import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  CreditCard, TrendingUp, AlertTriangle, FileText,
  ArrowUpRight, CheckCircle2, ArrowUp, ArrowDown, Building2
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardComptable({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [transactions, factures, depenses, banque] = await Promise.all([
        base44.entities.Transaction.list("-created_date", 100),
        base44.entities.Facture.list("-created_date", 50),
        base44.entities.Depense.list("-created_date", 50),
        base44.entities.CompteBancaire.list("-created_date", 10),
      ]);

      const recettes = transactions.filter(t => t.statut === "paye" && t.type !== "depense").reduce((s, t) => s + (t.montant || 0), 0);
      const depensesTotal = depenses.reduce((s, d) => s + (d.montant || 0), 0);
      const impayés = transactions.filter(t => t.statut === "en_retard");
      const facturesEnAttente = factures.filter(f => f.statut === "emise");
      const anomalies = transactions.filter(t => t.anomalie);

      setData({ transactions, factures, depenses, banque, recettes, depensesTotal, impayés, facturesEnAttente, anomalies });
      setLoading(false);
    };
    load();
  }, []);

  const kpis = data ? [
    { label: "Recettes", value: fmt(data.recettes), icon: ArrowUp, color: "text-green-600", bg: "bg-green-50", link: "/admin/comptabilite" },
    { label: "Dépenses", value: fmt(data.depensesTotal), icon: ArrowDown, color: "text-rose-600", bg: "bg-rose-50", link: "/admin/comptabilite" },
    { label: "Impayés", value: data.impayés.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", link: "/admin/comptabilite", alert: data.impayés.length > 0 },
    { label: "Factures émises", value: data.facturesEnAttente.length, icon: FileText, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/comptabilite" },
  ] : [];

  const quickActions = [
    { label: "Comptabilité", icon: CreditCard, path: "/admin/comptabilite", color: "bg-green-500" },
    { label: "Transactions", icon: TrendingUp, path: "/admin/comptabilite", color: "bg-blue-500" },
    { label: "Factures", icon: FileText, path: "/admin/comptabilite", color: "bg-amber-500" },
    { label: "Banque", icon: Building2, path: "/admin/comptabilite", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-border/50 animate-pulse h-28" />
        )) : kpis.map((k, i) => (
          <Link key={i} to={k.link} className={`bg-white rounded-2xl p-5 border hover:shadow-sm transition-all group ${k.alert ? "border-red-200" : "border-border/50"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className={`text-2xl font-bold ${k.alert ? "text-red-600" : ""}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Alerte anomalies */}
      {data?.anomalies?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{data.anomalies.length} anomalie(s)</strong> détectée(s) sur vos transactions bancaires.
          </p>
          <Link to="/admin/comptabilite" className="ml-auto text-xs text-amber-700 hover:underline font-medium whitespace-nowrap">Vérifier →</Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.path}>
            <button className="w-full bg-white border border-border/50 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                <a.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xs font-medium text-center">{a.label}</span>
            </button>
          </Link>
        ))}
      </div>

      {/* Flux financier + Factures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Dernières transactions</p>
            <Link to="/admin/comptabilite" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.transactions.slice(0, 6) || []).map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === "depense" ? "bg-red-50" : "bg-green-50"}`}>
                  {t.type === "depense"
                    ? <ArrowDown className="w-3.5 h-3.5 text-red-500" />
                    : <ArrowUp className="w-3.5 h-3.5 text-green-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.tiers_nom || t.bien_titre || "—"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.type}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === "depense" ? "text-red-600" : "text-green-600"}`}>
                  {t.type === "depense" ? "-" : "+"}{fmt(t.montant)}
                </span>
              </div>
            ))}
            {(!data || data.transactions.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Comptes bancaires</p>
            <Link to="/admin/comptabilite" className="text-xs text-primary hover:underline">Gérer →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.banque || []).map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-secondary/20 rounded-xl px-4 py-3">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.nom}</p>
                  <p className="text-xs text-muted-foreground">{b.banque}</p>
                </div>
                <span className="text-sm font-bold text-green-600">{fmt(b.solde)}</span>
              </div>
            ))}
            {(!data || data.banque.length === 0) && (
              <div className="text-center py-4">
                <Building2 className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Aucun compte connecté</p>
                <Link to="/admin/comptabilite" className="text-xs text-primary hover:underline">Connecter →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}