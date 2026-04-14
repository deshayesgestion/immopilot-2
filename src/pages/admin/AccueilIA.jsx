import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Phone, TicketIcon, AlertTriangle, Clock, CheckCircle2,
  ArrowUpRight, MessageSquare, Mic, PhoneIncoming, Users,
  Home, TrendingUp, CreditCard, Loader2, Plus, X, Send, Zap, Eye
} from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—";

const PRIORITE_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  normal: { label: "Normal", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  faible: { label: "Faible", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

const STATUT_CONFIG = {
  nouveau: { label: "Nouveau", color: "bg-blue-100 text-blue-700" },
  en_cours: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  resolu: { label: "Résolu", color: "bg-green-100 text-green-700" },
  escalade: { label: "Escalade", color: "bg-red-100 text-red-700" },
};

const MODULE_ICONS = {
  location: <Home className="w-3.5 h-3.5 text-blue-500" />,
  vente: <TrendingUp className="w-3.5 h-3.5 text-purple-500" />,
  comptabilite: <CreditCard className="w-3.5 h-3.5 text-green-500" />,
  general: <MessageSquare className="w-3.5 h-3.5 text-gray-500" />,
};

const TYPE_LABELS = {
  incident_logement: "Incident logement",
  demande_visite: "Demande de visite",
  demande_information: "Demande d'info",
  probleme_paiement: "Problème paiement",
  question_administrative: "Question admin",
  autre: "Autre",
};

// ── CHAT IA ──────────────────────────────────────────────────────────────
function ChatIA({ onTicketCreated }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async () => {
    setLoading(true);
    const conv = await base44.agents.createConversation({
      agent_name: "accueil_ia",
      metadata: { name: `Appel ${new Date().toLocaleString("fr-FR")}` }
    });
    setConversation(conv);
    setStarted(true);
    setLoading(false);

    // Subscribe to updates
    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });

    // Send initial greeting trigger
    const updated = await base44.agents.addMessage(conv, {
      role: "user",
      content: "Bonjour"
    });
    setMessages(updated?.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    const updated = await base44.agents.addMessage(conversation, {
      role: "user",
      content: msg
    });
    setMessages(updated?.messages || []);
    setLoading(false);

    // Check if a TicketIA was created
    if (onTicketCreated) onTicketCreated();
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">Standardiste IA</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Simulez un appel entrant pour tester l'agent IA. Il comprend les demandes et crée des tickets automatiquement.
          </p>
        </div>
        <Button className="rounded-full gap-2" onClick={startConversation} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneIncoming className="w-4 h-4" />}
          Simuler un appel entrant
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {messages.filter(m => m.role !== "system").map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-primary text-white"
                : "bg-secondary/40 text-foreground"
            }`}>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border/50">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Tapez votre message..."
          className="flex-1 h-10 rounded-xl text-sm"
        />
        <Button size="icon" className="h-10 w-10 rounded-xl" onClick={sendMessage} disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── TICKET DETAIL ─────────────────────────────────────────────────────────
function TicketDetail({ ticket, onClose, onUpdate }) {
  const [statut, setStatut] = useState(ticket.statut);
  const [notes, setNotes] = useState(ticket.notes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.TicketIA.update(ticket.id, { statut, notes });
    setSaving(false);
    onUpdate();
    onClose();
  };

  const prioriteConfig = PRIORITE_CONFIG[ticket.priorite] || PRIORITE_CONFIG.normal;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${prioriteConfig.color}`}>
              {prioriteConfig.label}
            </span>
            <span className="text-sm font-semibold">{ticket.numero}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Appelant</p>
              <p className="text-sm font-medium">{ticket.appelant_nom || "Inconnu"}</p>
              <p className="text-xs text-muted-foreground">{ticket.appelant_telephone || ""}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium">{TYPE_LABELS[ticket.type_demande] || ticket.type_demande}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Module</p>
              <div className="flex items-center gap-1 mt-0.5">{MODULE_ICONS[ticket.module]} <span className="text-sm capitalize">{ticket.module}</span></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm">{fmt(ticket.date_appel)} {fmtTime(ticket.date_appel)}</p>
            </div>
          </div>

          {ticket.resume_ia && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Résumé IA</p>
              <p className="text-sm">{ticket.resume_ia}</p>
            </div>
          )}

          {ticket.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm bg-secondary/20 rounded-xl p-3">{ticket.description}</p>
            </div>
          )}

          {ticket.transcription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Transcription</p>
              <p className="text-xs bg-secondary/10 rounded-xl p-3 max-h-24 overflow-y-auto font-mono">{ticket.transcription}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="escalade">Escalade</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes internes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded-xl text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="rounded-full flex-1 text-sm h-9" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 text-sm h-9" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function AccueilIA() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterPriorite, setFilterPriorite] = useState("all");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    appelant_nom: "", appelant_telephone: "", type_demande: "incident_logement",
    module: "location", priorite: "normal", description: "", source: "manuel"
  });
  const [savingNew, setSavingNew] = useState(false);

  const load = async () => {
    const res = await base44.entities.TicketIA.list("-created_date", 100);
    setTickets(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total: tickets.length,
    urgents: tickets.filter(t => t.priorite === "urgent").length,
    nouveaux: tickets.filter(t => t.statut === "nouveau").length,
    resolus: tickets.filter(t => t.statut === "resolu").length,
    location: tickets.filter(t => t.module === "location").length,
    vente: tickets.filter(t => t.module === "vente").length,
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatut !== "all" && t.statut !== filterStatut) return false;
    if (filterPriorite !== "all" && t.priorite !== filterPriorite) return false;
    return true;
  });

  const createTicket = async () => {
    setSavingNew(true);
    await base44.entities.TicketIA.create({
      ...newTicket,
      numero: `TKT-${Date.now()}`,
      date_appel: new Date().toISOString(),
    });
    setSavingNew(false);
    setShowNewTicket(false);
    setNewTicket({ appelant_nom: "", appelant_telephone: "", type_demande: "incident_logement", module: "location", priorite: "normal", description: "", source: "manuel" });
    load();
  };

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: TicketIcon },
    { id: "agent", label: "Agent IA (simulation)", icon: Bot },
    { id: "tickets", label: "Tous les tickets", icon: MessageSquare },
    { id: "config", label: "Configuration", icon: Zap },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Accueil IA
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Standardiste intelligent — gestion automatique des appels et tickets</p>
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
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {/* Stats */}
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

          {/* Modules */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{stats.location}</p>
                <p className="text-xs text-muted-foreground">Tickets Location</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{stats.vente}</p>
                <p className="text-xs text-muted-foreground">Tickets Vente</p>
              </div>
            </div>
          </div>

          {/* Recent urgent tickets */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-3">Tickets urgents récents</p>
            {tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun ticket urgent en cours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 cursor-pointer hover:border-red-300 transition-colors"
                    onClick={() => setSelectedTicket(t)}>
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.appelant_nom || "Appelant inconnu"}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.resume_ia || t.description || TYPE_LABELS[t.type_demande]}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{fmt(t.date_appel)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AGENT IA ── */}
      {activeTab === "agent" && (
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Simulation d'appel</p>
              <p className="text-xs text-muted-foreground">Testez le standardiste IA en simulant une conversation</p>
            </div>
          </div>
          <ChatIA onTicketCreated={load} />
        </div>
      )}

      {/* ── TICKETS ── */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
              className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="all">Tous statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="escalade">Escalade</option>
            </select>
            <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)}
              className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="faible">Faible</option>
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
                  return (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/10 cursor-pointer transition-colors"
                      onClick={() => setSelectedTicket(t)}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${prioriteConfig.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{t.appelant_nom || "Appelant inconnu"}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statutConfig.color}`}>{statutConfig.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{t.resume_ia || TYPE_LABELS[t.type_demande] || "—"}</p>
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

      {/* ── CONFIG ── */}
      {activeTab === "config" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
            <p className="text-sm font-semibold">Intégration téléphonie (à venir)</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Twilio", desc: "Intégration appels SIP/PSTN via Twilio Voice", available: false },
                { label: "Vonage", desc: "API Voice Vonage pour appels entrants", available: false },
                { label: "WhatsApp Business", desc: "Conversations WhatsApp avec l'agent IA", available: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  {item.available ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Disponible</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Bientôt</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
            <p className="text-sm font-semibold">Règles d'escalade automatique</p>
            <div className="space-y-2">
              {[
                { rule: "Incident urgent (fuite, incendie, intrusion)", action: "Alerte SMS agent de garde immédiate" },
                { rule: "Problème paiement > 2 semaines retard", action: "Redirection module Comptabilité" },
                { rule: "Demande visite — bien disponible", action: "Proposition créneaux automatique" },
                { rule: "Interlocuteur non identifié", action: "Création Lead générique + ticket" },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{r.rule}</p>
                    <p className="text-xs text-muted-foreground">→ {r.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New ticket modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewTicket(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Créer un ticket manuellement</p>
              <button onClick={() => setShowNewTicket(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Nom appelant</label>
                <Input value={newTicket.appelant_nom} onChange={(e) => setNewTicket(p => ({ ...p, appelant_nom: e.target.value }))} className="h-9 text-sm rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Téléphone</label>
                <Input value={newTicket.appelant_telephone} onChange={(e) => setNewTicket(p => ({ ...p, appelant_telephone: e.target.value }))} className="h-9 text-sm rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priorité</label>
                <select value={newTicket.priorite} onChange={(e) => setNewTicket(p => ({ ...p, priorite: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                  <option value="urgent">Urgent</option>
                  <option value="normal">Normal</option>
                  <option value="faible">Faible</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Module</label>
                <select value={newTicket.module} onChange={(e) => setNewTicket(p => ({ ...p, module: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                  <option value="location">Location</option>
                  <option value="vente">Vente</option>
                  <option value="comptabilite">Comptabilité</option>
                  <option value="general">Général</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select value={newTicket.type_demande} onChange={(e) => setNewTicket(p => ({ ...p, type_demande: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                  <option value="incident_logement">Incident logement</option>
                  <option value="demande_visite">Demande visite</option>
                  <option value="demande_information">Demande d'info</option>
                  <option value="probleme_paiement">Problème paiement</option>
                  <option value="question_administrative">Question admin</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Textarea value={newTicket.description} onChange={(e) => setNewTicket(p => ({ ...p, description: e.target.value }))} rows={3} className="text-sm rounded-xl resize-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={() => setShowNewTicket(false)}>Annuler</Button>
              <Button className="rounded-full flex-1 h-9 text-sm" onClick={createTicket} disabled={savingNew}>
                {savingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer le ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket detail modal */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}