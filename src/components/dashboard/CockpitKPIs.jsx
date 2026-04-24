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

  const KPI_SECTIONS = [
    {
      title: "🌍 Global",
      color: "border-l-slate-400",
      items: [
        { label: "CA Total Global", value: fmt(data.caTotalGlobal||data.caTotalTransactions), sub: `${data.totalDossiers||0} dossiers · ${data.tauxConversion||0}% conv.`, icon: "💰", color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/comptabilite" },
        { label: "Bénéfice estimé", value: fmt(data.beneficeEstime), sub: `marge ~${data.tauxMarge}%`, icon: "📊", color: "text-indigo-600", bg: "bg-indigo-50", link: "/admin/modules/comptabilite" },
      ]
    },
    {
      title: "🔑 Location",
      color: "border-l-emerald-400",
      items: [
        { label: "Dossiers locatifs", value: data.dossiersLocatifsActifs??data.locationsActives, sub: `${data.loyersAttente||0} loyers en attente`, icon: "🔑", color: "text-emerald-600", bg: "bg-emerald-50", link: "/admin/modules/location" },
        { label: "Loyers encaissés", value: fmt(data.loyersEncaisses||data.caLocation), sub: `quittances payées`, icon: "✅", color: "text-teal-600", bg: "bg-teal-50", link: "/admin/modules/location" },
        { label: "Impayés", value: fmt(data.impayesMontant||data.montantRetard), sub: `${data.impayesCount||data.paiementsRetard||0} en retard`, icon: "⚠️", color: "text-red-600", bg: "bg-red-50", link: "/admin/modules/location", alert: (data.impayesCount||data.paiementsRetard||0) > 0 },
      ]
    },
    {
      title: "📈 Vente",
      color: "border-l-purple-400",
      items: [
        { label: "Mandats actifs", value: data.mandatsActifs??data.biensVente, sub: `${data.mandatsSignes||data.ventesSigne||0} signés`, icon: "📝", color: "text-purple-600", bg: "bg-purple-50", link: "/admin/modules/vente" },
        { label: "Ventes en cours", value: data.acquereursPipeline??data.ventesEnCours, sub: `${data.ventesFinalisees||data.ventesCloture||0} clôturées`, icon: "📈", color: "text-violet-600", bg: "bg-violet-50", link: "/admin/modules/vente" },
        { label: "Commissions vente", value: fmt(data.caCommissions), sub: `sur ${fmt(data.caTotalTransactions)}`, icon: "💵", color: "text-fuchsia-600", bg: "bg-fuchsia-50", link: "/admin/modules/vente" },
      ]
    },
    {
      title: "🏦 Compta",
      color: "border-l-blue-400",
      items: [
        { label: "Biens actifs", value: data.biensActifs, sub: `${data.biensVente} vente · ${data.biensLocation} loc.`, icon: "🏠", color: "text-blue-600", bg: "bg-blue-50", link: "/admin/modules/biens" },
        { label: "Encaissé", value: fmt(data.montantEncaisse), sub: `${data.paiementsPayes||0} paiements`, icon: "💳", color: "text-sky-600", bg: "bg-sky-50", link: "/admin/modules/comptabilite" },
        { label: "En attente", value: fmt(data.montantAttente), sub: `${data.paiementsAttente||0} paiements`, icon: "⏳", color: "text-amber-600", bg: "bg-amber-50", link: "/admin/modules/comptabilite" },
      ]
    },
  ];

  return (
    <div className="space-y-3">
      {KPI_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{section.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            {section.items.map((k, i) => (
              <Link key={i} to={k.link}
                className={`bg-white rounded-2xl p-4 border hover:shadow-md transition-all group ${k.alert ? "border-red-300 bg-red-50/30" : "border-border/50"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center text-lg`}>{k.icon}</div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
                <p className={`text-xl font-bold ${k.alert ? "text-red-600" : k.color}`}>{k.value}</p>
                <p className="text-xs font-medium text-foreground/80 mt-0.5">{k.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{k.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}