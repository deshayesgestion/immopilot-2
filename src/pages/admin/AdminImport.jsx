import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Download, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImportWizard from "../../components/admin/import/ImportWizard";

const IMPORT_TYPES = [
  {
    id: "Property",
    label: "Biens immobiliers",
    icon: "🏠",
    description: "Appartements, maisons, locaux…",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-100",
    example: ["title", "type", "transaction", "price", "surface", "rooms", "city", "postal_code", "address"],
    fields: [
      { key: "title", label: "Titre", required: true },
      { key: "type", label: "Type (maison/appartement/terrain/local_commercial/bureau)", required: true },
      { key: "transaction", label: "Transaction (vente/location)", required: true },
      { key: "price", label: "Prix (€)", required: true },
      { key: "surface", label: "Surface (m²)", required: true },
      { key: "rooms", label: "Pièces", required: false },
      { key: "bedrooms", label: "Chambres", required: false },
      { key: "city", label: "Ville", required: true },
      { key: "postal_code", label: "Code postal", required: false },
      { key: "address", label: "Adresse", required: false },
      { key: "description", label: "Description", required: false },
      { key: "owner_name", label: "Propriétaire nom", required: false },
      { key: "owner_email", label: "Propriétaire email", required: false },
      { key: "owner_phone", label: "Propriétaire tél.", required: false },
      { key: "status", label: "Statut (disponible/loue/vendu…)", required: false },
      { key: "dpe", label: "DPE (A-G)", required: false },
    ],
  },
  {
    id: "Lead",
    label: "Locataires / Prospects",
    icon: "👥",
    description: "Locataires, leads location et vente",
    color: "bg-violet-50 border-violet-200 hover:border-violet-400",
    iconBg: "bg-violet-100",
    example: ["name", "email", "phone", "type", "budget_min", "budget_max"],
    fields: [
      { key: "name", label: "Nom complet", required: true },
      { key: "email", label: "Email", required: true },
      { key: "phone", label: "Téléphone", required: false },
      { key: "type", label: "Type (acheteur/vendeur/locataire/bailleur)", required: true },
      { key: "budget_min", label: "Budget min (€)", required: false },
      { key: "budget_max", label: "Budget max (€)", required: false },
      { key: "surface_min", label: "Surface min (m²)", required: false },
      { key: "cities", label: "Villes (séparées par ;)", required: false },
      { key: "notes", label: "Notes", required: false },
      { key: "status", label: "Statut (nouveau/contacte…)", required: false },
      { key: "source", label: "Source (site_web/telephone…)", required: false },
    ],
  },
  {
    id: "Acquereur",
    label: "Acquéreurs",
    icon: "🔑",
    description: "Acquéreurs avec critères de recherche",
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    iconBg: "bg-emerald-100",
    example: ["nom", "email", "telephone", "budget_min", "budget_max"],
    fields: [
      { key: "nom", label: "Nom complet", required: true },
      { key: "email", label: "Email", required: true },
      { key: "telephone", label: "Téléphone", required: false },
      { key: "budget_min", label: "Budget min (€)", required: false },
      { key: "budget_max", label: "Budget max (€)", required: false },
      { key: "surface_min", label: "Surface min (m²)", required: false },
      { key: "nb_pieces_min", label: "Pièces min", required: false },
      { key: "apport", label: "Apport (€)", required: false },
      { key: "financement_valide", label: "Financement validé (oui/non)", required: false },
      { key: "notes", label: "Notes", required: false },
      { key: "statut", label: "Statut (actif/en_attente/inactif)", required: false },
    ],
  },
  {
    id: "TransactionVente",
    label: "Transactions de vente",
    icon: "📈",
    description: "Transactions immobilières en cours ou finalisées",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    iconBg: "bg-amber-100",
    example: ["property_title", "acquereur_nom", "prix_affiche", "statut"],
    fields: [
      { key: "property_title", label: "Titre du bien", required: true },
      { key: "acquereur_nom", label: "Acquéreur nom", required: true },
      { key: "acquereur_email", label: "Acquéreur email", required: false },
      { key: "prix_affiche", label: "Prix affiché (€)", required: false },
      { key: "prix_offre", label: "Prix d'offre (€)", required: false },
      { key: "prix_vente_final", label: "Prix final (€)", required: false },
      { key: "statut", label: "Statut (prospection/offre/compromis/vendu…)", required: false },
      { key: "agent_nom", label: "Agent nom", required: false },
      { key: "agent_email", label: "Agent email", required: false },
      { key: "date_compromis", label: "Date compromis (YYYY-MM-DD)", required: false },
      { key: "notes", label: "Notes", required: false },
    ],
  },
];

export default function AdminImport() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au choix du type
        </button>
        <ImportWizard type={selected} onDone={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import de données</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Importez vos données existantes via fichier CSV</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {IMPORT_TYPES.map(type => (
          <button key={type.id} onClick={() => setSelected(type)}
            className={`text-left p-5 rounded-2xl border-2 transition-all group ${type.color}`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-xl ${type.iconBg} flex items-center justify-center text-2xl`}>
                {type.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{type.label}</p>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div className="flex flex-wrap gap-1">
              {type.fields.filter(f => f.required).slice(0, 4).map(f => (
                <span key={f.key} className="text-[10px] bg-white/70 rounded-full px-2 py-0.5 text-muted-foreground">
                  {f.label}
                </span>
              ))}
              <span className="text-[10px] text-muted-foreground/60">+{type.fields.length} champs</span>
            </div>
          </button>
        ))}
      </div>

      {/* Guide */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-3">
        <p className="text-sm font-semibold">Comment préparer votre fichier CSV ?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Préparez le CSV", desc: "Fichier CSV avec des colonnes en entête (1ère ligne). Encodage UTF-8 recommandé." },
            { step: "2", title: "Mappez les champs", desc: "Associez chaque colonne de votre fichier aux champs de la plateforme." },
            { step: "3", title: "Vérifiez & importez", desc: "Prévisualisez les erreurs et importez en un clic." },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</span>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}