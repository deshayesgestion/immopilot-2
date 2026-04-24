import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CockpitKPIs from "./CockpitKPIs";
import CockpitAlertes from "./CockpitAlertes";
import CockpitPerformance from "./CockpitPerformance";
import CockpitActivite from "./CockpitActivite";
import CockpitBiens from "./CockpitBiens";
import CockpitInsightsIA from "./CockpitInsightsIA";
import CockpitActionsRapides from "./CockpitActionsRapides";
import CockpitPeriodFilter, { filterByPeriod } from "./CockpitPeriodFilter";
import CockpitSuperAgent from "./CockpitSuperAgent";
import CockpitRounded from "./CockpitRounded";

function computeStats(
  biens, leads, contacts, transactions, paiements, tickets, dossiers,
  dossiersLocatifs, mandats, acquereurs, quittances, aiLogs,
  period, customStart, customEnd
) {
  const fp = (items, field = "created_date") => filterByPeriod(items, period, customStart, customEnd, field);
  const paiementsP = fp(paiements, "created_date");
  const transactionsP = fp(transactions, "created_date");
  const leadsP = fp(leads, "created_date");
  const dossiersP = fp(dossiers, "created_date");
  const ticketsP = fp(tickets, "created_date");

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  // ── BIENS ──
  const biensActifs = biens.filter(b => b.statut === "disponible" || b.statut === "en_cours").length;
  const biensVente = biens.filter(b => b.type === "vente").length;
  const biensLocation = biens.filter(b => b.type === "location").length;

  // ── TRANSACTIONS ──
  const ventesEnCours = transactionsP.filter(t => t.statut === "en_cours" && t.type === "vente").length;
  const ventesSigne = transactionsP.filter(t => t.statut === "signe" && t.type === "vente").length;
  const ventesCloture = transactionsP.filter(t => t.statut === "cloture" && t.type === "vente").length;
  const locationsActives = transactionsP.filter(t => t.statut === "en_cours" && t.type === "location").length;
  const caTotalTransactions = transactionsP.filter(t => ["signe","cloture"].includes(t.statut)).reduce((s,t) => s+(t.prix||0),0);
  const caCommissions = transactionsP.filter(t => ["signe","cloture"].includes(t.statut)).reduce((s,t) => s+(t.commission||0),0);
  const caVente = transactionsP.filter(t => t.type==="vente" && ["signe","cloture"].includes(t.statut)).reduce((s,t) => s+(t.commission||t.prix||0),0);

  // ── PAIEMENTS ──
  const paiementsPayes = paiementsP.filter(p => p.statut === "paye");
  const paiementsEnAttente = paiementsP.filter(p => p.statut === "en_attente");
  const paiementsEnRetard = paiements.filter(p => p.statut === "en_retard");
  const montantEncaisse = paiementsPayes.reduce((s,p) => s+(p.montant||0), 0);
  const montantAttente = paiementsEnAttente.reduce((s,p) => s+(p.montant||0), 0);
  const montantRetard = paiementsEnRetard.reduce((s,p) => s+(p.montant||0), 0);
  const caLocation = paiementsPayes.filter(p => p.type === "loyer").reduce((s,p) => s+(p.montant||0), 0);
  const loyersAttente = paiementsEnAttente.filter(p => p.type === "loyer").length;
  const beneficeEstime = montantEncaisse + caCommissions;
  const tauxMarge = montantEncaisse + caTotalTransactions > 0
    ? Math.round((beneficeEstime / (montantEncaisse + caTotalTransactions)) * 100) : 0;

  // ── LEADS ──
  const totalLeads = leadsP.length;
  const leadsQualifies = leadsP.filter(l => l.statut === "qualifie" || l.statut === "contacte").length;

  // ── DOSSIERS ──
  const dossiersTermines = dossiersP.filter(d => d.statut === "termine" || d.statut === "signe");
  const dureeTotaleDossiers = dossiersTermines.reduce((s,d) => {
    const debut = new Date(d.created_date), fin = new Date(d.updated_date);
    return s + Math.max(0, Math.floor((fin-debut)/86400000));
  }, 0);

  // ── TICKETS ──
  const ticketsUrgents = ticketsP.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length;

  // ── MODULE LOCATION (DossierLocatif) ──
  const dossiersLocatifsActifs = dossiersLocatifs.filter(d =>
    d.statut_dossier === "en_cours" || d.statut_dossier === "bail_signe"
  );
  const loyersEncaisses = quittances.filter(q => q.statut === "paye").reduce((s,q) => s+(q.montant_total||0), 0);
  const impayesCount = quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").length;
  const impayesMontant = quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").reduce((s,q) => s+(q.montant_total||0), 0);

  // ── MODULE VENTE (Mandats + Acquéreurs) ──
  const mandatsActifs = mandats.filter(m => m.statut === "actif").length;
  const mandatsSignes = mandats.filter(m => m.statut_mandat === "signe").length;
  const acquereursPipeline = acquereurs.filter(a => a.etape !== "perdu" && a.etape !== "acte").length;
  const ventesFinalisees = acquereurs.filter(a => a.etape === "acte").length;

  // ── LOGS IA ──
  const logsIARecents = fp(aiLogs, "created_date").slice(0, 20);
  const logsErreurs = aiLogs.filter(l => l.status === "error").slice(0, 5);

  // ── CA TOTAL GLOBAL ──
  const caTotalGlobal = caTotalTransactions + loyersEncaisses + montantEncaisse;
  const totalDossiers = dossiers.length + dossiersLocatifs.length + mandats.length;
  const tauxConversion = (totalLeads + acquereurs.length) > 0
    ? Math.round(((leadsQualifies + ventesFinalisees) / (totalLeads + acquereurs.length)) * 100) : 0;

  return {
    biens, leads: leadsP, contacts, transactions: transactionsP,
    paiements: paiementsP, tickets: ticketsP, dossiers: dossiersP,
    paiementsRetardList: paiementsEnRetard,
    contactMap, bienMap,
    // KPIs base
    biensActifs, biensVente, biensLocation,
    ventesEnCours, ventesSigne, ventesCloture,
    locationsActives, loyersAttente,
    caTotalTransactions, caCommissions, caVente, caLocation,
    montantEncaisse, montantAttente, montantRetard,
    paiementsPayes: paiementsPayes.length,
    paiementsAttente: paiementsEnAttente.length,
    paiementsRetard: paiementsEnRetard.length,
    beneficeEstime, tauxMarge,
    totalLeads, leadsQualifies,
    dossiersTermines: dossiersTermines.length,
    dureeTotaleDossiers,
    ticketsUrgents,
    // ── NOUVEAUX KPIs ──
    // Location
    dossiersLocatifsActifs: dossiersLocatifsActifs.length,
    dossiersLocatifsAll: dossiersLocatifs,
    loyersEncaisses,
    impayesCount,
    impayesMontant,
    quittances,
    // Vente
    mandatsActifs,
    mandatsSignes,
    mandats,
    acquereursPipeline,
    ventesFinalisees,
    acquereurs,
    // Global
    caTotalGlobal,
    totalDossiers,
    tauxConversion,
    // IA Logs
    logsIARecents,
    logsErreurs,
    aiLogs,
  };
}

export default function DashboardAdmin({ agency }) {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = async () => {
    setLoading(true);
    const [biens, leads, contacts, transactions, paiements, tickets, dossiers,
           dossiersLocatifs, mandats, acquereurs, quittances, aiLogs] = await Promise.all([
      base44.entities.Bien.list("-created_date", 300),
      base44.entities.Lead.list("-created_date", 300),
      base44.entities.Contact.list("-created_date", 300),
      base44.entities.Transaction.list("-created_date", 300),
      base44.entities.Paiement.list("-created_date", 500),
      base44.entities.TicketIA.list("-created_date", 200),
      base44.entities.DossierImmobilier.list("-created_date", 300),
      base44.entities.DossierLocatif.list("-created_date", 200),
      base44.entities.MandatVente.list("-created_date", 200),
      base44.entities.Acquereur.list("-created_date", 200),
      base44.entities.Quittance.list("-created_date", 300),
      base44.entities.AIActionLog.list("-created_date", 100),
    ]);
    setRawData({ biens, leads, contacts, transactions, paiements, tickets, dossiers,
                 dossiersLocatifs, mandats, acquereurs, quittances, aiLogs });
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const data = useMemo(() => {
    if (!rawData) return null;
    return computeStats(
      rawData.biens, rawData.leads, rawData.contacts,
      rawData.transactions, rawData.paiements, rawData.tickets, rawData.dossiers,
      rawData.dossiersLocatifs, rawData.mandats, rawData.acquereurs,
      rawData.quittances, rawData.aiLogs,
      period, customStart, customEnd
    );
  }, [rawData, period, customStart, customEnd]);

  const handleCustomChange = (key, val) => {
    if (key === "start") setCustomStart(val);
    else setCustomEnd(val);
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <CockpitPeriodFilter
            period={period}
            onPeriodChange={setPeriod}
            customStart={customStart}
            customEnd={customEnd}
            onCustomChange={handleCustomChange}
          />
          {lastRefresh && (
            <span className="text-[11px] text-muted-foreground">
              Mis à jour {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-2 h-8 text-xs self-start sm:self-auto" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <CockpitKPIs data={data || {}} loading={loading} />

      {/* Actions rapides */}
      {!loading && data && <CockpitActionsRapides data={data} onRefresh={load} />}

      {/* ── SÉPARATION CLAIRE : IA MÉTIER vs COMMUNICATION ── */}
      {!loading && data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2">Intelligence & Communication</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>
        </div>
      )}

      {/* 🤖 Super Agent IA (cerveau métier SaaS) + 📞 Rounded (communication) */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CockpitSuperAgent data={data} />
          <CockpitRounded tickets={data.tickets} />
        </div>
      )}

      {/* IA Actionnelle (insights rapides) */}
      {!loading && data && <CockpitInsightsIA data={data} />}

      {/* Alertes + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!loading && data && <CockpitAlertes data={data} />}
        {!loading && data && <CockpitActivite data={data} />}
      </div>

      {/* Performance + Biens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!loading && data && <CockpitPerformance data={data} />}
        {!loading && data && <CockpitBiens data={data} />}
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-border/50 animate-pulse h-64" />
          ))}
        </div>
      )}
    </div>
  );
}