import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Home, Users, TrendingUp, CreditCard, AlertTriangle, ArrowUpRight,
  Brain, CheckCircle2, Clock, Plus, Mail, Calendar, FileText, Zap,
  KeySquare, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG = {
  vente: { label: "Vente", className: "bg-blue-100 text-blue-700", icon: TrendingUp },
  location: { label: "Location", className: "bg-emerald-100 text-emerald-700", icon: KeySquare },
};

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardAdmin({ agency }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [props, leads, transactions, dossiers, tickets, biens] = await Promise.all([
        base44.entities.Property.list("-created_date", 100),
        base44.entities.Lead.list("-created_date", 50),
        base44.entities.Transaction.list("-created_date", 100),
        base44.entities.Dossier?.list?.("-created_date", 50).catch(() => []) || Promise.resolve([]),
        base44.entities.TicketIA.list("-created_date", 20),
        base44.entities.Bien.list("-created_date", 8),
      ]);

      const ca = transactions.filter(t => t.statut === "paye").reduce((s, t) => s + (t.montant || 0), 0);
      const impayés = transactions.filter(t => t.statut === "en_retard").length;
      const propsLoues = props.filter(p => p.status === "loue").length;
      const propsVendus = props.filter(p => p.status === "vendu").length;
      const ticketsUrgents = tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length;

      setData({ props, leads, transactions, dossiers, tickets, biens, ca, impayés, propsLoues, propsVendus, ticketsUrgents });
      setLoading(false);
    };
    load();
  }, []);

  const generateInsights = async () => {
    if (!data || loadingAI) return;
    setLoadingAI(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse ces données d'agence immobilière et génère 3 alertes/recommandations courtes (max 15 mots chacune) en JSON:
      - Biens: ${data.props.length} (${data.propsLoues} loués, ${data.propsVendus} vendus)
      - Leads: ${data.leads.length} dont ${data.leads.filter(l => l.status === "nouveau").length} nouveaux
      - CA total: ${data.ca}€
      - Impayés: ${data.impayés} transactions
      - Tickets urgents: ${data.ticketsUrgents}
      Réponds en JSON: {"insights": [{"type":"alerte|info|opportunite","message":"...","priority":"critique|important|info"}]}`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                message: { type: "string" },
                priority: { type: "string" }
              }
            }
          }
        }
      }
    });
    setAiInsights(res?.insights || []);
    setLoadingAI(false);
  };

  useEffect(() => {
    if (data && !loading) generateInsights();
  }, [loading]);

  const kpis = data ? [
    { label: "Chiffre d'affaires", value: fmt(data.ca), icon: CreditCard, color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/comptabilite" },
    { label: "Biens actifs", value: data.props.filter(p => p.status === "disponible").length, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/modules/biens" },
    { label: "Leads en cours", value: data.leads.filter(l => ["nouveau","en_cours"].includes(l.status)).length, icon: Users, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/modules/vente" },
    { label: "Impayés", value: data.impayés, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", link: "/admin/modules/comptabilite", alert: data.impayés > 0 },
  ] : [];

  const quickActions = [
    { label: "Créer un bien", icon: Home, path: "/admin/modules/biens", color: "bg-blue-500" },
    { label: "Nouveau ticket", icon: FileText, path: "/admin/parametres/accueil-ia", color: "bg-amber-500" },
    { label: "Utilisateurs", icon: Users, path: "/admin/utilisateurs", color: "bg-purple-500" },
    { label: "Agenda", icon: Calendar, path: "/admin/agenda", color: "bg-green-500" },
  ];

  const priorityColors = { critique: "bg-red-50 border-red-200 text-red-700", important: "bg-amber-50 border-amber-200 text-amber-700", info: "bg-blue-50 border-blue-200 text-blue-700" };
  const priorityIcons = { critique: "🔴", important: "🟡", info: "🔵" };

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

      {/* AI Insights */}
      {(aiInsights.length > 0 || loadingAI) && (
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold">Analyse IA</p>
            {loadingAI && <span className="text-xs text-muted-foreground animate-pulse">Analyse en cours…</span>}
          </div>
          {!loadingAI && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {aiInsights.map((ins, i) => (
                <div key={i} className={`rounded-xl border px-4 py-3 text-sm ${priorityColors[ins.priority] || priorityColors.info}`}>
                  <span className="mr-1.5">{priorityIcons[ins.priority] || "🔵"}</span>
                  {ins.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.path}>
            <button className="w-full bg-white border border-border/50 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                <a.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xs font-medium text-center">{a.label}</span>
            </button>
          </Link>
        ))}
      </div>

      {/* Biens récents avec indicateur de type */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Biens récents</p>
          <div className="flex gap-2">
            <Link to="/admin/modules/vente" className="text-xs text-blue-600 hover:underline">Vente →</Link>
            <Link to="/admin/modules/location" className="text-xs text-emerald-600 hover:underline">Location →</Link>
          </div>
        </div>
        {(!data || data.biens.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun bien</p>
        ) : (
          <div className="divide-y divide-border/30">
            {(data?.biens || []).map(b => {
              const tc = TYPE_CONFIG[b.type];
              const TIcon = tc?.icon;
              return (
                <div key={b.id} className="flex items-center gap-3 py-2.5">
                  <div className="p-1.5 bg-secondary rounded-lg flex-shrink-0">
                    <Home className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.titre}</p>
                    {b.adresse && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{b.adresse}</p>}
                  </div>
                  {b.prix && <span className="text-xs font-semibold whitespace-nowrap">{b.prix.toLocaleString("fr-FR")} €</span>}
                  {tc && (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tc.className}`}>
                      {TIcon && <TIcon className="w-3 h-3" />}{tc.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leads + Tickets urgents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Leads récents</p>
            <Link to="/admin/communications" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.leads.slice(0, 5) || []).map(l => (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {l.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{l.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                </div>
                <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full capitalize">{l.status}</span>
              </div>
            ))}
            {(!data || data.leads.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucun lead</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Tickets urgents</p>
            <Link to="/admin/parametres/accueil-ia" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").slice(0, 5) || []).map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.appelant_nom || "Inconnu"}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.resume_ia || t.type_demande}</p>
                </div>
              </div>
            ))}
            {(!data || data.tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length === 0) && (
              <div className="flex flex-col items-center py-4 gap-1">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <p className="text-xs text-muted-foreground">Aucun ticket urgent</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}