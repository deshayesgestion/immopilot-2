import RoleGuard from "@/components/admin/RoleGuard";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Calculator, Euro, TrendingUp, AlertCircle, Search,
  Loader2, Clock, Filter, X, Wallet, BarChart2, FileText,
  Link2, Brain, Download, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Sous-modules existants
import ModuleComptaPaiements from "@/components/modules/compta/ModuleComptaPaiements";
import ModuleComptaCommissions from "@/components/modules/compta/ModuleComptaCommissions";
import ModuleComptaRetards from "@/components/modules/compta/ModuleComptaRetards";

// Nouveaux modules
import ComptaTresorerie from "@/components/modules/compta/ComptaTresorerie";
import ComptaRapprochement from "@/components/modules/compta/ComptaRapprochement";
import ComptaFacturation from "@/components/modules/compta/ComptaFacturation";
import ComptaIAAgent from "@/components/modules/compta/ComptaIAAgent";
import ComptaExport from "@/components/modules/compta/ComptaExport";

const TABS = [
  { id: "tresorerie",      label: "Trésorerie",         icon: Wallet,      desc: "Cash-flow · Prévisionnel · Soldes" },
  { id: "paiements",       label: "Paiements",           icon: Euro,        desc: "Tous les flux financiers" },
  { id: "rapprochement",   label: "Rapprochement",       icon: Link2,       desc: "Matching bancaire intelligent" },
  { id: "facturation",     label: "Facturation",         icon: FileText,    desc: "Factures · TVA · Envoi" },
  { id: "commissions",     label: "Commissions",         icon: TrendingUp,  desc: "Suivi commissions vente & location" },
  { id: "retards",         label: "Retards",             icon: AlertCircle, desc: "Impayés & relances" },
  { id: "ia",              label: "IA Comptable",        icon: Brain,       desc: "Analyse · Anomalies · Prévisions" },
  { id: "export",          label: "Export",              icon: Download,    desc: "CSV · FEC · Expert-comptable" },
];

const TYPE_OPTIONS = ["", "loyer", "commission", "frais"];
const STATUT_OPTIONS = ["", "paye", "en_attente", "en_retard"];

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";

export default function ModuleComptabilite() {
  const [tab, setTab] = useState("tresorerie");
  const [paiements, setPaiements] = useState([]);
  const [quittances, setQuittances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [factures, setFactures] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterBienId, setFilterBienId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    setLoading(true);
    const [p, q, t, c, b, f] = await Promise.all([
      base44.entities.Paiement.list("-created_date", 500),
      base44.entities.Quittance.list("-created_date", 500),
      base44.entities.Transaction.list("-created_date", 200),
      base44.entities.Contact.list("-created_date", 500),
      base44.entities.Bien.list("-created_date", 200),
      base44.entities.Facture.list("-created_date", 100).catch(() => []),
    ]);
    const uniquePaiements = Array.from(new Map(p.map(x => [x.id, x])).values())
      .filter(x => x.montant && x.montant > 0 && x.contact_id);
    setPaiements(uniquePaiements);
    setQuittances(q);
    setTransactions(t);
    setContacts(c);
    setBiens(b);
    setFactures(f);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  // KPIs globaux
  const totalEncaisse = paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0)
    + quittances.filter(q => q.statut === "paye").reduce((s, q) => s + (q.montant_total || 0), 0);
  const totalAttente = paiements.filter(p => p.statut === "en_attente").reduce((s, p) => s + (p.montant || 0), 0)
    + quittances.filter(q => q.statut === "en_attente").reduce((s, q) => s + (q.montant_total || 0), 0);
  const totalRetard = paiements.filter(p => p.statut === "en_retard").reduce((s, p) => s + (p.montant || 0), 0)
    + quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").reduce((s, q) => s + (q.montant_total || 0), 0);
  const totalCommissions = paiements.filter(p => p.type === "commission" && p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
  const nbRetards = paiements.filter(p => p.statut === "en_retard").length
    + quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").length;
  const nonRapproches = paiements.filter(p => !p.statut_rapprochement || p.statut_rapprochement === "non_matche").length;

  // Filtres pour sous-modules paiements/commissions/retards
  const applyFilters = (list) => list.filter(p => {
    const contact = contactMap[p.contact_id];
    const bien = bienMap[p.bien_id];
    const matchSearch = !search ||
      [contact?.nom, bien?.titre, p.type, p.notes].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchType = !filterType || p.type === filterType;
    const matchStatut = !filterStatut || p.statut === filterStatut;
    const matchBien = !filterBienId || p.bien_id === filterBienId;
    return matchSearch && matchType && matchStatut && matchBien;
  });

  const filteredPaiements = applyFilters(paiements);
  const filteredCommissions = applyFilters(paiements.filter(p => p.type === "commission"));
  const filteredRetards = applyFilters([
    ...paiements.filter(p => p.statut === "en_retard"),
    // Quittances impayées converties en format paiement pour le composant existant
    ...quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").map(q => ({
      id: q.id, contact_id: q.contact_id, bien_id: q.bien_id,
      montant: q.montant_total, type: "loyer", statut: "en_retard",
      date_echeance: q.date_echeance,
    }))
  ]);

  const hasFilters = search || filterType || filterStatut || filterBienId;
  const clearFilters = () => { setSearch(""); setFilterType(""); setFilterStatut(""); setFilterBienId(""); };

  const showFilters = ["paiements", "commissions", "retards"].includes(tab);

  const kpis = [
    { label: "Total encaissé", value: fmtEur(totalEncaisse), icon: Euro, bg: "bg-green-50", color: "text-green-600", border: "border-green-100" },
    { label: "En attente", value: fmtEur(totalAttente), icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600", border: "border-yellow-100" },
    { label: "En retard / impayés", value: fmtEur(totalRetard), icon: AlertCircle, bg: "bg-red-50", color: "text-red-600", border: "border-red-100", badge: nbRetards > 0 ? nbRetards : null },
    { label: "Commissions", value: fmtEur(totalCommissions), icon: TrendingUp, bg: "bg-purple-50", color: "text-purple-600", border: "border-purple-100" },
    { label: "Non rapprochés", value: String(nonRapproches), icon: Link2, bg: "bg-amber-50", color: "text-amber-600", border: "border-amber-100", badge: nonRapproches > 0 ? nonRapproches : null, clickTab: "rapprochement" },
    { label: "Factures en cours", value: String(factures.filter(f => f.statut !== "payee").length), icon: FileText, bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-100", clickTab: "facturation" },
  ];

  return (
    <RoleGuard module="comptabilite">
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl">
            <Calculator className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Module Comptabilité</h1>
            <p className="text-sm text-muted-foreground">Trésorerie · Rapprochement · Facturation · TVA · IA · Export FEC</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Actualiser
        </Button>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i}
              className={`bg-white rounded-2xl border ${k.border} p-4 relative overflow-hidden ${k.clickTab ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`}
              onClick={() => k.clickTab && setTab(k.clickTab)}>
              <div className={`inline-flex p-1.5 rounded-lg ${k.bg} mb-2`}>
                <Icon className={`w-3.5 h-3.5 ${k.color}`} />
              </div>
              {k.badge && (
                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">{k.badge}</span>
              )}
              <p className="text-xl font-bold leading-none">{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Onglets navigation */}
      <div className="bg-white rounded-2xl border border-border/50 p-1.5 flex flex-wrap gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const isAlert = (t.id === "retards" && nbRetards > 0) || (t.id === "rapprochement" && nonRapproches > 0);
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {isAlert && tab !== t.id && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Filtres (uniquement sur paiements/commissions/retards) */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Contact, bien, notes…"
                className="pl-8 h-9 rounded-xl border-0 bg-secondary/50 text-sm w-full" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="h-9 text-sm border border-border/50 rounded-xl px-3 bg-white">
              <option value="">Tous les types</option>
              <option value="loyer">Loyer</option>
              <option value="commission">Commission</option>
              <option value="frais">Frais</option>
            </select>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              className="h-9 text-sm border border-border/50 rounded-xl px-3 bg-white">
              <option value="">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
              <option value="en_retard">En retard</option>
            </select>
            <select value={filterBienId} onChange={e => setFilterBienId(e.target.value)}
              className="h-9 text-sm border border-border/50 rounded-xl px-3 bg-white max-w-[180px]">
              <option value="">Tous les biens</option>
              {biens.map(b => <option key={b.id} value={b.id}>{b.titre}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border border-border/50">
                <X className="w-3.5 h-3.5" /> Effacer
              </button>
            )}
          </div>
          {hasFilters && <p className="text-xs text-muted-foreground"><Filter className="w-3 h-3 inline mr-1" />{filteredPaiements.length} résultat(s)</p>}
        </div>
      )}

      {/* Contenu onglets */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {tab === "tresorerie" && (
            <ComptaTresorerie paiements={paiements} quittances={quittances} transactions={transactions} />
          )}
          {tab === "paiements" && (
            <ModuleComptaPaiements paiements={filteredPaiements} contactMap={contactMap} bienMap={bienMap} />
          )}
          {tab === "rapprochement" && (
            <ComptaRapprochement
              paiements={paiements} quittances={quittances}
              contactMap={contactMap} bienMap={bienMap}
              onUpdate={() => setRefreshKey(k => k + 1)}
            />
          )}
          {tab === "facturation" && (
            <ComptaFacturation contacts={contacts} />
          )}
          {tab === "commissions" && (
            <ModuleComptaCommissions commissions={filteredCommissions} contactMap={contactMap} bienMap={bienMap} />
          )}
          {tab === "retards" && (
            <ModuleComptaRetards retards={filteredRetards} contactMap={contactMap} bienMap={bienMap} />
          )}
          {tab === "ia" && (
            <ComptaIAAgent paiements={paiements} quittances={quittances} transactions={transactions} factures={factures} />
          )}
          {tab === "export" && (
            <ComptaExport paiements={paiements} quittances={quittances} transactions={transactions} factures={factures} contacts={contacts} biens={biens} />
          )}
        </>
      )}
    </div>
    </RoleGuard>
  );
}