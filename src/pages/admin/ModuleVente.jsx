import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Home, Users, FileSignature, Euro, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import ModuleVenteBiens from "@/components/modules/vente/ModuleVenteBiens";
import ModuleVenteLeads from "@/components/modules/vente/ModuleVenteLeads";
import ModuleVenteTransactions from "@/components/modules/vente/ModuleVenteTransactions";

const TABS = [
  { id: "biens", label: "Biens", icon: Home },
  { id: "leads", label: "Leads", icon: Users },
  { id: "transactions", label: "Transactions", icon: FileSignature },
];

export default function ModuleVente() {
  const [tab, setTab] = useState("biens");
  const [biens, setBiens] = useState([]);
  const [leads, setLeads] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [b, l, t, c] = await Promise.all([
        base44.entities.Bien.filter({ type: "vente" }),
        base44.entities.Lead.list("-created_date", 200),
        base44.entities.Transaction.filter({ type: "vente" }),
        base44.entities.Contact.list("-created_date", 200),
      ]);
      setBiens(b);
      setLeads(l);
      setTransactions(t);
      setContacts(c);
      setLoading(false);
    };
    load();
  }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const stats = [
    { label: "Biens à vendre", value: biens.length, icon: Home, color: "text-blue-600" },
    { label: "Leads actifs", value: leads.filter(l => l.statut !== "perdu").length, icon: Users, color: "text-green-600" },
    { label: "Transactions", value: transactions.length, icon: FileSignature, color: "text-purple-600" },
    {
      label: "CA total",
      value: transactions.filter(t => t.statut === "cloture").reduce((s, t) => s + (t.prix || 0), 0).toLocaleString("fr-FR") + " €",
      icon: Euro,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Module Vente</h1>
          <p className="text-sm text-muted-foreground">Biens, leads et transactions de vente</p>
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
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5">
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
          {tab === "biens" && <ModuleVenteBiens biens={biens} contactMap={contactMap} search={search} />}
          {tab === "leads" && <ModuleVenteLeads leads={leads} contactMap={contactMap} bienMap={bienMap} search={search} />}
          {tab === "transactions" && <ModuleVenteTransactions transactions={transactions} contactMap={contactMap} bienMap={bienMap} search={search} />}
        </>
      )}
    </div>
  );
}