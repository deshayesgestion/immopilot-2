import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Calculator, Euro, TrendingUp, AlertCircle, Search,
  Loader2, Clock, Filter, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import ModuleComptaPaiements from "@/components/modules/compta/ModuleComptaPaiements";
import ModuleComptaCommissions from "@/components/modules/compta/ModuleComptaCommissions";
import ModuleComptaRetards from "@/components/modules/compta/ModuleComptaRetards";

const TABS = [
  { id: "paiements", label: "Tous les paiements", icon: Euro },
  { id: "commissions", label: "Commissions", icon: TrendingUp },
  { id: "retards", label: "Retards", icon: AlertCircle },
];

const TYPE_OPTIONS = ["", "loyer", "commission", "frais"];
const STATUT_OPTIONS = ["", "paye", "en_attente", "en_retard"];

export default function ModuleComptabilite() {
  const [tab, setTab] = useState("paiements");
  const [paiements, setPaiements] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterBienId, setFilterBienId] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, c, b] = await Promise.all([
        base44.entities.Paiement.list("-created_date", 500),
        base44.entities.Contact.list("-created_date", 500),
        base44.entities.Bien.list("-created_date", 200),
      ]);
      // Déduplication par id
      const uniquePaiements = Array.from(new Map(p.map(x => [x.id, x])).values());
      // Filtrer paiements valides : montant > 0, contact_id présent
      const validPaiements = uniquePaiements.filter(x => x.montant && x.montant > 0 && x.contact_id);
      setPaiements(validPaiements);
      setContacts(c);
      setBiens(b);
      setLoading(false);
    };
    load();
  }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  // KPIs
  const totalEncaisse = paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
  const totalAttente = paiements.filter(p => p.statut === "en_attente").reduce((s, p) => s + (p.montant || 0), 0);
  const totalRetard = paiements.filter(p => p.statut === "en_retard").reduce((s, p) => s + (p.montant || 0), 0);
  const nbRetards = paiements.filter(p => p.statut === "en_retard").length;

  // Filtre global appliqué aux 3 vues
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
  const filteredRetards = applyFilters(paiements.filter(p => p.statut === "en_retard"));

  const hasFilters = search || filterType || filterStatut || filterBienId;
  const clearFilters = () => { setSearch(""); setFilterType(""); setFilterStatut(""); setFilterBienId(""); };

  const kpis = [
    {
      label: "Total encaissé",
      value: totalEncaisse.toLocaleString("fr-FR") + " €",
      icon: Euro,
      bg: "bg-green-50",
      color: "text-green-600",
      border: "border-green-100",
    },
    {
      label: "En attente",
      value: totalAttente.toLocaleString("fr-FR") + " €",
      icon: Clock,
      bg: "bg-yellow-50",
      color: "text-yellow-600",
      border: "border-yellow-100",
    },
    {
      label: "En retard",
      value: totalRetard.toLocaleString("fr-FR") + " €",
      icon: AlertCircle,
      bg: "bg-red-50",
      color: "text-red-600",
      border: "border-red-100",
      badge: nbRetards > 0 ? nbRetards : null,
    },
    {
      label: "Commissions",
      value: paiements.filter(p => p.type === "commission" && p.statut === "paye")
        .reduce((s, p) => s + (p.montant || 0), 0).toLocaleString("fr-FR") + " €",
      icon: TrendingUp,
      bg: "bg-purple-50",
      color: "text-purple-600",
      border: "border-purple-100",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-50 rounded-xl">
          <Calculator className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Module Comptabilité</h1>
          <p className="text-sm text-muted-foreground">Paiements, commissions et suivi des retards</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className={`bg-white rounded-2xl border ${k.border} p-4 relative overflow-hidden`}>
              <div className={`inline-flex p-1.5 rounded-lg ${k.bg} mb-2`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              {k.badge && (
                <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                  {k.badge}
                </span>
              )}
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Contact, bien, notes…"
              className="pl-8 h-9 rounded-xl border-0 bg-secondary/50 text-sm w-full"
            />
          </div>

          {/* Filtre type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-9 text-sm border border-border/50 rounded-xl px-3 bg-white text-foreground"
          >
            <option value="">Tous les types</option>
            <option value="loyer">Loyer</option>
            <option value="commission">Commission</option>
            <option value="frais">Frais</option>
          </select>

          {/* Filtre statut */}
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="h-9 text-sm border border-border/50 rounded-xl px-3 bg-white text-foreground"
          >
            <option value="">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="en_retard">En retard</option>
          </select>

          {/* Filtre bien */}
          <select
            value={filterBienId}
            onChange={e => setFilterBienId(e.target.value)}
            className="h-9 text-sm border border-border/50 rounded-xl px-3 bg-white text-foreground max-w-[200px]"
          >
            <option value="">Tous les biens</option>
            {biens.map(b => (
              <option key={b.id} value={b.id}>{b.titre}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border border-border/50"
            >
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
        </div>

        {hasFilters && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {filteredPaiements.length} paiement(s) correspondant(s) aux filtres
          </p>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = t.id === "paiements" ? filteredPaiements.length
            : t.id === "commissions" ? filteredCommissions.length
            : filteredRetards.length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id
                  ? "bg-white/20 text-white"
                  : t.id === "retards" && filteredRetards.length > 0
                  ? "bg-red-100 text-red-600"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "paiements" && (
            <ModuleComptaPaiements
              paiements={filteredPaiements}
              contactMap={contactMap}
              bienMap={bienMap}
            />
          )}
          {tab === "commissions" && (
            <ModuleComptaCommissions
              commissions={filteredCommissions}
              contactMap={contactMap}
              bienMap={bienMap}
            />
          )}
          {tab === "retards" && (
            <ModuleComptaRetards
              retards={filteredRetards}
              contactMap={contactMap}
              bienMap={bienMap}
            />
          )}
        </>
      )}
    </div>
  );
}