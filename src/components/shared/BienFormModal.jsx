import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUTS_VENTE = ["disponible", "en_cours", "vendu"];
const STATUTS_LOCATION = ["disponible", "en_cours", "loue"];

export default function BienFormModal({ bien, typeDefaut, onClose, onSave }) {
  const isEdit = !!bien;
  const [form, setForm] = useState({
    titre: "",
    adresse: "",
    prix: "",
    type: typeDefaut || "vente",
    statut: "disponible",
    ...bien,
  });
  const [saving, setSaving] = useState(false);

  const statutOptions = form.type === "location" ? STATUTS_LOCATION : STATUTS_VENTE;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      titre: form.titre,
      adresse: form.adresse,
      prix: form.prix ? parseFloat(form.prix) : null,
      type: form.type,
      statut: form.statut,
    };
    let saved;
    if (isEdit) {
      saved = await base44.entities.Bien.update(bien.id, data);
      saved = { ...bien, ...data };
    } else {
      saved = await base44.entities.Bien.create(data);
    }
    onSave(saved, isEdit);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-bold text-base">{isEdit ? "Modifier le bien" : "Nouveau bien"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Titre *</label>
            <Input value={form.titre} onChange={e => set("titre", e.target.value)} placeholder="Ex: Appartement T3 centre-ville" required />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Adresse</label>
            <Input value={form.adresse || ""} onChange={e => set("adresse", e.target.value)} placeholder="12 rue de la Paix, Paris" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Prix (€)</label>
              <Input type="number" value={form.prix || ""} onChange={e => set("prix", e.target.value)} placeholder="250000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Type *</label>
              <select
                value={form.type}
                onChange={e => { set("type", e.target.value); set("statut", "disponible"); }}
                className="w-full h-9 text-sm border border-input rounded-md px-3 bg-white"
                required
              >
                <option value="vente">Vente</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Statut</label>
            <select
              value={form.statut}
              onChange={e => set("statut", e.target.value)}
              className="w-full h-9 text-sm border border-input rounded-md px-3 bg-white"
            >
              {statutOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={saving || !form.titre}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Enregistrer" : "Créer le bien"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}