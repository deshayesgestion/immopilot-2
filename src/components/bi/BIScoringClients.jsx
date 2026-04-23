import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Users, Loader2, Zap, Brain, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

function ScoreRing({ value }) {
  const color = value >= 70 ? "text-green-600" : value >= 40 ? "text-amber-600" : "text-red-600";
  const bg = value >= 70 ? "bg-green-50" : value >= 40 ? "bg-amber-50" : "bg-red-50";
  const label = value >= 70 ? "Fort" : value >= 40 ? "Moyen" : "Faible";
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full ${bg} flex-shrink-0`}>
      <span className={`text-base font-bold ${color}`}>{value}</span>
      <span className={`text-[9px] font-medium ${color}`}>{label}</span>
    </div>
  );
}

// Scoring heuristique local
function scoreAcquereur(contact, leads, dossiers) {
  let score = 30;
  const contactLeads = leads.filter(l => l.contact_id === contact.id);
  const contactDossiers = dossiers.filter(d => (d.contact_ids || []).includes(contact.id));
  score += Math.min(contactLeads.length * 12, 36);
  score += Math.min(contactDossiers.length * 15, 30);
  if (contact.email) score += 5;
  if (contact.telephone) score += 5;
  const qualified = contactLeads.some(l => l.statut === "qualifie");
  if (qualified) score += 15;
  return Math.min(score, 99);
}

function scoreLocataire(contact, paiements) {
  let score = 60;
  const contactPaie = paiements.filter(p => p.contact_id === contact.id);
  const retards = contactPaie.filter(p => p.statut === "en_retard");
  const payes = contactPaie.filter(p => p.statut === "paye");
  score -= Math.min(retards.length * 20, 50);
  score += Math.min(payes.length * 5, 20);
  if (contact.email) score += 5;
  return Math.min(Math.max(score, 5), 99);
}

export default function BIScoringClients({ data }) {
  const { contacts, leads, dossiers, paiements } = data;
  const [tab, setTab] = useState("acquereurs");
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const acquereurs = contacts
    .filter(c => c.type === "acheteur" || c.type === "acquereur" || leads.some(l => l.contact_id === c.id))
    .map(c => ({ ...c, score: scoreAcquereur(c, leads, dossiers) }))
    .sort((a, b) => b.score - a.score);

  const locataires = contacts
    .filter(c => c.type === "locataire")
    .map(c => ({ ...c, score: scoreLocataire(c, paiements) }))
    .sort((a, b) => a.score - b.score); // Tri par risque croissant (plus faible = problème)

  const vendeurs = contacts
    .filter(c => c.type === "vendeur" || c.type === "proprietaire")
    .map(c => ({
      ...c,
      score: Math.min(50 + (dossiers.filter(d => (d.contact_ids || []).includes(c.id)).length * 15), 95)
    }))
    .sort((a, b) => b.score - a.score);

  const analyzeAI = async () => {
    if (loading) return;
    setLoading(true);
    const topAcq = acquereurs.slice(0, 3).map(a => `${a.nom} (score: ${a.score})`).join(", ");
    const riskyLoc = locataires.slice(0, 3).map(l => `${l.nom} (fiabilité: ${l.score}%)`).join(", ");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `IA Rounded — scoring clients immobilier.

DONNÉES :
- ${acquereurs.length} acquéreurs potentiels | Top: ${topAcq || "—"}
- ${locataires.length} locataires | À surveiller: ${riskyLoc || "—"}
- ${vendeurs.length} vendeurs/propriétaires

Génère :
1. 3 insights sur la qualité du portefeuille clients
2. Top 2 actions pour convertir les meilleurs acquéreurs
3. Top 2 actions pour sécuriser les paiements locatifs

Format JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: { type: "array", items: { type: "object", properties: { message: { type: "string" }, type: { type: "string" } } } },
          actions_acquereurs: { type: "array", items: { type: "string" } },
          actions_locataires: { type: "array", items: { type: "string" } }
        }
      }
    });
    setAiInsights(res);
    setLoading(false);
  };

  const currentList = tab === "acquereurs" ? acquereurs : tab === "locataires" ? locataires : vendeurs;
  const tabLabel = tab === "acquereurs" ? "Probabilité d'achat" : tab === "locataires" ? "Fiabilité paiement" : "Potentiel de vente";

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Acquéreurs", value: acquereurs.length, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", id: "acquereurs" },
          { label: "Locataires", value: locataires.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", id: "locataires" },
          { label: "Vendeurs", value: vendeurs.length, icon: Star, color: "text-purple-600", bg: "bg-purple-50", id: "vendeurs" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${tab === s.id ? "border-primary ring-1 ring-primary/20" : "border-border/50"}`}>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* IA Insights */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Analyse IA du portefeuille clients</p>
          </div>
          <Button size="sm" variant={aiInsights ? "outline" : "default"} className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiInsights ? "Réanalyser" : "Analyser"}
          </Button>
        </div>

        {!aiInsights && !loading && (
          <p className="text-xs text-muted-foreground text-center py-4">L'IA Rounded va analyser votre portefeuille et suggérer les meilleures actions</p>
        )}
        {loading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>}
        {aiInsights && !loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(aiInsights.insights || []).map((ins, i) => (
                <div key={i} className={`rounded-xl border px-3 py-2.5 text-xs ${ins.type === "alerte" ? "bg-red-50 border-red-100 text-red-800" : ins.type === "opportunite" ? "bg-green-50 border-green-100 text-green-800" : "bg-blue-50 border-blue-100 text-blue-800"}`}>
                  {ins.message}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(aiInsights.actions_acquereurs || []).length > 0 && (
                <div className="bg-blue-50/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1.5">Actions acquéreurs</p>
                  <ul className="space-y-1">
                    {aiInsights.actions_acquereurs.map((a, i) => <li key={i} className="text-[11px] text-blue-700 flex gap-1.5"><span>→</span>{a}</li>)}
                  </ul>
                </div>
              )}
              {(aiInsights.actions_locataires || []).length > 0 && (
                <div className="bg-amber-50/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Actions locataires</p>
                  <ul className="space-y-1">
                    {aiInsights.actions_locataires.map((a, i) => <li key={i} className="text-[11px] text-amber-700 flex gap-1.5"><span>→</span>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Liste scorée */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <p className="text-sm font-semibold mb-1">{tab === "acquereurs" ? "Acquéreurs" : tab === "locataires" ? "Locataires" : "Vendeurs"} — {tabLabel}</p>
        <p className="text-xs text-muted-foreground mb-4">Scoré automatiquement par l'IA locale</p>
        <div className="space-y-3">
          {currentList.slice(0, 12).map(c => (
            <div key={c.id} className="flex items-center gap-3">
              <ScoreRing value={c.score} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.nom}</p>
                <p className="text-xs text-muted-foreground">{c.email || c.telephone || "—"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold">{tabLabel}</p>
                <div className="w-24 bg-secondary/50 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${c.score >= 70 ? "bg-green-500" : c.score >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {currentList.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun contact dans cette catégorie</p>}
        </div>
      </div>
    </div>
  );
}