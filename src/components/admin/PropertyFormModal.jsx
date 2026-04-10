import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";

export default function PropertyFormModal({ property, onSave, onClose }) {
  const [form, setForm] = useState({
    title: property?.title || "",
    type: property?.type || "appartement",
    transaction: property?.transaction || "vente",
    price: property?.price || "",
    surface: property?.surface || "",
    rooms: property?.rooms || "",
    bedrooms: property?.bedrooms || "",
    city: property?.city || "",
    postal_code: property?.postal_code || "",
    address: property?.address || "",
    condition: property?.condition || "bon_etat",
    year_built: property?.year_built || "",
    description: property?.description || "",
    features: property?.features?.join(", ") || "",
    status: property?.status || "disponible",
    monthly_charges: property?.monthly_charges || "",
    charges_included: property?.charges_included || false,
    available_date: property?.available_date || "",
    featured: property?.featured || false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      price: Number(form.price),
      surface: Number(form.surface),
      rooms: Number(form.rooms),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      year_built: form.year_built ? Number(form.year_built) : undefined,
      monthly_charges: form.monthly_charges ? Number(form.monthly_charges) : undefined,
      features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : [],
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">{property ? "Modifier le bien" : "Ajouter un bien"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Titre de l'annonce</label>
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Appartement lumineux..." className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type de bien</label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="local_commercial">Local commercial</SelectItem>
                  <SelectItem value="bureau">Bureau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Transaction</label>
              <Select value={form.transaction} onValueChange={(v) => set("transaction", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vente">Vente</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prix (€)</label>
              <Input required type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="350000" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Surface (m²)</label>
              <Input required type="number" value={form.surface} onChange={(e) => set("surface", e.target.value)} placeholder="75" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Pièces</label>
              <Input required type="number" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} placeholder="4" className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ville</label>
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Paris" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Code postal</label>
              <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} placeholder="75008" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">État</label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="renove">Rénové</SelectItem>
                  <SelectItem value="bon_etat">Bon état</SelectItem>
                  <SelectItem value="a_renover">À rénover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Adresse complète</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="12 rue de la Paix" className="rounded-xl" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description détaillée du bien..." className="rounded-xl min-h-[100px] resize-none" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Caractéristiques <span className="text-muted-foreground font-normal">(séparées par des virgules)</span></label>
            <Input value={form.features} onChange={(e) => set("features", e.target.value)} placeholder="Parking, Jardin, Terrasse, Cave" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut</label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="sous_compromis">Sous compromis</SelectItem>
                  <SelectItem value="vendu">Vendu</SelectItem>
                  <SelectItem value="loue">Loué</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Année de construction</label>
              <Input type="number" value={form.year_built} onChange={(e) => set("year_built", e.target.value)} placeholder="1990" className="rounded-xl" />
            </div>
          </div>

          {form.transaction === "location" && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/30 rounded-xl">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Charges mensuelles (€)</label>
                <Input type="number" value={form.monthly_charges} onChange={(e) => set("monthly_charges", e.target.value)} placeholder="80" className="rounded-xl bg-white" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Disponible à partir du</label>
                <Input type="date" value={form.available_date} onChange={(e) => set("available_date", e.target.value)} className="rounded-xl bg-white" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="charges_included" checked={form.charges_included} onChange={(e) => set("charges_included", e.target.checked)} className="w-4 h-4" />
                <label htmlFor="charges_included" className="text-sm">Charges incluses dans le loyer</label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4" />
            <label htmlFor="featured" className="text-sm font-medium">Mettre ce bien en avant (homepage)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 rounded-full gap-2" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {property ? "Enregistrer" : "Créer le bien"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}