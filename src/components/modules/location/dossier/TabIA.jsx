import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw, Trophy, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

const RECO_CFG = {
  fort:   { label: "Profil FORT",   cls: "bg-green-100 text-green-700 border-green-300",  bar: "bg-green-500" },
  moyen:  { label: "Profil MOYEN",  cls: "bg-amber-100 text-amber-700 border-amber-300",  bar: "bg-amber-500" },
  faible: { label: "Profil FAIBLE", cls: "bg-red-100 text-red-700 border-red-300",        bar: "bg-red-500" },
};

function ScoreBar({ score }) {
  const color = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className={`text-3xl font-black ${score >= 70 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600"}`}>
        {score}<span className="text-base font-medium">/100</span>
      </span>
      <div className="flex-1 bg-secondary/40 rounded-full h-3">
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function CandidatScore({ candidat, loyer, onUpdate }) {
  const [scoring, setScoring] = useState(false);
  const ratio = loyer && candidat.revenus_mensuels ? (loyer / candidat.revenus_mensuels * 100).toFixed(0) : null;
  const reco = RECO_CFG[candidat.scoring_recommandation];

  const scorer = async () => {
    setScoring(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert IA scoring locatif. Analyse ce candidat pour un loyer de ${loyer}€/mois.
Nom: ${candidat.nom}
Situation: ${candidat.situation_pro} chez ${candidat.employeur || "N/A"}
Revenus: ${candidat.revenus_mensuels || 0}€/mois
Garant: ${candidat.nom_garant || "aucun"} (${candidat.revenus_garant || 0}€)
Ratio loyer/revenus: ${ratio || "?"}%
Documents: identité=${candidat.docs_identite}, revenus=${candidat.docs_revenus}, imposition=${candidat.docs_imposition}, domicile=${candidat.docs_domicile}
Notes: ${candidat.notes_agent || "aucune"}

Retourne JSON: { score: number (0-100), solvabilite: number (0-100), risque: "faible"|"modere"|"eleve", stabilite: "forte"|"moyenne"|"faible", recommandation: "fort"|"moyen"|"faible", commentaire: string (max 200 chars), detail: { coherence_revenus: string, capacite_paiement: string, stabilite_locative: string } }`,
      response_json_schema: { type: "object", properties: { score: { type: "number" }, solvabilite: { type: "number" }, risque: { type: "string" }, stabilite: { type: "string" }, recommandation: { type: "string" }, commentaire: { type: "string" }, detail: { type: "object" } } }
    });
    if (r?.score !== undefined) {
      const updates = { scoring_ia: r.score, scoring_solvabilite: r.solvabilite, scoring_risque: r.risque, scoring_stabilite: r.stabilite, scoring_recommandation: r.recommandation, scoring_commentaire: r.commentaire, scoring_detail: r.detail || {} };
      await base44.entities.CandidatLocataire.update(candidat.id, updates);
      onUpdate({ ...candidat, ...updates });
    }
    setScoring(false);
  };

  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-3 ${reco ? `border-current/20` : "border-border/50"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{candidat.nom}</p>
          <p className="text-xs text-muted-foreground capitalize">{candidat.situation_pro?.replace("_", " ") || "—"} · {candidat.revenus_mensuels ? `${candidat.revenus_mensuels.toLocaleString("fr-FR")} €/mois` : "N/A"}
            {ratio && <span className={`ml-2 font-medium ${Number(ratio) <= 33 ? "text-green-600" : Number(ratio) <= 40 ? "text-amber-600" : "text-red-600"}`}>({ratio}%)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reco && <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${reco.cls}`}>{reco.label}</span>}
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={scorer} disabled={scoring}>
            {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {candidat.scoring_ia > 0 ? "Ré-analyser" : "Analyser"}
          </Button>
        </div>
      </div>

      {candidat.scoring_ia > 0 && (
        <>
          <ScoreBar score={candidat.scoring_ia} />
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Solvabilité", value: candidat.scoring_solvabilite ? `${candidat.scoring_solvabilite}%` : "—", ok: (candidat.scoring_solvabilite || 0) >= 70 },
              { label: "Risque", value: candidat.scoring_risque || "—", ok: candidat.scoring_risque === "faible" },
              { label: "Stabilité", value: candidat.scoring_stabilite || "—", ok: candidat.scoring_stabilite === "forte" },
            ].map(item => (
              <div key={item.label} className="bg-secondary/20 rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground mb-0.5">{item.label}</p>
                <p className={`text-xs font-bold capitalize ${item.ok ? "text-green-600" : "text-amber-600"}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {candidat.scoring_detail && Object.keys(candidat.scoring_detail).length > 0 && (
            <div className="space-y-1.5 bg-secondary/10 rounded-xl p-3">
              {Object.entries(candidat.scoring_detail).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="text-muted-foreground capitalize min-w-0 flex-shrink-0" style={{minWidth:"120px"}}>{k.replace(/_/g, " ")} :</span>
                  <span className="text-foreground">{v}</span>
                </div>
              ))}
            </div>
          )}
          {candidat.scoring_commentaire && (
            <p className="text-xs text-muted-foreground bg-secondary/20 rounded-xl px-3 py-2 italic">{candidat.scoring_commentaire}</p>
          )}
        </>
      )}

      {scoring && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse IA en cours…
        </div>
      )}
    </div>
  );
}

export default function TabIA({ dossier }) {
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalAnalysis, setGlobalAnalysis] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    if (!dossier.bien_id) { setLoading(false); return; }
    base44.entities.CandidatLocataire.filter({ bien_id: dossier.bien_id }).then(data => {
      setCandidats(data.filter(c => c.statut !== "refuse"));
      setLoading(false);
    });
  }, [dossier.bien_id]);

  const updateCandidat = (updated) => setCandidats(prev => prev.map(c => c.id === updated.id ? updated : c));

  const analyseGlobale = async () => {
    if (candidats.length === 0) return;
    setAnalysing(true);
    const scoredCandidats = candidats.filter(c => c.scoring_ia > 0);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert location immobilière. Analyse comparative de ${candidats.length} candidats pour un bien à ${dossier.loyer_mensuel}€/mois (${dossier.bien_titre}).

Candidats :
${candidats.map((c, i) => `${i+1}. ${c.nom} — Score: ${c.scoring_ia || "N/A"}/100, ${c.situation_pro}, ${c.revenus_mensuels || 0}€/mois, recommandation: ${c.scoring_recommandation || "N/A"}`).join("\n")}

Donne une recommandation finale avec le meilleur candidat et les raisons.
Retourne JSON: { meilleur_candidat: string (nom), justification: string (max 200 chars), risques_globaux: string (max 150 chars), action_recommandee: string (max 100 chars) }`,
      response_json_schema: { type: "object", properties: { meilleur_candidat: { type: "string" }, justification: { type: "string" }, risques_globaux: { type: "string" }, action_recommandee: { type: "string" } } }
    });
    setGlobalAnalysis(result);
    setAnalysing(false);
  };

  const sorted = [...candidats].sort((a, b) => (b.scoring_ia || 0) - (a.scoring_ia || 0));
  const bestCandidat = sorted[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Analyse IA</p>
          <p className="text-xs text-muted-foreground mt-0.5">Scoring solvabilité · Analyse automatique</p>
        </div>
        {candidats.length > 1 && (
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={analyseGlobale} disabled={analysing}>
            {analysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
            Analyse comparative
          </Button>
        )}
      </div>

      {/* Analyse globale IA */}
      {globalAnalysis && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Recommandation IA globale</p>
          <div className="flex items-start gap-2">
            <Trophy className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">{globalAnalysis.meilleur_candidat}</p>
              <p className="text-xs text-indigo-700 mt-0.5">{globalAnalysis.justification}</p>
            </div>
          </div>
          {globalAnalysis.risques_globaux && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{globalAnalysis.risques_globaux}</span>
            </div>
          )}
          {globalAnalysis.action_recommandee && (
            <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{globalAnalysis.action_recommandee}</span>
            </div>
          )}
        </div>
      )}

      {/* Podium si plusieurs */}
      {sorted.filter(c => c.scoring_ia > 0).length > 1 && (
        <div className="bg-white border border-border/50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Classement par score</p>
          <div className="space-y-2">
            {sorted.filter(c => c.scoring_ia > 0).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-muted-foreground"}`}>#{i+1}</span>
                <span className="text-sm flex-1 font-medium">{c.nom}</span>
                <div className="w-32 bg-secondary/40 rounded-full h-2">
                  <div className={`h-2 rounded-full ${c.scoring_ia >= 70 ? "bg-green-500" : c.scoring_ia >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${c.scoring_ia}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${c.scoring_ia >= 70 ? "text-green-600" : c.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>{c.scoring_ia}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : candidats.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-2xl">
          <Sparkles className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Ajoutez des candidats pour lancer l'analyse IA</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(c => (
            <CandidatScore key={c.id} candidat={c} loyer={dossier.loyer_mensuel} onUpdate={updateCandidat} />
          ))}
        </div>
      )}
    </div>
  );
}