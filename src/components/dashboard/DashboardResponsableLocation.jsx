import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import {
  KeySquare, Home, Euro, AlertTriangle, ArrowUpRight,
  Brain, Zap, Loader2, RefreshCw, CheckCircle2, ArrowRight, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitPeriodFilter, { filterByPeriod } from "./CockpitPeriodFilter";
import CockpitActionsRapides from "./CockpitActionsRapides";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardResponsableLocation({ user }) {
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
    const [biens, paiements, contacts, dossiers] = await Promise.all([
      base44.entities.Bien.filter({ type: "location" }),
      base44.entities.Paiement.filter({ type: "loyer" }),
      base44.entities.Contact.filter({ type: "locataire" }).catch(() => base44.entities.Contact.list("-created_date", 100)),
      base44.entities.DossierImmobilier.filter({ type: "location" }),
    ]);
    setRawData({ biens, paiements, contacts, dossiers });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const data = useMemo(() => {
    if (!rawData) return null;
    const fp = (items, field = "created_date") => filterByPeriod(items, period, customStart, customEnd, field);
    const paiementsP = fp(rawData.paiements, "created_date");
    const dossP = fp(rawData.dossiers);

    const payes = paiementsP.filter(p => p.statut === "paye");
    const enAttente = paiementsP.filter(p => p.statut === "en_attente");
    // Retards = all time (pas filtré par période)
    const enRetard = rawData.paiements.filter(p => p.statut === "en_retard");
    const montantEncaisse = payes.reduce((s, p) => s + (p.montant || 0), 0);
    const montantRetard = enRetard.reduce((s, p) => s + (p.montant || 0), 0);
    const biensLoues = rawData.biens.filter(b => b.statut === "loue").length;
    const biensDisponibles = rawData.biens.filter(b => b.statut === "disponible").length;
    const tauxOccupation = rawData.biens.length > 0 ? Math.round((biensLoues / rawData.biens.length) * 100) : 0;

    return {
      biens: rawData.biens, contacts: rawData.contacts,
      paiements: paiementsP, paiementsRetardList: enRetard, dossiers: dossP,
      payes: payes.length, enAttente: enAttente.length, enRetard: enRetard.length,
      montantEncaisse, montantRetard,
      biensLoues, biensDisponibles, tauxOccupation,
      totalBiens: rawData.biens.length,
    };
  }, [rawData, period, customStart, customEnd]);

  const analyzeAI = async () => {
    if (!data || aiLoading) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Responsable location immobilier. Données:
- Biens total: ${data.totalBiens} | Loués: ${data.biensLoues} | Disponibles: ${data.biensDisponibles}
- Taux d'occupation: ${data.tauxOccupation}%
- Loyers encaissés: ${fmt(data.montantEncaisse)} (${data.payes} paiements)
- En retard: ${data.enRetard} loyers — ${fmt(data.montantRetard)}
- Dossiers: ${data.dossiers.length}
Génère 3 actions prioritaires pour améliorer la gestion locative. Courtes et actionnables.`,
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
    { label: "Biens en location", value: data.totalBiens, icon: Home, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/modules/location" },
    { label: "Taux occupation", value: `${data.tauxOccupation}%`, icon: KeySquare, color: "text-green-600", bg: "bg-green-50", link: "/admin/modules/location" },
    { label: "Impayés actifs", value: data.enRetard, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", link: "/admin/modules/location", alert: data.enRetard > 0 },
    { label: "Loyers encaissés", value: fmt(data.montantEncaisse), icon: Euro, color: "text-emerald-600", bg: "bg-emerald-50", link: "/admin/modules/comptabilite" },
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
            <p className={`text-2xl font-bold ${k.alert ? "text-red-600" : ""}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Alerte impayés */}
      {data?.enRetard > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            <strong>{data.enRetard} loyer(s) en retard</strong> — {fmt(data.montantRetard)} à recouvrer
          </p>
          <Link to="/admin/modules/location" className="text-xs text-red-700 font-medium hover:underline whitespace-nowrap">Gérer →</Link>
        </div>
      )}

      {/* Actions rapides */}
      {!loading && data && <CockpitActionsRapides data={data} onRefresh={load} />}

      {/* IA Actionnelle */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">IA — Recommandations Location</p>
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

      {/* Suivi loyers + Locataires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Suivi des loyers (période)</p>
            <Link to="/admin/modules/location" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {[
              { label: "Payés", count: data?.payes || 0, color: "bg-green-50 text-green-700", dot: "bg-green-500" },
              { label: "En attente", count: data?.enAttente || 0, color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
              { label: "En retard", count: data?.enRetard || 0, color: "bg-red-50 text-red-700", dot: "bg-red-500" },
            ].map(row => (
              <div key={row.label} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${row.color}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${row.dot}`} />
                  <span className="text-xs font-medium">{row.label}</span>
                </div>
                <span className="text-sm font-bold">{loading ? "—" : row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Locataires actifs</p>
            <Link to="/admin/modules/location" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {(data?.contacts.slice(0, 5) || []).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-semibold text-blue-600 flex-shrink-0">
                  {(c.nom || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.nom}</p>
                  <p className="text-[11px] text-muted-foreground">{c.email || c.telephone || "—"}</p>
                </div>
              </div>
            ))}
            {(!data || data.contacts.length === 0) && <p className="text-xs text-muted-foreground text-center py-4">Aucun locataire</p>}
          </div>
        </div>
      </div>
    </div>
  );
}