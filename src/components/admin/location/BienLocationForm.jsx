import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sparkles, Loader2 } from "lucide-react";

const SECTION = ({ title, children }) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
    <div className="space-y-3">{children}</div>
  </div>
);

const Row = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>;

const Field = ({ label, children }) => (
  <div><label className="text-sm font-medium mb-1.5 block">{label}</label>{children}</div>
);

const defaultForm = {
  title: "", description: "", type: "appartement", surface: "", rooms: "", floor: "",
  address: "", city: "", postal_code: "",
  dpe: "", ges: "", heating: "", condition: "bon_etat", year_built: "",
  price: "", monthly_charges: "", deposit: "",
  owner_name: "", owner_email: "", owner_phone: "",
  agent_email: "",
  transaction: "location", status: "disponible", featured: false,
  publish_site: false, publish_platforms: false,
};

export default function BienLocationForm({ bien, onClose, onSave }) {
  const [form, setForm] = useState(bien ? {
    ...defaultForm, ...bien,
    owner_name: bien.owner_name || "",
    owner_email: bien.owner_email || "",
    owner_phone: bien.owner_phone || "",
    agent_email: bien.agent_email || "",
    publish_site: bien.publish_site || false,
    publish_platforms: bien.publish_platforms || false,
  } : defaultForm);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const generateAI = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère une description immobilière professionnelle et attractive pour ce bien en location :
Type: ${form.type}, Surface: ${form.surface}m², Pièces: ${form.rooms}, Ville: ${form.city}, Loyer: ${form.price}€/mois, État: ${form.condition}, DPE: ${form.dpe}.
Ton élégant, vendeur, professionnel. 3-4 phrases maximum. En français.`,
    });
    set("description", res);
    setAiLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      ...form,
      surface: Number(form.surface) || 0,
      rooms: Number(form.rooms) || 1,
      price: Number(form.price) || 0,
      monthly_charges: Number(form.monthly_charges) || 0,
      year_built: form.year_built ? Number(form.year_built) : undefined,
      bedrooms: Number(form.rooms) - 1 || 0,
    };
    if (bien?.id) await base44.entities.Property.update(bien.id, data);
    else await base44.entities.Property.create(data);
    await onSave();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-border/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/50">
          <h3 className="text-lg font-bold">{bien ? "Modifier le bien" : "Nouveau bien en location"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-7">
          {/* Infos générales */}
          <SECTION title="Informations générales">
            <Field label="Titre de l'annonce">
              <Input required placeholder="Bel appartement lumineux — Paris 11e" value={form.title} onChange={(e) => set("title", e.target.value)} className="h-10 rounded-xl" />
            </Field>
            <Field label="Description">
              <div className="relative">
                <Textarea
                  placeholder="Description du bien..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="rounded-xl resize-none min-h-[90px] pr-32"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateAI}
                  disabled={aiLoading || !form.type}
                  className="absolute bottom-2.5 right-2.5 rounded-full gap-1.5 text-xs h-7 px-3"
                >
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
                  Générer IA
                </Button>
              </div>
            </Field>
            <Row>
              <Field label="Type de bien">
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="local_commercial">Local commercial</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Statut">
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Publié</SelectItem>
                    <SelectItem value="loue">Loué</SelectItem>
                    <SelectItem value="sous_compromis">En cours</SelectItem>
                    <SelectItem value="vendu">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Row>
            <Row>
              <Field label="Surface (m²)">
                <Input required type="number" placeholder="65" value={form.surface} onChange={(e) => set("surface", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="Nb. pièces">
                <Input required type="number" placeholder="3" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} className="h-10 rounded-xl" />
              </Field>
            </Row>
            <Field label="Étage (optionnel)">
              <Input placeholder="2e étage" value={form.floor} onChange={(e) => set("floor", e.target.value)} className="h-10 rounded-xl" />
            </Field>
          </SECTION>

          {/* Localisation */}
          <SECTION title="Localisation">
            <Field label="Adresse complète">
              <Input placeholder="12 rue de la Paix" value={form.address} onChange={(e) => set("address", e.target.value)} className="h-10 rounded-xl" />
            </Field>
            <Row>
              <Field label="Ville">
                <Input required placeholder="Paris" value={form.city} onChange={(e) => set("city", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="Code postal">
                <Input placeholder="75001" value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} className="h-10 rounded-xl" />
              </Field>
            </Row>
          </SECTION>

          {/* Caractéristiques techniques */}
          <SECTION title="Caractéristiques techniques">
            <Row>
              <Field label="DPE (A–G)">
                <Select value={form.dpe} onValueChange={(v) => set("dpe", v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Classe" /></SelectTrigger>
                  <SelectContent>
                    {["A","B","C","D","E","F","G"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="GES (A–G)">
                <Select value={form.ges} onValueChange={(v) => set("ges", v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Classe" /></SelectTrigger>
                  <SelectContent>
                    {["A","B","C","D","E","F","G"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Row>
            <Row>
              <Field label="Chauffage">
                <Input placeholder="Gaz individuel" value={form.heating} onChange={(e) => set("heating", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="État du bien">
                <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Neuf</SelectItem>
                    <SelectItem value="renove">Rénové</SelectItem>
                    <SelectItem value="bon_etat">Bon état</SelectItem>
                    <SelectItem value="a_renover">À rénover</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Row>
            <Field label="Année de construction">
              <Input type="number" placeholder="1990" value={form.year_built} onChange={(e) => set("year_built", e.target.value)} className="h-10 rounded-xl" />
            </Field>
          </SECTION>

          {/* Données location */}
          <SECTION title="Données location">
            <Row>
              <Field label="Loyer mensuel (€)">
                <Input required type="number" placeholder="1 200" value={form.price} onChange={(e) => set("price", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="Charges (€/mois)">
                <Input type="number" placeholder="150" value={form.monthly_charges} onChange={(e) => set("monthly_charges", e.target.value)} className="h-10 rounded-xl" />
              </Field>
            </Row>
            <Field label="Dépôt de garantie (€)">
              <Input type="number" placeholder="2 400" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} className="h-10 rounded-xl" />
            </Field>
          </SECTION>

          {/* Attributions */}
          <SECTION title="Attributions">
            <p className="text-xs text-muted-foreground -mt-1 mb-2">Propriétaire du bien</p>
            <Row>
              <Field label="Nom propriétaire">
                <Input placeholder="M. Dupont" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="Email propriétaire">
                <Input type="email" placeholder="dupont@email.fr" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} className="h-10 rounded-xl" />
              </Field>
            </Row>
            <Field label="Téléphone propriétaire">
              <Input placeholder="06 12 34 56 78" value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} className="h-10 rounded-xl" />
            </Field>
            <Field label="Agent assigné (email)">
              <Input placeholder="agent@agence.fr" value={form.agent_email} onChange={(e) => set("agent_email", e.target.value)} className="h-10 rounded-xl" />
            </Field>
          </SECTION>

          {/* Publication */}
          <SECTION title="Publication">
            <div className="space-y-2.5">
              {[
                { key: "publish_site", label: "Publier sur le site vitrine", desc: "Le bien apparaît sur la page 'Louer' du site public" },
                { key: "featured", label: "Mettre en avant (page accueil)", desc: "Affiché dans la sélection de biens à la une" },
                { key: "publish_platforms", label: "Diffuser sur les plateformes externes", desc: "SeLoger, Leboncoin, Logic-Immo (bientôt disponible)" },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 p-3.5 rounded-xl border border-border/50 hover:bg-secondary/20 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </SECTION>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full h-10">Annuler</Button>
            <Button type="submit" className="flex-1 rounded-full h-10 gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}