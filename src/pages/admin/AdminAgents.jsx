import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Search, Users, UserCheck, Mail, X, ChevronRight, Loader2, CheckCircle } from "lucide-react";

const INTERNAL_ROLES = ["directeur", "responsable_location", "responsable_vente", "agent"];
const CLIENT_ROLES = ["locataire", "proprietaire", "acquereur", "prestataire"];

const ROLE_LABELS = {
  directeur: "Directeur",
  responsable_location: "Resp. Location",
  responsable_vente: "Resp. Vente",
  agent: "Agent",
  locataire: "Locataire",
  proprietaire: "Propriétaire",
  acquereur: "Acquéreur",
  prestataire: "Prestataire",
  admin: "Admin",
};

const ROLE_COLORS = {
  directeur: "bg-violet-100 text-violet-700",
  responsable_location: "bg-blue-100 text-blue-700",
  responsable_vente: "bg-emerald-100 text-emerald-700",
  agent: "bg-sky-100 text-sky-700",
  locataire: "bg-orange-100 text-orange-700",
  proprietaire: "bg-amber-100 text-amber-700",
  acquereur: "bg-green-100 text-green-700",
  prestataire: "bg-gray-100 text-gray-600",
  admin: "bg-purple-100 text-purple-700",
};

function InviteModal({ onClose, currentUser }) {
  const [form, setForm] = useState({ email: "", role: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const canInviteRoles = () => {
    const r = currentUser?.role;
    if (r === "directeur" || r === "admin") return [...INTERNAL_ROLES, ...CLIENT_ROLES];
    if (r === "responsable_location") return ["agent", "locataire", "proprietaire"];
    if (r === "responsable_vente") return ["agent", "acquereur", "proprietaire"];
    if (r === "agent") return ["locataire", "proprietaire", "acquereur", "prestataire"];
    return [];
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Invitation.create({ ...form, invited_by: currentUser?.email });
    await base44.users.inviteUser(form.email, INTERNAL_ROLES.includes(form.role) ? "user" : "user");
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-border/50" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-1">Invitation envoyée</h3>
            <p className="text-sm text-muted-foreground mb-6">Un email a été envoyé à {form.email}</p>
            <Button onClick={onClose} variant="outline" className="rounded-full">Fermer</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Inviter un utilisateur</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Adresse email</label>
                <Input required type="email" placeholder="email@exemple.fr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rôle attribué</label>
                <Select required value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                  <SelectContent>
                    {canInviteRoles().map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message <span className="text-muted-foreground font-normal">(optionnel)</span></label>
                <Textarea placeholder="Message personnalisé..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-xl resize-none min-h-[70px]" />
              </div>
              <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Envoyer l'invitation</>}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function UserRow({ user }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors rounded-xl">
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground/70 flex-shrink-0">
        {(user.full_name || user.email || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.full_name || "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_COLORS[user.role] || "bg-secondary text-muted-foreground"}`}>
        {ROLE_LABELS[user.role] || user.role}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
    </div>
  );
}

function InvitationRow({ inv }) {
  const statusColors = { en_attente: "bg-amber-100 text-amber-700", acceptee: "bg-green-100 text-green-700", expiree: "bg-gray-100 text-gray-500" };
  const statusLabels = { en_attente: "En attente", acceptee: "Acceptée", expiree: "Expirée" };
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors rounded-xl">
      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{inv.email}</p>
        <p className="text-xs text-muted-foreground">Invité par {inv.invited_by || "—"}</p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[inv.role] || "bg-secondary"}`}>{ROLE_LABELS[inv.role]}</span>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[inv.statut]}`}>{statusLabels[inv.statut]}</span>
    </div>
  );
}

export default function AdminAgents() {
  const [tab, setTab] = useState("agents");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Invitation.list("-created_date", 50),
      base44.auth.me(),
    ]).then(([u, inv, me]) => {
      setUsers(u);
      setInvitations(inv);
      setCurrentUser(me);
      setLoading(false);
    });
  }, []);

  const agentUsers = users.filter((u) => INTERNAL_ROLES.includes(u.role));
  const clientUsers = users.filter((u) => CLIENT_ROLES.includes(u.role));

  const filtered = (list) =>
    list.filter((u) =>
      [u.full_name, u.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );

  const tabs = [
    { id: "agents", label: "Agents", count: agentUsers.length, icon: UserCheck },
    { id: "clients", label: "Clients", count: clientUsers.length, icon: Users },
    { id: "invitations", label: "Invitations", count: invitations.length, icon: Mail },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} currentUser={currentUser} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents & Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des utilisateurs et des accès</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="rounded-full gap-2 h-9 text-sm">
          <UserPlus className="w-4 h-4" /> Inviter
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-secondary text-muted-foreground" : "bg-secondary/70 text-muted-foreground/70"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-2">
            {tab === "agents" && (
              filtered(agentUsers).length === 0
                ? <p className="text-sm text-muted-foreground text-center py-12">Aucun agent trouvé</p>
                : filtered(agentUsers).map((u) => <UserRow key={u.id} user={u} />)
            )}
            {tab === "clients" && (
              filtered(clientUsers).length === 0
                ? <p className="text-sm text-muted-foreground text-center py-12">Aucun client trouvé</p>
                : filtered(clientUsers).map((u) => <UserRow key={u.id} user={u} />)
            )}
            {tab === "invitations" && (
              invitations.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-12">Aucune invitation</p>
                : invitations.map((inv) => <InvitationRow key={inv.id} inv={inv} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}