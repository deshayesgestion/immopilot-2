import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAgency } from "../../hooks/useAgency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Users, MessageSquare, Pencil, Trash2, Loader2, X } from "lucide-react";

const statusColors = {
  nouveau: "bg-blue-100 text-blue-700",
  contacte: "bg-yellow-100 text-yellow-700",
  qualifie: "bg-green-100 text-green-700",
  en_cours: "bg-purple-100 text-purple-700",
  gagne: "bg-emerald-100 text-emerald-700",
  perdu: "bg-red-100 text-red-700",
};

const sourceLabels = {
  site_web: "Site web", telephone: "Téléphone", email: "Email",
  recommandation: "Recommandation", portail: "Portail", autre: "Autre"
};

export default function AdminCRM() {
  const { agency } = useAgency();
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", type: "acheteur", source: "site_web", status: "nouveau", notes: "" });

  const load = async () => {
    setLoading(true);
    const [l, m] = await Promise.all([
      base44.entities.Lead.list("-created_date", 100),
      base44.entities.ContactMessage.list("-created_date", 50),
    ]);
    setLeads(l);
    setMessages(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setField = (k, v) => setLeadForm((p) => ({ ...p, [k]: v }));

  const handleSaveLead = async (e) => {
    e.preventDefault();
    const payload = { ...leadForm, agency_id: agency?.id || "default" };
    if (editLead) {
      const updated = await base44.entities.Lead.update(editLead.id, payload);
      setLeads((l) => l.map((x) => (x.id === editLead.id ? updated : x)));
    } else {
      const created = await base44.entities.Lead.create(payload);
      setLeads((l) => [created, ...l]);
    }
    setShowLeadForm(false);
    setEditLead(null);
    setLeadForm({ name: "", email: "", phone: "", type: "acheteur", source: "site_web", status: "nouveau", notes: "" });
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm("Supprimer ce lead ?")) return;
    await base44.entities.Lead.delete(id);
    setLeads((l) => l.filter((x) => x.id !== id));
  };

  const handleMessageStatus = async (id, status) => {
    await base44.entities.ContactMessage.update(id, { status });
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const filteredLeads = leads.filter((l) => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));
  const filteredMessages = messages.filter((m) => !search || m.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM & Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos prospects et messages clients</p>
        </div>
        {tab === "leads" && (
          <Button className="rounded-full gap-2" onClick={() => { setEditLead(null); setLeadForm({ name: "", email: "", phone: "", type: "acheteur", source: "site_web", status: "nouveau", notes: "" }); setShowLeadForm(true); }}>
            <Plus className="w-4 h-4" /> Ajouter un lead
          </Button>
        )}
      </div>

      <div className="flex gap-2 bg-secondary/50 p-1 rounded-full w-fit">
        {[["leads", "Leads", Users], ["messages", "Messages", MessageSquare]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === key ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-full bg-white h-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : tab === "leads" ? (
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border/50">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>Aucun lead trouvé</p>
            </div>
          ) : filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl border border-border/50 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {lead.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{lead.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || "bg-gray-100"}`}>{lead.status}</span>
                  <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">{lead.type}</span>
                </div>
                <p className="text-sm text-muted-foreground">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
                {lead.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lead.notes}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Select value={lead.status} onValueChange={async (v) => {
                  await base44.entities.Lead.update(lead.id, { status: v });
                  setLeads((l) => l.map((x) => x.id === lead.id ? { ...x, status: v } : x));
                }}>
                  <SelectTrigger className="h-8 w-32 rounded-full text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["nouveau","contacte","qualifie","en_cours","gagne","perdu"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setEditLead(lead);
                  setLeadForm({ name: lead.name || "", email: lead.email || "", phone: lead.phone || "", type: lead.type || "acheteur", source: lead.source || "site_web", status: lead.status || "nouveau", notes: lead.notes || "" });
                  setShowLeadForm(true);
                }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteLead(lead.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border/50">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>Aucun message</p>
            </div>
          ) : filteredMessages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{msg.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${msg.status === "nouveau" ? "bg-blue-100 text-blue-700" : msg.status === "traite" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{msg.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{msg.email}{msg.phone ? ` · ${msg.phone}` : ""}</p>
                  <p className="text-sm text-muted-foreground">{msg.message}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {msg.status !== "lu" && <Button variant="outline" size="sm" className="rounded-full h-7 text-xs" onClick={() => handleMessageStatus(msg.id, "lu")}>Marquer lu</Button>}
                  {msg.status !== "traite" && <Button variant="outline" size="sm" className="rounded-full h-7 text-xs" onClick={() => handleMessageStatus(msg.id, "traite")}>Traité</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLeadForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{editLead ? "Modifier le lead" : "Nouveau lead"}</h2>
              <button onClick={() => setShowLeadForm(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveLead} className="space-y-4">
              <Input required placeholder="Nom complet" value={leadForm.name} onChange={(e) => setField("name", e.target.value)} className="rounded-xl" />
              <Input required type="email" placeholder="Email" value={leadForm.email} onChange={(e) => setField("email", e.target.value)} className="rounded-xl" />
              <Input placeholder="Téléphone" value={leadForm.phone} onChange={(e) => setField("phone", e.target.value)} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={leadForm.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["acheteur","vendeur","locataire","bailleur"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={leadForm.source} onValueChange={(v) => setField("source", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Notes internes..." value={leadForm.notes} onChange={(e) => setField("notes", e.target.value)} className="rounded-xl resize-none min-h-[80px]" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => setShowLeadForm(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 rounded-full">{editLead ? "Enregistrer" : "Créer"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}