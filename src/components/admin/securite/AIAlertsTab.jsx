import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, TrendingUp, XCircle, Bot, RefreshCw, Loader2, CheckCircle2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALERT_TYPES = [
  {
    id: "high_volume",
    label: "Volume élevé",
    desc: "Plus de 50 actions en 1 heure",
    severity: "high",
    color: "bg-orange-50 border-orange-200 text-orange-700",
    icon: TrendingUp,
    check: (logs, now) => {
      const lastHour = logs.filter(l => (now - new Date(l.created_date)) < 3600000);
      return lastHour.length > 50 ? `${lastHour.length} actions dans la dernière heure` : null;
    }
  },
  {
    id: "high_errors",
    label: "Taux d'erreurs élevé",
    desc: "Plus de 10% d'erreurs sur 24h",
    severity: "high",
    color: "bg-red-50 border-red-200 text-red-700",
    icon: XCircle,
    check: (logs, now) => {
      const last24h = logs.filter(l => (now - new Date(l.created_date)) < 86400000);
      const errors = last24h.filter(l => l.status === "error");
      const rate = last24h.length > 0 ? errors.length / last24h.length : 0;
      return rate > 0.1 ? `${Math.round(rate * 100)}% erreurs sur ${last24h.length} actions` : null;
    }
  },
  {
    id: "spam_client",
    label: "Spam client potentiel",
    desc: "Un client a reçu plus de 5 messages en 24h",
    severity: "medium",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    icon: Bot,
    check: (logs, now) => {
      const last24h = logs.filter(l => (now - new Date(l.created_date)) < 86400000);
      const msgs = last24h.filter(l => ["email", "sms", "whatsapp"].includes(l.action_type));
      const byContact = {};
      msgs.forEach(l => { if (l.target_contact) byContact[l.target_contact] = (byContact[l.target_contact] || 0) + 1; });
      const suspect = Object.entries(byContact).find(([, count]) => count > 5);
      return suspect ? `${suspect[0]} a reçu ${suspect[1]} messages` : null;
    }
  },
  {
    id: "loop_detection",
    label: "Boucle IA détectée",
    desc: "Même action répétée > 10 fois en 30 min",
    severity: "high",
    color: "bg-red-50 border-red-200 text-red-700",
    icon: AlertTriangle,
    check: (logs, now) => {
      const last30min = logs.filter(l => (now - new Date(l.created_date)) < 1800000);
      const actionCounts = {};
      last30min.forEach(l => {
        const key = `${l.agent}_${l.action_type}_${l.target_entity_id}`;
        actionCounts[key] = (actionCounts[key] || 0) + 1;
      });
      const loop = Object.entries(actionCounts).find(([, count]) => count > 10);
      return loop ? `Action répétée ${loop[1]} fois en 30 min` : null;
    }
  },
  {
    id: "agent_down",
    label: "Agent IA inactif",
    desc: "Un agent n'a pas eu d'activité depuis 6h (si attendu)",
    severity: "low",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    icon: Bot,
    check: (logs, now) => {
      const last6h = logs.filter(l => (now - new Date(l.created_date)) < 21600000);
      if (logs.length > 50 && last6h.length === 0) return "Aucune activité IA depuis 6h";
      return null;
    }
  },
  {
    id: "blocked_surge",
    label: "Actions bloquées en hausse",
    desc: "Plus de 20 actions bloquées en 1h",
    severity: "medium",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    icon: AlertTriangle,
    check: (logs, now) => {
      const lastHour = logs.filter(l => (now - new Date(l.created_date)) < 3600000 && l.status === "blocked");
      return lastHour.length > 20 ? `${lastHour.length} actions bloquées en 1h` : null;
    }
  },
];

const SEVERITY_COLOR = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

export default function AIAlertsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState([]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AIActionLog.list("-created_date", 500);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const activeAlerts = ALERT_TYPES
    .map(type => ({ ...type, message: type.check(logs, now) }))
    .filter(a => a.message && !dismissed.includes(a.id));

  const recentBlocked = logs
    .filter(l => l.status === "blocked" && (now - new Date(l.created_date)) < 86400000)
    .slice(0, 10);

  const recentErrors = logs
    .filter(l => l.status === "error" && (now - new Date(l.created_date)) < 86400000)
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Alertes système IA</h3>
          <p className="text-xs text-muted-foreground">{activeAlerts.length} alerte{activeAlerts.length !== 1 ? "s" : ""} active{activeAlerts.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Analyser
        </Button>
      </div>

      {/* Alertes actives */}
      {activeAlerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-green-700">Aucune alerte active</p>
          <p className="text-xs text-green-600 mt-1">Le système IA fonctionne normalement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map(alert => {
            const Icon = alert.icon;
            return (
              <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${alert.color}`}>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${SEVERITY_COLOR[alert.severity]} animate-pulse`} />
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{alert.label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">{alert.desc}</p>
                </div>
                <button onClick={() => setDismissed(d => [...d, alert.id])}
                  className="text-xs opacity-60 hover:opacity-100 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-black/5 transition-colors">
                  Ignorer
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions bloquées récentes */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Actions bloquées (24h)</h3>
          <span className="ml-auto text-xs text-muted-foreground">{recentBlocked.length} au total</span>
        </div>
        {recentBlocked.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune action bloquée</p>
        ) : (
          <div className="space-y-2">
            {recentBlocked.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl text-xs">
                <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{l.agent}</span>
                  {l.target_contact && <span className="text-muted-foreground"> → {l.target_contact}</span>}
                  {l.blocked_reason && <p className="text-[10px] text-muted-foreground truncate">{l.blocked_reason}</p>}
                </div>
                <span className="text-muted-foreground/60 flex-shrink-0">
                  {new Date(l.created_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Erreurs récentes */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold">Erreurs IA (24h)</h3>
          <span className="ml-auto text-xs text-muted-foreground">{recentErrors.length} au total</span>
        </div>
        {recentErrors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune erreur</p>
        ) : (
          <div className="space-y-2">
            {recentErrors.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2.5 bg-red-50 rounded-xl text-xs">
                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{l.agent}</span> — <span className="capitalize">{l.action_type?.replace(/_/g, " ")}</span>
                  {l.error_message && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{l.error_message}</p>}
                </div>
                <span className="text-muted-foreground/60 flex-shrink-0">
                  {new Date(l.created_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}