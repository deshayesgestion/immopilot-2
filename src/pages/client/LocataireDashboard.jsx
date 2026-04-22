import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Loader2, MessageSquare, FolderOpen, MapPin } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function LocataireDashboard() {
  const [user, setUser] = useState(null);
  const [dossierImmo, setDossierImmo] = useState(null); // DossierImmobilier
  const [dossierLocatif, setDossierLocatif] = useState(null); // DossierLocatif (ancien)
  const [bien, setBien] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Chercher le contact lié à cet email
      const [contacts, dossiersImmo, dossiersLocatifs] = await Promise.all([
        base44.entities.Contact.filter({ email: me.email }, "-created_date", 5),
        base44.entities.DossierImmobilier.filter({ type: "location" }, "-created_date", 100),
        base44.entities.DossierLocatif.list("-created_date", 100),
      ]);

      const myContact = contacts[0] || null;
      setContact(myContact);

      // Trouver le DossierImmobilier lié à ce contact
      let dImmo = null;
      if (myContact) {
        dImmo = dossiersImmo.find(d =>
          d.contact_ids?.includes(myContact.id)
        ) || null;
      }

      // Fallback: DossierLocatif (ancien système)
      const dLocatif = dossiersLocatifs.find(d =>
        d.locataire_selectionne?.email === me.email ||
        d.candidatures?.some(c => c.email === me.email && c.statut === "selectionne")
      ) || null;

      setDossierImmo(dImmo);
      setDossierLocatif(dLocatif);

      // Charger le bien associé
      let bienData = null;
      if (dImmo?.bien_id) {
        try {
          const biens = await base44.entities.Bien.filter({ id: dImmo.bien_id });
          bienData = biens[0] || null;
        } catch {}
      }
      setBien(bienData);

      // Paiements liés au contact
      if (myContact) {
        const paies = await base44.entities.Paiement.filter({ contact_id: myContact.id, type: "loyer" }, "-created_date", 50);
        setPaiements(paies);
      } else if (dLocatif) {
        setPaiements(dLocatif.paiements || []);
      }

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const hasDossier = dossierImmo || dossierLocatif;
  const bienTitre = bien?.titre || dossierImmo?.bien_titre || dossierLocatif?.property_title || "—";
  const bienAdresse = bien?.adresse || dossierLocatif?.property_address || null;
  const loyer = dossierImmo?.loyer || dossierLocatif?.loyer || 0;
  const charges = dossierLocatif?.charges || 0;
  const dateEntree = dossierLocatif?.date_entree || null;

  const enRetard = paiements.some(p => p.statut === "en_retard");
  const paiementsPayes = paiements.filter(p => p.statut === "paye");
  const incidents = (dossierLocatif?.incidents || []).filter(i => i.statut !== "resolu");
  const docs = dossierLocatif?.documents || [];

  const STEPS = [
    { label: "Dossier créé", done: true },
    { label: "Contact validé", done: !!contact },
    { label: "Bail signé", done: !!(dossierLocatif?.contrat_url) },
    { label: "État des lieux entrée", done: !!(dossierLocatif?.edl_entree) },
    { label: "En location", done: dossierLocatif?.statut === "en_cours" || dossierImmo?.statut === "signe" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bonjour {user?.full_name?.split(" ")[0] || "👋"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Votre espace locataire {hasDossier ? `— ${bienTitre}` : ""}
        </p>
      </div>

      {!hasDossier ? (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center space-y-3">
          <Home className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="font-semibold">Aucun dossier actif</p>
          <p className="text-sm text-muted-foreground">Votre dossier sera lié automatiquement à votre compte lors de votre entrée dans les lieux.</p>
        </div>
      ) : (
        <>
          {/* Carte logement */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Votre logement</p>
                <p className="text-lg font-bold mt-1">{bienTitre}</p>
                {bienAdresse && (
                  <p className="text-blue-200 text-sm mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{bienAdresse}
                  </p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (dossierImmo?.statut === "signe" || dossierLocatif?.statut === "en_cours")
                  ? "bg-green-400 text-white" : "bg-white/20 text-white"
              }`}>
                {dossierImmo?.statut === "signe" || dossierLocatif?.statut === "en_cours" ? "Actif" : "En cours"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-xs">Loyer</p>
                <p className="text-white font-bold">{fmt(loyer)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Charges</p>
                <p className="text-white font-bold">{fmt(charges)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Entrée</p>
                <p className="text-white font-bold">{fmtDate(dateEntree)}</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/espace/locataire/paiements" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${enRetard ? "bg-red-50" : "bg-green-50"}`}>
                <CreditCard className={`w-4 h-4 ${enRetard ? "text-red-500" : "text-green-600"}`} />
              </div>
              <p className={`text-lg font-bold ${enRetard ? "text-red-500" : "text-green-600"}`}>{enRetard ? "Retard" : "À jour"}</p>
              <p className="text-xs text-muted-foreground">{paiements.length} paiements</p>
            </Link>
            <Link to="/espace/locataire/documents" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold">{docs.length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </Link>
            <Link to="/espace/locataire/incidents" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${incidents.length > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                <AlertTriangle className={`w-4 h-4 ${incidents.length > 0 ? "text-amber-500" : "text-gray-400"}`} />
              </div>
              <p className={`text-lg font-bold ${incidents.length > 0 ? "text-amber-500" : "text-gray-400"}`}>{incidents.length}</p>
              <p className="text-xs text-muted-foreground">Incidents</p>
            </Link>
            <Link to="/espace/locataire/messages" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-purple-600">—</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </Link>
          </div>

          {/* Prochain loyer */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Prochain loyer
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{fmt(loyer + charges)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Loyer + charges · 1er du mois</p>
              </div>
              <Link to="/espace/locataire/paiements" className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                Historique <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Historique encaissements récents */}
          {paiements.length > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Paiements récents</p>
                <Link to="/espace/locataire/paiements" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {paiements.slice(0, 3).map((p, i) => (
                  <div key={p.id || i} className="flex items-center gap-3 p-2.5 bg-secondary/20 rounded-xl">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${p.statut === "paye" ? "bg-green-100" : "bg-amber-100"}`}>
                      {p.statut === "paye"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{p.type === "loyer" ? "Loyer" : p.type || "Paiement"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.date_paiement || p.date_echeance)}</p>
                    </div>
                    <p className="text-sm font-bold">{fmt(p.montant)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suivi dossier */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-600" /> Suivi de votre dossier
            </p>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-green-500" : "bg-gray-100"}`}>
                    {step.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      : <span className="text-xs text-gray-400">{i + 1}</span>}
                  </div>
                  <p className={`text-sm ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}