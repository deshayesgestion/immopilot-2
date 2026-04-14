import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Home, Users, Calendar, TrendingUp, ArrowUpRight, Plus,
  Brain, Eye, Phone, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardAgent({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiTips, setAiTips] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [props, leads, events, transactions] = await Promise.all([
        base44.entities.Property.filter({ agent_email: user?.email || "" }).catch(() => base44.entities.Property.list("-created_date", 50)),
        base44.entities.Lead.list("-created_date", 50),
        base44.entities.Evenement.filter({ agent_email: user?.email || "" }).catch(() => []),
        base44.entities.TransactionVente.list("-created_date", 30),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const visitesDuJour = events.filter(e => e.date_debut?.slice(0, 10) === today && e.type === "visite");
      const newLeads = leads.filter(l => l.status === "nouveau");

      setData({ props, leads, events, transactions, visitesDuJour, newLeads });
      setLoading(false);

      // AI tips
      if (newLeads.length > 0 || props.length > 0) {
        base44.integrations.Core.InvokeLLM({
          prompt: `Agent immobilier avec ${newLeads.length} nouveaux leads, ${visitesDuJour.length} visites aujourd'hui, ${props.length} biens. Génère 2 suggestions d'action courtes (max 12 mots) en JSON.`,
          response_json_schema: {
            type: "object",
            properties: {
              tips: { type: "array", items: { type: "object", properties: { message: { type: "string" }, icon: { type: "string" } } } }
            }
          }
        }).then(r => setAiTips(r?.tips || [])).catch(() => {});
      }
    };
    load();
  }, [user?.email]);

  const kpis = data ? [
    { label: "Biens assignés", value: data.props.length, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/location" },
    { label: "Leads à traiter", value: data.newLeads.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/communications", alert: data.newLeads.length > 0 },
    { label: "Visites aujourd'hui", value: data.visitesDuJour.length, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/agenda" },
    { label: "Transactions", value: data.transactions.length, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", link: "/admin/vente/transactions" },
  ] : [];

  const quickActions = [
    { label: "Nouveau bien", icon: Home, path: "/admin/location", color: "bg-blue-500" },
    { label: "Planifier visite", icon: Calendar, path: "/admin/agenda", color: "bg-amber-500" },
    { label: "Relancer lead", icon: Phone, path: "/admin/communications", color: "bg-purple-500" },
    { label: "Voir pipeline", icon: TrendingUp, path: "/admin/vente/transactions", color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-border/50 animate-pulse h-28" />
        )) : kpis.map((k, i) => (
          <Link key={i} to={k.link} className={`bg-white rounded-2xl p-5 border hover:shadow-sm transition-all group ${k.alert ? "border-amber-200" : "border-border/50"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className={`text-2xl font-bold ${k.alert ? "text-amber-600" : ""}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* AI Tips */}
      {aiTips.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-accent rounded-2xl border border-primary/15 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Suggestions IA pour vous</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiTips.map((tip, i) => (
              <span key={i} className="text-xs bg-white border border-primary/20 text-foreground rounded-full px-3 py-1.5">
                💡 {tip.message}
              </span>
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

      {/* Visites du jour + Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Visites du jour</p>
            <Link to="/admin/agenda" className="text-xs text-primary hover:underline">Agenda →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.visitesDuJour || []).map(v => (
              <div key={v.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.titre}</p>
                  <p className="text-xs text-muted-foreground">{v.lieu || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{v.date_debut?.slice(11, 16)}</span>
              </div>
            ))}
            {(!data || data.visitesDuJour.length === 0) && (
              <div className="text-center py-4">
                <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Aucune visite aujourd'hui</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Leads à traiter</p>
            <Link to="/admin/communications" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.newLeads.slice(0, 5) || []).map(l => (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-xs font-semibold text-purple-600 flex-shrink-0">
                  {l.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{l.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{l.type}</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Nouveau</span>
              </div>
            ))}
            {(!data || data.newLeads.length === 0) && (
              <div className="flex flex-col items-center py-4 gap-1">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <p className="text-xs text-muted-foreground">Tous les leads traités</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}