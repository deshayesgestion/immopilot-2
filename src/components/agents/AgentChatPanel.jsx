import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot, X, Plus, Zap, ChevronRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Contexte automatique selon l'agent
function buildContext(agent, rawData) {
  if (!rawData) return "";
  const { leads, paiements, dossiers, contacts, tickets } = rawData;
  switch (agent.module) {
    case "vente":
      return `Contexte actuel : ${leads.length} leads (${leads.filter(l => l.statut === "nouveau").length} nouveaux, ${leads.filter(l => l.statut === "qualifie").length} qualifiés, ${leads.filter(l => l.statut === "perdu").length} perdus). Dossiers vente : ${dossiers.filter(d => d.type === "vente").length}.`;
    case "location":
      return `Contexte actuel : ${paiements.filter(p => p.statut === "en_retard").length} loyers en retard, ${paiements.filter(p => p.statut === "en_attente").length} en attente. Dossiers location : ${dossiers.filter(d => d.type === "location").length}. Contacts locataires : ${contacts.filter(c => c.type === "locataire").length}.`;
    case "comptabilite":
      return `Contexte actuel : ${paiements.filter(p => p.statut === "en_retard").length} impayés, ${paiements.filter(p => p.statut === "en_attente").length} en attente, ${paiements.filter(p => p.statut === "paye").length} payés.`;
    case "support":
      return `Contexte actuel : ${tickets.filter(t => t.statut !== "resolu").length} tickets ouverts dont ${tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length} urgents.`;
    default:
      return "";
  }
}

// Suggestions de prompts selon l'agent
const SUGGESTED_PROMPTS = {
  vente: ["Analyse mes leads et dis-moi lesquels relancer en priorité", "Quels leads sont les plus chauds cette semaine ?", "Génère une relance pour mes acquéreurs inactifs"],
  location: ["Vérifie les loyers en retard et propose des relances", "Quel locataire est le plus à risque d'impayé ?", "Analyse les dossiers location en cours"],
  comptabilite: ["Vérifie l'état des paiements et détecte les anomalies", "Quels paiements sont en retard depuis plus de 30 jours ?", "Génère un rapport de trésorerie"],
  support: ["Analyse les tickets urgents et priorise-les", "Quels clients nécessitent une intervention immédiate ?", "Crée un résumé des demandes en cours"],
};

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name?.split(".").reverse().join(" ") || "Action";
  const status = toolCall?.status || "pending";
  const StatusIcon = status === "completed" ? CheckCircle2 : status === "running" || status === "in_progress" ? Loader2 : AlertCircle;
  const statusColor = status === "completed" ? "text-green-600" : status === "failed" ? "text-red-500" : "text-primary";

  return (
    <button onClick={() => setExpanded(e => !e)}
      className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-lg border border-border/40 text-xs hover:bg-secondary/50 transition-all mt-1">
      <StatusIcon className={`w-3 h-3 ${statusColor} ${["running","in_progress"].includes(status) ? "animate-spin" : ""}`} />
      <span className="text-muted-foreground">{name}</span>
      <ChevronRight className={`w-3 h-3 text-muted-foreground/40 ml-auto transition-transform ${expanded ? "rotate-90" : ""}`} />
    </button>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {msg.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isUser ? "bg-primary text-white" : "bg-white border border-border/50"
          }`}>
            {msg.content}
          </div>
        )}
        {(msg.tool_calls || []).map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}

export default function AgentChatPanel({ agent, rawData, onConversationCreated, onClose }) {
  const Icon = agent.icon;
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const context = buildContext(agent, rawData);
  const suggestions = SUGGESTED_PROMPTS[agent.module] || [];

  const startSession = async (initialPrompt) => {
    setStarting(true);
    const conv = await base44.agents.createConversation({
      agent_name: agent.id,
      metadata: { name: `Session ${new Date().toLocaleString("fr-FR")}` },
    });
    setConversation(conv);
    onConversationCreated(conv);

    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages?.filter(m => m.role !== "system") || []);
    });

    const prompt = initialPrompt || `Bonjour ! ${context} Analyse la situation et dis-moi quelles actions prioritaires je dois mener.`;
    setLoading(true);
    await base44.agents.addMessage(conv, { role: "user", content: prompt });
    setLoading(false);
    setStarting(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversation) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setLoading(false);
  };

  const newSession = () => {
    setConversation(null);
    setMessages([]);
    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "520px" }}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-border/50 bg-gradient-to-r ${agent.gradient}`}>
        <div className={`w-9 h-9 rounded-xl ${agent.bg} border ${agent.border} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${agent.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{agent.name}</p>
          <p className="text-[11px] text-muted-foreground">{conversation ? "Session active" : "Prêt à démarrer"}</p>
        </div>
        <div className="flex items-center gap-2">
          {conversation && (
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={newSession}>
              <Plus className="w-3 h-3" /> Nouvelle session
            </Button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!conversation && !starting && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className={`w-16 h-16 rounded-2xl ${agent.bg} border ${agent.border} flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${agent.color}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{agent.name}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{agent.description}</p>
            </div>
            {context && (
              <div className="bg-secondary/30 rounded-xl px-4 py-2.5 text-xs text-muted-foreground max-w-sm text-center">
                📊 {context}
              </div>
            )}
            {/* Suggested prompts */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs text-muted-foreground text-center">Démarrer avec :</p>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => startSession(s)}
                  className="w-full text-left text-xs px-4 py-2.5 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-2 group">
                  <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${agent.color} opacity-60 group-hover:opacity-100`} />
                  {s}
                </button>
              ))}
              <Button className="w-full rounded-xl gap-2" onClick={() => startSession()}>
                <Icon className="w-4 h-4" />
                Lancer l'analyse complète
              </Button>
            </div>
          </div>
        )}

        {starting && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">Initialisation de la session…</p>
          </div>
        )}

        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white border border-border/50 rounded-2xl px-4 py-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {conversation && (
        <div className="flex gap-2 px-4 py-3 border-t border-border/50">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Instruire l'${agent.name}…`}
            className="flex-1 h-10 rounded-xl text-sm"
            disabled={loading}
          />
          <Button size="icon" className="h-10 w-10 rounded-xl flex-shrink-0"
            onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}