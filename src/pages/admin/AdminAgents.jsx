import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus, Search, Users, UserCheck, Mail, X, Loader2, CheckCircle,
  Shield, ChevronRight, Phone, MoreHorizontal
} from "lucide-react";
import { INTERNAL_ROLES, CLIENT_ROLES, ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS } from "@/lib/roles";
import UserDetailModal from "../../components/admin/equipe/UserDetailModal";
import RoleCard from "../../components/admin/equipe/RoleCard";

function InviteModal({ onClose, currentUser }) {
  const [form, setForm] = useState({ email: "", role: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const allRoles = [...INTERNAL_ROLES, ...CLIENT_ROLES];

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Invitation.create({ ...form, invited_by: currentUser?.email });
    await base44.users.inviteUser(form.email, "user");
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-border/50" onClick={e => e.stopPropagation()}>
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
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Adresse email</label>
                <Input required type="email" placeholder="email@exemple.fr" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rôle</label>
                <Select required value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wide">Équipe interne</div>
                    {INTERNAL_ROLES.map(r => (
                      <SelectItem key={r} value={r}>
                        <span className="font-medium">{ROLE_LABELS[r]}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]?.split(" ").slice(0, 4).join(" ")}…</span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-1">Clients</div>
                    {CLIENT_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message <span className="text-muted-foreground font-normal">(optionnel)</span></label>
                <Textarea placeholder="Message personnalisé..." value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="rounded-xl resize-none min-h-[70px]" />
              </div>
              <Button type="submit" className="w-full rounded-full gap-2" disabled={loading || !form.role}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Envoyer l'invitation</>}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onClick }) {
  const statusColor = { actif: "bg-green-500", inactif: "bg-gray-300", invite: "bg-amber-400" };
  return (
    <div onClick={onClick}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors rounded-xl cursor-pointer group">
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground/70 flex-shrink-0">
          {(user.full_name || user.email || "?")[0].toUpperCase()}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor[user.statut] || "bg-gray-300"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.full_name || "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      {user.phone && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="w-3 h-3" /> {user.phone}
        </div>
      )}
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_COLORS[user.role] || "bg-secondary text-muted-foreground"}`}>
        {ROLE_LABELS[user.role] || user.role}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
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
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[inv.role] || "bg-secondary"}`}>
        {ROLE_LABELS[inv.role] || inv.role}
      </span>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[inv.statut] || ""}`}>
        {statusLabels[inv.statut] || inv.statut}
      </span>
    </div>
  );
}

export default function AdminAgents() {
  const [tab, setTab] = useState("equipe");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = () => {
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
  };

  useEffect(() => { load(); }, []);

  const internalUsers = users.filter(u => INTERNAL_ROLES.includes(u.role));
  const clientUsers = users.filter(u => CLIENT_ROLES.includes(u.role));

  const filterList = (list) =>
    list.filter(u => [u.full_name, u.email].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  const roleCounts = {};
  INTERNAL_ROLES.forEach(r => { roleCounts[r] = users.filter(u => u.role === r).length; });

  const TABS = [
    { id: "equipe", label: "Équipe interne", count: internalUsers.length, icon: UserCheck },
    { id: "roles", label: "Rôles & Permissions", icon: Shield },
    { id: "clients", label: "Clients", count: clientUsers.length, icon: Users },
    { id: "invitations", label: "Invitations", count: invitations.length, icon: Mail },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} currentUser={currentUser} />}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => { load(); setSelectedUser(null); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de l'équipe</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Utilisateurs, rôles, permissions et attributions</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="rounded-full gap-2 h-9 text-sm">
          <UserPlus className="w-4 h-4" /> Inviter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INTERNAL_ROLES.map(r => (
          <div key={r} className="bg-white rounded-2xl border border-border/50 p-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[r]}`}>{ROLE_LABELS[r]}</span>
            <p className="text-2xl font-bold mt-2">{roleCounts[r]}</p>
            <p className="text-xs text-muted-foreground">utilisateur{roleCounts[r] > 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search (for list tabs) */}
      {tab !== "roles" && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
        </div>
      )}

      {/* Content */}
      {tab === "roles" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INTERNAL_ROLES.map(r => (
            <RoleCard key={r} role={r} count={roleCounts[r]} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-2">
              {tab === "equipe" && (
                filterList(internalUsers).length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-12">Aucun membre trouvé</p>
                  : filterList(internalUsers).map(u => (
                    <UserRow key={u.id} user={u} onClick={() => setSelectedUser(u)} />
                  ))
              )}
              {tab === "clients" && (
                filterList(clientUsers).length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-12">Aucun client trouvé</p>
                  : filterList(clientUsers).map(u => (
                    <UserRow key={u.id} user={u} onClick={() => setSelectedUser(u)} />
                  ))
              )}
              {tab === "invitations" && (
                invitations.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-12">Aucune invitation</p>
                  : invitations.map(inv => <InvitationRow key={inv.id} inv={inv} />)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}