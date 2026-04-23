import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, TrendingUp, KeySquare, Calculator, Headphones, Play, History, Settings2, Zap, ToggleRight, ToggleLeft, RefreshCw } from "lucide-react";
import AgentCard from "@/components/agents/AgentCard";
import AgentChatPanel from "@/components/agents/AgentChatPanel";
import AgentHistorique from "@/components/agents/AgentHistorique";
import { useAI } from "@/lib/AIContext";
import { Button } from "@/components/ui/button";

export const AGENTS_CONFIG = [
  {
    id: "agent_vente",
    name: "Agent Vente",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    gradient: "from-blue-50 to-blue-100/50",
    description: "Suit les leads, relance les acquéreurs, propose des biens adaptés et optimise la conversion.",
    capabilities: ["Suivi leads", "Relances acquéreurs", "Matchmaking biens", "Alertes conversion"],
    module: "vente",
  },
  {
    id: "agent_location",
    name: "Agent Location",
    icon: KeySquare,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    gradient: "from-emerald-50 to-emerald-100/50",
    description: "Gère les locataires, relance les paiements en retard et surveille les impayés.",
    capabilities: ["Suivi loyers", "Relances impayés", "Gestion demandes", "Alertes critiques"],
    module: "location",
  },
  {
    id: "agent_comptabilite",
    name: "Agent Comptabilité",
    icon: Calculator,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    gradient: "from-purple-50 to-purple-100/50",
    description: "Vérifie les paiements, détecte les anomalies financières et met à jour les statuts.",
    capabilities: ["Vérification paiements", "Détection anomalies", "Relances impayés", "Alertes trésorerie"],
    module: "comptabilite",
  },
  {
    id: "agent_support",
    name: "Agent Support",
    icon: Headphones,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    gradient: "from-orange-50 to-orange-100/50",
    description: "Répond aux demandes clients, crée des tickets et priorise les urgences.",
    capabilities: ["Réponses automatiques", "Création tickets", "Priorisation urgences", "Escalade humain"],
    module: "support",
  },
];

const TABS = [
  { id: "agents", label: "Agents IA", icon: Bot },
  { id: "historique", label: "Historique", icon: History },
];

export default function AdminAgents() {
  const [tab, setTab] = useState("agents");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState({});

  // Utiliser le contexte IA global (données déjà chargées en fond)
  const { data: rawData, agentStatus, toggleAgent, metrics, alerts, refreshData, loading: loadingData, lastRefresh } = useAI();

  // Charger toutes les conversations de chaque agent
  useEffect(() => {
    const loadConvs = async () => {
      const results = {};
      await Promise.all(
        AGENTS_CONFIG.map(async (agent) => {
          const convs = await base44.agents.listConversations({ agent_name: agent.id }).catch(() => []);
          results[agent.id] = convs || [];
        })
      );
      setConversations(results);
    };
    loadConvs();
  }, []);

  const handleConversationCreated = (agentId, conv) => {
    setConversations(prev => ({
      ...prev,
      [agentId]: [conv, ...(prev[agentId] || [])],
    }));
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Agents IA Autonomes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            4 agents spécialisés · Vente · Location · Comptabilité · Support
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              MAJ {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={refreshData} disabled={loadingData}>
            <RefreshCw className={`w-3 h-3 ${loadingData ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700">
              {Object.values(agentStatus).filter(Boolean).length}/{AGENTS_CONFIG.length} actifs
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedAgent(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "agents" && (
        <div className={`flex gap-5 ${selectedAgent ? "flex-col lg:flex-row" : ""}`}>
          {/* Grille des agents */}
          <div className={`${selectedAgent ? "lg:w-80 flex-shrink-0" : "w-full"}`}>
            <div className={`grid gap-4 ${selectedAgent ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
              {AGENTS_CONFIG.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  conversations={conversations[agent.id] || []}
                  isSelected={selectedAgent?.id === agent.id}
                  compact={!!selectedAgent}
                  rawData={rawData}
                  isActive={agentStatus[agent.id] !== false}
                  onToggle={() => toggleAgent(agent.id)}
                  onSelect={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                />
              ))}
            </div>
          </div>

          {/* Panel de chat */}
          {selectedAgent && (
            <div className="flex-1 min-w-0">
              <AgentChatPanel
                agent={selectedAgent}
                rawData={rawData}
                onConversationCreated={(conv) => handleConversationCreated(selectedAgent.id, conv)}
                onClose={() => setSelectedAgent(null)}
              />
            </div>
          )}
        </div>
      )}

      {tab === "historique" && (
        <AgentHistorique conversations={conversations} agents={AGENTS_CONFIG} />
      )}
    </div>
  );
}