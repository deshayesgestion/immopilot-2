import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Sparkles } from "lucide-react";

export default function BienVenteForm({ bien, onClose, onSave }) {
  const [form, setForm] = useState({
    title: bien?.title || "",
    type: bien?.type || "appartement",
    transaction: "vente",
    price: bien?.price || "",
    surface: bien?.surface || "",
    rooms: bien?.rooms || "",
    bedrooms: bien?.bedrooms || "",
    city: bien?.city || "",
    postal_code: bien?.postal_code || "",
    address: bien?.address || "",
    description: bien?.description || "",
    status: bien?.status || "disponible",
    publish_site: bien?.publish_site || false,
    mandat_type: bien?.mandat_type || "simple",
    frais_agence: bien?.frais_agence || "",
    historique: bien?.historique || "",
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, price: Number(form.price), surface: Number(form.surface), rooms: Number(form.rooms), bedrooms: Number(form.bedrooms) };
    if (bien?.id) await base44.entities.Property.update(bien.id, data);
    else await base44.entities.Property.create(data);
    setSaving(false);
    onSave();
    onClose();
  };

  const genererDescription = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère une annonce immobilière professionnelle et attrayante pour ce bien:\nType: ${form.type}\nSurface: ${form.surface}m²\nPièces: ${form.rooms}\nVille: ${form.city}\nPrix: ${form.price}€\nDécris le bien de manière engageante en 3-4 phrases.`
    });
    set("description", res);
    setAiLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold">{bien ? "Modifier le bien" : "Nouveau bien à vendre"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos de base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Titre de l'annonce</label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Bel appartement T3..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de bien</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="terrain">Terrain</option>
                <option value="local_commercial">Local commercial</option>
                <option value="bureau">Bureau</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de mandat</label>
              <select value={form.mandat_type} onChange={(e) => set("mandat_type", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="simple">Simple</option>
                <option value="exclusif">Exclusif</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prix de vente (€)</label>
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frais agence (€)</label>
              <Input type="number" value={form.frais_agence} onChange={(e) => set("frais_agence", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Surface (m²)</label>
              <Input type="number" value={form.surface} onChange={(e) => set("surface", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pièces</label>
              <Input type="number" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ville</label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Code postal</label>
              <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Adresse complète</label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>

          {/* Description + IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={genererDescription} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Générer IA
              </Button>
            </div>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
          </div>

          {/* Historique interne */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Historique interne (non public)</label>
            <Textarea value={form.historique} onChange={(e) => set("historique", e.target.value)} rows={2}
              placeholder="Notes internes, historique du bien..." />
          </div>

          {/* Statut & publication */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Statut</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="disponible">Disponible</option>
                <option value="sous_compromis">Sous compromis</option>
                <option value="vendu">Vendu</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.publish_site} onChange={(e) => set("publish_site", e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Publier sur le site</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {bien ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}