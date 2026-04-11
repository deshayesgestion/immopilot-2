import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, User,
  TrendingUp, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp
} from "lucide-react";

const DOCS_REQUIS = [
  { id: "identite", label: "Pièce d'identité" },
  { id: "revenus", label: "Justificatif de revenus" },
  { id: "contrat", label: "Contrat de travail" },
];

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null;
  if (score >= 70) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
      <ShieldCheck className="w-3.5 h-3.5" /> Bon dossier · {score}/100
    </span>
  );
  if (score >= 45) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
      <AlertTriangle className="w-3.5 h-3.5" /> Dossier moyen · {score}/100
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-100 text-red-600 px-3 py-1.5 rounded-full">
      <XCircle className="w-3.5 h-3.5" /> Dossier risqué · {score}/100
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function CandidatCard({ candidat, scoring, onScore, onValider, onRefuser, isValidated }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const docsRecus = DOCS_REQUIS.filter((d) => candidat.documents?.[d.id]?.recu).length;
  const s = scoring?.[candidat.id];

  const analyzeWithAI = async () => {
    setLoading(true);
    const docsDetails = DOCS_REQUIS.map((d) => {
      const doc = candidat.documents?.[d.id];
      return `${d.label}: ${doc?.recu ? "✓ reçu" : "✗ manquant"}`;
    }).join(", ");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse ce dossier de candidature locative et génère un score sur 100.

Candidat: ${candidat.nom}
Documents: ${docsDetails}
Documents reçus: ${docsRecus}/${DOCS_REQUIS.length}

Évalue:
1. La complétude du dossier (documents fournis vs requis)
2. La cohérence apparente du profil

Réponds UNIQUEMENT avec ce JSON, rien d'autre.`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          completude: { type: "number" },
          coherence: { type: "number" },
          resume: { type: "string" },
          points_positifs: { type: "array", items: { type: "string" } },
          points_attention: { type: "array", items: { type: "string" } },
        },
      },
    });
    setLoading(false);
    onScore(candidat.id, result);
  };

  const statut = isValidated
    ? "valide"
    : s?.statut === "refuse"
    ? "refuse"
    : null;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      statut === "valide" ? "border-green-300 bg-green-50/30" :
      statut === "refuse" ? "border-red-200 bg-red-50/20 opacity-60" :
      "border-border/50"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{candidat.nom}</p>
            {statut === "valide" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {statut === "refuse" && <XCircle className="w-4 h-4 text-red-400" />}
          </div>
          <p className="text-xs text-muted-foreground">{candidat.email} · {docsRecus}/{DOCS_REQUIS.length} documents</p>
        </div>
        <div className="flex items-center gap-2">
          {s?.score !== undefined && <ScoreBadge score={s.score} />}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30">
          {/* Docs summary */}
          <div className="pt-3 flex flex-wrap gap-2">
            {DOCS_REQUIS.map((doc) => {
              const ok = candidat.documents?.[doc.id]?.recu;
              return (
                <span key={doc.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                  {ok ? "✓" : "✗"} {doc.label}
                </span>
              );
            })}
          </div>

          {/* AI score */}
          {s && s.score !== undefined ? (
            <div className="bg-white rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Analyse IA</p>
                <ScoreBadge score={s.score} />
              </div>
              <ScoreBar score={s.score} />
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{s.completude}/100</p>
                  <p className="text-xs text-muted-foreground">Complétude</p>
                </div>
                <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{s.coherence}/100</p>
                  <p className="text-xs text-muted-foreground">Cohérence</p>
                </div>
              </div>
              {s.resume && <p className="text-xs text-muted-foreground italic">"{s.resume}"</p>}
              {s.points_positifs?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">✓ Points positifs</p>
                  <ul className="space-y-0.5">
                    {s.points_positifs.map((p, i) => <li key={i} className="text-xs text-muted-foreground">· {p}</li>)}
                  </ul>
                </div>
              )}
              {s.points_attention?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1">⚠ Points d'attention</p>
                  <ul className="space-y-0.5">
                    {s.points_attention.map((p, i) => <li key={i} className="text-xs text-muted-foreground">· {p}</li>)}
                  </ul>
                </div>
              )}
              <Button size="sm" variant="outline" className="w-full rounded-full text-xs h-8 gap-1.5" onClick={analyzeWithAI} disabled={loading}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
                Relancer l'analyse
              </Button>
            </div>
          ) : (
            <Button size="sm" className="w-full rounded-full gap-1.5 text-xs h-9" onClick={analyzeWithAI} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Analyser avec l'IA
            </Button>
          )}

          {/* Validation actions */}
          {statut !== "refuse" && (
            <div className="flex gap-2">
              {statut !== "valide" && (
                <Button
                  size="sm"
                  className="flex-1 rounded-full gap-1.5 text-xs h-9 bg-green-600 hover:bg-green-700"
                  onClick={() => onValider(candidat.id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valider
                </Button>
              )}
              {statut !== "valide" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full gap-1.5 text-xs h-9 border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => onRefuser(candidat.id)}
                >
                  <XCircle className="w-3.5 h-3.5" /> Refuser
                </Button>
              )}
              {statut === "valide" && (
                <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Candidat sélectionné
                </div>
              )}
            </div>
          )}
          {statut === "refuse" && (
            <p className="text-xs text-center text-red-400 font-medium">Dossier refusé</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ValidationStep({ dossier, onUpdate }) {
  const [scoring, setScoring] = useState(dossier.ia_scoring || {});
  const [saving, setSaving] = useState(false);

  const persist = async (newScoring, locataireSelectionne) => {
    setSaving(true);
    const update = { ia_scoring: newScoring };
    if (locataireSelectionne !== undefined) update.locataire_selectionne = locataireSelectionne;
    await base44.entities.DossierLocatif.update(dossier.id, update);
    setSaving(false);
    onUpdate();
  };

  const onScore = (candidatId, result) => {
    const newScoring = { ...scoring, [candidatId]: { ...result, statut: scoring[candidatId]?.statut } };
    setScoring(newScoring);
    persist(newScoring);
  };

  const onValider = async (candidatId) => {
    const candidat = (dossier.candidatures || []).find((c) => c.id === candidatId);
    // Reset all, set this one as valide, others as refused
    const newScoring = {};
    (dossier.candidatures || []).forEach((c) => {
      newScoring[c.id] = { ...(scoring[c.id] || {}), statut: c.id === candidatId ? "valide" : "refuse" };
    });
    setScoring(newScoring);

    // Unlock next step
    const stepsCompleted = [...(dossier.steps_completed || [])];
    if (!stepsCompleted.includes(2)) stepsCompleted.push(2);
    await base44.entities.DossierLocatif.update(dossier.id, {
      ia_scoring: newScoring,
      locataire_selectionne: candidat,
      steps_completed: stepsCompleted,
      current_step: Math.max(dossier.current_step || 1, 3),
    });
    onUpdate();
  };

  const onRefuser = (candidatId) => {
    const newScoring = { ...scoring, [candidatId]: { ...(scoring[candidatId] || {}), statut: "refuse" } };
    setScoring(newScoring);
    persist(newScoring);
  };

  const candidats = dossier.candidatures || [];
  const validatedId = Object.entries(scoring).find(([, v]) => v.statut === "valide")?.[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Validation des dossiers</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidats.length} candidat{candidats.length > 1 ? "s" : ""} · Scoring IA disponible
          </p>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {validatedId && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Candidat sélectionné · étape suivante débloquée
          </p>
        </div>
      )}

      {candidats.length === 0 ? (
        <div className="border-2 border-dashed border-border/40 rounded-2xl py-10 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun candidat à valider</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Ajoutez des candidats dans l'étape "Candidatures"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidats.map((c) => (
            <CandidatCard
              key={c.id}
              candidat={c}
              scoring={scoring}
              onScore={onScore}
              onValider={onValider}
              onRefuser={onRefuser}
              isValidated={scoring[c.id]?.statut === "valide"}
            />
          ))}
        </div>
      )}
    </div>
  );
}