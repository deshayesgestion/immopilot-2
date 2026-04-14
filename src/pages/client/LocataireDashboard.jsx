import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Loader2, MessageSquare, Bell } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function LocataireDashboard() {
  const [user, setUser] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      // Find dossier linked to this tenant's email
      const dossiers = await base44.entities.DossierLocatif.list("-created_date", 100);
      const found = dossiers.find(d =>
        d.locataire_selectionne?.email === me.email ||
        d.candidatures?.some(c => c.email === me.email && c.statut === "selectionne")
      );
      setDossier(found || null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const paiements = dossier?.paiements || [];
  const dernierPaiement = paiements[paiements.length - 1];
  const enRetard = paiements.some(p => p.statut === "en_retard");
  const incidents = (dossier?.incidents || []).filter(i => i.statut !== "resolu");
  const docs = dossier?.documents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bonjour {user?.full_name?.split(" ")[0] || "👋"}</h1>
        <p className="text-muted-foreground text-sm mt-1">Votre espace locataire — {dossier ? dossier.property_title : "aucun dossier actif"}</p>
      </div>

      {!dossier ? (
        <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
          <Home className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold">Aucun dossier trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">Votre dossier sera lié automatiquement à votre email lors de votre entrée dans les lieux.</p>
        </div>
      ) : (
        <>
          {/* Status card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Votre logement</p>
                <p className="text-lg font-bold mt-1">{dossier.property_title}</p>
                <p className="text-blue-100 text-sm mt-0.5">{dossier.property_address || "—"}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${dossier.statut === "en_cours" ? "bg-green-400 text-white" : "bg-white/20 text-white"}`}>
                {dossier.statut === "en_cours" ? "Actif" : dossier.statut}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-xs">Loyer</p>
                <p className="text-white font-bold">{fmt(dossier.loyer)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Charges</p>
                <p className="text-white font-bold">{fmt(dossier.charges)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Entrée</p>
                <p className="text-white font-bold">{fmtDate(dossier.date_entree)}</p>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/espace/locataire/paiements" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all group">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${enRetard ? "bg-red-50" : "bg-green-50"}`}>
                <CreditCard className={`w-4 h-4 ${enRetard ? "text-red-500" : "text-green-600"}`} />
              </div>
              <p className={`text-lg font-bold ${enRetard ? "text-red-500" : "text-green-600"}`}>{enRetard ? "En retard" : "À jour"}</p>
              <p className="text-xs text-muted-foreground">Paiements</p>
            </Link>
            <Link to="/espace/locataire/documents" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold">{docs.length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </Link>
            <Link to="/espace/locataire/incidents" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all group">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${incidents.length > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                <AlertTriangle className={`w-4 h-4 ${incidents.length > 0 ? "text-amber-500" : "text-gray-400"}`} />
              </div>
              <p className={`text-lg font-bold ${incidents.length > 0 ? "text-amber-500" : "text-gray-400"}`}>{incidents.length}</p>
              <p className="text-xs text-muted-foreground">Incidents</p>
            </Link>
            <Link to="/espace/locataire/messages" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-purple-600">0</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </Link>
          </div>

          {/* Prochain loyer */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Prochain loyer</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{fmt((dossier.loyer || 0) + (dossier.charges || 0))}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Loyer + charges · 1er du mois</p>
              </div>
              <Link to="/espace/locataire/paiements"
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                Payer <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Timeline dossier */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-4">Suivi de votre dossier</p>
            <div className="space-y-3">
              {[
                { label: "Candidature validée", done: true },
                { label: "Bail signé", done: !!(dossier.contrat_url) },
                { label: "État des lieux entrée", done: !!(dossier.edl_entree) },
                { label: "En location", done: dossier.statut === "en_cours" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-green-500" : "bg-gray-100"}`}>
                    {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-xs text-gray-400">{i + 1}</span>}
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