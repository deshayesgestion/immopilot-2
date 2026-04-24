import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Bot, Loader2, RefreshCw, Zap, ChevronRight,
  AlertTriangle, TrendingUp, Target, Shield, CheckCircle2, Activity
} from "lucide-react";

const ROUTE_MAP = {
  location: "/admin/modules/location",
  vente: "/admin/modules/vente",
  comptabilite: "/admin/modules/comptabilite",
  biens: "/admin/modules/biens",
  securite: "/admin/securite",
  communications: "/admin/communications",
  ia: "/admin/parametres/accueil-ia",
  taches: "/admin/taches",
};

const CATEGORIE_STYLES = {
  critique:     { cls: "border-red-300 bg-red-50/80",    badge: "bg-red-100 text-red-700",    icon: "🔴" },
  important:    { cls: "border-amber-300 bg-amber-50/80", badge: "bg-amber-100 text-amber-700", icon: "🟡" },
  opportunite:  { cls: "border-green-300 bg-green-50/80", badge: "bg-green-100 text-green-700", icon: "🟢" },
  systeme:      { cls: "border-purple-200 bg-purple-50/80",badge: "bg-purple-100 text-purple-700",icon: "🔵" },
  info:         { cls: "border-border/50 bg-white",       badge: "bg-secondary text-muted-foreground", icon: "⚪" },
};

const fmt = n => n ? n.toLocaleString("fr-FR") + " €" : "0 €";

export default function CockpitSuperAgent({ data }) {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const analyse = async () => {
    if (loading) return;
    setLoading(true);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es le SUPER AGENT IA d'une agence immobilière. Tu analyses l'ensemble du SaaS et fournis un rapport exécutif complet.

DONNÉES COMPLÈTES :

MODULE LOCATION :
- Dossiers actifs : ${data.dossiersLocatifsActifs||0}
- Loyers encaissés : ${fmt(data.loyersEncaisses||0)}
- Impayés critiques : ${data.impayesCount||0} (${fmt(data.impayesMontant||0)})
- Quittances total : ${(data.quittances||[]).length}

MODULE VENTE :
- Mandats actifs : ${data.mandatsActifs||0} (${data.mandatsSignes||0} signés)
- Acquéreurs pipeline : ${data.acquereursPipeline||0}
- Ventes finalisées (acte) : ${data.ventesFinalisees||0}
- Commissions : ${fmt(data.caCommissions||0)}

MODULE COMPTA :
- CA Total Global : ${fmt(data.caTotalGlobal||0)}
- Encaissé : ${fmt(data.montantEncaisse||0)} / Retards : ${fmt(data.montantRetard||0)}
- Trésorerie estimée : ${fmt((data.montantEncaisse||0) + (data.loyersEncaisses||0))}
- Revenus mensuels estimés : ${fmt(((data.montantEncaisse||0) + (data.loyersEncaisses||0)) / 3)}

GLOBAL :
- Biens actifs : ${data.biensActifs||0} (${data.biensVente||0} vente · ${data.biensLocation||0} location)
- Taux conversion : ${data.tauxConversion||0}%
- Total leads : ${data.totalLeads||0} / qualifiés : ${data.leadsQualifies||0}
- Tickets urgents : ${data.ticketsUrgents||0}
- Actions IA récentes : ${(data.logsIARecents||[]).length}
- Erreurs IA : ${(data.logsErreurs||[]).length}

Génère un rapport exécutif avec :
1. analyse_globale : phrase de synthèse générale de la santé du SaaS (2-3 phrases max)
2. score_sante : score global 0-100 de la santé de l'agence
3. problemes : liste de problèmes détectés (max 4) avec champ: { titre, detail, categorie (critique/important), module, route_key (parmi: location/vente/comptabilite/biens/securite/taches) }
4. opportunites : liste d'opportunités à saisir (max 3) avec champ: { titre, detail, impact_estime, route_key }
5. priorites : liste de 4 tâches prioritaires ordonnées par urgence avec: { ordre, action, raison, module, route_key, urgence (critique/important/normal) }
6. detection_anomalies : liste d'anomalies système détectées (max 3) avec: { type, description }

Format JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          analyse_globale: { type: "string" },
          score_sante: { type: "number" },
          problemes: { type: "array", items: { type: "object" } },
          opportunites: { type: "array", items: { type: "object" } },
          priorites: { type: "array", items: { type: "object" } },
          detection_anomalies: { type: "array", items: { type: "object" } },
        }
      }
    });

    setResult(res);
    setGenerated(true);
    setLoading(false);
  };

  const goTo = (route_key) => {
    const r = ROUTE_MAP[route_key];
    if (r) navigate(r);
  };

  const scoreColor = (s) => {
    if (s >= 75) return "text-green-600";
    if (s >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const scoreBg = (s) => {
    if (s >= 75) return "bg-green-500";
    if (s >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Super Agent IA — Rounded</p>
            <p className="text-[11px] text-muted-foreground">Analyse globale SaaS · Détection problèmes · Priorisation</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={generated ? "outline" : "default"}
          className="rounded-full h-8 text-xs gap-1.5"
          onClick={analyse}
          disabled={loading}
        >
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyse…</>
            : generated ? <><RefreshCw className="w-3 h-3" /> Relancer</>
            : <><Zap className="w-3 h-3" /> Lancer l'analyse</>}
        </Button>
      </div>

      {/* État initial */}
      {!generated && !loading && (
        <div className="text-center py-8 space-y-3">
          <Activity className="w-12 h-12 text-muted-foreground/15 mx-auto" />
          <p className="text-sm text-muted-foreground">Le Super Agent analyse l'ensemble du SaaS :</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Location","Vente","Comptabilité","Biens","IA Logs","Anomalies"].map(m => (
              <span key={m} className="text-[11px] px-2.5 py-1 bg-secondary rounded-full text-muted-foreground">{m}</span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-10 space-y-3">
          <Loader2 className="w-10 h-10 text-primary/30 mx-auto animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">Rounded IA analyse l'intégralité de votre SaaS…</p>
          <div className="flex justify-center gap-1">
            {["Location","Vente","Compta","Biens","IA","Alertes"].map((m, i) => (
              <span key={m} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {generated && !loading && result && (
        <div className="space-y-5">
          {/* Score santé + synthèse */}
          <div className={`rounded-2xl border p-4 space-y-3 ${result.score_sante >= 75 ? "bg-green-50 border-green-200" : result.score_sante >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-4">
              <div className="text-center flex-shrink-0">
                <p className={`text-4xl font-black ${scoreColor(result.score_sante)}`}>{result.score_sante}</p>
                <p className="text-[10px] text-muted-foreground">/ 100</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold">Score santé SaaS</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${scoreBg(result.score_sante)}`}>
                    {result.score_sante >= 75 ? "BON" : result.score_sante >= 50 ? "MOYEN" : "CRITIQUE"}
                  </span>
                </div>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${scoreBg(result.score_sante)}`} style={{ width: `${result.score_sante}%` }} />
                </div>
              </div>
            </div>
            {result.analyse_globale && (
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-current/10 pt-2">{result.analyse_globale}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Problèmes */}
            {result.problemes?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Problèmes détectés
                </p>
                {result.problemes.map((p, i) => {
                  const cfg = CATEGORIE_STYLES[p.categorie] || CATEGORIE_STYLES.info;
                  return (
                    <button key={i} onClick={() => goTo(p.route_key)}
                      className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-sm ${cfg.cls}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.icon} {p.categorie}</span>
                            {p.module && <span className="text-[10px] text-muted-foreground">{p.module}</span>}
                          </div>
                          <p className="text-xs font-semibold leading-snug">{p.titre}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{p.detail}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Opportunités */}
            {result.opportunites?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Opportunités
                </p>
                {result.opportunites.map((o, i) => (
                  <button key={i} onClick={() => goTo(o.route_key)}
                    className="w-full text-left rounded-xl border border-green-200 bg-green-50/80 p-3 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-800 leading-snug">{o.titre}</p>
                        <p className="text-[11px] text-green-700 mt-0.5">{o.detail}</p>
                        {o.impact_estime && <p className="text-[10px] text-green-600 font-semibold mt-1">Impact estimé : {o.impact_estime}</p>}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priorités triées */}
          {result.priorites?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" /> Tâches prioritaires
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.priorites.map((t, i) => {
                  const urgenceCls = t.urgence === "critique" ? "border-red-200 bg-red-50/50" : t.urgence === "important" ? "border-amber-200 bg-amber-50/50" : "border-border/50 bg-white";
                  return (
                    <button key={i} onClick={() => goTo(t.route_key)}
                      className={`text-left rounded-xl border p-3 hover:shadow-sm transition-all ${urgenceCls}`}>
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          i === 0 ? "bg-red-500 text-white" : i === 1 ? "bg-amber-500 text-white" : "bg-secondary text-foreground"
                        }`}>{t.ordre || i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-snug">{t.action}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{t.raison}</p>
                          {t.module && <span className="text-[10px] text-primary font-medium">{t.module}</span>}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anomalies système */}
          {result.detection_anomalies?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-500" /> Anomalies détectées
              </p>
              {result.detection_anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
                  <Shield className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-purple-800">{a.type}</p>
                    <p className="text-[11px] text-purple-700">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aucun problème */}
          {(result.problemes?.length || 0) === 0 && (result.detection_anomalies?.length || 0) === 0 && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Aucune anomalie détectée — SaaS en bonne santé</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}