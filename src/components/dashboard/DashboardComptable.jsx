import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCard, TrendingUp, AlertTriangle, FileText,
  ArrowUpRight, CheckCircle2, ArrowUp, ArrowDown, Building2,
  Brain, Zap, Loader2, RefreshCw, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitPeriodFilter, { filterByPeriod } from "./CockpitPeriodFilter";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardComptable({ user }) {
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
    const [transactions, factures, depenses, banque, paiements] = await Promise.all([
      base44.entities.Transaction.list("-created_date", 200),
      base44.entities.Facture.list("-created_date", 100),
      base44.entities.Depense.list("-created_date", 100),
      base44.entities.CompteBancaire.list("-created_date", 10),
      base44.entities.Paiement.list("-created_date", 300),
    ]);
    setRawData({ transactions, factures, depenses, banque, paiements });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const data = useMemo(() => {
    if (!rawData) return null;
    const fp = (items, field = "created_date") => filterByPeriod(items, period, customStart, customEnd, field);
    const transP = fp(rawData.transactions);
    const depP = fp(rawData.depenses);
    const factP = fp(rawData.factures);
    const paiP = fp(rawData.paiements);

    const recettes = transP.filter(t => t.statut === "paye" && t.type !== "depense").reduce((s, t) => s + (t.montant || 0), 0);
    const loyers = paiP.filter(p => p.type === "loyer" && p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
    const depensesTotal = depP.reduce((s, d) => s + (d.montant || 0), 0);
    const marge = recettes + loyers - depensesTotal;
    const impayés = rawData.paiements.filter(p => p.statut === "en_retard");
    const facturesEnAttente = factP.filter(f => f.statut === "emise");
    const anomalies = transP.filter(t => t.anomalie);
    const montantImpayés = impayés.reduce((s, p) => s + (p.montant || 0), 0);

    return {
      transactions: transP, factures: factP, depenses: depP, banque: rawData.banque,
      paiementsRetardList: impayés,
      recettes, loyers, depensesTotal, marge,
      impayés: impayés.length, montantImpayés,
      facturesEnAttente: facturesEnAttente.length,
      anomalies: anomalies.length,
      // pour CockpitActionsRapides (pas utilisé ici — comptable n'a pas accès leads)
      contacts: [], biens: [],
    };
  }, [rawData, period, customStart, customEnd]);

  const analyzeAI = async () => {
    if (!data || aiLoading) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Responsable comptabilité immobilier. Données période:
- Recettes: ${fmt(data.recettes)} | Loyers: ${fmt(data.loyers)} | Dépenses: ${fmt(data.depensesTotal)}
- Marge estimée: ${fmt(data.marge)}
- Impayés: ${data.impayés} — ${fmt(data.montantImpayés)}
- Factures en attente: ${data.facturesEnAttente}
- Anomalies: ${data.anomalies}
Génère 3 actions comptables prioritaires. Courtes et actionnables.`,
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
    { label: "Recettes", value: fmt(data.recettes + data.loyers), icon: ArrowUp, color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/comptabilite" },
    { label: "Dépenses", value: fmt(data.depensesTotal), icon: ArrowDown, color: "text-rose-600", bg: "bg-rose-50", link: "/admin/modules/comptabilite" },
    { label: "Impayés", value: `${data.impayés} — ${fmt(data.montantImpayés)}`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", link: "/admin/modules/comptabilite", alert: data.impayés > 0 },
    { label: "Marge estimée", value: fmt(data.marge), icon: TrendingUp, color: data.marge >= 0 ? "text-emerald-600" : "text-red-600", bg: data.marge >= 0 ? "bg-emerald-50" : "bg-red-50", link: "/admin/modules/comptabilite" },
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
          <Link key={i} to={k.link} className={`bg-white rounded-2xl p-5 border hover:shadow-sm transition-all group ${k.alert ? "border-red-200" : "border-border/50"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className={`text-xl font-bold leading-tight ${k.alert ? "text-red-600" : ""}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Link>
        ))}
      </div>

      {data?.anomalies > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1"><strong>{data.anomalies} anomalie(s)</strong> sur vos transactions bancaires.</p>
          <Link to="/admin/modules/comptabilite" className="text-xs text-amber-700 hover:underline font-medium whitespace-nowrap">Vérifier →</Link>
        </div>
      )}

      {/* Actions rapides comptabilité uniquement */}
      <div className="bg-white rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions rapides</p>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
          {[
            { label: "Paiements", icon: CreditCard, path: "/admin/modules/comptabilite", color: "bg-green-500" },
            { label: "Factures", icon: FileText, path: "/admin/modules/comptabilite", color: "bg-amber-500" },
            { label: "Comptes", icon: Building2, path: "/admin/modules/comptabilite", color: "bg-blue-500" },
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
            <p className="text-sm font-semibold">IA — Recommandations Comptabilité</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiActions.length ? "Actualiser" : "Analyser"}
          </Button>
        </div>
        {aiActions.length === 0 && !aiLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">Analyse IA de votre trésorerie et impayés</p>
        )}
        {aiLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>}
        {aiActions.length > 0 && !aiLoading && (
          <div className="space-y-2">
            {aiActions.map((a, i) => {
              const done = executedAI.has(i);
              return (
                <button key={i} onClick={() => { setExecutedAI(prev => new Set([...prev, i])); navigate("/admin/modules/comptabilite"); }}
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

      {/* Transactions + Banque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Dernières transactions</p>
            <Link to="/admin/modules/comptabilite" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {(data?.transactions.slice(0, 6) || []).map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === "depense" ? "bg-red-50" : "bg-green-50"}`}>
                  {t.type === "depense" ? <ArrowDown className="w-3.5 h-3.5 text-red-500" /> : <ArrowUp className="w-3.5 h-3.5 text-green-500" />}
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
            <Link to="/admin/modules/comptabilite" className="text-xs text-primary hover:underline">Gérer →</Link>
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
                <Link to="/admin/modules/comptabilite" className="text-xs text-primary hover:underline">Connecter →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}