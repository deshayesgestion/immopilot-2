import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2 } from "lucide-react";

export default function DossierCreationModal({ biens, contacts, onClose, onCreated }) {
  const [form, setForm] = useState({
    bien_id: "", contact_id: "", loyer_mensuel: "", charges_mensuelle: 0,
    depot_garantie_montant: "", type_bail: "vide", duree_mois: 12,
    date_debut_bail: "", locataire_nom: "", locataire_email: "", locataire_telephone: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleBienChange = (id) => {
    const b = biens.find(b => b.id === id);
    set("bien_id", id);
    if (b?.prix) { set("loyer_mensuel", b.prix); set("depot_garantie_montant", b.prix * 2); }
  };

  const handleContactChange = (id) => {
    const c = contacts.find(c => c.id === id);
    set("contact_id", id);
    if (c) { set("locataire_nom", c.nom); set("locataire_email", c.email || ""); set("locataire_telephone", c.telephone || ""); }
  };

  const handleSave = async () => {
    if (!form.bien_id || !form.locataire_nom || !form.loyer_mensuel) return;
    setSaving(true);
    const ref = `LOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
    const bien = biens.find(b => b.id === form.bien_id);
    const dossier = await base44.entities.DossierLocatif.create({
      ...form,
      reference: ref,
      bien_titre: bien?.titre || "",
      bien_adresse: bien?.adresse || "",
      etape: "candidat",
      statut_dossier: "ouvert",
      validation_statut: "en_attente",
      loyer_mensuel: Number(form.loyer_mensuel),
      charges_mensuelle: Number(form.charges_mensuelle) || 0,
      depot_garantie_montant: Number(form.depot_garantie_montant) || 0,
      historique: [{ date: new Date().toISOString(), action: "Dossier créé", auteur: "Agent" }],
    });
    onCreated(dossier);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-base font-bold">Nouveau dossier locatif</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Bien *</label>
            <select value={form.bien_id} onChange={e => handleBienChange(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="">Sélectionner un bien…</option>
              {biens.map(b => <option key={b.id} value={b.id}>{b.titre} — {b.prix?.toLocaleString("fr-FR")} €/mois</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Locataire</label>
            <select value={form.contact_id} onChange={e => handleContactChange(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="">— Nouveau prospect —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.nom}{c.email ? ` — ${c.email}` : ""}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Input value={form.locataire_nom} onChange={e => set("locataire_nom", e.target.value)}
              placeholder="Nom du locataire *" className="h-9 rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.locataire_email} onChange={e => set("locataire_email", e.target.value)}
                placeholder="Email" className="h-9 rounded-xl text-sm" />
              <Input value={form.locataire_telephone} onChange={e => set("locataire_telephone", e.target.value)}
                placeholder="Téléphone" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Loyer mensuel (€) *</label>
              <Input type="number" value={form.loyer_mensuel} onChange={e => set("loyer_mensuel", e.target.value)} placeholder="800" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Charges (€)</label>
              <Input type="number" value={form.charges_mensuelle} onChange={e => set("charges_mensuelle", e.target.value)} placeholder="50" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Dépôt de garantie (€)</label>
              <Input type="number" value={form.depot_garantie_montant} onChange={e => set("depot_garantie_montant", e.target.value)} placeholder="1600" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type de bail</label>
              <select value={form.type_bail} onChange={e => set("type_bail", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="vide">Vide</option>
                <option value="meuble">Meublé</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date de début</label>
              <Input type="date" value={form.date_debut_bail} onChange={e => set("date_debut_bail", e.target.value)} className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Durée (mois)</label>
              <Input type="number" value={form.duree_mois} onChange={e => set("duree_mois", Number(e.target.value))} placeholder="12" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2" onClick={handleSave} disabled={saving || !form.locataire_nom || !form.loyer_mensuel || !form.bien_id}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer le dossier
          </Button>
        </div>
      </div>
    </div>
  );
}