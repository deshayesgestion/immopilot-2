import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DossierFormModal({ bienPrefill, typeDefaut, onClose, onSave }) {
  const [biens, setBiens] = useState([]);
  const [form, setForm] = useState({
    titre: bienPrefill ? `Dossier — ${bienPrefill.titre}` : "",
    type: bienPrefill?.type || typeDefaut || "vente",
    statut: "nouveau",
    bien_id: bienPrefill?.id || "",
    bien_titre: bienPrefill?.titre || "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!bienPrefill) {
      base44.entities.Bien.list("-created_date", 200).then(setBiens);
    }
  }, [bienPrefill]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleBienChange = (bienId) => {
    const found = biens.find(b => b.id === bienId);
    set("bien_id", bienId);
    set("bien_titre", found?.titre || "");
    if (found?.type) set("type", found.type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.DossierImmobilier.create({
      titre: form.titre,
      type: form.type,
      statut: form.statut,
      bien_id: form.bien_id,
      bien_titre: form.bien_titre,
      notes: form.notes || null,
      contact_ids: [],
      paiement_ids: [],
      lead_ids: [],
      historique: [{ date: new Date().toISOString(), action: "Dossier créé" }],
    });
    onSave(saved);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <FolderOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-base">Nouveau dossier</h2>
              <p className="text-xs text-muted-foreground">Centraliser une affaire immobilière</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Bien */}
            <div>
              <label className="label-field">Bien immobilier *</label>
              {bienPrefill ? (
                <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl border border-border/50">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-sm">🏠</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{bienPrefill.titre}</p>
                    {bienPrefill.adresse && <p className="text-xs text-muted-foreground">{bienPrefill.adresse}</p>}
                  </div>
                </div>
              ) : (
                <select
                  value={form.bien_id}
                  onChange={e => handleBienChange(e.target.value)}
                  className="field-input"
                  required
                >
                  <option value="">Sélectionner un bien…</option>
                  {biens.map(b => (
                    <option key={b.id} value={b.id}>{b.titre} ({b.type})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Titre */}
            <div>
              <label className="label-field">Titre du dossier *</label>
              <Input
                value={form.titre}
                onChange={e => set("titre", e.target.value)}
                placeholder="Ex: Vente appartement Dupont"
                required
              />
            </div>

            {/* Type + Statut */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Type *</label>
                <select value={form.type} onChange={e => set("type", e.target.value)} className="field-input" required>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                </select>
              </div>
              <div>
                <label className="label-field">Statut</label>
                <select value={form.statut} onChange={e => set("statut", e.target.value)} className="field-input">
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours</option>
                  <option value="signe">Signé</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label-field">Notes (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Premières informations, contexte…"
                rows={3}
                className="field-input resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 px-5 py-4 border-t border-border/50 flex-shrink-0 bg-white">
            <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 rounded-xl h-11" disabled={saving || !form.titre || !form.bien_id}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le dossier"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}