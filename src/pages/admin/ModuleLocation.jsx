import RoleGuard from "@/components/admin/RoleGuard";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  KeySquare, Home, Users, Euro, Search, Loader2,
  AlertCircle, FolderOpen, Activity, Shield, FileText, Plus, Calendar, Star, Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BiensList from "@/components/shared/BiensList";
import ModuleLocationLocataires from "@/components/modules/location/ModuleLocationLocataires";
import ModuleLocationPaiements from "@/components/modules/location/ModuleLocationPaiements";
import LocationWorkflow from "@/components/modules/location/LocationWorkflow";
import LocationQuittances from "@/components/modules/location/LocationQuittances";
import LocationDepotGarantie from "@/components/modules/location/LocationDepotGarantie";
import LocationTempsReel from "@/components/modules/location/LocationTempsReel";
import DossierCreationModal from "@/components/modules/location/workflow/DossierCreationModal";

const TABS = [
  { id: "temps_reel", label: "Tableau de bord",  icon: Activity,   },
  { id: "workflow",   label: "Dossiers",          icon: FolderOpen, },
  { id: "quittances", label: "Quittances",        icon: FileText,   },
  { id: "depot",      label: "Dépôts",            icon: Shield,     },
  { id: "biens",      label: "Biens",             icon: Home,       },
  { id: "locataires", label: "Locataires",        icon: Users,      },
  { id: "paiements",  label: "Loyers",            icon: Euro,       },
];

export default function ModuleLocation() {
  const [tab, setTab] = useState("temps_reel");
  const [biens, setBiens] = useState([]);
  const [locataires, setLocataires] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewDossier, setShowNewDossier] = useState(false);
  const [dossiers, setDossiers] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [b, p, allContacts, d] = await Promise.all([
        base44.entities.Bien.filter({ type: "location" }),
        base44.entities.Paiement.filter({ type: "loyer" }),
        base44.entities.Contact.list("-created_date", 500),
        base44.entities.DossierLocatif.list("-created_date", 50),
      ]);
      setBiens(b);
      setPaiements(p);
      setDossiers(d);
      const locatairesList = allContacts.filter(c => c.type === "locataire");
      setLocataires(locatairesList.length > 0 ? locatairesList : allContacts);
      setContacts(allContacts);
      setLoading(false);
    };
    load();
  }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));
  const loyersEnRetard = paiements.filter(p => p.statut === "en_retard");
  const loyersPayes = paiements.filter(p => p.statut === "paye");
  const totalEncaisse = loyersPayes.reduce((s, p) => s + (p.montant || 0), 0);
  const dossiersActifs = dossiers.filter(d => d.statut_dossier === "en_cours" || d.statut_dossier === "bail_signe").length;

  const needsSearch = ["biens", "locataires", "paiements"].includes(tab);

  // Quick actions contextuelles
  const QUICK_ACTIONS = [
    {
      id: "new_dossier", label: "Nouveau dossier", emoji: "📂",
      color: "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white",
      onClick: () => setShowNewDossier(true),
    },
    {
      id: "planifier_rdv", label: "Planifier RDV", emoji: "📅",
      color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white",
      fields: [
        { key: "titre", label: "Objet du RDV", required: true, placeholder: "Ex: Visite T3 rue de la Paix" },
        { key: "date_debut", label: "Date & heure", type: "datetime-local", required: true },
        { key: "contact_nom", label: "Nom du contact", placeholder: "Nom locataire…" },
      ],
      onSubmit: async (v) => {
        await base44.entities.Evenement.create({
          titre: v.titre, date_debut: v.date_debut, type: "visite",
          contact_nom: v.contact_nom, module: "location", statut: "planifie",
        });
      },
      successMsg: "RDV planifié ✓", cta: "Planifier",
    },
    {
      id: "scoring_ia", label: "Scoring IA", emoji: "✨",
      color: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-500 hover:text-white",
      fields: [
        {
          key: "dossier_id", label: "Dossier à scorer", required: true, type: "select",
          options: dossiers.slice(0, 30).map(d => ({ value: d.id, label: d.locataire_nom || d.id })),
        },
      ],
      onSubmit: async (v) => {
        const d = dossiers.find(x => x.id === v.dossier_id);
        if (!d) return;
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Score ce candidat locataire (0-100) : ${d.locataire_nom}, revenus : ${d.loyer_mensuel ? d.loyer_mensuel * 3 : "?"} €/mois, loyer : ${d.loyer_mensuel} €. JSON: {score:number, recommandation:"ACCEPTER"|"REFUSER"|"À COMPLETER", commentaire:string}`,
          response_json_schema: { type: "object", properties: { score: { type: "number" }, recommandation: { type: "string" }, commentaire: { type: "string" } } },
        });
        await base44.entities.DossierLocatif.update(d.id, { scoring_ia: result.score, scoring_recommandation: result.recommandation, scoring_commentaire: result.commentaire });
      },
      successMsg: "Scoring IA lancé ✓", cta: "Lancer le scoring",
    },
    {
      id: "loyer_retard", label: "Relancer impayé", emoji: "⚠️",
      color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-500 hover:text-white",
      fields: [
        { key: "contact_nom", label: "Nom du locataire", required: true, placeholder: "Nom…" },
        { key: "contact_email", label: "Email", type: "email", placeholder: "email@…" },
        { key: "montant", label: "Montant dû (€)", type: "number", placeholder: "850" },
      ],
      onSubmit: async (v) => {
        await base44.entities.Relance.create({
          type_relance: "paiement_retard", canal: "email",
          contact_nom: v.contact_nom, contact_email: v.contact_email,
          montant: Number(v.montant) || 0, statut: "planifiee", niveau: 1, auto: false,
        });
        if (v.contact_email) {
          await base44.integrations.Core.SendEmail({
            to: v.contact_email,
            subject: "Rappel : loyer en retard",
            body: `<p>Bonjour ${v.contact_nom},</p><p>Nous vous rappelons que votre loyer de ${v.montant || ""}€ est en retard. Merci de régulariser votre situation dans les plus brefs délais.</p>`,
          });
        }
      },
      successMsg: "Relance envoyée ✓", cta: "Relancer",
    },
    {
      id: "quittance", label: "Générer quittance", emoji: "🧾",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white",
      onClick: () => setTab("quittances"),
    },
    {
      id: "voir_biens", label: "Gérer les biens", emoji: "🏠",
      color: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-500 hover:text-white",
      onClick: () => setTab("biens"),
    },
  ];

  return (
    <RoleGuard module="location">
    <div className="space-y-4 max-w-6xl">

      {/* ── HEADER ACTIONNEL ── */}
      <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <KeySquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Module Location</h1>
              <p className="text-xs text-muted-foreground">Cycle locatif complet · Dossiers · Bail · EDL · Quittances</p>
            </div>
          </div>
          {/* KPIs inline */}
          <div className="flex items-center gap-5">
            {[
              { v: biens.length, l: "Biens", color: "text-blue-600" },
              { v: dossiersActifs, l: "Actifs", color: "text-emerald-600" },
              { v: totalEncaisse.toLocaleString("fr-FR") + " €", l: "Encaissé", color: "text-green-600" },
              { v: loyersEnRetard.length, l: "Retards", color: loyersEnRetard.length > 0 ? "text-red-600" : "text-muted-foreground" },
            ].map((k, i) => (
              <div key={i} className="text-center hidden sm:block">
                <p className={`text-lg font-bold ${k.color}`}>{k.v}</p>
                <p className="text-[10px] text-muted-foreground">{k.l}</p>
              </div>
            ))}
            <Button className="rounded-full gap-1.5 h-9 text-sm" onClick={() => setShowNewDossier(true)}>
              <Plus className="w-3.5 h-3.5" /> Nouveau dossier
            </Button>
          </div>
        </div>

        {/* Quick actions pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => action.onClick ? action.onClick() : document.getElementById(`qa-${action.id}`)?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm active:scale-95 ${action.color}`}
            >
              <span>{action.emoji}</span> {action.label}
            </button>
          ))}
        </div>

        {/* Alerte retards */}
        {loyersEnRetard.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={() => setTab("paiements")}>
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-800">
              {loyersEnRetard.length} loyer{loyersEnRetard.length > 1 ? "s" : ""} en retard — cliquer pour voir →
            </p>
          </div>
        )}
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-border/50 p-1.5 flex flex-wrap gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === "paiements" && loyersEnRetard.length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20" : "bg-red-100 text-red-600"}`}>
                  {loyersEnRetard.length}
                </span>
              )}
            </button>
          );
        })}
        {needsSearch && (
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
              className="pl-8 h-9 w-40 rounded-xl border-0 bg-secondary/50 text-sm" />
          </div>
        )}
      </div>

      {/* ── CONTENU ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "temps_reel"  && <LocationTempsReel />}
          {tab === "workflow"    && <LocationWorkflow biens={biens} contacts={contacts} />}
          {tab === "quittances"  && <LocationQuittances />}
          {tab === "depot"       && <LocationDepotGarantie />}
          {tab === "biens"       && <BiensList biens={biens} typeModule="location" onBiensChange={setBiens} search={search} />}
          {tab === "locataires"  && <ModuleLocationLocataires locataires={locataires} biens={biens} search={search} />}
          {tab === "paiements"   && <ModuleLocationPaiements paiements={paiements} contactMap={contactMap} bienMap={bienMap} search={search} />}
        </>
      )}

      {/* Modal nouveau dossier */}
      {showNewDossier && (
        <DossierCreationModal
          biens={biens} contacts={contacts}
          onClose={() => setShowNewDossier(false)}
          onCreated={d => {
            setDossiers(p => [d, ...p]);
            setShowNewDossier(false);
            setTab("workflow");
          }}
        />
      )}
    </div>
    </RoleGuard>
  );
}