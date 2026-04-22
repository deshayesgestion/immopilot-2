import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function CockpitKPIs({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-border/50 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Biens actifs",
      value: data.biensActifs,
      sub: `${data.biensVente} vente · ${data.biensLocation} location`,
      icon: "🏠",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      link: "/admin/modules/biens",
    },
    {
      label: "Ventes en cours",
      value: data.ventesEnCours,
      sub: `${data.ventesSigne} signées · ${data.ventesCloture} clôturées`,
      icon: "📈",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      link: "/admin/modules/vente",
    },
    {
      label: "Locations actives",
      value: data.locationsActives,
      sub: `${data.loyersAttente} loyers en attente`,
      icon: "🔑",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      link: "/admin/modules/location",
    },
    {
      label: "CA Total",
      value: fmt(data.caTotalTransactions),
      sub: `commissions: ${fmt(data.caCommissions)}`,
      icon: "💰",
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      link: "/admin/modules/comptabilite",
    },
    {
      label: "Encaissé",
      value: fmt(data.montantEncaisse),
      sub: `${data.paiementsPayes} paiements`,
      icon: "✅",
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      link: "/admin/modules/comptabilite",
    },
    {
      label: "En attente",
      value: fmt(data.montantAttente),
      sub: `${data.paiementsAttente} paiements`,
      icon: "⏳",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      link: "/admin/modules/comptabilite",
    },
    {
      label: "En retard",
      value: fmt(data.montantRetard),
      sub: `${data.paiementsRetard} impayés`,
      icon: "⚠️",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      link: "/admin/modules/comptabilite",
      alert: data.paiementsRetard > 0,
    },
    {
      label: "Bénéfice estimé",
      value: fmt(data.beneficeEstime),
      sub: `marge ~${data.tauxMarge}%`,
      icon: "📊",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      link: "/admin/modules/comptabilite",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => (
        <Link key={i} to={k.link}
          className={`bg-white rounded-2xl p-4 border hover:shadow-md transition-all group ${k.alert ? "border-red-300 bg-red-50/30" : `border-border/50`}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center text-lg`}>
              {k.icon}
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </div>
          <p className={`text-xl font-bold ${k.alert ? "text-red-600" : k.color}`}>{k.value}</p>
          <p className="text-xs font-medium text-foreground/80 mt-0.5">{k.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{k.sub}</p>
        </Link>
      ))}
    </div>
  );
}