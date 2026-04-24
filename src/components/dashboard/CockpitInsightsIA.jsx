import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Brain, Loader2, RefreshCw, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIORITY_STYLES = {
  critique: "bg-red-50 border-red-200 text-red-800",
  important: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  opportunite: "bg-green-50 border-green-200 text-green-800",
};
const PRIORITY_ICONS = { critique: "🔴", important: "🟡", info: "🔵", opportunite: "🟢" };

// Map action_type → route ou handler
const ACTION_ROUTES = {
  relance: "/admin/parametres/accueil-ia",
  ticket: "/admin/parametres/accueil-ia",
  paiement: "/admin/modules/comptabilite",
  bien: "/admin/modules/biens",
  dossier: "/admin/dossiers",
  lead: "/admin/modules/vente",
  location: "/admin/modules/location",
  communication: "/admin/communications",
};

export default function CockpitInsightsIA({ data, onAction }) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [executedActions, setExecutedActions] = useState(new Set());

  const generate = async () => {
    if (!data || loading) return;
    setLoading(true);
    setExecutedActions(new Set());

    const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "0 €";

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es l'IA de pilotage Rounded d'une agence immobilière. Analyse ce cockpit COMPLET et génère des insights ACTIONNABLES.

DONNÉES COMPLÈTES :
MODULE LOCATION :
- Dossiers locatifs actifs : ${data.dossiersLocatifsActifs||data.locationsActives}
- Loyers encaissés : ${fmt(data.loyersEncaisses||data.caLocation)}
- Impayés : ${data.impayesCount||data.paiementsRetard||0} dossiers · ${fmt(data.impayesMontant||data.montantRetard)}

MODULE VENTE :
- Mandats actifs : ${data.mandatsActifs||data.biensVente} (${data.mandatsSignes||0} signés)
- Acquéreurs en pipeline : ${data.acquereursPipeline||data.ventesEnCours}
- Ventes finalisées : ${data.ventesFinalisees||data.ventesCloture}
- Commissions : ${fmt(data.caCommissions)}

MODULE COMPTA :
- CA Total Global : ${fmt(data.caTotalGlobal||data.caTotalTransactions)}
- Encaissé : ${fmt(data.montantEncaisse)} | En attente : ${fmt(data.montantAttente)}
- Bénéfice estimé : ${fmt(data.beneficeEstime)} | Marge : ${data.tauxMarge}%

GLOBAL :
- Taux de conversion : ${data.tauxConversion||0}%
- Leads : ${data.totalLeads} | Qualifiés : ${data.leadsQualifies}
- Tickets urgents : ${data.ticketsUrgents}
- Total dossiers : ${data.totalDossiers}

Génère :
1. 4 insights avec priorité (critique/important/info/opportunite) — phrases courtes < 20 mots
2. 4 actions concrètes cliquables avec un type d'action parmi : relance, ticket, paiement, bien, dossier, lead, location, communication
   - Chaque action doit indiquer : ce qu'elle fait, pourquoi c'est urgent/important
   - label_bouton : texte du bouton d'action (ex: "Relancer maintenant", "Voir les impayés")

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
                message: { type: "string" }
              }
            }
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                raison: { type: "string" },
                action_type: { type: "string" },
                label_bouton: { type: "string" },
                urgence: { type: "string" }
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

  const executeAction = (a, idx) => {
    setExecutedActions(prev => new Set([...prev, idx]));
    const route = ACTION_ROUTES[a.action_type];
    if (route) navigate(route);
    onAction?.(a);
  };

  const URGENCE_STYLES = {
    critique: "border-red-300 bg-red-50",
    important: "border-amber-300 bg-amber-50",
    normal: "border-border/50 bg-white",
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">IA Actionnelle — Rounded</p>
            <p className="text-[11px] text-muted-foreground">Insights, opportunités & actions recommandées</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={generated ? "outline" : "default"}
          className="rounded-full h-8 text-xs gap-1.5"
          onClick={generate}
          disabled={loading}
        >
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyse…</>
            : generated ? <><RefreshCw className="w-3 h-3" /> Actualiser</>
            : <><Zap className="w-3 h-3" /> Analyser</>}
        </Button>
      </div>

      {!generated && !loading && (
        <div className="text-center py-8 space-y-2">
          <Brain className="w-10 h-10 text-muted-foreground/20 mx-auto" />
          <p className="text-sm text-muted-foreground">Cliquez "Analyser" pour que Rounded IA génère des recommandations actionnables</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 space-y-2">
          <Loader2 className="w-8 h-8 text-primary/40 mx-auto animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">Rounded IA analyse vos données en temps réel…</p>
        </div>
      )}

      {generated && !loading && (
        <div className="space-y-5">
          {/* Insights */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Insights</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insights.map((ins, i) => (
                <div key={i} className={`rounded-xl border px-3.5 py-3 text-xs ${PRIORITY_STYLES[ins.priority] || PRIORITY_STYLES.info}`}>
                  <span className="mr-1.5">{PRIORITY_ICONS[ins.priority] || "🔵"}</span>
                  {ins.message}
                </div>
              ))}
            </div>
          </div>

          {/* Actions cliquables */}
          {actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions recommandées — cliquer pour exécuter</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actions.map((a, i) => {
                  const done = executedActions.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => !done && executeAction(a, i)}
                      className={`text-left rounded-xl border p-3.5 transition-all group ${
                        done
                          ? "border-green-200 bg-green-50 opacity-70"
                          : `${URGENCE_STYLES[a.urgence] || URGENCE_STYLES.normal} hover:shadow-sm hover:border-primary/40`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-snug">{a.action}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{a.raison}</p>
                        </div>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          : <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                        }
                      </div>
                      {!done && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {a.label_bouton || "Exécuter"} →
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}