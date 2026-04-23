import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Search, Loader2, Trash2, Download, AlertTriangle,
  CheckCircle2, Edit3, PlusCircle, LogIn, Upload, Eye,
  XCircle, Lock, Database, FileDown, Bot, Activity,
  Settings, Bell
} from "lucide-react";

import AILogsTab from "@/components/admin/securite/AILogsTab";
import AIMonitoringTab from "@/components/admin/securite/AIMonitoringTab";
import AIControlTab from "@/components/admin/securite/AIControlTab";
import AIAlertsTab from "@/components/admin/securite/AIAlertsTab";

// ── AUDIT LOG (actions humaines) ──────────────────────────────────────────
const ACTION_CONFIG = {
  create:        { label: "Création",       color: "bg-green-100 text-green-700",   icon: PlusCircle },
  update:        { label: "Modification",   color: "bg-blue-100 text-blue-700",     icon: Edit3 },
  delete:        { label: "Suppression",    color: "bg-red-100 text-red-700",       icon: Trash2 },
  login:         { label: "Connexion",      color: "bg-gray-100 text-gray-600",     icon: LogIn },
  export:        { label: "Export",         color: "bg-amber-100 text-amber-700",   icon: FileDown },
  import:        { label: "Import",         color: "bg-violet-100 text-violet-700", icon: Upload },
  rgpd_delete:   { label: "Suppression RGPD", color: "bg-rose-100 text-rose-700",  icon: XCircle },
  access_denied: { label: "Accès refusé",   color: "bg-orange-100 text-orange-700", icon: Lock },
};

const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { label: action, color: "bg-gray-100 text-gray-600", icon: Eye };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 200).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || [l.user_email, l.user_name, l.entity, l.entity_label, l.details].some(v => v?.toLowerCase().includes(q));
    const matchA = filterAction === "all" || l.action === filterAction;
    return matchQ && matchA;
  });

  const exportCSV = () => {
    const headers = ["Date", "Utilisateur", "Rôle", "Action", "Entité", "Libellé", "Détails"];
    const rows = filtered.map(l => [
      fmt(l.created_date), l.user_email, l.user_role, l.action, l.entity, l.entity_label || "", l.details || ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher utilisateur, entité…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-full" />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
            <option value="all">Toutes les actions</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-9" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Exporter
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
          <Shield className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun log trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map(log => {
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {(log.user_name || log.user_email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{log.user_name || log.user_email}</span>
                        <ActionBadge action={log.action} />
                        {log.entity && <span className="text-xs text-muted-foreground">{log.entity}{log.entity_label ? ` · ${log.entity_label}` : ""}</span>}
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{fmt(log.created_date)}</p>
                      {log.user_role && <p className="text-[10px] text-muted-foreground/60">{log.user_role}</p>}
                    </div>
                  </div>
                  {isExpanded && log.changes && (
                    <div className="px-5 pb-4">
                      <div className="bg-secondary/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Modifications :</p>
                        <div className="space-y-1.5">
                          {Object.entries(log.changes).map(([field, { before, after }]) => (
                            <div key={field} className="flex items-start gap-2 text-xs">
                              <span className="font-mono text-muted-foreground w-24 flex-shrink-0 truncate">{field}</span>
                              <span className="line-through text-red-500 truncate max-w-[120px]">{String(before ?? "—")}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-green-700 truncate max-w-[120px]">{String(after ?? "—")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RGPD ──────────────────────────────────────────────────────────────────
function RgpdTab() {
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const search = async () => {
    if (!email.trim()) return;
    setSearching(true); setFound(null); setDone(false);
    const [leads, users] = await Promise.all([
      base44.entities.Lead.filter({ email }),
      base44.entities.User.list(),
    ]);
    const userMatch = users.filter(u => u.email === email);
    setFound({ leads, user: userMatch });
    setSearching(false);
  };

  const deleteAll = async () => {
    if (!window.confirm(`Supprimer définitivement toutes les données de ${email} ?`)) return;
    setDeleting(true);
    for (const l of found.leads) await base44.entities.Lead.delete(l.id);
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      user_email: user?.email, user_name: user?.full_name || user?.email, user_role: user?.role,
      action: "rgpd_delete", entity: "Contact", entity_label: email,
      details: `Suppression RGPD — ${found.leads.length} leads supprimés`,
    });
    setDeleting(false); setDone(true); setFound(null); setEmail("");
  };

  const totalFound = found?.leads?.length || 0;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Droit à l'oubli — RGPD</p>
          <p className="text-xs text-amber-700 mt-0.5">Recherchez une personne par email pour identifier et supprimer toutes ses données personnelles.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
        <p className="text-sm font-semibold">Recherche par email</p>
        <div className="flex gap-2">
          <Input placeholder="email@exemple.fr" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()} className="flex-1 h-10 rounded-xl" />
          <Button className="rounded-xl h-10 px-5" onClick={search} disabled={searching || !email.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
          </Button>
        </div>
        {done && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3"><CheckCircle2 className="w-4 h-4" /> Données supprimées.</div>}
        {found && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{totalFound} enregistrement{totalFound > 1 ? "s" : ""} trouvé{totalFound > 1 ? "s" : ""}</p>
            {found.user?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Compte utilisateur actif</p>
                <p className="text-xs text-amber-700">Ce compte ne peut pas être supprimé automatiquement.</p>
              </div>
            )}
            {totalFound > 0 && (
              <Button variant="destructive" className="rounded-full w-full h-9 text-sm gap-2" onClick={deleteAll} disabled={deleting}>
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Supprimer toutes les données</>}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── BACKUPS ────────────────────────────────────────────────────────────────
function BackupsTab() {
  const [exporting, setExporting] = useState(null);
  const [done, setDone] = useState(null);

  const EXPORTS = [
    { id: "Bien", label: "Biens immobiliers", icon: "🏠", entity: "Bien" },
    { id: "Lead", label: "Leads / Prospects", icon: "👤", entity: "Lead" },
    { id: "Contact", label: "Contacts", icon: "👥", entity: "Contact" },
    { id: "Transaction", label: "Transactions", icon: "💰", entity: "Transaction" },
    { id: "DossierImmobilier", label: "Dossiers immobiliers", icon: "📂", entity: "DossierImmobilier" },
    { id: "Paiement", label: "Paiements", icon: "💳", entity: "Paiement" },
    { id: "AIActionLog", label: "Logs IA", icon: "🤖", entity: "AIActionLog" },
  ];

  const exportEntity = async (item) => {
    setExporting(item.id); setDone(null);
    const data = await base44.entities[item.entity].list();
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const rows = data.map(row => headers.map(h => {
      const v = row[h];
      const str = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backup_${item.entity.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      user_email: user?.email, user_name: user?.full_name || user?.email, user_role: user?.role,
      action: "export", entity: item.entity,
      details: `Export sauvegarde — ${data.length} enregistrements`,
    });
    setExporting(null); setDone(item.id);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Sauvegarde des données</p>
          <p className="text-xs text-blue-700 mt-0.5">Exportez vos données en CSV à tout moment. Les exports sont tracés dans le journal d'audit.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPORTS.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-border/50 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <p className="text-sm font-medium">{item.label}</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5 flex-shrink-0"
              onClick={() => exportEntity(item)} disabled={exporting === item.id}>
              {exporting === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
               done === item.id ? <><CheckCircle2 className="w-3 h-3 text-green-600" /> Exporté</> :
               <><Download className="w-3 h-3" /> Exporter</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "ai-monitoring", label: "Monitoring IA",      icon: Activity },
  { id: "ai-logs",       label: "Logs IA",            icon: Bot },
  { id: "ai-control",    label: "Contrôle IA",        icon: Settings },
  { id: "ai-alerts",     label: "Alertes IA",         icon: Bell },
  { id: "logs",          label: "Journal d'audit",    icon: Shield },
  { id: "rgpd",          label: "RGPD",               icon: XCircle },
  { id: "backups",       label: "Sauvegardes",        icon: Database },
];

// BackupsTab is defined above in this file

export default function AdminSecurite() {
  const [tab, setTab] = useState("ai-monitoring");
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    base44.entities.AIActionLog.list("-created_date", 500).then(logs => {
      const now = new Date();
      const last24h = logs.filter(l => (now - new Date(l.created_date)) < 86400000);
      const errors = last24h.filter(l => l.status === "error").length;
      const lastHour = logs.filter(l => (now - new Date(l.created_date)) < 3600000).length;
      setAlertCount((errors > 5 ? 1 : 0) + (lastHour > 50 ? 1 : 0));
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Sécurité & Centre de Contrôle IA
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitoring, logs, contrôle des agents IA, alertes et conformité RGPD
        </p>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 relative ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === "ai-alerts" && alertCount > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                  tab === t.id ? "bg-white/20" : "bg-red-500 text-white"
                }`}>{alertCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "ai-monitoring" && <AIMonitoringTab />}
      {tab === "ai-logs"       && <AILogsTab />}
      {tab === "ai-control"    && <AIControlTab />}
      {tab === "ai-alerts"     && <AIAlertsTab />}
      {tab === "logs"          && <AuditLogsTab />}
      {tab === "rgpd"          && <RgpdTab />}
      {tab === "backups"       && <BackupsTab />}
    </div>
  );
}