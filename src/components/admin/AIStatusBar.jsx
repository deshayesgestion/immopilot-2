import { useState } from "react";
import { useAI } from "@/lib/AIContext";
import { Bot, AlertTriangle, CheckCircle2, X, ChevronDown, Zap, ExternalLink, ToggleLeft, ToggleRight, Clock, Info } from "lucide-react";
import { Link } from "react-router-dom";

const AGENT_LABELS = {
  agent_vente: "Vente",
  agent_location: "Location",
  agent_comptabilite: "Compta",
  agent_support: "Support",
  system: "Système",
};

const AGENT_COLORS = {
  agent_vente: "text-blue-600",
  agent_location: "text-emerald-600",
  agent_comptabilite: "text-purple-600",
  agent_support: "text-orange-600",
  system: "text-primary",
};

const fmt = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

function AlertBadge({ alert, onDismiss }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium flex-shrink-0 ${
      alert.level === "critical" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"
    }`}>
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      <span className="hidden sm:inline">{alert.message}</span>
      <span className="sm:hidden">{AGENT_LABELS[alert.agent]}</span>
      {alert.action && (
        <Link to={alert.action} className="opacity-60 hover:opacity-100">
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}
      <button onClick={() => onDismiss(alert.id)} className="opacity-50 hover:opacity-100 ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function AIStatusBar() {
  const { alerts, metrics, agentStatus, logs, loading, lastRefresh, toggleAgent, dismissAlert, activeAgentsCount } = useAI();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState("status");

  const hasAlerts = alerts.length > 0;
  const criticals = alerts.filter(a => a.level === "critical").length;

  return (
    <>
      {/* Barre de statut IA */}
      <div className={`sticky top-0 z-30 border-b transition-colors ${
        criticals > 0 ? "bg-red-50 border-red-200" : hasAlerts ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
      }`}>
        <div className="flex items-center gap-3 px-4 py-1.5 overflow-x-auto">
          {/* Statut global */}
          <button onClick={() => setPanelOpen(o => !o)}
            className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`flex items-center gap-1.5 ${criticals > 0 ? "text-red-700" : hasAlerts ? "text-amber-700" : "text-green-700"}`}>
              <Bot className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">IA</span>
              <div className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-gray-400 animate-pulse" : criticals > 0 ? "bg-red-500 animate-pulse" : hasAlerts ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
              <span className="text-xs">{activeAgentsCount}/4</span>
            </div>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${panelOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="w-px h-4 bg-border/50 flex-shrink-0" />

          {/* Alertes inline */}
          {alerts.length === 0 && !loading && (
            <div className="flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tous les systèmes IA opérationnels</span>
            </div>
          )}
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse">Analyse en cours…</span>
          )}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {alerts.slice(0, 3).map(alert => (
              <AlertBadge key={alert.id} alert={alert} onDismiss={dismissAlert} />
            ))}
            {alerts.length > 3 && (
              <button onClick={() => { setPanelOpen(true); setPanelTab("alertes"); }}
                className="text-xs text-muted-foreground flex-shrink-0 hover:text-foreground">
                +{alerts.length - 3} alertes
              </button>
            )}
          </div>

          {/* Metrics rapides à droite */}
          {metrics && (
            <div className="flex items-center gap-3 ml-auto flex-shrink-0">
              {metrics.loyersEnRetard > 0 && (
                <span className="text-xs text-red-600 font-medium hidden md:inline">{metrics.loyersEnRetard} retard{metrics.loyersEnRetard > 1 ? "s" : ""}</span>
              )}
              {metrics.ticketsUrgents > 0 && (
                <span className="text-xs text-orange-600 font-medium hidden md:inline">{metrics.ticketsUrgents} urgent{metrics.ticketsUrgents > 1 ? "s" : ""}</span>
              )}
              {lastRefresh && (
                <span className="text-[10px] text-muted-foreground hidden lg:inline">
                  MAJ {fmt(lastRefresh)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panneau de contrôle IA */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-12 pr-4" onClick={() => setPanelOpen(false)}>
          <div className="bg-white rounded-2xl border border-border/50 shadow-xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Centre de contrôle IA</span>
              </div>
              <button onClick={() => setPanelOpen(false)} className="p-1 rounded-lg hover:bg-black/5">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 border-b border-border/30">
              {[
                { id: "status", label: "Agents" },
                { id: "alertes", label: `Alertes ${alerts.length > 0 ? `(${alerts.length})` : ""}` },
                { id: "logs", label: "Logs" },
              ].map(t => (
                <button key={t.id} onClick={() => setPanelTab(t.id)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                    panelTab === t.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary/50"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {/* Agents status */}
              {panelTab === "status" && (
                <div className="p-3 space-y-2">
                  {/* Métriques globales */}
                  {metrics && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Leads actifs", value: metrics.leadsActifs, color: "text-blue-600" },
                        { label: "Retards loyer", value: metrics.loyersEnRetard, color: metrics.loyersEnRetard > 0 ? "text-red-600" : "text-green-600" },
                        { label: "Tickets urgents", value: metrics.ticketsUrgents, color: metrics.ticketsUrgents > 0 ? "text-orange-600" : "text-green-600" },
                      ].map((m, i) => (
                        <div key={i} className="bg-secondary/30 rounded-xl p-2 text-center">
                          <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                          <p className="text-[10px] text-muted-foreground">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.entries(agentStatus).map(([agentId, active]) => (
                    <div key={agentId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? "bg-green-500" : "bg-gray-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${AGENT_COLORS[agentId]}`}>Agent {AGENT_LABELS[agentId]}</p>
                        <p className="text-[10px] text-muted-foreground">{active ? "Actif — surveillance continue" : "Désactivé"}</p>
                      </div>
                      <button onClick={() => toggleAgent(agentId)} className="flex-shrink-0">
                        {active
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-gray-300" />
                        }
                      </button>
                    </div>
                  ))}
                  <Link to="/admin/agents" onClick={() => setPanelOpen(false)}
                    className="flex items-center justify-center gap-2 mt-2 py-2 rounded-xl border border-primary/20 text-xs text-primary hover:bg-primary/5 transition-colors">
                    <Zap className="w-3.5 h-3.5" /> Gérer les agents IA
                  </Link>
                </div>
              )}

              {/* Alertes */}
              {panelTab === "alertes" && (
                <div className="p-3 space-y-2">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune alerte active</p>
                    </div>
                  ) : alerts.map(alert => (
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                      alert.level === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                    }`}>
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.level === "critical" ? "text-red-600" : "text-amber-600"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${AGENT_COLORS[alert.agent]}`}>Agent {AGENT_LABELS[alert.agent]}</p>
                        <p className="text-xs mt-0.5">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {alert.action && (
                          <Link to={alert.action} onClick={() => setPanelOpen(false)}>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                          </Link>
                        )}
                        <button onClick={() => dismissAlert(alert.id)}>
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Logs */}
              {panelTab === "logs" && (
                <div className="p-3 space-y-1.5">
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Aucun log disponible</p>
                  ) : logs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        log.level === "error" ? "bg-red-500" : log.level === "warn" ? "bg-amber-500" : "bg-green-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-semibold ${AGENT_COLORS[log.agentId] || "text-primary"}`}>
                          {AGENT_LABELS[log.agentId] || log.agentId}
                        </span>
                        <p className="text-[11px] text-foreground/80">{log.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{fmt(log.ts)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}