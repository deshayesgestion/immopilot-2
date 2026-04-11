import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sparkles, Loader2, Upload, Trash2, ImagePlus, User } from "lucide-react";

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

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </div>
    <span className="text-sm">{label}</span>
  </label>
);

const defaultForm = {
  title: "", description: "", type: "appartement", surface: "", rooms: "", floor: "",
  address: "", city: "", postal_code: "",
  dpe: "", ges: "", heating: "", condition: "bon_etat", year_built: "",
  price: "", monthly_charges: "", deposit: "",
  available_date: "",
  furnished: false, elevator: false, balcony: false, parking: false, cellar: false, terrace: false,
  owner_name: "", owner_email: "", owner_phone: "",
  agent_id: "", agent_email: "", agent_name: "",
  conditions_revenus_min: "", conditions_garant: false, conditions_contrat: "", conditions_notes: "",
  transaction: "location", status: "disponible", featured: false,
  publish_site: false, publish_platforms: false,
  images: [],
};

export default function BienLocationForm({ bien, onClose, onSave }) {
  const [form, setForm] = useState(bien ? { ...defaultForm, ...bien } : defaultForm);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [aiImgLoading, setAiImgLoading] = useState(null);
  const fileRef = useRef();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    base44.entities.User.list().then((users) => {
      setAgents(users.filter((u) => ["admin", "agent", "responsable_location", "responsable_vente"].includes(u.role)));
    }).catch(() => {});
  }, []);

  const generateAI = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère une description immobilière professionnelle et attractive pour ce bien en location :
Type: ${form.type}, Surface: ${form.surface}m², Pièces: ${form.rooms}, Ville: ${form.city}, Loyer: ${form.price}€/mois, État: ${form.condition}, DPE: ${form.dpe}.
Meublé: ${form.furnished ? "oui" : "non"}, Balcon: ${form.balcony ? "oui" : "non"}, Ascenseur: ${form.elevator ? "oui" : "non"}.
Ton élégant, vendeur, professionnel. 3-4 phrases maximum. En français.`,
    });
    set("description", res);
    setAiLoading(false);
  };

  const handleUploadImages = async (files) => {
    for (let i = 0; i < files.length; i++) {
      setUploadingIdx(i);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });
      setForm((p) => ({ ...p, images: [...(p.images || []), file_url] }));
    }
    setUploadingIdx(null);
  };

  const removeImage = (idx) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  };

  const enhanceWithAI = async (idx) => {
    setAiImgLoading(idx);
    const imageUrl = form.images[idx];
    const res = await base44.integrations.Core.GenerateImage({
      prompt: "Professional real estate interior photo, bright lighting, clean and modern, home staging style, high quality photography",
      existing_image_urls: [imageUrl],
    });
    setForm((p) => {
      const imgs = [...p.images];
      imgs[idx] = res.url;
      return { ...p, images: imgs };
    });
    setAiImgLoading(null);
  };

  const selectAgent = (agentId) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      set("agent_id", agent.id);
      set("agent_email", agent.email);
      set("agent_name", agent.full_name);
    } else {
      set("agent_id", "");
      set("agent_email", "");
      set("agent_name", "");
    }
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
      deposit: Number(form.deposit) || 0,
      conditions_revenus_min: form.conditions_revenus_min ? Number(form.conditions_revenus_min) : undefined,
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

          {/* 1. Infos générales */}
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
                  type="button" size="sm" variant="outline" onClick={generateAI}
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
                    <SelectItem value="disponible">Disponible</SelectItem>
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

          {/* 2. Localisation */}
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

          {/* 3. Caractéristiques */}
          <SECTION title="Caractéristiques">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <Toggle label="Meublé" checked={form.furnished} onChange={(v) => set("furnished", v)} />
              <Toggle label="Ascenseur" checked={form.elevator} onChange={(v) => set("elevator", v)} />
              <Toggle label="Balcon" checked={form.balcony} onChange={(v) => set("balcony", v)} />
              <Toggle label="Parking" checked={form.parking} onChange={(v) => set("parking", v)} />
              <Toggle label="Cave" checked={form.cellar} onChange={(v) => set("cellar", v)} />
              <Toggle label="Terrasse" checked={form.terrace} onChange={(v) => set("terrace", v)} />
            </div>
          </SECTION>

          {/* 4. Photos */}
          <SECTION title="Photos du bien">
            <div className="grid grid-cols-3 gap-3">
              {(form.images || []).map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-secondary/40 border border-border/50">
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => enhanceWithAI(idx)}
                      disabled={aiImgLoading === idx}
                      className="flex items-center gap-1 bg-white/90 hover:bg-white text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {aiImgLoading === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
                      IA
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="flex items-center gap-1 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                      Suppr.
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-accent/30 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary"
              >
                {uploadingIdx !== null ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                <span className="text-xs font-medium">Ajouter</span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && handleUploadImages(Array.from(e.target.files))}
            />
            <p className="text-xs text-muted-foreground">Survolez une image pour l'améliorer avec l'IA (home staging) ou la supprimer.</p>
          </SECTION>

          {/* 5. Disponibilité & finances */}
          <SECTION title="Disponibilité & finances">
            <Field label="Date de disponibilité">
              <Input type="date" value={form.available_date} onChange={(e) => set("available_date", e.target.value)} className="h-10 rounded-xl" />
            </Field>
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

          {/* 6. Agent assigné */}
          <SECTION title="Agent assigné">
            {agents.length > 0 ? (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <label
                    key={agent.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.agent_id === agent.id ? "border-primary/60 bg-accent/30" : "border-border/50 hover:bg-secondary/20"}`}
                  >
                    <input
                      type="radio"
                      name="agent"
                      value={agent.id}
                      checked={form.agent_id === agent.id}
                      onChange={() => selectAgent(agent.id)}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.full_name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                    {form.agent_id === agent.id && (
                      <span className="ml-auto text-xs text-primary font-medium">Sélectionné</span>
                    )}
                  </label>
                ))}
                {form.agent_id && (
                  <button type="button" onClick={() => selectAgent("")} className="text-xs text-muted-foreground hover:text-destructive">
                    Retirer l'assignation
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-secondary/40 rounded-xl p-4">
                Aucun agent trouvé. Invitez des agents depuis le module "Équipe".
              </div>
            )}
          </SECTION>

          {/* 7. Propriétaire */}
          <SECTION title="Propriétaire">
            <Row>
              <Field label="Nom">
                <Input placeholder="M. Dupont" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="Email">
                <Input type="email" placeholder="dupont@email.fr" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} className="h-10 rounded-xl" />
              </Field>
            </Row>
            <Field label="Téléphone">
              <Input placeholder="06 12 34 56 78" value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} className="h-10 rounded-xl" />
            </Field>
          </SECTION>

          {/* 8. Conditions d'obtention */}
          <SECTION title="Conditions d'obtention">
            <Row>
              <Field label="Revenus minimum (€/mois)">
                <Input type="number" placeholder="3 600" value={form.conditions_revenus_min} onChange={(e) => set("conditions_revenus_min", e.target.value)} className="h-10 rounded-xl" />
              </Field>
              <Field label="Type de contrat requis">
                <Input placeholder="CDI, fonctionnaire..." value={form.conditions_contrat} onChange={(e) => set("conditions_contrat", e.target.value)} className="h-10 rounded-xl" />
              </Field>
            </Row>
            <Toggle label="Garant requis" checked={form.conditions_garant} onChange={(v) => set("conditions_garant", v)} />
            <Field label="Autres conditions (optionnel)">
              <Textarea
                placeholder="Ex : Pas d'animaux, non-fumeur..."
                value={form.conditions_notes}
                onChange={(e) => set("conditions_notes", e.target.value)}
                className="rounded-xl resize-none min-h-[70px]"
              />
            </Field>
          </SECTION>

          {/* 9. Publication */}
          <SECTION title="Publication">
            <div className="space-y-2.5">
              {[
                { key: "publish_site", label: "Publier sur le site vitrine", desc: "Le bien apparaît sur la page 'Louer' du site public" },
                { key: "featured", label: "Mettre en avant (page accueil)", desc: "Affiché dans la sélection de biens à la une" },
                { key: "publish_platforms", label: "Diffuser sur les plateformes externes", desc: "SeLoger, Leboncoin (bientôt disponible)" },
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