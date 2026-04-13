import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Home, Save } from "lucide-react";

const STEPS = [
  { id: "contact", label: "Prise de contact" },
  { id: "estimation", label: "Estimation" },
  { id: "visite", label: "Visite & CR" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "mandat_signe", label: "Mandat" },
  { id: "en_vente", label: "Mise en vente" },
];

const STEPS_ORDER = STEPS.map((s) => s.id);

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export default function MandatDetail({ mandat, onBack, onUpdate }) {
  const isNew = !mandat;
  const [form, setForm] = useState({
    vendeur_nom: mandat?.vendeur_nom || "",
    vendeur_email: mandat?.vendeur_email || "",
    vendeur_telephone: mandat?.vendeur_telephone || "",
    vendeur_source: mandat?.vendeur_source || "telephone",
    agent_email: mandat?.agent_email || "",
    agent_nom: mandat?.agent_nom || "",
    bien_type: mandat?.bien_type || "appartement",
    bien_adresse: mandat?.bien_adresse || "",
    bien_ville: mandat?.bien_ville || "",
    bien_code_postal: mandat?.bien_code_postal || "",
    bien_surface: mandat?.bien_surface || "",
    bien_pieces: mandat?.bien_pieces || "",
    bien_annee: mandat?.bien_annee || "",
    bien_description_vendeur: mandat?.bien_description_vendeur || "",
    date_prise_contact: mandat?.date_prise_contact || new Date().toISOString().substring(0, 10),
    date_visite_estimation: mandat?.date_visite_estimation || "",
    compte_rendu_visite: mandat?.compte_rendu_visite || "",
    points_forts: mandat?.points_forts || "",
    points_faibles: mandat?.points_faibles || "",
    travaux_necessaires: mandat?.travaux_necessaires || "",
    prix_vendeur: mandat?.prix_vendeur || "",
    estimation_min: mandat?.estimation_min || "",
    estimation_max: mandat?.estimation_max || "",
    estimation_ia: mandat?.estimation_ia || "",
    estimation_notes: mandat?.estimation_notes || "",
    prix_mandat: mandat?.prix_mandat || "",
    dpe_classe: mandat?.dpe_classe || "",
    ges_classe: mandat?.ges_classe || "",
    diagnostics_notes: mandat?.diagnostics_notes || "",
    mandat_type: mandat?.mandat_type || "exclusif",
    mandat_date_signature: mandat?.mandat_date_signature || "",
    mandat_duree_mois: mandat?.mandat_duree_mois || 3,
    mandat_date_expiration: mandat?.mandat_date_expiration || "",
    honoraires_taux: mandat?.honoraires_taux || "",
    honoraires_montant: mandat?.honoraires_montant || "",
    honoraires_a_charge: mandat?.honoraires_a_charge || "acquereur",
    statut: mandat?.statut || "contact",
    notes: mandat?.notes || "",
  });
  const [activeStep, setActiveStep] = useState(STEPS_ORDER.indexOf(form.statut) || 0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (newStatut) => {
    setSaving(true);
    const data = {
      ...form,
      bien_surface: Number(form.bien_surface) || undefined,
      bien_pieces: Number(form.bien_pieces) || undefined,
      bien_annee: Number(form.bien_annee) || undefined,
      prix_vendeur: Number(form.prix_vendeur) || undefined,
      estimation_min: Number(form.estimation_min) || undefined,
      estimation_max: Number(form.estimation_max) || undefined,
      estimation_ia: Number(form.estimation_ia) || undefined,
      prix_mandat: Number(form.prix_mandat) || undefined,
      honoraires_taux: Number(form.honoraires_taux) || undefined,
      honoraires_montant: Number(form.honoraires_montant) || undefined,
      mandat_duree_mois: Number(form.mandat_duree_mois) || 3,
    };
    if (newStatut) data.statut = newStatut;
    if (isNew) {
      data.reference = `MANDAT-${Date.now()}`;
      data.historique = [{ id: Date.now(), content: "Dossier créé.", date: new Date().toISOString() }];
      const created = await base44.entities.MandatVente.create(data);
      setSaving(false);
      onUpdate(created);
      return;
    }
    await base44.entities.MandatVente.update(mandat.id, data);
    setSaving(false);
    onUpdate();
  };

  const avancerEtape = async () => {
    const next = STEPS_ORDER[activeStep + 1];
    if (next) {
      await save(next);
      setForm((p) => ({ ...p, statut: next }));
      setActiveStep(activeStep + 1);
    }
  };

  const estimerIA = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert immobilier. Estime le prix de ce bien immobilier et fournis une analyse détaillée.

Type: ${form.bien_type}
Surface: ${form.bien_surface} m²
Pièces: ${form.bien_pieces}
Ville: ${form.bien_ville} (${form.bien_code_postal})
Année de construction: ${form.bien_annee || "non précisé"}
Description vendeur: ${form.bien_description_vendeur || "non précisé"}
Points forts: ${form.points_forts || "non précisé"}
Points faibles: ${form.points_faibles || "non précisé"}
Travaux: ${form.travaux_necessaires || "aucun"}
Prix souhaité par le vendeur: ${form.prix_vendeur ? fmt(form.prix_vendeur) : "non précisé"}

Donne:
1. Une fourchette d'estimation réaliste (min - max)
2. Un prix de mise en vente conseillé
3. Une analyse du marché local
4. Les arguments pour négocier avec le vendeur`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          prix_min: { type: "number" },
          prix_max: { type: "number" },
          prix_conseille: { type: "number" },
          analyse: { type: "string" },
        },
      },
    });
    if (res?.prix_min) set("estimation_min", res.prix_min);
    if (res?.prix_max) set("estimation_max", res.prix_max);
    if (res?.prix_conseille) set("estimation_ia", res.prix_conseille);
    if (res?.analyse) set("estimation_notes", res.analyse);
    setAiLoading(false);
  };

  const genererCR = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un compte-rendu de visite professionnel pour ce bien immobilier.

Bien: ${form.bien_type} à ${form.bien_ville}, ${form.bien_surface}m², ${form.bien_pieces} pièces
Date de visite: ${form.date_visite_estimation || "aujourd'hui"}
Points forts: ${form.points_forts || "à compléter"}
Points faibles: ${form.points_faibles || "à compléter"}
Travaux identifiés: ${form.travaux_necessaires || "aucun"}

Rédige un compte-rendu structuré, factuel et professionnel à destination du dossier interne agence.`
    });
    set("compte_rendu_visite", res);
    setAiLoading(false);
  };

  const createPropertyFromMandat = async () => {
    setSaving(true);
    const prop = await base44.entities.Property.create({
      title: `${form.bien_type === "appartement" ? "Appartement" : form.bien_type === "maison" ? "Maison" : "Bien"} ${form.bien_pieces ? form.bien_pieces + " pièces" : ""} — ${form.bien_ville}`,
      type: form.bien_type,
      transaction: "vente",
      price: Number(form.prix_mandat) || Number(form.estimation_ia) || 0,
      surface: Number(form.bien_surface) || 0,
      rooms: Number(form.bien_pieces) || 0,
      city: form.bien_ville,
      postal_code: form.bien_code_postal,
      address: form.bien_adresse,
      status: "disponible",
      publish_site: false,
      owner_name: form.vendeur_nom,
      owner_email: form.vendeur_email,
      owner_phone: form.vendeur_telephone,
      agent_email: form.agent_email,
      agent_name: form.agent_nom,
    });
    await base44.entities.MandatVente.update(mandat.id, {
      statut: "en_vente",
      property_id: prop.id,
      historique: [
        ...(mandat.historique || []),
        { id: Date.now(), content: `Bien créé et mis en vente (ID: ${prop.id}).`, date: new Date().toISOString() },
      ],
    });
    setSaving(false);
    onUpdate();
  };

  const currentStepIdx = STEPS_ORDER.indexOf(form.statut);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-secondary/60 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{isNew ? "Nouveau dossier vendeur" : form.vendeur_nom}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {form.bien_adresse || form.bien_ville || "Adresse non renseignée"}{mandat?.reference ? ` · ${mandat.reference}` : ""}
          </p>
        </div>
        <Button className="rounded-full gap-2 h-9" onClick={() => save()} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Enregistrer
        </Button>
      </div>

      {/* Stepper */}
      {!isNew && (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((step, i) => {
              const isDone = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setActiveStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeStep === i ? "bg-primary text-white" :
                      isDone ? "bg-green-50 text-green-700 hover:bg-green-100" :
                      isCurrent ? "bg-primary/10 text-primary" :
                      "bg-secondary/30 text-muted-foreground opacity-50"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ borderColor: "currentColor" }}>{i + 1}</span>}
                    <span className="hidden sm:block">{step.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-5">

        {/* STEP 0 - Contact */}
        {(isNew || activeStep === 0) && (
          <>
            <p className="text-sm font-semibold border-b border-border/40 pb-3">Informations vendeur & bien</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Field label="Nom du vendeur *">
                  <Input value={form.vendeur_nom} onChange={(e) => set("vendeur_nom", e.target.value)} />
                </Field>
              </div>
              <Field label="Téléphone *">
                <Input value={form.vendeur_telephone} onChange={(e) => set("vendeur_telephone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input value={form.vendeur_email} onChange={(e) => set("vendeur_email", e.target.value)} />
              </Field>
              <Field label="Source">
                <select value={form.vendeur_source} onChange={(e) => set("vendeur_source", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="telephone">Téléphone</option>
                  <option value="site_web">Site web</option>
                  <option value="recommandation">Recommandation</option>
                  <option value="portail">Portail immobilier</option>
                  <option value="autre">Autre</option>
                </select>
              </Field>
              <Field label="Date de prise de contact">
                <Input type="date" value={form.date_prise_contact} onChange={(e) => set("date_prise_contact", e.target.value)} />
              </Field>
              <Field label="Agent responsable">
                <Input value={form.agent_nom} onChange={(e) => set("agent_nom", e.target.value)} placeholder="Nom de l'agent" />
              </Field>
            </div>

            <p className="text-sm font-semibold border-b border-border/40 pb-3 pt-2">Caractéristiques du bien</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de bien">
                <select value={form.bien_type} onChange={(e) => set("bien_type", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="terrain">Terrain</option>
                  <option value="local_commercial">Local commercial</option>
                  <option value="bureau">Bureau</option>
                </select>
              </Field>
              <Field label="Surface (m²)">
                <Input type="number" value={form.bien_surface} onChange={(e) => set("bien_surface", e.target.value)} />
              </Field>
              <Field label="Nombre de pièces">
                <Input type="number" value={form.bien_pieces} onChange={(e) => set("bien_pieces", e.target.value)} />
              </Field>
              <Field label="Année de construction">
                <Input type="number" value={form.bien_annee} onChange={(e) => set("bien_annee", e.target.value)} />
              </Field>
              <div className="col-span-2">
                <Field label="Adresse complète">
                  <Input value={form.bien_adresse} onChange={(e) => set("bien_adresse", e.target.value)} />
                </Field>
              </div>
              <Field label="Ville">
                <Input value={form.bien_ville} onChange={(e) => set("bien_ville", e.target.value)} />
              </Field>
              <Field label="Code postal">
                <Input value={form.bien_code_postal} onChange={(e) => set("bien_code_postal", e.target.value)} />
              </Field>
              <div className="col-span-2">
                <Field label="Description du vendeur">
                  <Textarea value={form.bien_description_vendeur} onChange={(e) => set("bien_description_vendeur", e.target.value)} rows={3} placeholder="Ce que le vendeur décrit de son bien..." />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Prix souhaité par le vendeur (€)">
                  <Input type="number" value={form.prix_vendeur} onChange={(e) => set("prix_vendeur", e.target.value)} />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* STEP 1 - Estimation */}
        {!isNew && activeStep === 1 && (
          <>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <p className="text-sm font-semibold">Estimation du bien</p>
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={estimerIA} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Estimer avec l'IA
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estimation min (€)">
                <Input type="number" value={form.estimation_min} onChange={(e) => set("estimation_min", e.target.value)} />
              </Field>
              <Field label="Estimation max (€)">
                <Input type="number" value={form.estimation_max} onChange={(e) => set("estimation_max", e.target.value)} />
              </Field>
              <Field label="Prix conseillé IA (€)">
                <Input type="number" value={form.estimation_ia} onChange={(e) => set("estimation_ia", e.target.value)} />
              </Field>
              <Field label="Prix souhaité vendeur (€)">
                <Input type="number" value={form.prix_vendeur} onChange={(e) => set("prix_vendeur", e.target.value)} />
              </Field>
              <div className="col-span-2">
                <Field label="Analyse & notes d'estimation">
                  <Textarea value={form.estimation_notes} onChange={(e) => set("estimation_notes", e.target.value)} rows={5} placeholder="Analyse du marché, comparatifs, argumentaire..." />
                </Field>
              </div>
            </div>
            {form.estimation_min && form.estimation_max && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-center gap-4">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">Fourchette</p>
                  <p className="text-lg font-bold text-primary">{fmt(form.estimation_min)} — {fmt(form.estimation_max)}</p>
                </div>
                {form.estimation_ia && (
                  <div className="text-center flex-1 border-l border-primary/15">
                    <p className="text-xs text-muted-foreground">Prix conseillé</p>
                    <p className="text-lg font-bold">{fmt(form.estimation_ia)}</p>
                  </div>
                )}
                {form.prix_vendeur && (
                  <div className="text-center flex-1 border-l border-primary/15">
                    <p className="text-xs text-muted-foreground">Vendeur demande</p>
                    <p className={`text-lg font-bold ${Number(form.prix_vendeur) > Number(form.estimation_max) ? "text-red-500" : "text-green-600"}`}>{fmt(form.prix_vendeur)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* STEP 2 - Visite & CR */}
        {!isNew && activeStep === 2 && (
          <>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <p className="text-sm font-semibold">Visite & compte-rendu</p>
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={genererCR} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Générer CR IA
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Field label="Date de visite">
                  <Input type="date" value={form.date_visite_estimation} onChange={(e) => set("date_visite_estimation", e.target.value)} />
                </Field>
              </div>
            </div>
            <Field label="Points forts du bien">
              <Textarea value={form.points_forts} onChange={(e) => set("points_forts", e.target.value)} rows={2} placeholder="Luminosité, emplacement, état général..." />
            </Field>
            <Field label="Points faibles / vigilances">
              <Textarea value={form.points_faibles} onChange={(e) => set("points_faibles", e.target.value)} rows={2} placeholder="Travaux, nuisances, orientation..." />
            </Field>
            <Field label="Travaux nécessaires">
              <Textarea value={form.travaux_necessaires} onChange={(e) => set("travaux_necessaires", e.target.value)} rows={2} placeholder="Estimation des travaux identifiés..." />
            </Field>
            <Field label="Compte-rendu de visite">
              <Textarea value={form.compte_rendu_visite} onChange={(e) => set("compte_rendu_visite", e.target.value)} rows={6} placeholder="Compte-rendu complet de la visite..." />
            </Field>
          </>
        )}

        {/* STEP 3 - Diagnostics */}
        {!isNew && activeStep === 3 && (
          <>
            <p className="text-sm font-semibold border-b border-border/40 pb-3">Diagnostics obligatoires</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Classe DPE">
                <select value={form.dpe_classe} onChange={(e) => set("dpe_classe", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">Non renseigné</option>
                  {["A", "B", "C", "D", "E", "F", "G"].map((c) => <option key={c} value={c}>Classe {c}</option>)}
                </select>
              </Field>
              <Field label="Classe GES">
                <select value={form.ges_classe} onChange={(e) => set("ges_classe", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">Non renseigné</option>
                  {["A", "B", "C", "D", "E", "F", "G"].map((c) => <option key={c} value={c}>Classe {c}</option>)}
                </select>
              </Field>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Diagnostics réalisés</label>
              <div className="grid grid-cols-2 gap-2">
                {["Amiante", "Plomb (CREP)", "Électricité", "Gaz", "Termites", "Loi Carrez", "ERP (risques)", "Assainissement"].map((d) => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={(form.diagnostics_realises || []).includes(d)}
                      onChange={(e) => {
                        const list = form.diagnostics_realises || [];
                        set("diagnostics_realises", e.target.checked ? [...list, d] : list.filter((x) => x !== d));
                      }}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm">{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Notes diagnostics">
              <Textarea value={form.diagnostics_notes} onChange={(e) => set("diagnostics_notes", e.target.value)} rows={3} placeholder="Observations, réserves, délais..." />
            </Field>
          </>
        )}

        {/* STEP 4 - Mandat */}
        {!isNew && activeStep === 4 && (
          <>
            <p className="text-sm font-semibold border-b border-border/40 pb-3">Signature du mandat</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de mandat">
                <select value={form.mandat_type} onChange={(e) => set("mandat_type", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="exclusif">Exclusif</option>
                  <option value="simple">Simple</option>
                  <option value="semi_exclusif">Semi-exclusif</option>
                </select>
              </Field>
              <Field label="Durée (mois)">
                <Input type="number" value={form.mandat_duree_mois} onChange={(e) => set("mandat_duree_mois", e.target.value)} />
              </Field>
              <Field label="Date de signature">
                <Input type="date" value={form.mandat_date_signature} onChange={(e) => set("mandat_date_signature", e.target.value)} />
              </Field>
              <Field label="Date d'expiration">
                <Input type="date" value={form.mandat_date_expiration} onChange={(e) => set("mandat_date_expiration", e.target.value)} />
              </Field>
              <Field label="Prix de mise en vente (€) *">
                <Input type="number" value={form.prix_mandat} onChange={(e) => set("prix_mandat", e.target.value)} />
              </Field>
              <Field label="Honoraires (%)">
                <Input type="number" value={form.honoraires_taux} onChange={(e) => set("honoraires_taux", e.target.value)} step="0.1" />
              </Field>
              <Field label="Honoraires (€)">
                <Input type="number" value={form.honoraires_montant} onChange={(e) => set("honoraires_montant", e.target.value)} />
              </Field>
              <Field label="Honoraires à charge de">
                <select value={form.honoraires_a_charge} onChange={(e) => set("honoraires_a_charge", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="acquereur">Acquéreur</option>
                  <option value="vendeur">Vendeur</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {/* STEP 5 - Mise en vente */}
        {!isNew && activeStep === 5 && (
          <>
            <p className="text-sm font-semibold border-b border-border/40 pb-3">Mise en vente</p>
            {form.statut === "en_vente" && mandat?.property_id ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Bien créé et mis en vente</p>
                  <p className="text-xs text-green-700 mt-0.5">Le bien a été ajouté au portefeuille vente avec succès.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Récapitulatif</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Vendeur :</span> <strong>{form.vendeur_nom}</strong></div>
                    <div><span className="text-muted-foreground">Type :</span> <strong>{form.bien_type}</strong></div>
                    <div><span className="text-muted-foreground">Adresse :</span> <strong>{form.bien_adresse || form.bien_ville}</strong></div>
                    <div><span className="text-muted-foreground">Prix mandat :</span> <strong>{fmt(form.prix_mandat)}</strong></div>
                    <div><span className="text-muted-foreground">Mandat :</span> <strong>{form.mandat_type}</strong></div>
                    <div><span className="text-muted-foreground">DPE :</span> <strong>{form.dpe_classe || "—"}</strong></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button className="rounded-full gap-2" onClick={createPropertyFromMandat} disabled={saving || !form.prix_mandat}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
                    Créer le bien & mettre en vente
                  </Button>
                  <p className="text-xs text-muted-foreground">Crée automatiquement la fiche dans "Biens à vendre"</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Notes globales */}
        <div className="border-t border-border/40 pt-4">
          <Field label="Notes internes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Observations, points d'attention..." />
          </Field>
        </div>
      </div>

      {/* Navigation steps */}
      {!isNew && (
        <div className="flex items-center justify-between">
          <Button variant="outline" className="rounded-full gap-2" disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)}>
            <ChevronLeft className="w-4 h-4" /> Étape précédente
          </Button>
          {activeStep < STEPS.length - 1 && activeStep >= STEPS_ORDER.indexOf(form.statut) && (
            <Button className="rounded-full gap-2" onClick={avancerEtape} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Valider & passer à l'étape suivante <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {activeStep < STEPS.length - 1 && activeStep < STEPS_ORDER.indexOf(form.statut) && (
            <Button variant="outline" className="rounded-full gap-2" onClick={() => setActiveStep(activeStep + 1)}>
              Étape suivante <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}