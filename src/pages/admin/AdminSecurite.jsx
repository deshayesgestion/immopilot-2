import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Search, Loader2, Trash2, Download, AlertTriangle,
  CheckCircle2, User, Edit3, PlusCircle, LogIn, Upload, Eye,
  XCircle, Lock, Database, FileDown
} from "lucide-react";

const ACTION_CONFIG = {
  create:        { label: "Création",       color: "bg-green-100 text-green-700",  icon: PlusCircle },
  update:        { label: "Modification",   color: "bg-blue-100 text-blue-700",    icon: Edit3 },
  delete:        { label: "Suppression",    color: "bg-red-100 text-red-700",      icon: Trash2 },
  login:         { label: "Connexion",      color: "bg-gray-100 text-gray-600",    icon: LogIn },
  export:        { label: "Export",         color: "bg-amber-100 text-amber-700",  icon: FileDown },
  import:        { label: "Import",         color: "bg-violet-100 text-violet-700",icon: Upload },
  rgpd_delete:   { label: "Suppression RGPD", color: "bg-rose-100 text-rose-700", icon: XCircle },
  access_denied: { label: "Accès refusé",   color: "bg-orange-100 text-orange-700",icon: Lock },
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

// ── AUDIT LOGS TAB ──────────────────────────────────────────────────────
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

// ── RGPD TAB ─────────────────────────────────────────────────────────────
function RgpdTab() {
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const search = async () => {
    if (!email.trim()) return;
    setSearching(true); setFound(null); setDone(false);
    const [leads, acq, users] = await Promise.all([
      base44.entities.Lead.filter({ email }),
      base44.entities.Acquereur.filter({ email }),
      base44.entities.User.list(),
    ]);
    const userMatch = users.filter(u => u.email === email);
    setFound({ leads, acq, user: userMatch });
    setSearching(false);
  };

  const deleteAll = async () => {
    if (!window.confirm(`Supprimer définitivement toutes les données de ${email} ? Cette action est irréversible.`)) return;
    setDeleting(true);
    for (const l of found.leads) await base44.entities.Lead.delete(l.id);
    for (const a of found.acq) await base44.entities.Acquereur.delete(a.id);
    // Log RGPD action
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      user_email: user?.email,
      user_name: user?.full_name || user?.email,
      user_role: user?.role,
      action: "rgpd_delete",
      entity: "Contact",
      entity_label: email,
      details: `Suppression RGPD demandée pour ${email} — ${found.leads.length} leads, ${found.acq.length} acquéreurs supprimés`,
    });
    setDeleting(false); setDone(true); setFound(null); setEmail("");
  };

  const totalFound = (found?.leads?.length || 0) + (found?.acq?.length || 0);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Droit à l'oubli — RGPD</p>
          <p className="text-xs text-amber-700 mt-0.5">Recherchez une personne par email pour identifier et supprimer toutes ses données personnelles conformément au RGPD.</p>
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

        {done && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4" /> Données supprimées avec succès.
          </div>
        )}

        {found && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{totalFound} enregistrement{totalFound > 1 ? "s" : ""} trouvé{totalFound > 1 ? "s" : ""}</p>
            {[
              { label: "Leads / Prospects", items: found.leads, icon: "👤" },
              { label: "Acquéreurs", items: found.acq, icon: "🔑" },
            ].map(g => g.items.length > 0 && (
              <div key={g.label} className="bg-secondary/20 rounded-xl p-3">
                <p className="text-xs font-semibold mb-2">{g.icon} {g.label} ({g.items.length})</p>
                {g.items.map(i => (
                  <p key={i.id} className="text-xs text-muted-foreground">{i.name || i.nom} · {i.email}</p>
                ))}
              </div>
            ))}
            {found.user?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Compte utilisateur actif</p>
                <p className="text-xs text-amber-700">Ce compte ne peut pas être supprimé automatiquement. Désactivez-le manuellement dans Équipe.</p>
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

// ── BACKUPS TAB ────────────────────────────────────────────────────────────
function BackupsTab() {
  const [exporting, setExporting] = useState(null);
  const [done, setDone] = useState(null);

  const EXPORTS = [
    { id: "Property", label: "Biens immobiliers", icon: "🏠", entity: "Property" },
    { id: "Lead", label: "Leads / Prospects", icon: "👤", entity: "Lead" },
    { id: "Acquereur", label: "Acquéreurs", icon: "🔑", entity: "Acquereur" },
    { id: "Transaction", label: "Transactions comptables", icon: "💰", entity: "Transaction" },
    { id: "TransactionVente", label: "Transactions vente", icon: "📈", entity: "TransactionVente" },
    { id: "DossierLocatif", label: "Dossiers locatifs", icon: "📂", entity: "DossierLocatif" },
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
    // Log export
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      user_email: user?.email,
      user_name: user?.full_name || user?.email,
      user_role: user?.role,
      action: "export",
      entity: item.entity,
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
              {exporting === item.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : done === item.id
                  ? <><CheckCircle2 className="w-3 h-3 text-green-600" /> Exporté</>
                  : <><Download className="w-3 h-3" /> Exporter</>}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
        <p className="text-sm font-semibold">Bonnes pratiques</p>
        <div className="space-y-2">
          {[
            "Exportez vos données régulièrement (hebdomadaire recommandé)",
            "Stockez les sauvegardes dans un emplacement sécurisé hors plateforme",
            "Vérifiez l'intégrité des fichiers après chaque export",
            "Documentez les exports dans votre politique RGPD interne",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "logs", label: "Journal d'audit", icon: Shield },
  { id: "rgpd", label: "Suppression RGPD", icon: Trash2 },
  { id: "backups", label: "Sauvegardes", icon: Database },
];

export default function AdminSecurite() {
  const [tab, setTab] = useState("logs");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Sécurité & Traçabilité
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Journal d'audit, conformité RGPD et sauvegardes</p>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "logs" && <AuditLogsTab />}
      {tab === "rgpd" && <RgpdTab />}
      {tab === "backups" && <BackupsTab />}
    </div>
  );
}