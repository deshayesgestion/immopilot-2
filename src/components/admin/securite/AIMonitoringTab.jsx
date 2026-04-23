import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity, Bot, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Clock, Zap, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAI } from "@/lib/AIContext";

const AGENTS = [
  { id: "agent_vente",        label: "Agent Vente",        color: "purple", emoji: "📈" },
  { id: "agent_location",     label: "Agent Location",     color: "blue",   emoji: "🏠" },
  { id: "agent_comptabilite", label: "Agent Comptabilité", color: "green",  emoji: "💰" },
  { id: "agent_support",      label: "Agent Support",      color: "orange", emoji: "🎧" },
  { id: "accueil_ia",         label: "Accueil IA",         color: "indigo", emoji: "🤖" },
  { id: "email_ia",           label: "Email IA",           color: "sky",    emoji: "📧" },
  { id: "relance_ia",         label: "Relance IA",         color: "amber",  emoji: "🔔" },
  { id: "rounded",            label: "Rounded",            color: "teal",   emoji: "📞" },
];

const COLOR_MAP = {
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-500" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  dot: "bg-green-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  sky:    { bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700",    dot: "bg-sky-500" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-500" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   dot: "bg-teal-500" },
};

export default function AIMonitoringTab() {
  const { isActive } = useAI();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AIActionLog.list("-created_date", 500);
    setLogs(data);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const today = logs.filter(l => new Date(l.created_date).toDateString() === now.toDateString());
  const lastHour = logs.filter(l => (now - new Date(l.created_date)) < 3600000);
  const last24h = logs.filter(l => (now - new Date(l.created_date)) < 86400000);

  const agentStats = AGENTS.map(agent => {
    const agentLogs = last24h.filter(l => l.agent === agent.id);
    const errors = agentLogs.filter(l => l.status === "error").length;
    const blocked = agentLogs.filter(l => l.status === "blocked").length;
    const lastAction = agentLogs[0];
    return { ...agent, total: agentLogs.length, errors, blocked, lastAction };
  });

  const globalErrors = last24h.filter(l => l.status === "error");
  const globalBlocked = last24h.filter(l => l.status === "blocked");
  const errorRate = last24h.length > 0 ? Math.round((globalErrors.length / last24h.length) * 100) : 0;

  // Détection activité anormale (> 2x la moyenne)
  const byHour = Array.from({ length: 24 }, (_, i) => {
    const h = new Date(now - i * 3600000);
    return logs.filter(l => {
      const d = new Date(l.created_date);
      return d.getHours() === h.getHours() && d.toDateString() === h.toDateString();
    }).length;
  });
  const avgHourly = byHour.reduce((a, b) => a + b, 0) / 24;
  const currentHourCount = byHour[0];
  const isAnomalous = currentHourCount > Math.max(avgHourly * 2, 10);

  const actionByType = {};
  today.forEach(l => { actionByType[l.action_type] = (actionByType[l.action_type] || 0) + 1; });
  const topActions = Object.entries(actionByType).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Statut global */}
      <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
        isAnomalous ? "bg-red-50 border-red-200" :
        globalErrors.length > 5 ? "bg-amber-50 border-amber-200" :
        "bg-green-50 border-green-200"
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAnomalous ? "bg-red-100" : globalErrors.length > 5 ? "bg-amber-100" : "bg-green-100"
        }`}>
          {isAnomalous ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
           globalErrors.length > 5 ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
           <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {isAnomalous ? "⚠️ Activité anormale détectée" :
             globalErrors.length > 5 ? "Erreurs IA élevées" :
             "Système IA opérationnel"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {last24h.length} actions 24h · {lastHour.length} dernière heure · {errorRate}% erreurs
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs flex-shrink-0" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Actions aujourd'hui", value: today.length, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
          { label: "Dernière heure", value: lastHour.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Erreurs 24h", value: globalErrors.length, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Bloqués 24h", value: globalBlocked.length, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Agents grid */}
      <div>
        <h3 className="text-sm font-semibold mb-3">État des agents IA (24h)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {agentStats.map(agent => {
            const c = COLOR_MAP[agent.color];
            return (
              <div key={agent.id} className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agent.emoji}</span>
                    <span className={`text-xs font-semibold ${c.text}`}>{agent.label}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${agent.total > 0 ? c.dot : "bg-gray-300"}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Actions</span>
                    <span className="font-bold">{agent.total}</span>
                  </div>
                  {agent.errors > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-red-600">Erreurs</span>
                      <span className="font-bold text-red-600">{agent.errors}</span>
                    </div>
                  )}
                  {agent.blocked > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-600">Bloqués</span>
                      <span className="font-bold text-amber-600">{agent.blocked}</span>
                    </div>
                  )}
                  {agent.lastAction && (
                    <div className="text-[10px] text-muted-foreground/70 mt-1 pt-1 border-t border-black/5">
                      Dernière action : {new Date(agent.lastAction.created_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top actions + erreurs récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <h3 className="text-sm font-semibold mb-4">Actions les plus fréquentes (aujourd'hui)</h3>
          {topActions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune action aujourd'hui</p>
          ) : (
            <div className="space-y-2">
              {topActions.map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs font-medium capitalize flex-1">{type.replace(/_/g, " ")}</span>
                  <div className="flex-1 bg-secondary/30 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((count / today.length) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-primary w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <h3 className="text-sm font-semibold mb-4">Erreurs récentes</h3>
          {globalErrors.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Aucune erreur en 24h</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {globalErrors.slice(0, 8).map(l => (
                <div key={l.id} className="flex items-start gap-2 p-2 bg-red-50 rounded-xl">
                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-red-700">{l.agent} — {l.action_type}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{l.error_message || l.details}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {new Date(l.created_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}