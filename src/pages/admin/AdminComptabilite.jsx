import { useState } from "react";
import { LayoutDashboard, ArrowLeftRight, FileText, Home, TrendingDown, Bell, BarChart2, Building2 } from "lucide-react";
import TabBanque from "../../components/admin/comptabilite/TabBanque";
import TabDashboard from "../../components/admin/comptabilite/TabDashboard";
import TabTransactions from "../../components/admin/comptabilite/TabTransactions";
import TabFacturation from "../../components/admin/comptabilite/TabFacturation";
import TabLoyers from "../../components/admin/comptabilite/TabLoyers";
import TabDepenses from "../../components/admin/comptabilite/TabDepenses";
import TabRelances from "../../components/admin/comptabilite/TabRelances";
import TabRapports from "../../components/admin/comptabilite/TabRapports";

const TABS = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "facturation", label: "Facturation", icon: FileText },
  { id: "loyers", label: "Loyers & encaissements", icon: Home },
  { id: "depenses", label: "Dépenses", icon: TrendingDown },
  { id: "relances", label: "Relances", icon: Bell },
  { id: "rapports", label: "Rapports", icon: BarChart2 },
  { id: "banque", label: "Liaison bancaire", icon: Building2 },
];

export default function AdminComptabilite() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comptabilité</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion financière centralisée — location & vente</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl border border-border/50 shadow-sm p-1.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && <TabDashboard />}
      {activeTab === "transactions" && <TabTransactions />}
      {activeTab === "facturation" && <TabFacturation />}
      {activeTab === "loyers" && <TabLoyers />}
      {activeTab === "depenses" && <TabDepenses />}
      {activeTab === "relances" && <TabRelances />}
      {activeTab === "rapports" && <TabRapports />}
      {activeTab === "banque" && <TabBanque />}
    </div>
  );
}