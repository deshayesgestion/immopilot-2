import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, CheckCircle2, Minus } from "lucide-react";

const ETAT_SCORE = { "Bon état": 4, "Usage normal": 3, "Dégradé": 2, "À remplacer": 1, "": 3 };
const ETAT_COLORS = {
  "Bon état": "text-green-600 bg-green-50",
  "Usage normal": "text-blue-600 bg-blue-50",
  "Dégradé": "text-orange-600 bg-orange-50",
  "À remplacer": "text-red-600 bg-red-50",
  "": "text-muted-foreground bg-secondary/30",
};

function getDiff(etatEntree, etatSortie) {
  if (!etatEntree || !etatSortie) return "neutral";
  const scoreE = ETAT_SCORE[etatEntree] || 3;
  const scoreS = ETAT_SCORE[etatSortie] || 3;
  if (scoreS >= scoreE) return "ok";
  if (scoreE - scoreS >= 2) return "grave";
  return "degradation";
}

export default function Step3Comparaison({ dossier, onUpdate, onNext, onPrev }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalyse, setAiAnalyse] = useState(dossier.edl_comparaison_ai || null);

  const edlEntree = dossier.edl_entree || null; // from DossierLocatif (copied at creation if needed)
  const edlSortie = dossier.edl_sortie || null;

  const checklistSortie = edlSortie?.checklist || [];
  // Try to find matching entry EDL from dossier source (may not always exist)
  const checklistEntree = edlEntree?.checklist || [];

  const degradations = checklistSortie.flatMap((cat, ci) => {
    const catEntree = checklistEntree[ci];
    return cat.items.map((item, ii) => {
      const itemEntree = catEntree?.items?.[ii];
      const diff = getDiff(itemEntree?.etat, item.etat);
      if (diff === "ok" || diff === "neutral") return null;
      return {
        piece: cat.label,
        element: item.label,
        etatEntree: itemEntree?.etat || "Non renseigné",
        etatSortie: item.etat,
        commentaire: item.commentaire,
        severity: diff,
      };
    }).filter(Boolean);
  });

  const lancerAnalyseIA = async () => {
    setAiLoading(true);
    const prompt = `Tu es un expert immobilier. Analyse cet état des lieux de sortie et identifie les dégradations importantes.

Locataire : ${dossier.locataire?.nom}
Bien : ${dossier.property_title}

État des lieux de sortie :
${checklistSortie.map(cat => `${cat.label}:\n${cat.items.map(i => `  - ${i.label}: ${i.etat || "Non renseigné"}${i.commentaire ? ` (${i.commentaire})` : ""}`).join("\n")}`).join("\n\n")}

Dégradations détectées automatiquement :
${degradations.length === 0 ? "Aucune dégradation significative." : degradations.map(d => `- ${d.piece} / ${d.element}: ${d.etatEntree} → ${d.etatSortie}${d.commentaire ? ` (${d.commentaire})` : ""}`).join("\n")}

Donne :
1. Un résumé de l'état général du bien
2. La liste des dégradations imputables au locataire (hors usure normale)
3. Une estimation indicative des retenues sur caution conseillées
4. Les recommandations pour la remise en location`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiAnalyse(res);
    await base44.entities.DossierSortie.update(dossier.id, { edl_comparaison_ai: res });
    setAiLoading(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-4 text-center">
          <p className={`text-2xl font-bold ${degradations.length === 0 ? "text-green-600" : "text-amber-600"}`}>{degradations.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Dégradation{degradations.length > 1 ? "s" : ""} détectée{degradations.length > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{degradations.filter(d => d.severity === "grave").length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Grave{degradations.filter(d => d.severity === "grave").length > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{checklistSortie.reduce((s, c) => s + c.items.filter(i => i.etat === "Bon état").length, 0)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Éléments en bon état</p>
        </div>
      </div>

      {/* Comparaison par pièce */}
      {checklistSortie.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <p className="text-sm font-semibold">Comparaison EDL Entrée / Sortie</p>
            {checklistEntree.length === 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">⚠️ EDL d'entrée non disponible — affichage de l'état de sortie uniquement</p>
            )}
          </div>
          <div className="divide-y divide-border/20">
            {checklistSortie.map((cat, ci) => {
              const catEntree = checklistEntree[ci];
              return (
                <div key={cat.id} className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat.label}</p>
                  <div className="space-y-2">
                    {cat.items.map((item, ii) => {
                      const itemEntree = catEntree?.items?.[ii];
                      const diff = getDiff(itemEntree?.etat, item.etat);
                      return (
                        <div key={ii} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                          diff === "grave" ? "bg-red-50 border border-red-100" :
                          diff === "degradation" ? "bg-orange-50 border border-orange-100" :
                          "bg-secondary/20"
                        }`}>
                          <p className="text-sm flex-1">{item.label}</p>
                          {itemEntree?.etat ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ETAT_COLORS[itemEntree.etat]}`}>{itemEntree.etat}</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-muted-foreground">—</span>
                          )}
                          <Minus className="w-3 h-3 text-muted-foreground" />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${ETAT_COLORS[item.etat] || "bg-secondary/30 text-muted-foreground"}`}>
                            {item.etat || "—"}
                          </span>
                          {diff === "grave" && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                          {diff === "degradation" && <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          {diff === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          {item.commentaire && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{item.commentaire}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-12">
          <p className="text-sm text-muted-foreground">Aucun EDL de sortie renseigné. Retournez à l'étape 2.</p>
        </div>
      )}

      {/* IA Analyse */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Analyse IA des dégradations
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Synthèse automatique avec recommandations de retenues</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={lancerAnalyseIA} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {aiAnalyse ? "Relancer" : "Analyser"}
          </Button>
        </div>
        {aiAnalyse && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
            <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed font-sans">{aiAnalyse}</pre>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full gap-2" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
        <Button className="rounded-full gap-2" onClick={onNext}>
          Étape suivante — Caution <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}