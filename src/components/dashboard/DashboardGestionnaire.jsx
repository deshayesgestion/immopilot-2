import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Home, CreditCard, AlertTriangle, Clock, CheckCircle2,
  ArrowUpRight, FileText, Settings, Bell
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardGestionnaire({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [dossiers, tickets, transactions] = await Promise.all([
        base44.entities.DossierLocatif?.list?.("-created_date", 100).catch(() => []) || Promise.resolve([]),
        base44.entities.TicketIA.list("-created_date", 30),
        base44.entities.Transaction.filter({ type: "loyer" }).catch(() => []),
      ]);

      const impayés = transactions.filter(t => t.statut === "en_retard");
      const enAttente = transactions.filter(t => t.statut === "en_attente");
      const payés = transactions.filter(t => t.statut === "paye");
      const incidentsOuverts = tickets.filter(t => t.module === "location" && t.statut !== "resolu");
      const urgents = incidentsOuverts.filter(t => t.priorite === "urgent");

      setData({ dossiers, tickets, transactions, impayés, enAttente, payés, incidentsOuverts, urgents });
      setLoading(false);
    };
    load();
  }, []);

  const kpis = data ? [
    { label: "Dossiers actifs", value: data.dossiers.length, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/suivi" },
    { label: "Loyers en retard", value: data.impayés.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", link: "/admin/suivi", alert: data.impayés.length > 0 },
    { label: "Incidents ouverts", value: data.incidentsOuverts.length, icon: Bell, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/suivi", alert: data.urgents.length > 0 },
    { label: "Loyers reçus", value: data.payés.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", link: "/admin/suivi" },
  ] : [];

  const quickActions = [
    { label: "Module suivi", icon: Home, path: "/admin/suivi", color: "bg-blue-500" },
    { label: "Incidents", icon: AlertTriangle, path: "/admin/suivi", color: "bg-amber-500" },
    { label: "Sortie locataire", icon: Settings, path: "/admin/sortie", color: "bg-rose-500" },
    { label: "Documents", icon: FileText, path: "/admin/suivi", color: "bg-green-500" },
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

      {/* Alertes urgentes */}
      {data?.urgents?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-700">{data.urgents.length} incident(s) urgent(s)</p>
          </div>
          <div className="space-y-2">
            {data.urgents.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-red-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.appelant_nom || "Locataire"}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.resume_ia || t.description || "Incident urgent"}</p>
                </div>
                <Link to="/admin/suivi">
                  <span className="text-xs text-red-600 hover:underline">Traiter →</span>
                </Link>
              </div>
            ))}
          </div>
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

      {/* Loyers + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Suivi des loyers</p>
            <Link to="/admin/suivi" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {[
              { label: "Payés", count: data?.payés.length || 0, color: "bg-green-50 text-green-700", dot: "bg-green-500" },
              { label: "En attente", count: data?.enAttente.length || 0, color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
              { label: "En retard", count: data?.impayés.length || 0, color: "bg-red-50 text-red-700", dot: "bg-red-500" },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 ${row.color}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${row.dot}`} />
                  <span className="text-sm font-medium">{row.label}</span>
                </div>
                <span className="text-lg font-bold">{loading ? "—" : row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Incidents récents</p>
            <Link to="/admin/suivi" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.incidentsOuverts.slice(0, 5) || []).map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priorite === "urgent" ? "bg-red-500" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.appelant_nom || "Locataire"}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.resume_ia || t.type_demande}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.priorite === "urgent" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                  {t.priorite}
                </span>
              </div>
            ))}
            {(!data || data.incidentsOuverts.length === 0) && (
              <div className="flex flex-col items-center py-4 gap-1">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <p className="text-xs text-muted-foreground">Aucun incident ouvert</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}