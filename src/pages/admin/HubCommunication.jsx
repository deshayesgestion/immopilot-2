import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, Mail, Phone, Search, Loader2, Send,
  ChevronRight, Bot, X, Plus, Clock, CheckCircle2,
  AlertTriangle, User, StickyNote, ArrowDownLeft, ArrowUpRight,
  Filter, Inbox
} from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const CANAL_CONFIG = {
  sms:          { label: "SMS",           icon: MessageSquare, color: "bg-blue-100 text-blue-700" },
  note_interne: { label: "Note interne",  icon: StickyNote,    color: "bg-amber-100 text-amber-700" },
  whatsapp:     { label: "WhatsApp",      icon: MessageSquare, color: "bg-green-100 text-green-700" },
};

// ── Merge all comms for a contact ─────────────────────────────────────────
function buildTimeline(emails, tickets, messages, contactEmail) {
  const timeline = [];

  emails.filter(e => e.de === contactEmail || e.de_nom?.toLowerCase().includes(contactEmail?.toLowerCase()))
    .forEach(e => timeline.push({
      id: `email-${e.id}`, type: "email", date: e.date_reception || e.created_date,
      label: e.objet || "(sans objet)", excerpt: e.corps?.slice(0, 120),
      direction: "entrant", priorite: e.priorite, statut: e.statut, raw: e,
    }));

  tickets.filter(t => t.appelant_email === contactEmail ||
    t.appelant_nom?.toLowerCase().includes(contactEmail?.split("@")[0]?.toLowerCase()))
    .forEach(t => timeline.push({
      id: `ticket-${t.id}`, type: "appel", date: t.date_appel || t.created_date,
      label: t.type_demande || "Appel", excerpt: t.resume_ia || t.description,
      direction: "entrant", priorite: t.priorite, statut: t.statut, raw: t,
    }));

  messages.filter(m => m.contact_email === contactEmail)
    .forEach(m => timeline.push({
      id: `msg-${m.id}`, type: "message", date: m.created_date,
      label: CANAL_CONFIG[m.canal]?.label || m.canal, excerpt: m.contenu,
      direction: m.direction, raw: m,
    }));

  return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ── Build contact list from all sources ──────────────────────────────────
function buildContacts(emails, tickets, messages, leads, acquereurs) {
  const map = new Map();

  const add = (email, nom, phone, source) => {
    if (!email && !nom) return;
    const key = email || nom;
    if (!map.has(key)) map.set(key, { email, nom: nom || email, phone, sources: new Set(), count: 0 });
    map.get(key).sources.add(source);
    map.get(key).count++;
    if (nom && !map.get(key).nom) map.get(key).nom = nom;
    if (phone && !map.get(key).phone) map.get(key).phone = phone;
  };

  emails.forEach(e => add(e.de, e.de_nom, null, "email"));
  tickets.forEach(t => add(t.appelant_email, t.appelant_nom, t.appelant_telephone, "appel"));
  messages.forEach(m => add(m.contact_email, m.contact_nom, m.contact_telephone, "message"));
  leads.forEach(l => add(l.email, l.name, l.phone, "lead"));
  acquereurs.forEach(a => add(a.email, a.nom, a.telephone, "acquereur"));

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

const SOURCE_ICONS = {
  email: <Mail className="w-3 h-3" />,
  appel: <Phone className="w-3 h-3" />,
  message: <MessageSquare className="w-3 h-3" />,
  lead: <User className="w-3 h-3" />,
  acquereur: <User className="w-3 h-3" />,
};

// ── Send message modal ────────────────────────────────────────────────────
function SendMessageModal({ contact, onClose, onSent, currentUser }) {
  const [canal, setCanal] = useState("note_interne");
  const [contenu, setContenu] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!contenu.trim()) return;
    setSending(true);
    await base44.entities.Message.create({
      canal, contenu, direction: "sortant",
      contact_email: contact.email, contact_nom: contact.nom, contact_telephone: contact.phone,
      auteur_email: currentUser?.email, auteur_nom: currentUser?.full_name,
    });
    setSending(false);
    onSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Nouveau message → {contact.nom}</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Canal</label>
          <div className="flex gap-2">
            {Object.entries(CANAL_CONFIG).map(([k, v]) => {
              const Icon = v.icon;
              return (
                <button key={k} onClick={() => setCanal(k)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    canal === k ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}>
                  <Icon className="w-3 h-3" />{v.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
          <Textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={4}
            placeholder="Rédigez votre message…" className="rounded-xl text-sm resize-none" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 h-9 text-sm gap-1.5" onClick={send} disabled={sending || !contenu.trim()}>
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Envoyer</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline item ─────────────────────────────────────────────────────────
function TimelineItem({ item }) {
  const [expanded, setExpanded] = useState(false);

  const icons = {
    email: <Mail className="w-4 h-4 text-primary" />,
    appel: <Phone className="w-4 h-4 text-purple-600" />,
    message: <MessageSquare className="w-4 h-4 text-amber-600" />,
  };

  const bgColors = {
    email: "bg-blue-50 border-blue-100",
    appel: "bg-purple-50 border-purple-100",
    message: "bg-amber-50 border-amber-100",
  };

  const dirIcon = item.direction === "entrant"
    ? <ArrowDownLeft className="w-3 h-3 text-green-600" />
    : <ArrowUpRight className="w-3 h-3 text-blue-600" />;

  return (
    <div className={`rounded-xl border p-3.5 cursor-pointer hover:shadow-sm transition-all ${bgColors[item.type]}`}
      onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-border/50 flex items-center justify-center flex-shrink-0">
          {icons[item.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">{item.label}</span>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">{dirIcon} {item.direction}</span>
            {item.priorite === "urgent" && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Urgent</span>
            )}
          </div>
          {item.excerpt && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.excerpt}</p>}
          {expanded && item.excerpt && item.excerpt.length > 60 && (
            <p className="text-xs text-foreground mt-2 whitespace-pre-wrap">{item.raw?.corps || item.raw?.description || item.raw?.contenu}</p>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmt(item.date)}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function HubCommunication() {
  const [emails, setEmails] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [acquereurs, setAcquereurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showSend, setShowSend] = useState(false);
  const [filterSource, setFilterSource] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);

  const load = async () => {
    const [em, tk, ms, ld, aq, me] = await Promise.all([
      base44.entities.EmailEntrant.list("-date_reception", 300),
      base44.entities.TicketIA.list("-date_appel", 300),
      base44.entities.Message.list("-created_date", 300),
      base44.entities.Lead.list("-created_date", 200),
      base44.entities.Acquereur.list("-created_date", 200),
      base44.auth.me(),
    ]);
    setEmails(em); setTickets(tk); setMessages(ms);
    setLeads(ld); setAcquereurs(aq); setCurrentUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const contacts = useMemo(
    () => buildContacts(emails, tickets, messages, leads, acquereurs),
    [emails, tickets, messages, leads, acquereurs]
  );

  const filtered = useMemo(() => contacts.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || [c.nom, c.email, c.phone].some(v => v?.toLowerCase().includes(q));
    const matchSource = filterSource === "all" || c.sources.has(filterSource);
    return matchQ && matchSource;
  }), [contacts, search, filterSource]);

  const timeline = useMemo(() => {
    if (!selected) return [];
    return buildTimeline(emails, tickets, messages, selected.email);
  }, [selected, emails, tickets, messages]);

  // Stats
  const totalUnread = emails.filter(e => e.statut === "non_lu").length +
    tickets.filter(t => t.statut === "nouveau").length +
    messages.filter(m => !m.lu && m.direction === "entrant").length;

  const recentActivity = [...emails, ...tickets, ...messages]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Hub Communication
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tous les canaux centralisés — appels, emails, messages</p>
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{totalUnread} non lu{totalUnread > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Contacts actifs", value: contacts.length, icon: User, color: "text-primary", bg: "bg-primary/10" },
          { label: "Emails reçus", value: emails.length, icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Appels / Tickets", value: tickets.length, icon: Phone, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Messages", value: messages.length, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main panel: contact list + detail */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden flex" style={{ height: "calc(100vh - 300px)", minHeight: "520px" }}>

        {/* Left — contact list */}
        <div className={`flex flex-col border-r border-border/50 flex-shrink-0 ${selected ? "w-72" : "flex-1 max-w-sm"}`}>
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 rounded-full text-sm bg-secondary/40 border-0" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["all", "email", "appel", "message", "lead"].map(s => (
                <button key={s} onClick={() => setFilterSource(s)}
                  className={`text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
                    filterSource === s ? "bg-primary text-white" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}>
                  {s === "all" ? "Tous" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Aucun contact trouvé</p>
              </div>
            ) : (
              filtered.map(c => {
                const isSelected = selected?.email === c.email && selected?.nom === c.nom;
                return (
                  <button key={c.email || c.nom} onClick={() => setSelected(isSelected ? null : c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left ${isSelected ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {(c.nom || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nom}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email || c.phone || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {Array.from(c.sources).map(s => (
                        <span key={s} className="text-muted-foreground/50">{SOURCE_ICONS[s]}</span>
                      ))}
                      <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5 ml-1">{c.count}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right — timeline */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Contact header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  {(selected.nom || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selected.nom}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {selected.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{selected.email}</span>}
                    {selected.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={() => setShowSend(true)}>
                  <Plus className="w-3 h-3" /> Message
                </Button>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/50">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Source chips */}
            <div className="px-5 py-2.5 border-b border-border/50 flex gap-2 flex-wrap">
              {[
                { src: "email", label: "Emails", count: emails.filter(e => e.de === selected.email).length, color: "bg-blue-50 text-blue-700" },
                { src: "appel", label: "Appels", count: tickets.filter(t => t.appelant_email === selected.email).length, color: "bg-purple-50 text-purple-700" },
                { src: "message", label: "Messages", count: messages.filter(m => m.contact_email === selected.email).length, color: "bg-amber-50 text-amber-700" },
              ].map(chip => (
                <span key={chip.src} className={`text-xs font-medium px-2.5 py-1 rounded-full ${chip.color}`}>
                  {chip.label} ({chip.count})
                </span>
              ))}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {timeline.length === 0 ? (
                <div className="text-center py-16">
                  <Inbox className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune communication trouvée pour ce contact</p>
                </div>
              ) : (
                timeline.map(item => <TimelineItem key={item.id} item={item} />)
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden sm:flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-muted-foreground/15 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Sélectionnez un contact</p>
              <p className="text-xs text-muted-foreground/60 mt-1">pour voir l'historique unifié</p>
            </div>
          </div>
        )}
      </div>

      {showSend && selected && (
        <SendMessageModal
          contact={selected}
          currentUser={currentUser}
          onClose={() => setShowSend(false)}
          onSent={load}
        />
      )}
    </div>
  );
}