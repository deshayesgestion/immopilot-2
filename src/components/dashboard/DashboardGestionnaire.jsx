import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, CreditCard, AlertTriangle, Bell, ArrowUpRight,
  Brain, Zap, CheckCircle2, Settings, FileText, Loader2, RefreshCw, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitPeriodFilter, { filterByPeriod } from "./CockpitPeriodFilter";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardGestionnaire({ user }) {
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
    const [dossiers, tickets, paiements] = await Promise.all([
      base44.entities.DossierImmobilier.filter({ type: "location" }).catch(() => []),
      base44.entities.TicketIA.list("-created_date", 100),
      base44.entities.Paiement.filter({ type: "loyer" }),
    ]);
    setRawData({ dossiers, tickets, paiements });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const data = useMemo(() => {
    if (!rawData) return null;
    const fp = (items, field = "created_date") => filterByPeriod(items, period, customStart, customEnd, field);
    const paiP = fp(rawData.paiements);
    const tickP = fp(rawData.tickets);

    // Impayés = all time (pas filtré)
    const impayés = rawData.paiements.filter(p => p.statut === "en_retard");
    const enAttente = paiP.filter(p => p.statut === "en_attente");
    const payés = paiP.filter(p => p.statut === "paye");
    const incidentsOuverts = tickP.filter(t => t.module === "location" && t.statut !== "resolu");
    const urgents = incidentsOuverts.filter(t => t.priorite === "urgent");

    return {
      dossiers: rawData.dossiers, tickets: tickP, paiements: paiP,
      impayés, enAttente, payés, incidentsOuverts, urgents,
      paiementsRetardList: impayés, contacts: [], biens: [],
    };
  }, [rawData, period, customStart, customEnd]);

  const analyzeAI = async () => {
    if (!data || aiLoading) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Gestionnaire location immobilier. Données:
- Dossiers actifs: ${data.dossiers.length}
- Loyers en retard: ${data.impayés.length}
- Incidents ouverts: ${data.incidentsOuverts.length} dont ${data.urgents.length} urgents
- Loyers payés cette période: ${data.payés.length}
Génère 3 actions prioritaires pour améliorer la gestion. Courtes et actionnables.`,
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
    { label: "Dossiers actifs", value: data.dossiers.length, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/modules/location" },
    { label: "Loyers en retard", value: data.impayés.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", link: "/admin/modules/location", alert: data.impayés.length > 0 },
    { label: "Incidents ouverts", value: data.incidentsOuverts.length, icon: Bell, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/parametres/accueil-ia", alert: data.urgents.length > 0 },
    { label: "Loyers reçus", value: data.payés.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/comptabilite" },
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
                <Link to="/admin/parametres/accueil-ia">
                  <span className="text-xs text-red-600 hover:underline">Traiter →</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions rapides</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Suivi location", icon: Home, path: "/admin/modules/location", color: "bg-blue-500" },
            { label: "Incidents", icon: AlertTriangle, path: "/admin/parametres/accueil-ia", color: "bg-amber-500" },
            { label: "Sortie locataire", icon: Settings, path: "/admin/modules/location", color: "bg-rose-500" },
            { label: "Documents", icon: FileText, path: "/admin/modules/location", color: "bg-green-500" },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <Link key={i} to={a.path}>
                <button className="w-full flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-secondary/40 transition-all group">
                  <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-center">{a.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* IA Actionnelle */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">IA — Recommandations Gestion</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiActions.length ? "Actualiser" : "Analyser"}
          </Button>
        </div>
        {aiActions.length === 0 && !aiLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">Cliquez "Analyser" pour des recommandations IA</p>
        )}
        {aiLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>}
        {aiActions.length > 0 && !aiLoading && (
          <div className="space-y-2">
            {aiActions.map((a, i) => {
              const done = executedAI.has(i);
              return (
                <button key={i} onClick={() => { setExecutedAI(prev => new Set([...prev, i])); navigate("/admin/modules/location"); }}
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

      {/* Loyers + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Suivi des loyers (période)</p>
            <Link to="/admin/modules/location" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {[
              { label: "Payés", count: data?.payés.length || 0, color: "bg-green-50 text-green-700", dot: "bg-green-500" },
              { label: "En attente", count: data?.enAttente.length || 0, color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
              { label: "En retard", count: data?.impayés.length || 0, color: "bg-red-50 text-red-700", dot: "bg-red-500" },
            ].map(row => (
              <div key={row.label} className={`flex items-center justify-between rounded-xl px-4 py-3 ${row.color}`}>
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
            <Link to="/admin/parametres/accueil-ia" className="text-xs text-primary hover:underline">Voir tout →</Link>
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