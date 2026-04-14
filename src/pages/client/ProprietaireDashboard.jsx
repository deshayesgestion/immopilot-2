import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, TrendingUp, Loader2, ArrowUpRight, CheckCircle2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function ProprietaireDashboard() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [props, dos] = await Promise.all([
        base44.entities.Property.filter({ owner_email: me.email }, "-created_date", 50),
        base44.entities.DossierLocatif.list("-created_date", 100),
      ]);
      setProperties(props);
      setDossiers(dos.filter(d => props.some(p => p.id === d.property_id)));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const totalLoyer = dossiers.reduce((sum, d) => sum + (d.loyer || 0), 0);
  const totalCharges = dossiers.reduce((sum, d) => sum + (d.charges || 0), 0);
  const nbLoues = properties.filter(p => p.status === "loue").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour {user?.full_name?.split(" ")[0] || "👋"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Votre espace propriétaire · {properties.length} bien{properties.length > 1 ? "s" : ""}</p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
          <Home className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold">Aucun bien associé</p>
          <p className="text-sm text-muted-foreground mt-1">Votre email sera lié automatiquement à vos biens par votre agence.</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Biens", value: properties.length, icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Loués", value: nbLoues, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
              { label: "Revenus mensuels", value: fmt(totalLoyer + totalCharges), icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Dossiers actifs", value: dossiers.filter(d => d.statut === "en_cours").length, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Biens */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Mes biens</p>
              <Link to="/espace/proprietaire/biens" className="text-xs text-primary hover:underline flex items-center gap-1">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {properties.slice(0, 5).map((p) => (
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
                      {p.status === "loue" ? "Loué" : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenus récents */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Aperçu revenus
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{fmt(totalLoyer)}</p>
                <p className="text-xs text-muted-foreground">Loyers / mois</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-600">{fmt(totalCharges)}</p>
                <p className="text-xs text-muted-foreground">Charges / mois</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}