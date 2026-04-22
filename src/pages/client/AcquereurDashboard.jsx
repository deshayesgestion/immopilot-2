import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Home, Eye, FileText, TrendingUp, Loader2, CheckCircle2, Clock, ArrowUpRight, FolderOpen, MapPin, Search, MessageSquare } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STATUT_DOSSIER = {
  nouveau:   { label: "Nouveau",   color: "bg-amber-100 text-amber-700" },
  en_cours:  { label: "En cours",  color: "bg-blue-100 text-blue-700" },
  signe:     { label: "Signé",     color: "bg-green-100 text-green-700" },
  termine:   { label: "Terminé",   color: "bg-slate-100 text-slate-600" },
};

export default function AcquereurDashboard() {
  const [user, setUser] = useState(null);
  const [acquereur, setAcquereur] = useState(null);
  const [contact, setContact] = useState(null);
  const [dossiers, setDossiers] = useState([]);     // DossierImmobilier vente
  const [leads, setLeads] = useState([]);
  const [biensMap, setBiensMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      const [contacts, acqs, dossiersImmo, allLeads, allBiens] = await Promise.all([
        base44.entities.Contact.filter({ email: me.email }, "-created_date", 5),
        base44.entities.Acquereur.filter({ email: me.email }, "-created_date", 1),
        base44.entities.DossierImmobilier.filter({ type: "vente" }, "-created_date", 100),
        base44.entities.Lead.filter({ statut: "qualifie" }, "-created_date", 50),
        base44.entities.Bien.list("-created_date", 200),
      ]);

      const myContact = contacts[0] || null;
      setContact(myContact);
      setAcquereur(acqs[0] || null);

      // Biens map pour résoudre les titres
      const bMap = Object.fromEntries(allBiens.map(b => [b.id, b]));
      setBiensMap(bMap);

      // Dossiers liés à ce contact
      let myDossiers = [];
      if (myContact) {
        myDossiers = dossiersImmo.filter(d => d.contact_ids?.includes(myContact.id));
      }
      setDossiers(myDossiers);

      // Leads liés à ce contact
      let myLeads = [];
      if (myContact) {
        myLeads = allLeads.filter(l => l.contact_id === myContact.id);
      }
      setLeads(myLeads);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const hasDossier = acquereur || dossiers.length > 0 || leads.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour {user?.full_name?.split(" ")[0] || "👋"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Votre espace acquéreur · suivi de votre projet immobilier</p>
      </div>

      {!hasDossier ? (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center space-y-3">
          <Home className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="font-semibold">Aucun dossier acquéreur</p>
          <p className="text-sm text-muted-foreground">Votre dossier sera créé par votre conseiller lors de votre premier contact.</p>
        </div>
      ) : (
        <>
          {/* Profil acquéreur */}
          {acquereur && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
              <p className="text-purple-100 text-xs uppercase tracking-wide mb-2">Votre profil acquéreur</p>
              <p className="text-xl font-bold">{acquereur.nom}</p>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-purple-200 text-xs">Budget max</p>
                  <p className="text-white font-bold">{fmt(acquereur.budget_max)}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Financement</p>
                  <p className="text-white font-bold">{acquereur.financement_valide ? "Validé ✓" : "En cours"}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Statut</p>
                  <p className="text-white font-bold capitalize">{acquereur.statut || "actif"}</p>
                </div>
              </div>
              {acquereur.localisations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/20">
                  <MapPin className="w-3.5 h-3.5 text-purple-200 mt-0.5 flex-shrink-0" />
                  {acquereur.localisations.map((l, i) => (
                    <span key={i} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{l}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/espace/acquereur/visites" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-purple-600">{leads.length}</p>
              <p className="text-xs text-muted-foreground">Leads / visites</p>
            </Link>
            <Link to="/espace/acquereur/recherche" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-600">{acquereur ? "Actif" : "—"}</p>
              <p className="text-xs text-muted-foreground">Recherche</p>
            </Link>
            <div className="bg-white rounded-2xl border border-border/50 p-4">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                <FolderOpen className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-600">{dossiers.length}</p>
              <p className="text-xs text-muted-foreground">Dossiers</p>
            </div>
            <Link to="/espace/acquereur/messages" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-amber-600">—</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </Link>
          </div>

          {/* Dossiers vente */}
          {dossiers.length > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" /> Mes dossiers en cours
              </p>
              <div className="space-y-3">
                {dossiers.map((d) => {
                  const bien = biensMap[d.bien_id];
                  const statut = STATUT_DOSSIER[d.statut] || { label: d.statut, color: "bg-secondary text-muted-foreground" };
                  // Progress bar
                  const steps = ["nouveau", "en_cours", "signe", "termine"];
                  const idx = steps.indexOf(d.statut);
                  const pct = Math.round(((idx + 1) / steps.length) * 100);
                  return (
                    <div key={d.id} className="border border-border/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{d.titre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {bien?.titre || d.bien_titre || "Bien non renseigné"}
                            {bien?.adresse && <span> · {bien.adresse}</span>}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statut.color}`}>{statut.label}</span>
                      </div>
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Avancement</span><span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {bien?.prix && (
                        <p className="text-base font-bold text-purple-700">{fmt(bien.prix)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leads / biens consultés */}
          {leads.length > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Biens suivis
                </p>
                <Link to="/espace/acquereur/visites" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {leads.slice(0, 4).map((l) => {
                  const bien = biensMap[l.bien_id];
                  return (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Home className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bien?.titre || "Bien"}</p>
                        {bien?.adresse && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{bien.adresse}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {bien?.prix && <p className="text-sm font-bold">{fmt(bien.prix)}</p>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          l.statut === "qualifie" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>{l.statut}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions rapides */}
          <div className="grid grid-cols-3 gap-3">
            <Link to="/espace/acquereur/visites" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all text-center">
              <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Mes visites</p>
            </Link>
            <Link to="/espace/acquereur/documents" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all text-center">
              <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Documents</p>
            </Link>
            <Link to="/espace/acquereur/recherche" className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all text-center">
              <Search className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Recherche</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}