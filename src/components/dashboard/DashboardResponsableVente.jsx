import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, Home, Users, CheckCircle2, ArrowUpRight,
  Brain, Zap, Loader2, RefreshCw, ArrowRight, AlertTriangle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitPeriodFilter, { filterByPeriod } from "./CockpitPeriodFilter";
import CockpitActionsRapides from "./CockpitActionsRapides";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const LEAD_STATUT_COLORS = {
  nouveau: "bg-blue-100 text-blue-700",
  contacte: "bg-amber-100 text-amber-700",
  qualifie: "bg-green-100 text-green-700",
  perdu: "bg-gray-100 text-gray-500",
};

export default function DashboardResponsableVente({ user }) {
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
    const [biens, leads, contacts, transactions, dossiers] = await Promise.all([
      base44.entities.Bien.filter({ type: "vente" }),
      base44.entities.Lead.list("-created_date", 300),
      base44.entities.Contact.list("-created_date", 300),
      base44.entities.Transaction.filter({ type: "vente" }),
      base44.entities.DossierImmobilier.filter({ type: "vente" }),
    ]);
    setRawData({ biens, leads, contacts, transactions, dossiers });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const data = useMemo(() => {
    if (!rawData) return null;
    const fp = (items, field = "created_date") => filterByPeriod(items, period, customStart, customEnd, field);
    const leadsP = fp(rawData.leads);
    const transP = fp(rawData.transactions);
    const dossP = fp(rawData.dossiers);
    const biens = rawData.biens;
    const contacts = rawData.contacts;

    const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
    const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

    const leadsNouveaux = leadsP.filter(l => l.statut === "nouveau");
    const leadsQualifies = leadsP.filter(l => l.statut === "qualifie");
    const tauxConversion = leadsP.length > 0 ? Math.round((leadsQualifies.length / leadsP.length) * 100) : 0;
    const ventesSign = transP.filter(t => ["signe", "cloture"].includes(t.statut));
    const caVente = ventesSign.reduce((s, t) => s + (t.commission || t.prix || 0), 0);
    const biensDisponibles = biens.filter(b => b.statut === "disponible");

    return {
      biens, leads: leadsP, contacts, transactions: transP, dossiers: dossP,
      bienMap, contactMap,
      leadsNouveaux, leadsQualifies, tauxConversion,
      ventesSign: ventesSign.length, caVente,
      biensDisponibles: biensDisponibles.length,
      totalLeads: leadsP.length,
      paiementsRetardList: [],
    };
  }, [rawData, period, customStart, customEnd]);

  const analyzeAI = async () => {
    if (!data || aiLoading) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Responsable vente immobilier. Données période sélectionnée:
- Biens en vente disponibles: ${data.biensDisponibles}
- Leads total: ${data.totalLeads} | Nouveaux: ${data.leadsNouveaux.length} | Qualifiés: ${data.leadsQualifies.length}
- Taux conversion: ${data.tauxConversion}%
- Ventes signées/clôturées: ${data.ventesSign}
- CA vente: ${fmt(data.caVente)}
Génère 3 actions concrètes prioritaires pour améliorer les performances vente. Chaque action doit être courte (< 15 mots) et actionnable immédiatement.`,
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
    { label: "Biens disponibles", value: data.biensDisponibles, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/modules/vente" },
    { label: "Leads période", value: data.totalLeads, icon: Users, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/modules/vente" },
    { label: "Taux conversion", value: `${data.tauxConversion}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/vente" },
    { label: "CA Vente", value: fmt(data.caVente), icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/modules/vente" },
  ] : [];

  return (
    <div className="space-y-4 max-w-6xl">
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
          <Link key={i} to={k.link} className="bg-white rounded-2xl p-5 border border-border/50 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Actions rapides */}
      {!loading && data && <CockpitActionsRapides data={data} onRefresh={load} />}

      {/* IA Actionnelle */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">IA — Recommandations Vente</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiActions.length ? "Actualiser" : "Analyser"}
          </Button>
        </div>
        {aiActions.length === 0 && !aiLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">Cliquez "Analyser" pour obtenir des recommandations IA personnalisées</p>
        )}
        {aiLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>}
        {aiActions.length > 0 && !aiLoading && (
          <div className="space-y-2">
            {aiActions.map((a, i) => {
              const done = executedAI.has(i);
              return (
                <button key={i} onClick={() => { setExecutedAI(prev => new Set([...prev, i])); navigate("/admin/modules/vente"); }}
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

      {/* Pipeline leads + Biens actifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Pipeline Leads</p>
            <Link to="/admin/modules/vente" className="text-xs text-primary hover:underline">Pipeline complet →</Link>
          </div>
          <div className="space-y-2">
            {["nouveau", "contacte", "qualifie", "perdu"].map(statut => {
              const count = (data?.leads || []).filter(l => l.statut === statut).length;
              return (
                <div key={statut} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${LEAD_STATUT_COLORS[statut]}`}>
                  <span className="text-xs font-medium capitalize">{statut}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Biens à vendre</p>
            <Link to="/admin/modules/vente" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {(rawData?.biens.slice(0, 5) || []).map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Home className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{b.titre}</p>
                  <p className="text-[11px] text-muted-foreground">{b.prix ? fmt(b.prix) : "—"}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.statut === "disponible" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {b.statut}
                </span>
              </div>
            ))}
            {(!rawData || rawData.biens.length === 0) && <p className="text-xs text-muted-foreground text-center py-4">Aucun bien en vente</p>}
          </div>
        </div>
      </div>
    </div>
  );
}