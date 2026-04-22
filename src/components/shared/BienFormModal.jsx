import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Sparkles, Globe, Eye, EyeOff, FolderOpen } from "lucide-react";
import DossierFormModal from "./DossierFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BienFichePhotos from "./BienFichePhotos";
import BienFicheCaracteristiques from "./BienFicheCaracteristiques";

const STATUTS_VENTE = [
  { v: "disponible", l: "Disponible" },
  { v: "en_cours", l: "En cours" },
  { v: "vendu", l: "Vendu" },
];
const STATUTS_LOCATION = [
  { v: "disponible", l: "Disponible" },
  { v: "en_cours", l: "En cours" },
  { v: "loue", l: "Loué" },
];

const TABS = ["Infos", "Caractéristiques", "Photos", "Publication"];

export default function BienFormModal({ bien, typeDefaut, onClose, onSave }) {
  const isEdit = !!bien;
  const [tab, setTab] = useState("Infos");
  const [form, setForm] = useState({
    titre: "",
    adresse: "",
    prix: "",
    type: typeDefaut || "vente",
    statut: "disponible",
    description: "",
    surface: "",
    nb_pieces: "",
    etage: "",
    chauffage: "",
    dpe: "",
    balcon: false,
    terrasse: false,
    jardin: false,
    garage: false,
    parking: false,
    cave: false,
    meuble: false,
    ascenseur: false,
    photos: [],
    photo_principale: "",
    is_published_internal: false,
    is_published_external: false,
    ...bien,
  });
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setMany = (obj) => setForm(prev => ({ ...prev, ...obj }));

  const statutOptions = form.type === "location" ? STATUTS_LOCATION : STATUTS_VENTE;

  const generateAIDescription = async () => {
    setGeneratingAI(true);
    const prompt = `Tu es un expert en immobilier. Génère une description professionnelle pour ce bien :
- Type : ${form.type === "vente" ? "Vente" : "Location"}
- Titre : ${form.titre || "Non renseigné"}
- Adresse : ${form.adresse || "Non renseignée"}
- Surface : ${form.surface ? form.surface + " m²" : "Non renseignée"}
- Pièces : ${form.nb_pieces || "Non renseigné"}
- Prix : ${form.prix ? form.prix.toLocaleString("fr-FR") + " €" : "Non renseigné"}
- Équipements : ${["balcon","terrasse","jardin","garage","parking","cave","meuble","ascenseur"].filter(k => form[k]).map(k => k).join(", ") || "aucun"}
- DPE : ${form.dpe || "Non renseigné"}
- Chauffage : ${form.chauffage || "Non renseigné"}

Génère un titre accrocheur et une description immobilière professionnelle de 3-4 phrases, mettant en avant les atouts du bien.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          titre: { type: "string" },
          description: { type: "string" },
        },
      },
    });
    if (result.titre) set("titre", result.titre);
    if (result.description) set("description", result.description);
    setGeneratingAI(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      titre: form.titre,
      adresse: form.adresse || null,
      prix: form.prix ? parseFloat(form.prix) : null,
      type: form.type,
      statut: form.statut,
      description: form.description || null,
      surface: form.surface ? parseFloat(form.surface) : null,
      nb_pieces: form.nb_pieces ? parseInt(form.nb_pieces) : null,
      etage: form.etage || null,
      chauffage: form.chauffage || null,
      dpe: form.dpe || null,
      balcon: !!form.balcon,
      terrasse: !!form.terrasse,
      jardin: !!form.jardin,
      garage: !!form.garage,
      parking: !!form.parking,
      cave: !!form.cave,
      meuble: !!form.meuble,
      ascenseur: !!form.ascenseur,
      photos: form.photos || [],
      photo_principale: form.photo_principale || null,
      is_published_internal: !!form.is_published_internal,
      is_published_external: !!form.is_published_external,
    };
    let saved;
    if (isEdit) {
      await base44.entities.Bien.update(bien.id, data);
      saved = { ...bien, ...data, id: bien.id };
    } else {
      saved = await base44.entities.Bien.create(data);
    }
    onSave(saved, isEdit);
    setSaving(false);
    onClose();
  };

  return (
    <>
    {showDossierModal && isEdit && (
      <DossierFormModal
        bienPrefill={{ ...form, id: bien?.id }}
        onClose={() => setShowDossierModal(false)}
        onSave={() => setShowDossierModal(false)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 flex-shrink-0">
          <div>
            <h2 className="font-bold text-base">{isEdit ? "Modifier le bien" : "Nouveau bien"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.titre || "Sans titre"} · {form.type === "vente" ? "Vente" : "Location"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-4 pt-3 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* ── TAB INFOS ── */}
            {tab === "Infos" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Type *</label>
                    <select
                      value={form.type}
                      onChange={e => { set("type", e.target.value); set("statut", "disponible"); }}
                      className="field-input"
                      required
                    >
                      <option value="vente">Vente</option>
                      <option value="location">Location</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Statut</label>
                    <select value={form.statut} onChange={e => set("statut", e.target.value)} className="field-input">
                      {statutOptions.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label-field mb-0">Titre *</label>
                    <button
                      type="button"
                      onClick={generateAIDescription}
                      disabled={generatingAI}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Générer IA
                    </button>
                  </div>
                  <Input
                    value={form.titre}
                    onChange={e => set("titre", e.target.value)}
                    placeholder="Ex: Appartement T3 lumineux centre-ville"
                    required
                  />
                </div>

                <div>
                  <label className="label-field">Adresse</label>
                  <Input
                    value={form.adresse || ""}
                    onChange={e => set("adresse", e.target.value)}
                    placeholder="12 rue de la Paix, 75001 Paris"
                  />
                </div>

                <div>
                  <label className="label-field">Prix (€) *</label>
                  <Input
                    type="number"
                    value={form.prix || ""}
                    onChange={e => set("prix", e.target.value)}
                    placeholder={form.type === "location" ? "1200 / mois" : "250000"}
                  />
                </div>

                <div>
                  <label className="label-field">Description</label>
                  <textarea
                    value={form.description || ""}
                    onChange={e => set("description", e.target.value)}
                    placeholder="Décrivez le bien (situation, atouts, environnement…)"
                    rows={4}
                    className="field-input resize-none"
                  />
                </div>
              </>
            )}

            {/* ── TAB CARACTÉRISTIQUES ── */}
            {tab === "Caractéristiques" && (
              <BienFicheCaracteristiques form={form} set={set} />
            )}

            {/* ── TAB PHOTOS ── */}
            {tab === "Photos" && (
              <BienFichePhotos
                photos={form.photos || []}
                photoPrincipale={form.photo_principale}
                onChange={setMany}
              />
            )}

            {/* ── TAB PUBLICATION ── */}
            {tab === "Publication" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Gérez la visibilité du bien sur les différents canaux.</p>

                <div className="space-y-3">
                  <div
                    onClick={() => set("is_published_internal", !form.is_published_internal)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.is_published_internal ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${form.is_published_internal ? "bg-primary" : "bg-secondary"}`}>
                      <Eye className={`w-5 h-5 ${form.is_published_internal ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Publication interne</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Visible sur la landing page du SaaS</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all ${form.is_published_internal ? "bg-primary" : "bg-muted"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mt-0.5 ${form.is_published_internal ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>

                  <div
                    onClick={() => set("is_published_external", !form.is_published_external)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.is_published_external ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-200"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${form.is_published_external ? "bg-emerald-500" : "bg-secondary"}`}>
                      <Globe className={`w-5 h-5 ${form.is_published_external ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Export externe</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Préparation pour portails partenaires</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all ${form.is_published_external ? "bg-emerald-500" : "bg-muted"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mt-0.5 ${form.is_published_external ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                </div>

                {/* Status summary */}
                <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Résumé de publication</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${form.is_published_internal ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    Landing page : {form.is_published_internal ? <span className="text-primary font-medium">Actif</span> : <span className="text-muted-foreground">Inactif</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${form.is_published_external ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    Export externe : {form.is_published_external ? <span className="text-emerald-600 font-medium">Activé</span> : <span className="text-muted-foreground">Désactivé</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-5 pb-0 pt-4 border-t border-border/50 flex-shrink-0 bg-white space-y-2">
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl h-10 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => setShowDossierModal(true)}
              >
                <FolderOpen className="w-4 h-4" /> Créer un dossier pour ce bien
              </Button>
            )}
            <div className="flex gap-2 pb-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1 rounded-xl h-11 text-base" disabled={saving || !form.titre}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Enregistrer" : "Créer le bien"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}