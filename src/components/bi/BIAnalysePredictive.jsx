import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Home, FolderOpen, Clock, Loader2, Zap, Brain, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "—";

// Calcul heuristique local de probabilité de vente
function computeBienScore(bien, dossiers, leads) {
  let score = 50;
  // Bien en cours = plus avancé
  if (bien.statut === "en_cours") score += 25;
  if (bien.statut === "vendu" || bien.statut === "loue") return 100;
  // Leads associés
  const biensLeads = leads.filter(l => l.bien_id === bien.id);
  score += Math.min(biensLeads.length * 8, 24);
  // Dossiers associés
  const biensDossiers = dossiers.filter(d => d.bien_id === bien.id);
  score += Math.min(biensDossiers.length * 10, 20);
  // Prix pas renseigné = malus
  if (!bien.prix) score -= 10;
  // Photos disponibles = bonus
  if (bien.photos && bien.photos.length > 0) score += 5;
  return Math.min(Math.max(score, 5), 99);
}

function computeDossierRisk(dossier, paiements, tickets) {
  // 0 = faible risque, 100 = haut risque
  let risk = 20;
  const daysSinceUpdate = dossier.updated_date
    ? Math.floor((Date.now() - new Date(dossier.updated_date)) / 86400000)
    : 999;
  if (daysSinceUpdate > 30) risk += 30;
  if (daysSinceUpdate > 60) risk += 20;
  if (dossier.statut === "nouveau" && daysSinceUpdate > 14) risk += 15;
  const dossierTickets = tickets.filter(t => t.dossier_id === dossier.id && t.statut !== "resolu");
  risk += dossierTickets.length * 10;
  const dossierPaie = paiements.filter(p => p.statut === "en_retard");
  risk += Math.min(dossierPaie.length * 5, 15);
  return Math.min(risk, 99);
}

function ScoreBar({ value, color }) {
  return (
    <div className="w-full bg-secondary/50 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function ScoreBadge({ value }) {
  const color = value >= 70 ? "bg-green-100 text-green-700" : value >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>{value}%</span>;
}

export default function BIAnalysePredictive({ data }) {
  const { biens, dossiers, leads, paiements, tickets } = data;
  const [aiPredictions, setAiPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // Calcul heuristique local pour chaque bien
  const biensScores = biens
    .filter(b => b.statut !== "vendu" && b.statut !== "loue")
    .map(b => ({ ...b, score: computeBienScore(b, dossiers, leads) }))
    .sort((a, b) => b.score - a.score);

  const dossiersRisk = dossiers
    .filter(d => d.statut === "en_cours" || d.statut === "nouveau")
    .map(d => ({ ...d, risk: computeDossierRisk(d, paiements, tickets) }))
    .sort((a, b) => b.risk - a.risk);

  // Durée moyenne des dossiers terminés
  const dossiersTermines = dossiers.filter(d => d.statut === "termine" || d.statut === "signe");
  const dureeMoyenne = dossiersTermines.length > 0
    ? Math.round(dossiersTermines.reduce((s, d) => {
        const start = new Date(d.created_date);
        const end = new Date(d.updated_date || d.created_date);
        return s + Math.max(0, (end - start) / 86400000);
      }, 0) / dossiersTermines.length)
    : null;

  const analyzeAI = async () => {
    if (loading) return;
    setLoading(true);
    const top5Biens = biensScores.slice(0, 5).map(b => `${b.titre} (score: ${b.score}%, prix: ${fmt(b.prix)})`).join(", ");
    const top3DossRisk = dossiersRisk.slice(0, 3).map(d => `${d.titre} (risque: ${d.risk}%)`).join(", ");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es l'IA Rounded d'analyse prédictive pour une agence immobilière.

DONNÉES :
- ${biens.length} biens actifs | ${leads.length} leads | ${dossiers.length} dossiers
- Durée moyenne dossier terminé : ${dureeMoyenne ?? "N/A"} jours
- Top biens probabilité vente : ${top5Biens || "aucun"}
- Dossiers à risque : ${top3DossRisk || "aucun"}
- Paiements en retard : ${paiements.filter(p => p.statut === "en_retard").length}

Génère :
1. 3 prédictions de marché (tendances à venir)
2. Estimation délai moyen de vente pour le marché actuel
3. 2 biens à fort potentiel à prioriser

Format JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          predictions: { type: "array", items: { type: "object", properties: { titre: { type: "string" }, detail: { type: "string" }, confiance: { type: "number" } } } },
          delai_moyen_vente: { type: "string" },
          biens_prioritaires: { type: "array", items: { type: "object", properties: { nom: { type: "string" }, raison: { type: "string" } } } }
        }
      }
    });
    setAiPredictions(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Résumé stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Biens analysés", value: biens.length, icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Dossiers actifs", value: dossiers.filter(d => ["nouveau","en_cours"].includes(d.statut)).length, icon: FolderOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Durée moy. dossier", value: dureeMoyenne ? `${dureeMoyenne}j` : "N/A", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Dossiers à risque", value: dossiersRisk.filter(d => d.risk > 50).length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* IA Prédictions Rounded */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Prédictions IA Rounded</p>
          </div>
          <Button size="sm" variant={aiPredictions ? "outline" : "default"} className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiPredictions ? "Réanalyser" : "Lancer l'analyse"}
          </Button>
        </div>

        {!aiPredictions && !loading && (
          <div className="text-center py-8">
            <Brain className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cliquez "Lancer l'analyse" pour les prédictions IA de votre marché</p>
          </div>
        )}
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>}

        {aiPredictions && !loading && (
          <div className="space-y-4">
            {aiPredictions.delai_moyen_vente && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Délai moyen de vente estimé</p>
                  <p className="text-sm font-bold text-primary">{aiPredictions.delai_moyen_vente}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(aiPredictions.predictions || []).map((p, i) => (
                <div key={i} className="rounded-xl border border-border/50 p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-snug">{p.titre}</p>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{p.confiance}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{p.detail}</p>
                  <ScoreBar value={p.confiance} color="bg-primary" />
                </div>
              ))}
            </div>
            {(aiPredictions.biens_prioritaires || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Biens prioritaires à travailler</p>
                <div className="flex flex-wrap gap-2">
                  {aiPredictions.biens_prioritaires.map((b, i) => (
                    <div key={i} className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Home className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-green-800">{b.nom}</p>
                        <p className="text-[11px] text-green-600">{b.raison}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Probabilité de vente / location par bien */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Score de probabilité — biens actifs</p>
          <span className="text-[11px] text-muted-foreground">Calculé par IA locale</span>
        </div>
        <div className="space-y-2.5">
          {biensScores.slice(0, 10).map(b => (
            <div key={b.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Home className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate">{b.titre}</p>
                  <ScoreBadge value={b.score} />
                </div>
                <ScoreBar value={b.score} color={b.score >= 70 ? "bg-green-500" : b.score >= 40 ? "bg-amber-500" : "bg-red-400"} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{b.type} · {fmt(b.prix)}</p>
              </div>
            </div>
          ))}
          {biensScores.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun bien actif</p>}
        </div>
      </div>

      {/* Dossiers à risque */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <p className="text-sm font-semibold mb-3">Dossiers à risque</p>
        <div className="space-y-2.5">
          {dossiersRisk.slice(0, 8).map(d => (
            <div key={d.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${d.risk > 60 ? "border-red-100 bg-red-50/50" : "border-amber-100 bg-amber-50/30"}`}>
              <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 ${d.risk > 60 ? "text-red-500" : "text-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{d.titre}</p>
                <p className="text-[10px] text-muted-foreground">{d.statut} · {d.type}</p>
              </div>
              <ScoreBadge value={d.risk} />
            </div>
          ))}
          {dossiersRisk.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun dossier à risque détecté</p>
          )}
        </div>
      </div>
    </div>
  );
}