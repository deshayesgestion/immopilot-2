import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot, Phone, TicketIcon, AlertTriangle, CheckCircle2,
  PhoneIncoming, Home, TrendingUp, CreditCard, Loader2,
  Plus, Send, Zap, Eye, Mail, ArrowUpRight, Bell
} from "lucide-react";
import HubIAFlux from "@/components/ia/HubIAFlux";
import TicketCreateModal from "@/components/ia/TicketCreateModal";
import TicketDetailModal from "@/components/ia/TicketDetailModal";
import RelancesTab from "@/components/admin/relances/RelancesTab";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const PRIORITE_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  normal: { label: "Normal", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  faible: { label: "Faible", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};
const STATUT_CONFIG = {
  nouveau:   { label: "Nouveau",  color: "bg-blue-100 text-blue-700" },
  en_cours:  { label: "En cours", color: "bg-amber-100 text-amber-700" },
  resolu:    { label: "Résolu",   color: "bg-green-100 text-green-700" },
  escalade:  { label: "Escalade", color: "bg-red-100 text-red-700" },
};
const SOURCE_CONFIG = {
  appel:  { label: "Appel",  color: "bg-green-100 text-green-700", icon: Phone },
  email:  { label: "Email",  color: "bg-blue-100 text-blue-700", icon: Mail },
  chat:   { label: "Chat",   color: "bg-purple-100 text-purple-700", icon: Bot },
  manuel: { label: "Manuel", color: "bg-gray-100 text-gray-500", icon: Zap },
};
const MODULE_ICONS = {
  location:    <Home className="w-3.5 h-3.5 text-blue-500" />,
  vente:       <TrendingUp className="w-3.5 h-3.5 text-purple-500" />,
  comptabilite: <CreditCard className="w-3.5 h-3.5 text-green-500" />,
  general:     <Bot className="w-3.5 h-3.5 text-gray-400" />,
};

// ── CHAT IA (Rounded / Agent) ─────────────────────────────────────────────
function ChatIA({ onTicketCreated }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startConversation = async () => {
    setLoading(true);
    const conv = await base44.agents.createConversation({
      agent_name: "accueil_ia",
      metadata: { name: `Session ${new Date().toLocaleString("fr-FR")}` }
    });
    setConversation(conv);
    setStarted(true);
    base44.agents.subscribeToConversation(conv.id, (data) => setMessages(data.messages || []));
    const updated = await base44.agents.addMessage(conv, { role: "user", content: "Bonjour" });
    setMessages(updated?.messages || []);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    const updated = await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setMessages(updated?.messages || []);
    setLoading(false);
    if (onTicketCreated) onTicketCreated();
  };

  if (!started) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Bot className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold">Agent IA Central</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Testez l'agent IA en simulant une interaction. Il comprend les demandes, consulte le CRM et crée des tickets automatiquement.
        </p>
      </div>
      <Button className="rounded-full gap-2" onClick={startConversation} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneIncoming className="w-4 h-4" />}
        Démarrer une session IA
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {messages.filter(m => m.role !== "system").map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-secondary/40 text-foreground"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-secondary/40 rounded-2xl px-4 py-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 pt-3 border-t border-border/50">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Tapez votre message…" className="flex-1 h-10 rounded-xl text-sm" />
        <Button size="icon" className="h-10 w-10 rounded-xl" onClick={sendMessage} disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: TicketIcon },
  { id: "agent", label: "Agent IA", icon: Bot },
  { id: "tickets", label: "Tickets", icon: TicketIcon },
  { id: "relances", label: "Relances IA", icon: Bell },
  { id: "hub", label: "Hub IA & Flux", icon: Zap },
];

export default function AccueilIA() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterPriorite, setFilterPriorite] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [showNewTicket, setShowNewTicket] = useState(false);

  const load = async () => {
    const res = await base44.entities.TicketIA.list("-created_date", 200);
    setTickets(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total: tickets.length,
    urgents: tickets.filter(t => t.priorite === "urgent").length,
    nouveaux: tickets.filter(t => t.statut === "nouveau").length,
    resolus: tickets.filter(t => t.statut === "resolu").length,
    parSource: {
      appel: tickets.filter(t => t.source === "appel").length,
      email: tickets.filter(t => t.source === "email").length,
      chat: tickets.filter(t => t.source === "chat").length,
      manuel: tickets.filter(t => t.source === "manuel").length,
    },
    parModule: {
      location: tickets.filter(t => t.module === "location").length,
      vente: tickets.filter(t => t.module === "vente").length,
      comptabilite: tickets.filter(t => t.module === "comptabilite").length,
    },
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatut !== "all" && t.statut !== filterStatut) return false;
    if (filterPriorite !== "all" && t.priorite !== filterPriorite) return false;
    if (filterSource !== "all" && t.source !== filterSource) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" /> Accueil IA
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cerveau central IA — Rounded · Email · Tickets · CRM
          </p>
        </div>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => setShowNewTicket(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouveau ticket
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                activeTab === tab.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === "tickets" && stats.nouveaux > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-primary text-white"}`}>
                  {stats.nouveaux}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total tickets", value: stats.total, icon: TicketIcon, color: "text-primary", bg: "bg-primary/10" },
              { label: "Urgents", value: stats.urgents, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Nouveaux", value: stats.nouveaux, icon: PhoneIncoming, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Résolus", value: stats.resolus, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Sources */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-4">Tickets par source</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(stats.parSource).map(([src, count]) => {
                const cfg = SOURCE_CONFIG[src];
                const Icon = cfg.icon;
                return (
                  <div key={src} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modules */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Location", value: stats.parModule.location, icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Vente", value: stats.parModule.vente, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Comptabilité", value: stats.parModule.comptabilite, icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Urgents */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-3">Tickets urgents non résolus</p>
            {tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun ticket urgent en cours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").slice(0, 6).map(t => (
                  <div key={t.id}
                    className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 cursor-pointer hover:border-red-300 transition-colors"
                    onClick={() => setSelectedTicket(t)}>
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.appelant_nom || "Inconnu"}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.resume_ia || t.description || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {SOURCE_CONFIG[t.source] && (() => {
                        const SrcIcon = SOURCE_CONFIG[t.source].icon;
                        return <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${SOURCE_CONFIG[t.source].color}`}><SrcIcon className="w-3 h-3 inline" /></span>;
                      })()}
                      <span className="text-xs text-muted-foreground">{fmt(t.date_appel)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liens rapides vers modules */}
          <div className="grid grid-cols-2 gap-3">
            <a href="/admin/parametres/emails"
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">IA Email</p>
                <p className="text-xs text-muted-foreground">Gérer les emails entrants</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </a>
            <a href="https://app.callrounded.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-border/50 hover:border-green-300 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Rounded</p>
                <p className="text-xs text-muted-foreground">Dashboard agent vocal</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-green-600" />
            </a>
          </div>
        </div>
      )}

      {/* ── AGENT IA ── */}
      {activeTab === "agent" && (
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Agent IA — Cerveau central</p>
              <p className="text-xs text-muted-foreground">Accès CRM complet : biens, dossiers, contacts, paiements</p>
            </div>
          </div>
          <ChatIA onTicketCreated={load} />
        </div>
      )}

      {/* ── TICKETS ── */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="all">Tous statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="escalade">Escalade</option>
            </select>
            <select value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)}
              className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="faible">Faible</option>
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="all">Toutes sources</option>
              <option value="appel">Appel Rounded</option>
              <option value="email">Email IA</option>
              <option value="chat">Chat IA</option>
              <option value="manuel">Manuel</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
              <TicketIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun ticket trouvé</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
              <div className="divide-y divide-border/30">
                {filteredTickets.map(t => {
                  const statutConfig = STATUT_CONFIG[t.statut] || STATUT_CONFIG.nouveau;
                  const prioriteConfig = PRIORITE_CONFIG[t.priorite] || PRIORITE_CONFIG.normal;
                  const sourceConfig = SOURCE_CONFIG[t.source] || SOURCE_CONFIG.manuel;
                  const SrcIcon = sourceConfig.icon;
                  return (
                    <div key={t.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/10 cursor-pointer transition-colors"
                      onClick={() => setSelectedTicket(t)}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${prioriteConfig.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{t.appelant_nom || "Inconnu"}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statutConfig.color}`}>{statutConfig.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sourceConfig.color}`}>
                            <SrcIcon className="w-3 h-3 inline mr-0.5" />{sourceConfig.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{t.resume_ia || t.description || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {MODULE_ICONS[t.module]}
                        <span className="text-xs text-muted-foreground">{fmt(t.date_appel)}</span>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground/40" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RELANCES IA ── */}
      {activeTab === "relances" && <RelancesTab />}

      {/* ── HUB IA ── */}
      {activeTab === "hub" && <HubIAFlux />}

      {/* Modals */}
      {showNewTicket && (
        <TicketCreateModal onClose={() => setShowNewTicket(false)} onCreated={() => { load(); }} />
      )}
      {selectedTicket && (
        <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdate={load} />
      )}
    </div>
  );
}