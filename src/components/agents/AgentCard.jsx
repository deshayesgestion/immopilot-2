import { Play, MessageSquare, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

// Métriques contextuelles selon le module
function getMetrics(agent, rawData) {
  if (!rawData) return [];
  const { leads, paiements, dossiers, contacts, tickets } = rawData;
  switch (agent.module) {
    case "vente":
      return [
        { label: "Leads actifs", value: leads.filter(l => l.statut !== "perdu").length, alert: false },
        { label: "Leads chauds", value: leads.filter(l => l.statut === "qualifie").length, alert: leads.filter(l => l.statut === "qualifie").length > 0 },
      ];
    case "location":
      return [
        { label: "Loyers en retard", value: paiements.filter(p => p.statut === "en_retard").length, alert: paiements.filter(p => p.statut === "en_retard").length > 0 },
        { label: "Dossiers location", value: dossiers.filter(d => d.type === "location").length, alert: false },
      ];
    case "comptabilite":
      return [
        { label: "Paiements en attente", value: paiements.filter(p => p.statut === "en_attente").length, alert: false },
        { label: "Impayés", value: paiements.filter(p => p.statut === "en_retard").length, alert: paiements.filter(p => p.statut === "en_retard").length > 0 },
      ];
    case "support":
      return [
        { label: "Tickets ouverts", value: tickets.filter(t => t.statut !== "resolu").length, alert: tickets.filter(t => t.statut !== "resolu").length > 5 },
        { label: "Tickets urgents", value: tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length, alert: tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length > 0 },
      ];
    default:
      return [];
  }
}

export default function AgentCard({ agent, conversations, isSelected, compact, rawData, onSelect }) {
  const Icon = agent.icon;
  const metrics = getMetrics(agent, rawData);
  const lastConv = conversations[0];
  const totalConvs = conversations.length;

  if (compact) {
    return (
      <button onClick={onSelect}
        className={`w-full text-left rounded-2xl border p-3.5 transition-all hover:shadow-sm ${
          isSelected ? `${agent.border} bg-gradient-to-br ${agent.gradient} ring-1 ring-offset-1 ring-current/20` : "border-border/50 bg-white hover:border-primary/30"
        }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${agent.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${agent.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{agent.name}</p>
            <p className="text-[11px] text-muted-foreground">{totalConvs} session{totalConvs !== 1 ? "s" : ""}</p>
          </div>
          {isSelected && <div className={`w-2 h-2 rounded-full ${agent.color.replace("text-", "bg-")}`} />}
        </div>
        {metrics.some(m => m.alert) && (
          <div className="flex items-center gap-1 mt-2">
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-[10px] text-amber-600">{metrics.find(m => m.alert)?.value} {metrics.find(m => m.alert)?.label}</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-all hover:shadow-md ${isSelected ? `${agent.border} ring-1 ring-offset-1` : "border-border/50"}`}>
      {/* Header */}
      <div className={`p-4 bg-gradient-to-br ${agent.gradient} border-b border-border/30`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 rounded-2xl ${agent.bg} border ${agent.border} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${agent.color}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-green-700">Actif</span>
          </div>
        </div>
        <p className="text-sm font-bold">{agent.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
      </div>

      {/* Métriques contextuelles */}
      {rawData && (
        <div className="grid grid-cols-2 gap-px bg-border/20 border-b border-border/30">
          {metrics.map((m, i) => (
            <div key={i} className={`px-3 py-2.5 bg-white ${m.alert ? "bg-red-50/50" : ""}`}>
              <p className={`text-base font-bold ${m.alert ? "text-red-600" : ""}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Capabilities */}
      <div className="px-4 py-3 space-y-1">
        {agent.capabilities.map((cap, i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${agent.color}`} />
            <span className="text-[11px] text-muted-foreground">{cap}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-3">
        {lastConv && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            Dernière session : {fmt(lastConv.created_date)}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button size="sm" className={`flex-1 h-8 text-xs rounded-xl gap-1.5 ${agent.color.replace("text-", "bg-").replace("600", "600")} text-white hover:opacity-90`}
            style={{ backgroundColor: undefined }}
            variant="default"
            onClick={onSelect}>
            <Play className="w-3 h-3" />
            {isSelected ? "Fermer" : "Démarrer session"}
          </Button>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground border border-border/50 rounded-xl px-2 py-1.5">
            <MessageSquare className="w-3 h-3" />
            {totalConvs}
          </div>
        </div>
      </div>
    </div>
  );
}