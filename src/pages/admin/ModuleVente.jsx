import RoleGuard from "@/components/admin/RoleGuard";
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, Home, Users, FileSignature, BarChart2, Loader2,
  Euro, Target, Zap, AlertCircle, LayoutGrid, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BiensList from "@/components/shared/BiensList";
import PipelineVendeur from "@/components/modules/vente/PipelineVendeur";
import PipelineAcquereur from "@/components/modules/vente/PipelineAcquereur";
import KanbanVente from "@/components/modules/vente/KanbanVente";
import VenteDossierUnifie from "@/components/modules/vente/VenteDossierUnifie";

// ── Modal générique pour quick actions vente ─────────────────────────────────
function VenteActionModal({ actionId, actions, onClose }) {
  const action = actions.find(a => a.id === actionId);
  const [values, setValues] = useState(() => {
    const init = {};
    action?.fields?.forEach(f => { init[f.key] = f.default ?? ""; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setValues(p => ({ ...p, [k]: v }));

  if (!action || !action.fields) return null;

  const isValid = action.fields.filter(f => f.required).every(f => values[f.key]);

  const handleSubmit = async () => {
    setSaving(true);
    await action.onSubmit(values);
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">{action.emoji}</span>
            <p className="text-sm font-bold">{action.label}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-3">
          {done ? (
            <div className="py-4 text-center">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm font-semibold text-green-700">{action.successMsg || "Action effectuée ✓"}</p>
            </div>
          ) : (
            <>
              {action.fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    {field.label}{field.required ? " *" : ""}
                  </label>
                  {field.type === "select" ? (
                    <select value={values[field.key]} onChange={e => set(field.key, e.target.value)}
                      className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                      <option value="">— Choisir —</option>
                      {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={values[field.key]} onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder} rows={3}
                      className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                  ) : (
                    <input type={field.type || "text"} value={values[field.key]} onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={onClose} className="flex-1 h-9 rounded-full border border-border/50 text-sm text-muted-foreground hover:bg-secondary/50">Annuler</button>
                <button onClick={handleSubmit} disabled={saving || !isValid}
                  className="flex-1 h-9 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 flex items-center justify-center gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : action.emoji}
                  {saving ? "En cours…" : action.cta || "Confirmer"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "kanban",      label: "Pipeline Kanban",    icon: LayoutGrid,    desc: "Vue globale · Drag étapes · Actions rapides" },
  { id: "vendeur",     label: "Dossiers Vendeur",   icon: Home,          desc: "Mandats · Estimation IA · Documents" },
  { id: "acquereur",   label: "Pipeline Acquéreur",  icon: Users,         desc: "Qualification · Matching · Offres · Compromis" },
  { id: "biens",       label: "Biens à vendre",      icon: FileSignature, desc: "Catalogue · Publication" },
  { id: "transactions",label: "Transactions",        icon: BarChart2,     desc: "Ventes clôturées · CA" },
];

const TX_COLORS = {
  en_cours: "bg-blue-100 text-blue-700",
  signe:    "bg-green-100 text-green-700",
  cloture:  "bg-slate-100 text-slate-600",
  annule:   "bg-red-100 text-red-600",
};

function TransactionsList({ transactions, contactMap, bienMap }) {
  if (!transactions.length)
    return (
      <div className="bg-white rounded-2xl border border-border/50 py-16 text-center">
        <BarChart2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Aucune transaction clôturée</p>
      </div>
    );
  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            {["Bien", "Acheteur", "Vendeur", "Prix", "Commission", "Statut"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3 font-medium">{bienMap[t.bien_id]?.titre || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.acheteur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.vendeur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 font-semibold">{t.prix ? t.prix.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.commission ? t.commission.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${TX_COLORS[t.statut] || "bg-secondary text-muted-foreground"}`}>
                  {t.statut || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModuleVente() {
  const [tab, setTab] = useState("kanban");
  const [activeVenteAction, setActiveVenteAction] = useState(null);
  const [biens, setBiens] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [mandats, setMandats] = useState([]);
  const [acquereurs, setAcquereurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMandat, setSelectedMandat] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [b, c, t, m, a] = await Promise.all([
        base44.entities.Bien.filter({ type: "vente" }),
        base44.entities.Contact.list("-created_date", 300),
        base44.entities.Transaction.filter({ type: "vente" }),
        base44.entities.MandatVente.list("-created_date", 100),
        base44.entities.Acquereur.list("-created_date", 200),
      ]);
      setBiens(b);
      setContacts(c);
      setTransactions(t);
      setMandats(m);
      setAcquereurs(a);
      setLoading(false);
    };
    load();
  }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const caTotal = transactions.filter(t => t.statut === "cloture").reduce((s, t) => s + (t.prix || 0), 0);
  const commissionsTotal = transactions.filter(t => t.statut === "cloture").reduce((s, t) => s + (t.commission || 0), 0);

  const stats = [
    { label: "Mandats actifs",    value: mandats.filter(m => m.statut === "actif").length,         color: "text-blue-600",    bg: "bg-blue-50",    icon: Home },
    { label: "Acquéreurs",        value: acquereurs.filter(a => a.statut === "actif").length,       color: "text-green-600",   bg: "bg-green-50",   icon: Users },
    { label: "Biens disponibles", value: biens.filter(b => b.statut === "disponible").length,       color: "text-indigo-600",  bg: "bg-indigo-50",  icon: Target },
    { label: "CA clôturé",        value: caTotal.toLocaleString("fr-FR") + " €",                   color: "text-amber-600",   bg: "bg-amber-50",   icon: Euro },
  ];

  // Alertes intelligentes
  const biensBloqués = biens.filter(b => {
    const mandat = mandats.find(m => m.bien_id === b.id);
    if (!mandat) return false;
    const debut = mandat.date_debut_mandat ? new Date(mandat.date_debut_mandat) : null;
    if (!debut) return false;
    const jours = Math.floor((new Date() - debut) / 86400000);
    return jours > 60 && b.statut !== "vendu";
  });

  // Quick actions vente
  const VENTE_QUICK_ACTIONS = [
    {
      id: "new_mandat", label: "Nouveau mandat", emoji: "📋",
      color: "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white",
      onClick: () => setTab("vendeur"),
    },
    {
      id: "new_acquereur", label: "Nouvel acquéreur", emoji: "👤",
      color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white",
      onClick: () => setTab("acquereur"),
    },
    {
      id: "planifier_visite", label: "Planifier visite", emoji: "📅",
      color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-500 hover:text-white",
      fields: [
        { key: "titre", label: "Bien / Objet", required: true, placeholder: "Visite appartement T3…" },
        { key: "contact_nom", label: "Acquéreur", placeholder: "Nom…" },
        { key: "date_debut", label: "Date & heure", type: "datetime-local", required: true },
      ],
      onSubmit: async (v) => {
        await base44.entities.Evenement.create({
          titre: v.titre, date_debut: v.date_debut, type: "visite",
          contact_nom: v.contact_nom, module: "vente", statut: "planifie",
        });
      },
      successMsg: "Visite planifiée ✓", cta: "Planifier",
    },
    {
      id: "estimation_ia", label: "Estimation IA", emoji: "🤖",
      color: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-500 hover:text-white",
      fields: [
        { key: "bien_id", label: "Bien à estimer", required: true, type: "select", options: biens.slice(0, 30).map(b => ({ value: b.id, label: b.titre })) },
      ],
      onSubmit: async (v) => {
        const b = biens.find(x => x.id === v.bien_id);
        if (!b) return;
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: `Expert immobilier FR. Estimation bien: ${b.adresse || b.titre}, ${b.surface || "?"}m², ${b.nb_pieces || "?"}p, DPE:${b.dpe || "—"}. JSON: {prix_min:number, prix_max:number, prix_recommande:number, delai_vente_estime:string}`,
          response_json_schema: { type: "object", properties: { prix_min: { type: "number" }, prix_max: { type: "number" }, prix_recommande: { type: "number" }, delai_vente_estime: { type: "string" } } },
        });
        const mandat = mandats.find(m => m.bien_id === b.id);
        if (mandat) await base44.entities.MandatVente.update(mandat.id, { estimation_ia: r });
      },
      successMsg: "Estimation IA lancée ✓", cta: "Estimer",
    },
    {
      id: "relancer_acquereur", label: "Relancer acquéreur", emoji: "🔔",
      color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white",
      fields: [
        { key: "acquereur_id", label: "Acquéreur", required: true, type: "select", options: acquereurs.slice(0, 30).map(a => ({ value: a.id, label: a.nom })) },
        { key: "message", label: "Message (optionnel)", type: "textarea", placeholder: "Rappel suite à la visite…" },
      ],
      onSubmit: async (v) => {
        const a = acquereurs.find(x => x.id === v.acquereur_id);
        if (!a) return;
        await base44.entities.Relance.create({
          type_relance: "reponse_client", contact_nom: a.nom, contact_email: a.email,
          canal: "email", statut: "planifiee", niveau: 1, auto: false, raison: v.message,
        });
        if (a.email && v.message) {
          await base44.integrations.Core.SendEmail({ to: a.email, subject: "Suivi de votre recherche immobilière", body: `<p>Bonjour ${a.nom},</p><p>${v.message}</p>` });
        }
      },
      successMsg: "Relance envoyée ✓", cta: "Relancer",
    },
    {
      id: "voir_transactions", label: "Transactions", emoji: "💰",
      color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-500 hover:text-white",
      onClick: () => setTab("transactions"),
    },
  ];

  return (
    <RoleGuard module="vente">
    <div className="space-y-4 max-w-7xl">
      {/* ── HEADER ACTIONNEL ── */}
      <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Module Vente</h1>
              <p className="text-xs text-muted-foreground">Mandats · Pipeline acquéreur · Offres · Compromis · Closing</p>
            </div>
          </div>
          {/* KPIs inline */}
          <div className="flex items-center gap-5">
            {stats.map((s, i) => (
              <div key={i} className="text-center hidden sm:block">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
            <Button className="rounded-full gap-1.5 h-9 text-sm" onClick={() => setTab("vendeur")}>
              <Plus className="w-3.5 h-3.5" /> Nouveau mandat
            </Button>
          </div>
        </div>

        {/* Quick actions pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {VENTE_QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => {
                if (action.onClick) { action.onClick(); return; }
                setActiveVenteAction(action.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm active:scale-95 ${action.color}`}
            >
              <span>{action.emoji}</span> {action.label}
            </button>
          ))}
        </div>

        {/* Alertes IA */}
        {biensBloqués.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              ⚠ {biensBloqués.length} bien{biensBloqués.length > 1 ? "s" : ""} en vente depuis +60 jours → {biensBloqués.map(b => b.titre).join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="bg-white rounded-2xl border border-border/50 p-1.5 flex flex-wrap gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Action Modal */}
      {activeVenteAction && <VenteActionModal actionId={activeVenteAction} actions={VENTE_QUICK_ACTIONS} onClose={() => setActiveVenteAction(null)} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "kanban" && (
            <KanbanVente
              mandats={mandats}
              biens={biens}
              contacts={contacts}
              acquereurs={acquereurs}
              onMandatUpdate={setMandats}
              onSelectMandat={setSelectedMandat}
            />
          )}
          {tab === "vendeur" && (
            <PipelineVendeur
              biens={biens}
              contacts={contacts}
            />
          )}
          {tab === "acquereur" && (
            <PipelineAcquereur
              biens={biens}
              contacts={contacts}
            />
          )}
          {tab === "biens" && (
            <BiensList
              biens={biens}
              typeModule="vente"
              onBiensChange={setBiens}
            />
          )}
          {tab === "transactions" && (
            <TransactionsList
              transactions={transactions}
              contactMap={contactMap}
              bienMap={bienMap}
            />
          )}
        </>
      )}

      {/* Fiche dossier unifiée */}
      {selectedMandat && (
        <VenteDossierUnifie
          mandat={selectedMandat}
          bien={bienMap[selectedMandat.bien_id]}
          acquereurs={acquereurs}
          onClose={() => setSelectedMandat(null)}
          onUpdate={updated => setMandats(p => p.map(m => m.id === updated.id ? updated : m))}
        />
      )}
    </div>
    </RoleGuard>
  );
}