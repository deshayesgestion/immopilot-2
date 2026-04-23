import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart3, Brain, TrendingUp, AlertTriangle, Star, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BIAnalysePredictive from "@/components/bi/BIAnalysePredictive";
import BIScoringClients from "@/components/bi/BIScoringClients";
import BIAlertes from "@/components/bi/BIAlertes";
import BIRecommandations from "@/components/bi/BIRecommandations";

const TABS = [
  { id: "predictions", label: "Analyse prédictive", icon: TrendingUp },
  { id: "scoring", label: "Scoring clients", icon: Star },
  { id: "alertes", label: "Alertes intelligentes", icon: AlertTriangle },
  { id: "recommandations", label: "Recommandations IA", icon: Brain },
];

export default function AdminBI() {
  const [tab, setTab] = useState("predictions");
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    const [biens, dossiers, leads, paiements, tickets, contacts] = await Promise.all([
      base44.entities.Bien.list("-created_date", 300),
      base44.entities.DossierImmobilier.list("-created_date", 300),
      base44.entities.Lead.list("-created_date", 300),
      base44.entities.Paiement.list("-created_date", 500),
      base44.entities.TicketIA.list("-created_date", 200),
      base44.entities.Contact.list("-created_date", 300),
    ]);
    setRawData({ biens, dossiers, leads, paiements, tickets, contacts });
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Intelligence Business (BI)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyse prédictive · Scoring · Alertes · Recommandations IA Rounded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              MAJ {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button variant="outline" size="sm" className="rounded-full gap-2 h-8 text-xs" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border/50 p-5 animate-pulse h-48" />
          ))}
        </div>
      )}

      {/* Tabs content */}
      {!loading && rawData && (
        <>
          {tab === "predictions" && <BIAnalysePredictive data={rawData} />}
          {tab === "scoring" && <BIScoringClients data={rawData} />}
          {tab === "alertes" && <BIAlertes data={rawData} />}
          {tab === "recommandations" && <BIRecommandations data={rawData} />}
        </>
      )}
    </div>
  );
}