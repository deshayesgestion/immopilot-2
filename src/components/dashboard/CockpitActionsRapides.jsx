import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Home, FolderOpen, MessageSquare, TicketIcon, Bell, CheckCircle2,
  X, Plus, Loader2, ChevronRight
} from "lucide-react";

// ── Modal générique ────────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">{title}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Créer un bien ──────────────────────────────────────────────────────────
function ModalBien({ onClose, onDone }) {
  const [form, setForm] = useState({ titre: "", type: "vente", prix: "", adresse: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.titre) return;
    setSaving(true);
    await base44.entities.Bien.create({ ...form, prix: Number(form.prix) || 0, statut: "disponible" });
    setSaving(false);
    onDone("Bien créé avec succès");
  };

  return (
    <Modal title="Créer un bien" icon={Home} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label-field">Titre *</label>
          <Input value={form.titre} onChange={e => set("titre", e.target.value)} placeholder="Ex: Appartement T3 Paris 11e" className="field-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="field-input">
              <option value="vente">Vente</option>
              <option value="location">Location</option>
            </select>
          </div>
          <div>
            <label className="label-field">Prix (€)</label>
            <Input type="number" value={form.prix} onChange={e => set("prix", e.target.value)} placeholder="250000" className="field-input" />
          </div>
        </div>
        <div>
          <label className="label-field">Adresse</label>
          <Input value={form.adresse} onChange={e => set("adresse", e.target.value)} placeholder="12 rue de la Paix, Paris" className="field-input" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full h-9 text-sm" onClick={save} disabled={saving || !form.titre}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Créer un dossier ───────────────────────────────────────────────────────
function ModalDossier({ onClose, onDone, biens }) {
  const [form, setForm] = useState({ titre: "", type: "vente", bien_id: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.titre) return;
    setSaving(true);
    const bien = biens.find(b => b.id === form.bien_id);
    await base44.entities.DossierImmobilier.create({
      ...form,
      bien_titre: bien?.titre || "",
      statut: "nouveau",
    });
    setSaving(false);
    onDone("Dossier créé avec succès");
  };

  return (
    <Modal title="Créer un dossier" icon={FolderOpen} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label-field">Titre *</label>
          <Input value={form.titre} onChange={e => set("titre", e.target.value)} placeholder="Ex: Dossier vente appartement" className="field-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="field-input">
              <option value="vente">Vente</option>
              <option value="location">Location</option>
            </select>
          </div>
          <div>
            <label className="label-field">Bien associé</label>
            <select value={form.bien_id} onChange={e => set("bien_id", e.target.value)} className="field-input">
              <option value="">— Sélectionner —</option>
              {biens.slice(0, 30).map(b => (
                <option key={b.id} value={b.id}>{b.titre}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label-field">Notes</label>
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Notes internes…" className="rounded-xl text-sm resize-none" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full h-9 text-sm" onClick={save} disabled={saving || !form.titre}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Contacter un client ────────────────────────────────────────────────────
function ModalContact({ onClose, onDone, contacts }) {
  const [form, setForm] = useState({ contact_id: "", canal: "email", contenu: "", contact_email: "", contact_nom: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectContact = (id) => {
    const c = contacts.find(c => c.id === id);
    set("contact_id", id);
    if (c) {
      setForm(f => ({ ...f, contact_id: id, contact_email: c.email || "", contact_nom: c.nom || "" }));
    }
  };

  const save = async () => {
    if (!form.contenu || !form.contact_nom) return;
    setSaving(true);
    await base44.entities.Message.create({
      canal: form.canal, contenu: form.contenu, direction: "sortant",
      contact_email: form.contact_email, contact_nom: form.contact_nom,
    });
    setSaving(false);
    onDone("Message envoyé");
  };

  return (
    <Modal title="Contacter un client" icon={MessageSquare} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label-field">Contact</label>
          <select value={form.contact_id} onChange={e => selectContact(e.target.value)} className="field-input">
            <option value="">— Sélectionner —</option>
            {contacts.slice(0, 50).map(c => (
              <option key={c.id} value={c.id}>{c.nom} {c.email ? `(${c.email})` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Canal</label>
          <select value={form.canal} onChange={e => set("canal", e.target.value)} className="field-input">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="note_interne">Note interne</option>
          </select>
        </div>
        <div>
          <label className="label-field">Message *</label>
          <Textarea value={form.contenu} onChange={e => set("contenu", e.target.value)} rows={3} placeholder="Rédigez votre message…" className="rounded-xl text-sm resize-none" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full h-9 text-sm" onClick={save} disabled={saving || !form.contenu}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Envoyer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Créer un ticket ────────────────────────────────────────────────────────
function ModalTicket({ onClose, onDone }) {
  const [form, setForm] = useState({ appelant_nom: "", appelant_email: "", type_demande: "incident_logement", priorite: "normal", description: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.appelant_nom) return;
    setSaving(true);
    await base44.entities.TicketIA.create({
      ...form, statut: "nouveau", source: "manuel",
      numero_ticket: `TK-${Date.now().toString(36).toUpperCase()}`,
      date_appel: new Date().toISOString(),
    });
    setSaving(false);
    onDone("Ticket créé");
  };

  return (
    <Modal title="Créer un ticket" icon={TicketIcon} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Nom *</label>
            <Input value={form.appelant_nom} onChange={e => set("appelant_nom", e.target.value)} placeholder="Nom du contact" className="field-input" />
          </div>
          <div>
            <label className="label-field">Email</label>
            <Input value={form.appelant_email} onChange={e => set("appelant_email", e.target.value)} placeholder="email@..." className="field-input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Type</label>
            <select value={form.type_demande} onChange={e => set("type_demande", e.target.value)} className="field-input">
              <option value="incident_logement">Incident logement</option>
              <option value="demande_visite">Demande visite</option>
              <option value="question_administrative">Question admin</option>
              <option value="paiement_facture">Paiement/Facture</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="label-field">Priorité</label>
            <select value={form.priorite} onChange={e => set("priorite", e.target.value)} className="field-input">
              <option value="faible">Faible</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label-field">Description</label>
          <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Décrivez le problème…" className="rounded-xl text-sm resize-none" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full h-9 text-sm" onClick={save} disabled={saving || !form.appelant_nom}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Lancer une relance ─────────────────────────────────────────────────────
function ModalRelance({ onClose, onDone, contacts }) {
  const [form, setForm] = useState({ contact_nom: "", contact_email: "", type_relance: "reponse_client", canal: "email", raison: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectContact = (id) => {
    const c = contacts.find(c => c.id === id);
    if (c) setForm(f => ({ ...f, contact_nom: c.nom, contact_email: c.email || "" }));
  };

  const save = async () => {
    if (!form.contact_nom) return;
    setSaving(true);
    await base44.entities.Relance.create({
      ...form, statut: "planifiee", niveau: 1, auto: false,
    });
    setSaving(false);
    onDone("Relance créée");
  };

  return (
    <Modal title="Lancer une relance" icon={Bell} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label-field">Contact</label>
          <select onChange={e => selectContact(e.target.value)} className="field-input">
            <option value="">— Sélectionner —</option>
            {contacts.slice(0, 50).map(c => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        {form.contact_nom && <p className="text-xs text-primary font-medium">→ {form.contact_nom} ({form.contact_email || "pas d'email"})</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Type</label>
            <select value={form.type_relance} onChange={e => set("type_relance", e.target.value)} className="field-input">
              <option value="reponse_client">Réponse client</option>
              <option value="paiement_retard">Paiement retard</option>
              <option value="dossier_inactif">Dossier inactif</option>
              <option value="visite_non_confirmee">Visite non confirmée</option>
            </select>
          </div>
          <div>
            <label className="label-field">Canal</label>
            <select value={form.canal} onChange={e => set("canal", e.target.value)} className="field-input">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label-field">Raison / Note</label>
          <Input value={form.raison} onChange={e => set("raison", e.target.value)} placeholder="Raison de la relance…" className="field-input" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full h-9 text-sm" onClick={save} disabled={saving || !form.contact_nom}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Marquer paiement traité ────────────────────────────────────────────────
function ModalPaiement({ onClose, onDone, paiementsRetard }) {
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    await base44.entities.Paiement.update(selectedId, { statut: "paye", date_paiement: new Date().toISOString() });
    setSaving(false);
    onDone("Paiement marqué comme traité");
  };

  const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "—";

  return (
    <Modal title="Marquer un paiement traité" icon={CheckCircle2} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{paiementsRetard.length} paiement(s) en retard</p>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {paiementsRetard.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement en retard 🎉</p>
          ) : (
            paiementsRetard.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                  selectedId === p.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div>
                  <p className="text-xs font-medium">{p.type || "Paiement"} — {fmt(p.montant)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Échéance : {p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR") : "—"}
                  </p>
                </div>
                {selectedId === p.id && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full h-9 text-sm" onClick={save} disabled={saving || !selectedId}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Marquer traité"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Raccourcis navigation ──────────────────────────────────────────────────
import { Link } from "react-router-dom";

const NAV_SHORTCUTS = [
  { label: "Location", emoji: "🔑", href: "/admin/modules/location", color: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white" },
  { label: "Vente", emoji: "📈", href: "/admin/modules/vente", color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-500 hover:text-white" },
  { label: "Compta", emoji: "💳", href: "/admin/modules/comptabilite", color: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white" },
  { label: "Biens", emoji: "🏠", href: "/admin/modules/biens", color: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-500 hover:text-white" },
  { label: "Agenda", emoji: "📅", href: "/admin/agenda", color: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-500 hover:text-white" },
  { label: "Tâches", emoji: "✅", href: "/admin/taches", color: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-500 hover:text-white" },
];

// ── Main ───────────────────────────────────────────────────────────────────
const ACTIONS = [
  { id: "bien", label: "Créer un bien", icon: Home, color: "bg-blue-500", emoji: "🏠" },
  { id: "dossier", label: "Créer un dossier", icon: FolderOpen, color: "bg-indigo-500", emoji: "📂" },
  { id: "contact", label: "Contacter client", icon: MessageSquare, color: "bg-green-500", emoji: "💬" },
  { id: "ticket", label: "Créer ticket", icon: TicketIcon, color: "bg-amber-500", emoji: "🎫" },
  { id: "relance", label: "Lancer relance", icon: Bell, color: "bg-orange-500", emoji: "🔔" },
  { id: "paiement", label: "Traiter paiement", icon: CheckCircle2, color: "bg-purple-500", emoji: "💰" },
];

export default function CockpitActionsRapides({ data, onRefresh }) {
  const [active, setActive] = useState(null);
  const [toast, setToast] = useState(null);

  const handleDone = (msg) => {
    setActive(null);
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
    onRefresh?.();
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-4">
        {/* Accès rapide modules */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accès rapide</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {NAV_SHORTCUTS.map(s => (
              <Link key={s.href} to={s.href}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all hover:shadow-sm active:scale-95 ${s.color}`}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] font-semibold">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Actions métier */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ACTIONS.map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => setActive(a.id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 hover:bg-white hover:shadow-sm transition-all group active:scale-95"
                >
                  <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Modals */}
      {active === "bien" && <ModalBien onClose={() => setActive(null)} onDone={handleDone} />}
      {active === "dossier" && <ModalDossier onClose={() => setActive(null)} onDone={handleDone} biens={data?.biens || []} />}
      {active === "contact" && <ModalContact onClose={() => setActive(null)} onDone={handleDone} contacts={data?.contacts || []} />}
      {active === "ticket" && <ModalTicket onClose={() => setActive(null)} onDone={handleDone} />}
      {active === "relance" && <ModalRelance onClose={() => setActive(null)} onDone={handleDone} contacts={data?.contacts || []} />}
      {active === "paiement" && <ModalPaiement onClose={() => setActive(null)} onDone={handleDone} paiementsRetard={data?.paiementsRetardList || []} />}
    </>
  );
}