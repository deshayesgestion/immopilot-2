import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, MessageSquare, Bot, ChevronRight, Loader2, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

function ConvDetail({ conv, agent, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.agents.getConversation(conv.id).then(full => {
      setMessages((full.messages || []).filter(m => m.role !== "system"));
      setLoading(false);
    });
  }, [conv.id]);

  const Icon = agent?.icon || Bot;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden flex flex-col" style={{ maxHeight: "600px" }}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-gradient-to-r ${agent?.gradient || "from-secondary to-secondary/50"}`}>
        <div className={`w-8 h-8 rounded-lg ${agent?.bg || "bg-secondary"} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${agent?.color || "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{conv.metadata?.name || "Session"}</p>
          <p className="text-[11px] text-muted-foreground">{fmt(conv.created_date)}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className={`w-6 h-6 rounded-md ${agent?.bg || "bg-secondary"} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-3 h-3 ${agent?.color || "text-muted-foreground"}`} />
              </div>
            )}
            {msg.content && (
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                msg.role === "user" ? "bg-primary text-white" : "bg-secondary/40 text-foreground"
              }`}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && !loading && <p className="text-xs text-muted-foreground text-center py-4">Conversation vide</p>}
      </div>
    </div>
  );
}

export default function AgentHistorique({ conversations, agents }) {
  const [selectedConv, setSelectedConv] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [filterAgent, setFilterAgent] = useState("all");
  const [search, setSearch] = useState("");

  // Flatten all conversations with agent info
  const allConvs = agents.flatMap(agent =>
    (conversations[agent.id] || []).map(conv => ({ ...conv, agent }))
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const filtered = allConvs.filter(c => {
    const matchAgent = filterAgent === "all" || c.agent.id === filterAgent;
    const matchSearch = !search || (c.metadata?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchAgent && matchSearch;
  });

  const totalSessions = allConvs.length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {agents.map(agent => {
          const Icon = agent.icon;
          const count = (conversations[agent.id] || []).length;
          return (
            <div key={agent.id} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className={`w-8 h-8 rounded-lg ${agent.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${agent.color}`} />
              </div>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{agent.name}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…" className="pl-8 h-8 w-48 rounded-full text-xs bg-white" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilterAgent("all")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterAgent === "all" ? "bg-primary text-white" : "bg-white border border-border/50 text-muted-foreground"}`}>
            Tous ({totalSessions})
          </button>
          {agents.map(agent => (
            <button key={agent.id} onClick={() => setFilterAgent(agent.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterAgent === agent.id ? `${agent.color.replace("text-", "bg-")} text-white` : "bg-white border border-border/50 text-muted-foreground"}`}>
              {agent.name.replace("Agent ", "")} ({(conversations[agent.id] || []).length})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Liste des sessions */}
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-semibold">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune session trouvée</p>
              </div>
            ) : filtered.map(conv => {
              const Icon = conv.agent.icon;
              const isSelected = selectedConv?.id === conv.id;
              return (
                <button key={conv.id} onClick={() => { setSelectedConv(conv); setSelectedAgent(conv.agent); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors text-left ${isSelected ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                  <div className={`w-9 h-9 rounded-xl ${conv.agent.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${conv.agent.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{conv.metadata?.name || "Session sans nom"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium ${conv.agent.color}`}>{conv.agent.name}</span>
                      <span className="text-[10px] text-muted-foreground">{fmt(conv.created_date)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Détail de la conversation sélectionnée */}
        {selectedConv ? (
          <ConvDetail conv={selectedConv} agent={selectedAgent} onClose={() => setSelectedConv(null)} />
        ) : (
          <div className="bg-white rounded-2xl border border-border/50 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/15 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sélectionnez une session</p>
              <p className="text-xs text-muted-foreground/60 mt-1">pour voir le détail de la conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}