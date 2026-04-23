import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Download, Loader2, Bot, Mail, MessageSquare,
  Phone, Bell, FolderOpen, CreditCard, CheckCircle2, XCircle,
  AlertTriangle, Clock, RefreshCw
} from "lucide-react";

const ACTION_CONFIG = {
  email:          { label: "Email IA",       color: "bg-blue-100 text-blue-700",    icon: Mail },
  sms:            { label: "SMS",            color: "bg-green-100 text-green-700",  icon: MessageSquare },
  whatsapp:       { label: "WhatsApp",       color: "bg-emerald-100 text-emerald-700", icon: MessageSquare },
  relance:        { label: "Relance",        color: "bg-amber-100 text-amber-700",  icon: Bell },
  ticket_create:  { label: "Ticket créé",   color: "bg-purple-100 text-purple-700",icon: Bot },
  dossier_update: { label: "Dossier MAJ",   color: "bg-indigo-100 text-indigo-700",icon: FolderOpen },
  paiement_action:{ label: "Paiement",      color: "bg-rose-100 text-rose-700",    icon: CreditCard },
  lead_update:    { label: "Lead MAJ",      color: "bg-orange-100 text-orange-700",icon: Bot },
  bi_analyse:     { label: "Analyse BI",    color: "bg-cyan-100 text-cyan-700",    icon: Bot },
  call_rounded:   { label: "Appel Rounded", color: "bg-teal-100 text-teal-700",    icon: Phone },
};

const AGENT_CONFIG = {
  agent_vente:       { label: "Agent Vente",       color: "bg-purple-50 text-purple-700" },
  agent_location:    { label: "Agent Location",    color: "bg-blue-50 text-blue-700" },
  agent_comptabilite:{ label: "Agent Compta",      color: "bg-green-50 text-green-700" },
  agent_support:     { label: "Agent Support",     color: "bg-orange-50 text-orange-700" },
  accueil_ia:        { label: "Accueil IA",        color: "bg-primary/10 text-primary" },
  email_ia:          { label: "Email IA",          color: "bg-blue-50 text-blue-700" },
  relance_ia:        { label: "Relance IA",        color: "bg-amber-50 text-amber-700" },
  rounded:           { label: "Rounded",           color: "bg-teal-50 text-teal-700" },
};

const STATUS_CONFIG = {
  success: { label: "Succès",    color: "text-green-600", icon: CheckCircle2 },
  error:   { label: "Erreur",    color: "text-red-600",   icon: XCircle },
  blocked: { label: "Bloqué",   color: "text-amber-600", icon: AlertTriangle },
  pending: { label: "En cours", color: "text-blue-600",  icon: Clock },
};

const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AILogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AIActionLog.list("-created_date", 300);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || [l.target_contact, l.target_entity, l.details, l.agent].some(v => v?.toLowerCase().includes(q));
    const matchA = filterAction === "all" || l.action_type === filterAction;
    const matchAg = filterAgent === "all" || l.agent === filterAgent;
    const matchS = filterStatus === "all" || l.status === filterStatus;
    return matchQ && matchA && matchAg && matchS;
  });

  const exportCSV = () => {
    const headers = ["Date", "Type", "Agent", "Statut", "Contact", "Entité", "Détails"];
    const rows = filtered.map(l => [
      fmt(l.created_date), l.action_type, l.agent, l.status,
      l.target_contact || "", l.target_entity || "", l.details || ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ai_logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === "success").length,
    errors: logs.filter(l => l.status === "error").length,
    blocked: logs.filter(l => l.status === "blocked").length,
    today: logs.filter(l => new Date(l.created_date).toDateString() === new Date().toDateString()).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Aujourd'hui", value: stats.today, color: "text-primary" },
          { label: "Succès", value: stats.success, color: "text-green-600" },
          { label: "Erreurs", value: stats.errors, color: "text-red-600" },
          { label: "Bloqués", value: stats.blocked, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border/50 p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Rechercher contact, entité…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-full text-xs" />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="h-9 rounded-xl border border-input bg-white px-3 text-xs">
            <option value="all">Tous types</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="h-9 rounded-xl border border-input bg-white px-3 text-xs">
            <option value="all">Tous agents</option>
            {Object.entries(AGENT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-9 rounded-xl border border-input bg-white px-3 text-xs">
            <option value="all">Tous statuts</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-9 text-xs" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </Button>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-9 text-xs" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Exporter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
          <Bot className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun log IA trouvé</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Les actions IA apparaîtront ici automatiquement</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map(log => {
              const actionCfg = ACTION_CONFIG[log.action_type] || { label: log.action_type, color: "bg-gray-100 text-gray-600", icon: Bot };
              const agentCfg = AGENT_CONFIG[log.agent] || { label: log.agent, color: "bg-gray-100 text-gray-600" };
              const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
              const ActionIcon = actionCfg.icon;
              const StatusIcon = statusCfg.icon;
              const isExpanded = expanded === log.id;

              return (
                <div key={log.id} className="hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${actionCfg.color}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${actionCfg.color}`}>{actionCfg.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${agentCfg.color}`}>{agentCfg.label}</span>
                        {log.target_contact && <span className="text-xs text-muted-foreground">{log.target_contact}</span>}
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusIcon className={`w-4 h-4 ${statusCfg.color}`} />
                      <p className="text-[10px] text-muted-foreground">{fmt(log.created_date)}</p>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="bg-secondary/20 rounded-xl p-3 space-y-2 text-xs">
                        {log.target_entity && <div><span className="text-muted-foreground">Entité :</span> <span className="font-medium">{log.target_entity}</span></div>}
                        {log.module && <div><span className="text-muted-foreground">Module :</span> <span className="font-medium capitalize">{log.module}</span></div>}
                        {log.duration_ms && <div><span className="text-muted-foreground">Durée :</span> <span className="font-medium">{log.duration_ms}ms</span></div>}
                        {log.tokens_used && <div><span className="text-muted-foreground">Tokens :</span> <span className="font-medium">{log.tokens_used}</span></div>}
                        {log.error_message && <div className="text-red-600"><span className="font-semibold">Erreur :</span> {log.error_message}</div>}
                        {log.blocked_reason && <div className="text-amber-600"><span className="font-semibold">Bloqué car :</span> {log.blocked_reason}</div>}
                        {log.details && <div><span className="text-muted-foreground">Détails :</span> {log.details}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground">
            {filtered.length} log{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}