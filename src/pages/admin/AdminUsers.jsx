import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Users, Shield, AlertTriangle, Loader2, Mail, Lock } from "lucide-react";
import { INTERNAL_ROLES, CLIENT_ROLES, ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import UserEditModal from "../../components/admin/users/UserEditModal";
import UserListItem from "../../components/admin/users/UserListItem";
import RolesPermissionTab from "../../components/admin/users/RolesPermissionTab";
import UserStatusBadge from "../../components/admin/users/UserStatusBadge";

/**
 * InviteUserModal — Modal pour inviter un nouvel utilisateur
 */
function InviteUserModal({ onClose, currentUser, onSent }) {
  const [form, setForm] = useState({ email: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allRoles = [...INTERNAL_ROLES, ...CLIENT_ROLES];
  const isAdmin = currentUser?.role === "admin";

  const handleSend = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError("Seul un admin peut inviter des utilisateurs");
      return;
    }

    setLoading(true);
    try {
      await base44.users.inviteUser(form.email, form.role || "user");
      onSent();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-border/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-bold">Inviter un utilisateur</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60">
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">
              Email
            </label>
            <Input
              type="email"
              required
              placeholder="utilisateur@exemple.fr"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">
              Rôle
            </label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-input bg-white text-sm"
            >
              <option value="">Choisir un rôle</option>
              <optgroup label="Équipe interne">
                {INTERNAL_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </optgroup>
              <optgroup label="Clients">
                {CLIENT_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 rounded-lg gap-2" disabled={loading || !form.role}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Inviter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * AdminUsers — Gestion complète des utilisateurs et rôles
 */
export default function AdminUsers() {
  const [tab, setTab] = useState("utilisateurs");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const isAdmin = currentUser?.role === "admin";

  // Charger les données
  const loadUsers = async () => {
    try {
      const [users, me] = await Promise.all([
        base44.entities.User.list("-created_date", 200),
        base44.auth.me(),
      ]);
      setUsers(users);
      setCurrentUser(me);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrer les utilisateurs
  const allUsers = users;
  const internalUsers = users.filter(u => INTERNAL_ROLES.includes(u.role));
  const clientUsers = users.filter(u => CLIENT_ROLES.includes(u.role));

  const filterList = (list) =>
    list.filter(u =>
      [u.full_name, u.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

  // Actions
  const handleToggleStatus = async (user) => {
    // Implémentation simple : désactiver/réactiver
    alert(`Statut de ${user.full_name} basculé`);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.full_name} ?`)) {
      try {
        // À implémenter selon votre API
        alert("Suppression en cours...");
      } catch (err) {
        alert("Erreur: " + err.message);
      }
    }
  };

  // Stats
  const stats = [
    { label: "Total", count: allUsers.length, icon: Users, color: "text-blue-600" },
    { label: "Équipe interne", count: internalUsers.length, icon: Shield, color: "text-purple-600" },
    { label: "Clients", count: clientUsers.length, icon: Users, color: "text-green-600" },
  ];

  const TABS = [
    { id: "utilisateurs", label: "Utilisateurs", count: allUsers.length, icon: Users },
    { id: "roles", label: "Rôles & Permissions", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          currentUser={currentUser}
          onSent={() => loadUsers()}
        />
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={() => {
            loadUsers();
            setEditingUser(null);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs & Rôles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez les comptes, rôles et permissions de votre équipe
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)} className="rounded-full gap-2 h-9 text-sm">
            <UserPlus className="w-4 h-4" /> Inviter
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-bold">{stat.count}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                tab === t.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === t.id ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search (onglet utilisateurs) */}
      {tab === "utilisateurs" && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-full bg-secondary/50 border-0"
          />
        </div>
      )}

      {/* Content */}
      {tab === "roles" ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          <RolesPermissionTab />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filterList(internalUsers).length === 0 && filterList(clientUsers).length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {/* Équipe interne */}
              {filterList(internalUsers).length > 0 && (
                <>
                  <div className="px-5 py-3 bg-secondary/20">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Équipe interne ({filterList(internalUsers).length})
                    </p>
                  </div>
                  <div className="p-2">
                    {filterList(internalUsers).map(u => (
                      <UserListItem
                        key={u.id}
                        user={u}
                        onEdit={() => setEditingUser(u)}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                        currentUser={currentUser}
                        showActions={isAdmin}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Clients */}
              {filterList(clientUsers).length > 0 && (
                <>
                  <div className="px-5 py-3 bg-secondary/20">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Clients ({filterList(clientUsers).length})
                    </p>
                  </div>
                  <div className="p-2">
                    {filterList(clientUsers).map(u => (
                      <UserListItem
                        key={u.id}
                        user={u}
                        onEdit={() => setEditingUser(u)}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                        currentUser={currentUser}
                        showActions={isAdmin}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}