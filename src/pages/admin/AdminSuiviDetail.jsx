import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Loader2, Home, User, Euro, Calendar, FileText,
  AlertTriangle, MessageSquare, Plus, CheckCircle2, Clock, X
} from "lucide-react";

const TABS = [
  { id: "loyer", label: "Loyer", icon: Euro },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "historique", label: "Historique", icon: MessageSquare },
];

const STATUT_BAIL = {
  actif: { label: "Bail actif", color: "bg-green-100 text-green-700" },
  preavis: { label: "Préavis", color: "bg-amber-100 text-amber-700" },
  termine: { label: "Terminé", color: "bg-gray-100 text-gray-500" },
};

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

// ── LOYER TAB ──────────────────────────────────────────────────────────────
function LoyerTab({ dossier, onUpdate }) {
  const paiements = dossier.paiements || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ mois: "", montant: dossier.loyer || "", statut: "recu", note: "" });
  const [saving, setSaving] = useState(false);

  const addPaiement = async () => {
    setSaving(true);
    const updated = [...paiements, { ...form, id: Date.now(), date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { paiements: updated });
    setSaving(false);
    setAdding(false);
    setForm({ mois: "", montant: dossier.loyer || "", statut: "recu", note: "" });
    onUpdate();
  };

  const totalRecu = paiements.filter((p) => p.statut === "recu").reduce((s, p) => s + Number(p.montant || 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Loyer mensuel", value: formatEuro(dossier.loyer) },
          { label: "Charges", value: formatEuro(dossier.charges) },
          { label: "Total perçu", value: formatEuro(totalRecu) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-secondary/30 rounded-xl p-4 text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Payments list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Paiements</p>
          <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3" /> Ajouter
          </Button>
        </div>

        {adding && (
          <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mois</label>
                <Input placeholder="ex: Avril 2026" value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label>
                <Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="recu">Reçu</option>
                <option value="en_attente">En attente</option>
                <option value="retard">En retard</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button>
              <Button size="sm" className="rounded-full h-8 text-xs" onClick={addPaiement} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}

        {paiements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement enregistré</p>
        ) : (
          <div className="divide-y divide-border/30 border border-border/50 rounded-xl overflow-hidden">
            {[...paiements].reverse().map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.statut === "recu" ? "bg-green-500" : p.statut === "retard" ? "bg-red-500" : "bg-amber-400"}`} />
                <p className="text-sm font-medium flex-1">{p.mois || "—"}</p>
                <p className="text-sm font-semibold">{formatEuro(p.montant)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.statut === "recu" ? "bg-green-100 text-green-700" : p.statut === "retard" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                  {p.statut === "recu" ? "Reçu" : p.statut === "retard" ? "En retard" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DOCUMENTS TAB ──────────────────────────────────────────────────────────
function DocumentsTab({ dossier, onUpdate }) {
  const docs = dossier.documents || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: "", type: "contrat", url: "" });
  const [saving, setSaving] = useState(false);

  const addDoc = async () => {
    setSaving(true);
    const updated = [...docs, { ...form, id: Date.now(), date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { documents: updated });
    setSaving(false);
    setAdding(false);
    setForm({ nom: "", type: "contrat", url: "" });
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Documents ({docs.length})</p>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>

      {adding && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nom du document</label>
              <Input placeholder="ex: Bail signé" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="contrat">Contrat</option>
                <option value="edl">État des lieux</option>
                <option value="quittance">Quittance</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button>
            <Button size="sm" className="rounded-full h-8 text-xs" onClick={addDoc} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucun document</p>
      ) : (
        <div className="divide-y divide-border/30 border border-border/50 rounded-xl overflow-hidden">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{doc.nom}</p>
                <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
              </div>
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Voir</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── INCIDENTS TAB ──────────────────────────────────────────────────────────
function IncidentsTab({ dossier, onUpdate }) {
  const incidents = dossier.incidents || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", gravite: "moyen", statut: "ouvert" });
  const [saving, setSaving] = useState(false);

  const addIncident = async () => {
    setSaving(true);
    const updated = [...incidents, { ...form, id: Date.now(), date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    setSaving(false);
    setAdding(false);
    setForm({ titre: "", description: "", gravite: "moyen", statut: "ouvert" });
    onUpdate();
  };

  const closeIncident = async (id) => {
    const updated = incidents.map((i) => i.id === id ? { ...i, statut: "resolu" } : i);
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    onUpdate();
  };

  const GRAVITE = { faible: "bg-blue-100 text-blue-700", moyen: "bg-amber-100 text-amber-700", eleve: "bg-red-100 text-red-600" };
  const open = incidents.filter((i) => i.statut !== "resolu");
  const resolved = incidents.filter((i) => i.statut === "resolu");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Incidents</p>
          <p className="text-xs text-muted-foreground">{open.length} ouvert{open.length > 1 ? "s" : ""} · {resolved.length} résolu{resolved.length > 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" /> Signaler
        </Button>
      </div>

      {adding && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
          <Input placeholder="Titre de l'incident" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="h-8 text-sm" />
          <Textarea placeholder="Description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-sm resize-none min-h-[70px]" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gravité</label>
              <select value={form.gravite} onChange={(e) => setForm({ ...form, gravite: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button>
            <Button size="sm" className="rounded-full h-8 text-xs" onClick={addIncident} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}

      {incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucun incident signalé</p>
      ) : (
        <div className="space-y-2">
          {[...incidents].reverse().map((inc) => (
            <div key={inc.id} className={`border rounded-xl p-4 space-y-2 ${inc.statut === "resolu" ? "opacity-50 bg-secondary/10" : "bg-white border-border/50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{inc.titre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(inc.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${GRAVITE[inc.gravite] || GRAVITE.moyen}`}>{inc.gravite}</span>
                  {inc.statut !== "resolu" && (
                    <button onClick={() => closeIncident(inc.id)} className="text-xs text-green-600 hover:underline font-medium">Résoudre</button>
                  )}
                </div>
              </div>
              {inc.description && <p className="text-xs text-muted-foreground">{inc.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HISTORIQUE TAB ─────────────────────────────────────────────────────────
function HistoriqueTab({ dossier, onUpdate }) {
  const messages = Array.isArray(dossier.notes) ? dossier.notes : [];
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const addMessage = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const updated = [...messages, { id: Date.now(), content: text, date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { notes: updated });
    setText("");
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Historique & Notes</p>

      <div className="space-y-2">
        <Textarea
          placeholder="Ajouter une note ou un message interne..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="text-sm resize-none min-h-[80px] rounded-xl"
        />
        <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={addMessage} disabled={saving || !text.trim()}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Ajouter
        </Button>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune note</p>
      ) : (
        <div className="space-y-2">
          {[...messages].reverse().map((m) => (
            <div key={m.id} className="bg-secondary/20 border border-border/30 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{new Date(m.date).toLocaleString("fr-FR")}</p>
              <p className="text-sm">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function AdminSuiviDetail() {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("loyer");

  const load = () => {
    base44.entities.DossierLocatif.filter({ id })
      .then((res) => setDossier(res[0] || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!dossier) return (
    <div className="text-center py-24">
      <p className="text-sm text-muted-foreground">Dossier introuvable.</p>
      <Link to="/admin/suivi" className="text-primary text-sm hover:underline mt-2 inline-block">← Retour</Link>
    </div>
  );

  const locataire = dossier.locataire_selectionne;
  const statutBail = STATUT_BAIL[dossier.statut_bail || "actif"];
  const dateEntree = dossier.date_entree ? new Date(dossier.date_entree).toLocaleDateString("fr-FR") : "—";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/suivi" className="mt-1 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{dossier.property_title}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statutBail.color}`}>{statutBail.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{dossier.property_address} · Réf. {dossier.reference}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <User className="w-4 h-4 text-blue-500 mb-2" />
          <p className="text-sm font-semibold">{locataire?.nom || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{locataire?.email || "—"}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Euro className="w-4 h-4 text-green-500 mb-2" />
          <p className="text-sm font-semibold">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(dossier.loyer || 0)}/mois</p>
          <p className="text-xs text-muted-foreground">Loyer</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Calendar className="w-4 h-4 text-purple-500 mb-2" />
          <p className="text-sm font-semibold">{dateEntree}</p>
          <p className="text-xs text-muted-foreground">Date d'entrée</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Home className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-sm font-semibold">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(dossier.depot_garantie || 0)}</p>
          <p className="text-xs text-muted-foreground">Caution</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex border-b border-border/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="p-6">
          {activeTab === "loyer" && <LoyerTab dossier={dossier} onUpdate={load} />}
          {activeTab === "documents" && <DocumentsTab dossier={dossier} onUpdate={load} />}
          {activeTab === "incidents" && <IncidentsTab dossier={dossier} onUpdate={load} />}
          {activeTab === "historique" && <HistoriqueTab dossier={dossier} onUpdate={load} />}
        </div>
      </div>
    </div>
  );
}