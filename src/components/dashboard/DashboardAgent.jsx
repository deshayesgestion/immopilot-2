import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, Users, Calendar, TrendingUp, ArrowUpRight,
  Brain, Zap, Clock, CheckCircle2, Loader2, RefreshCw, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitPeriodFilter, { filterByPeriod } from "./CockpitPeriodFilter";

export default function DashboardAgent({ user }) {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [aiActions, setAiActions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [executedAI, setExecutedAI] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const [props, leads, events, transactions] = await Promise.all([
      base44.entities.Property.filter({ agent_email: user?.email || "" }).catch(() => base44.entities.Property.list("-created_date", 50)),
      base44.entities.Lead.list("-created_date", 100),
      base44.entities.Evenement.filter({ agent_email: user?.email || "" }).catch(() => []),
      base44.entities.Transaction.list("-created_date", 50),
    ]);
    setRawData({ props, leads, events, transactions });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.email]);

  const data = useMemo(() => {
    if (!rawData) return null;
    const fp = (items, field = "created_date") => filterByPeriod(items, period, customStart, customEnd, field);
    const leadsP = fp(rawData.leads);
    const today = new Date().toISOString().slice(0, 10);
    const visitesDuJour = rawData.events.filter(e => e.date_debut?.slice(0, 10) === today && e.type === "visite");
    const newLeads = leadsP.filter(l => l.statut === "nouveau" || l.status === "nouveau");
    return { props: rawData.props, leads: leadsP, events: rawData.events, transactions: rawData.transactions, visitesDuJour, newLeads };
  }, [rawData, period, customStart, customEnd]);

  const analyzeAI = async () => {
    if (!data || aiLoading) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Agent immobilier. Données:
- Biens assignés: ${data.props.length}
- Leads: ${data.leads.length} | Nouveaux: ${data.newLeads.length}
- Visites aujourd'hui: ${data.visitesDuJour.length}
Génère 3 actions prioritaires pour l'agent. Courtes et actionnables (< 12 mots).`,
      response_json_schema: {
        type: "object",
        properties: {
          actions: { type: "array", items: { type: "object", properties: { action: { type: "string" }, raison: { type: "string" } } } }
        }
      }
    });
    setAiActions(res?.actions || []);
    setAiLoading(false);
  };

  const kpis = data ? [
    { label: "Biens assignés", value: data.props.length, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/modules/biens" },
    { label: "Leads période", value: data.leads.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/communications", alert: data.newLeads.length > 0 },
    { label: "Visites aujourd'hui", value: data.visitesDuJour.length, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/agenda" },
    { label: "Transactions", value: data.transactions.length, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/vente" },
  ] : [];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <CockpitPeriodFilter period={period} onPeriodChange={setPeriod}
          customStart={customStart} customEnd={customEnd}
          onCustomChange={(k, v) => k === "start" ? setCustomStart(v) : setCustomEnd(v)} />
        <Button variant="outline" size="sm" className="rounded-full gap-2 h-8 text-xs self-start" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* IA Actionnelle */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">IA — Mes priorités du jour</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiActions.length ? "Actualiser" : "Analyser"}
          </Button>
        </div>
        {aiActions.length === 0 && !aiLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">Cliquez "Analyser" pour vos priorités IA du jour</p>
        )}
        {aiLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>}
        {aiActions.length > 0 && !aiLoading && (
          <div className="space-y-2">
            {aiActions.map((a, i) => {
              const done = executedAI.has(i);
              return (
                <button key={i} onClick={() => { setExecutedAI(prev => new Set([...prev, i])); navigate("/admin/agenda"); }}
                  className={`w-full text-left flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all group ${done ? "border-green-200 bg-green-50 opacity-60" : "border-border/50 hover:border-primary/40 hover:bg-accent/30"}`}>
                  <span className="text-primary font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{a.action}</p>
                    <p className="text-[11px] text-muted-foreground">{a.raison}</p>
                  </div>
                  {done ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary flex-shrink-0 transition-colors" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <p className="text-sm font-semibold">Leads à traiter (période)</p>
            <Link to="/admin/communications" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.newLeads.slice(0, 5) || []).map(l => (
              <div key={l.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-xs font-semibold text-purple-600 flex-shrink-0">
                  {(l.name || l.contact_id || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{l.name || "Lead"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{l.source || "—"}</p>
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