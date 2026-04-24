import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, Loader2, RefreshCw, Zap, AlertTriangle, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";

const PRIORITY_STYLES = {
  critique:   "bg-red-50 border-red-200 text-red-800",
  important:  "bg-amber-50 border-amber-200 text-amber-800",
  info:       "bg-blue-50 border-blue-200 text-blue-800",
  opportunite:"bg-green-50 border-green-200 text-green-800",
};
const PRIORITY_ICONS = { critique: "🔴", important: "🟡", info: "🔵", opportunite: "🟢" };

export default function ComptaIAAgent({ paiements, quittances, transactions, factures }) {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const analyser = async () => {
    setLoading(true);
    const totalEncaisse = paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0)
      + quittances.filter(q => q.statut === "paye").reduce((s, q) => s + (q.montant_total || 0), 0);
    const totalRetard = paiements.filter(p => p.statut === "en_retard").reduce((s, p) => s + (p.montant || 0), 0)
      + quittances.filter(q => q.statut === "impaye" || q.statut === "en_retard").reduce((s, q) => s + (q.montant_total || 0), 0);
    const nonRapproches = paiements.filter(p => !p.statut_rapprochement || p.statut_rapprochement === "non_matche").length;
    const facturesEnAttente = (factures || []).filter(f => f.statut !== "payee").reduce((s, f) => s + (f.montant_ttc || 0), 0);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Super Agent IA — Analyse comptable complète d'une agence immobilière.

DONNÉES :
- Total encaissé : ${fmtEur(totalEncaisse)}
- Montant en retard/impayé : ${fmtEur(totalRetard)}
- Transactions non rapprochées : ${nonRapproches}
- Factures en attente encaissement : ${fmtEur(facturesEnAttente)}
- Nb paiements total : ${paiements.length}
- Nb quittances : ${quittances.length}
- Commissions encaissées : ${fmtEur(paiements.filter(p => p.type === "commission" && p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0))}

Génère :
1. alertes : 3-5 alertes (critique/important/info/opportunite) avec message < 20 mots
2. actions : 4 actions concrètes avec { action, raison, route (location/vente/comptabilite), urgence }
3. prevision_tresorerie : string courte (2-3 mots) sur santé trésorerie
4. recommandation_principale : string < 30 mots

JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          alertes: { type: "array", items: { type: "object" } },
          actions: { type: "array", items: { type: "object" } },
          prevision_tresorerie: { type: "string" },
          recommandation_principale: { type: "string" },
        }
      }
    });

    setResult(res);
    setGenerated(true);
    setLoading(false);
  };

  const ROUTES = {
    location: "/admin/modules/location",
    vente: "/admin/modules/vente",
    comptabilite: "/admin/modules/comptabilite",
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-100 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">🤖 Super Agent IA — Comptabilité</p>
            <p className="text-[11px] text-muted-foreground">Anomalies · Écarts · Prévisions · Optimisation</p>
          </div>
        </div>
        <Button size="sm" variant={generated ? "outline" : "default"} className="rounded-full h-8 text-xs gap-1.5" onClick={analyser} disabled={loading}>
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyse…</>
            : generated ? <><RefreshCw className="w-3 h-3" /> Actualiser</>
            : <><Zap className="w-3 h-3" /> Analyser</>}
        </Button>
      </div>

      {!generated && !loading && (
        <div className="text-center py-6">
          <Brain className="w-10 h-10 text-muted-foreground/15 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">L'IA détecte anomalies, écarts de paiement et anticipe la trésorerie</p>
        </div>
      )}
      {loading && (
        <div className="text-center py-6">
          <Loader2 className="w-8 h-8 text-primary/30 mx-auto animate-spin mb-2" />
          <p className="text-xs text-muted-foreground animate-pulse">Analyse comptable en cours…</p>
        </div>
      )}

      {generated && !loading && result && (
        <div className="space-y-4">
          {/* Recommandation principale */}
          {result.recommandation_principale && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-primary mb-0.5">Recommandation principale</p>
              <p className="text-sm">{result.recommandation_principale}</p>
              {result.prevision_tresorerie && (
                <p className="text-[10px] text-muted-foreground mt-1">Trésorerie : <strong>{result.prevision_tresorerie}</strong></p>
              )}
            </div>
          )}

          {/* Alertes */}
          {result.alertes?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alertes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.alertes.map((a, i) => (
                  <div key={i} className={`rounded-xl border px-3.5 py-2.5 text-xs ${PRIORITY_STYLES[a.priority || a.type] || PRIORITY_STYLES.info}`}>
                    <span className="mr-1">{PRIORITY_ICONS[a.priority || a.type] || "🔵"}</span>
                    {a.message || a.titre}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions recommandées */}
          {result.actions?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions recommandées</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.actions.map((a, i) => (
                  <button key={i} onClick={() => a.route && navigate(ROUTES[a.route] || "/admin/modules/comptabilite")}
                    className="text-left rounded-xl border border-border/50 bg-white hover:border-primary/30 hover:shadow-sm p-3.5 transition-all group">
                    <p className="text-xs font-semibold leading-snug">{a.action}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.raison}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary">
                      Accéder <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}