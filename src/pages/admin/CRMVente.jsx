import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Loader2, Home, Users, FileSignature, BarChart2 } from "lucide-react";
import VentePipeline from "@/components/crm/VentePipeline";
import VenteBiensList from "@/components/crm/VenteBiensList";
import LeadFiche from "@/components/crm/LeadFiche";

const TABS = [
  { id: "pipeline", label: "Pipeline Leads", icon: Users },
  { id: "biens", label: "Biens à vendre", icon: Home },
  { id: "transactions", label: "Transactions", icon: FileSignature },
];

export default function CRMVente() {
  const [tab, setTab] = useState("pipeline");
  const [biens, setBiens] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const load = async () => {
    setLoading(true);
    const [b, l, c, t] = await Promise.all([
      base44.entities.Bien.filter({ type: "vente" }),
      base44.entities.Lead.list("-created_date", 200),
      base44.entities.Contact.list("-created_date", 200),
      base44.entities.Transaction.filter({ type: "vente" }),
    ]);
    setBiens(b);
    setLeads(l);
    setContacts(c);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const stats = [
    { label: "Biens actifs", value: biens.filter(b => b.statut === "disponible").length, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Leads actifs", value: leads.filter(l => l.statut !== "perdu").length, color: "text-green-600", bg: "bg-green-50" },
    { label: "Qualifiés", value: leads.filter(l => l.statut === "qualifie").length, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "CA clôturé", value: transactions.filter(t => t.statut === "cloture").reduce((s, t) => s + (t.prix || 0), 0).toLocaleString("fr-FR") + " €", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Vente</h1>
          <p className="text-sm text-muted-foreground">Pipeline, biens et suivi des leads</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border/50 p-4">
            <div className={`inline-flex p-1.5 rounded-lg ${s.bg} mb-2`}>
              <BarChart2 className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
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
          {tab === "pipeline" && (
            <VentePipeline
              leads={leads}
              contactMap={contactMap}
              bienMap={bienMap}
              onLeadClick={setSelectedLead}
              onLeadsChange={setLeads}
            />
          )}
          {tab === "biens" && (
            <VenteBiensList
              biens={biens}
              leads={leads}
              contactMap={contactMap}
              onBiensChange={setBiens}
            />
          )}
          {tab === "transactions" && (
            <TransactionsList transactions={transactions} contactMap={contactMap} bienMap={bienMap} />
          )}
        </>
      )}

      {/* Fiche lead modal */}
      {selectedLead && (
        <LeadFiche
          lead={selectedLead}
          contact={contactMap[selectedLead.contact_id]}
          bien={bienMap[selectedLead.bien_id]}
          biens={biens}
          contacts={contacts}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => {
            setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
            setSelectedLead(updated);
          }}
        />
      )}
    </div>
  );
}

// Transactions inline (simple)
const TX_COLORS = {
  en_cours: "bg-blue-100 text-blue-700",
  signe: "bg-green-100 text-green-700",
  cloture: "bg-slate-100 text-slate-600",
  annule: "bg-red-100 text-red-600",
};

function TransactionsList({ transactions, contactMap, bienMap }) {
  if (!transactions.length)
    return <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">Aucune transaction</div>;
  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            {["Bien", "Acheteur", "Vendeur", "Prix", "Commission", "Statut"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3 font-medium">{bienMap[t.bien_id]?.titre || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.acheteur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.vendeur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 font-semibold">{t.prix ? t.prix.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.commission ? t.commission.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${TX_COLORS[t.statut] || "bg-secondary text-muted-foreground"}`}>
                  {t.statut || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}