import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, Euro, TrendingUp, AlertCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import ModuleComptaPaiements from "@/components/modules/compta/ModuleComptaPaiements";
import ModuleComptaCommissions from "@/components/modules/compta/ModuleComptaCommissions";
import ModuleComptaRetards from "@/components/modules/compta/ModuleComptaRetards";

const TABS = [
  { id: "paiements", label: "Tous les paiements", icon: Euro },
  { id: "commissions", label: "Commissions", icon: TrendingUp },
  { id: "retards", label: "Retards", icon: AlertCircle },
];

export default function ModuleComptabilite() {
  const [tab, setTab] = useState("paiements");
  const [paiements, setPaiements] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, c, b] = await Promise.all([
        base44.entities.Paiement.list("-created_date", 500),
        base44.entities.Contact.list("-created_date", 200),
        base44.entities.Bien.list("-created_date", 200),
      ]);
      setPaiements(p);
      setContacts(c);
      setBiens(b);
      setLoading(false);
    };
    load();
  }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const commissions = paiements.filter(p => p.type === "commission");
  const retards = paiements.filter(p => p.statut === "en_retard");
  const totalPaye = paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
  const totalRetard = retards.reduce((s, p) => s + (p.montant || 0), 0);

  const stats = [
    { label: "Total encaissé", value: totalPaye.toLocaleString("fr-FR") + " €", icon: Euro, color: "text-green-600" },
    { label: "Commissions", value: commissions.length, icon: TrendingUp, color: "text-blue-600" },
    { label: "En retard", value: retards.length, icon: AlertCircle, color: "text-red-600" },
    { label: "Montant retards", value: totalRetard.toLocaleString("fr-FR") + " €", icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 rounded-xl">
          <Calculator className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Module Comptabilité</h1>
          <p className="text-sm text-muted-foreground">Paiements, commissions et relances</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
              {t.id === "retards" && retards.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {retards.length}
                </span>
              )}
            </button>
          );
        })}
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8 h-9 w-48 rounded-xl border-0 bg-secondary/50 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {tab === "paiements" && <ModuleComptaPaiements paiements={paiements} contactMap={contactMap} bienMap={bienMap} search={search} />}
          {tab === "commissions" && <ModuleComptaCommissions commissions={commissions} contactMap={contactMap} bienMap={bienMap} search={search} />}
          {tab === "retards" && <ModuleComptaRetards retards={retards} contactMap={contactMap} bienMap={bienMap} search={search} />}
        </>
      )}
    </div>
  );
}