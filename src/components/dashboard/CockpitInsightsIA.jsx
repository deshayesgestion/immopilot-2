import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, Loader2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIORITY_STYLES = {
  critique: "bg-red-50 border-red-200 text-red-800",
  important: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  opportunite: "bg-green-50 border-green-200 text-green-800",
};

const PRIORITY_ICONS = {
  critique: "🔴",
  important: "🟡",
  info: "🔵",
  opportunite: "🟢",
};

export default function CockpitInsightsIA({ data, autoLoad = false }) {
  const [insights, setInsights] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    if (!data || loading) return;
    setLoading(true);

    const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "0 €";

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es l'IA de pilotage d'une agence immobilière (Rounded IA). Analyse ce cockpit et génère des insights actionnables.

DONNÉES :
- Biens actifs : ${data.biensActifs} (${data.biensVente} vente, ${data.biensLocation} location)
- Ventes en cours : ${data.ventesEnCours} | Clôturées : ${data.ventesCloture}
- Locations actives : ${data.locationsActives}
- CA total encaissé : ${fmt(data.montantEncaisse)}
- Paiements en attente : ${fmt(data.montantAttente)} (${data.paiementsAttente} paiements)
- Paiements en retard : ${fmt(data.montantRetard)} (${data.paiementsRetard} impayés)
- Leads totaux : ${data.totalLeads} | Qualifiés : ${data.leadsQualifies}
- Taux conversion leads : ${data.totalLeads > 0 ? Math.round((data.leadsQualifies / data.totalLeads) * 100) : 0}%
- Tickets urgents IA : ${data.ticketsUrgents}
- Dossiers actifs : ${(data.dossiers || []).filter(d => d.statut === "en_cours").length}

Génère :
1. 4 insights pertinents avec priorité (critique/important/info/opportunite)
2. 3 actions concrètes recommandées

Format JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority: { type: "string" },
                message: { type: "string" },
                type: { type: "string" }
              }
            }
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                raison: { type: "string" }
              }
            }
          }
        }
      }
    });

    setInsights(res?.insights || []);
    setActions(res?.actions || []);
    setGenerated(true);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Analyse IA — Rounded</p>
            <p className="text-[11px] text-muted-foreground">Insights & recommandations automatiques</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={generated ? "outline" : "default"}
          className="rounded-full h-8 text-xs gap-1.5"
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Analyse…</>
          ) : generated ? (
            <><RefreshCw className="w-3 h-3" /> Actualiser</>
          ) : (
            <><Zap className="w-3 h-3" /> Analyser</>
          )}
        </Button>
      </div>

      {!generated && !loading && (
        <div className="text-center py-8 space-y-2">
          <Brain className="w-10 h-10 text-muted-foreground/20 mx-auto" />
          <p className="text-sm text-muted-foreground">Cliquez "Analyser" pour que l'IA génère des insights sur votre activité</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 space-y-2">
          <Loader2 className="w-8 h-8 text-primary/40 mx-auto animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">Rounded IA analyse vos données…</p>
        </div>
      )}

      {generated && !loading && (
        <div className="space-y-4">
          {/* Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {insights.map((ins, i) => (
              <div key={i} className={`rounded-xl border px-3.5 py-3 text-xs ${PRIORITY_STYLES[ins.priority] || PRIORITY_STYLES.info}`}>
                <span className="mr-1.5 text-sm">{PRIORITY_ICONS[ins.priority] || "🔵"}</span>
                {ins.message}
              </div>
            ))}
          </div>

          {/* Actions recommandées */}
          {actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Actions recommandées</p>
              <div className="space-y-2">
                {actions.map((a, i) => (
                  <div key={i} className="flex gap-2.5 bg-secondary/30 rounded-xl px-3.5 py-2.5">
                    <span className="text-primary font-bold text-sm flex-shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-xs font-semibold">{a.action}</p>
                      <p className="text-[11px] text-muted-foreground">{a.raison}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}