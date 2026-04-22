import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, TrendingUp, Loader2, ArrowUpRight, CheckCircle2, FolderOpen, MapPin, KeySquare } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function ProprietaireDashboard() {
  const [user, setUser] = useState(null);
  const [biens, setBiens] = useState([]);         // entité Bien (CRM interne)
  const [properties, setProperties] = useState([]); // entité Property (portal)
  const [dossiers, setDossiers] = useState([]);   // DossierImmobilier
  const [paiements, setPaiements] = useState([]);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      const [contacts, props, biensData, dossiersImmo, paies] = await Promise.all([
        base44.entities.Contact.filter({ email: me.email }, "-created_date", 5),
        base44.entities.Property.filter({ owner_email: me.email }, "-created_date", 50),
        base44.entities.Bien.list("-created_date", 200),
        base44.entities.DossierImmobilier.list("-created_date", 200),
        base44.entities.Paiement.list("-created_date", 100),
      ]);

      const myContact = contacts[0] || null;
      setContact(myContact);
      setProperties(props);

      // Biens dont le propriétaire est ce contact
      const myBiens = myContact
        ? biensData.filter(b => b.owner_id === myContact.id)
        : [];
      setBiens(myBiens);

      // Dossiers liés : soit via contact_ids, soit via bien_id (biens du proprio)
      const bienIds = new Set(myBiens.map(b => b.id));
      const myDossiers = dossiersImmo.filter(d =>
        (myContact && d.contact_ids?.includes(myContact.id)) ||
        (d.bien_id && bienIds.has(d.bien_id))
      );
      setDossiers(myDossiers);

      // Paiements liés au contact
      const myPaies = myContact
        ? paies.filter(p => p.contact_id === myContact.id)
        : [];
      setPaiements(myPaies);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const allBiens = [...biens]; // biens CRM internes
  const allProps = properties;  // biens portail public
  const totalBiens = allBiens.length + allProps.length;

  const dossiersLocation = dossiers.filter(d => d.type === "location");
  const dossiersVente = dossiers.filter(d => d.type === "vente");

  const logementsLoues = allBiens.filter(b => b.statut === "loue").length
    + allProps.filter(p => p.status === "loue").length;

  const loyersEncaisses = paiements
    .filter(p => p.type === "loyer" && p.statut === "paye")
    .reduce((s, p) => s + (p.montant || 0), 0);

  // Revenus mensuels estimés depuis DossierLocatif lié aux propriétés du portail
  const propsIds = new Set(allProps.map(p => p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour {user?.full_name?.split(" ")[0] || "👋"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Votre espace propriétaire · {totalBiens} bien{totalBiens > 1 ? "s" : ""}
        </p>
      </div>

      {totalBiens === 0 && dossiers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center space-y-3">
          <Home className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="font-semibold">Aucun bien associé</p>
          <p className="text-sm text-muted-foreground">Votre agence associera vos biens à votre compte prochainement.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Biens", value: totalBiens, icon: Home, color: "text-blue-600", bg: "bg-blue-50", to: "/espace/proprietaire/biens" },
              { label: "Loués", value: logementsLoues, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", to: "/espace/proprietaire/biens" },
              { label: "Encaissé", value: fmt(loyersEncaisses), icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50", to: "/espace/proprietaire/revenus" },
              { label: "Dossiers actifs", value: dossiers.filter(d => d.statut === "en_cours" || d.statut === "nouveau").length, icon: FolderOpen, color: "text-purple-600", bg: "bg-purple-50", to: "/espace/proprietaire/documents" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.label} to={s.to} className="bg-white rounded-2xl border border-border/50 p-4 hover:shadow-sm transition-all">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </Link>
              );
            })}
          </div>

          {/* Biens (entité Bien CRM) */}
          {allBiens.length > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <KeySquare className="w-4 h-4 text-emerald-600" /> Mes biens en gestion
                </p>
                <Link to="/espace/proprietaire/biens" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {allBiens.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.titre}</p>
                      {b.adresse && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{b.adresse}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {b.prix && <p className="text-sm font-bold">{fmt(b.prix)}{b.type === "location" ? "/m" : ""}</p>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.statut === "loue" ? "bg-green-100 text-green-700" : b.statut === "vendu" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                        {b.statut === "loue" ? "Loué" : b.statut === "vendu" ? "Vendu" : b.statut === "disponible" ? "Disponible" : b.statut || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biens portail public */}
          {allProps.length > 0 && allBiens.length === 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Mes biens</p>
                <Link to="/espace/proprietaire/biens" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Voir tout <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {allProps.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.city} · {p.surface}m²</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{fmt(p.price)}{p.transaction === "location" ? "/m" : ""}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "loue" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {p.status === "loue" ? "Loué" : p.status || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dossiers actifs */}
          {dossiers.length > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" /> Mes dossiers immobiliers
              </p>
              <div className="space-y-2">
                {dossiers.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${d.type === "location" ? "bg-emerald-50" : "bg-blue-50"}`}>
                      {d.type === "location"
                        ? <KeySquare className="w-4 h-4 text-emerald-600" />
                        : <TrendingUp className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.titre}</p>
                      <p className="text-xs text-muted-foreground">{d.bien_titre || "—"} · {d.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.statut === "signe" ? "bg-green-100 text-green-700"
                      : d.statut === "en_cours" ? "bg-blue-100 text-blue-700"
                      : d.statut === "termine" ? "bg-slate-100 text-slate-600"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                      {d.statut === "signe" ? "Signé" : d.statut === "en_cours" ? "En cours" : d.statut === "termine" ? "Terminé" : "Nouveau"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aperçu revenus */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Revenus encaissés
              </p>
              <Link to="/espace/proprietaire/revenus" className="text-xs text-primary hover:underline flex items-center gap-1">
                Détails <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{fmt(loyersEncaisses)}</p>
                <p className="text-xs text-muted-foreground">Total encaissé</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-600">
                  {paiements.filter(p => p.statut === "en_attente").length}
                </p>
                <p className="text-xs text-muted-foreground">Paiements en attente</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}