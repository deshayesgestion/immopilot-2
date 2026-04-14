import { MoreHorizontal, Mail, Lock, Unlock, Trash2 } from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import UserStatusBadge from "./UserStatusBadge";

/**
 * UserListItem — Ligne d'utilisateur dans la liste
 */
export default function UserListItem({ user, onEdit, onToggleStatus, onDelete, currentUser, showActions = true }) {
  const isCurrentUser = currentUser?.id === user.id;
  const isInactive = user.role === "inactif" || !user.id; // Détection basique d'inactivité

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors rounded-xl group">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
        {(user.full_name || user.email || "?")[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{user.full_name || user.email || "—"}</p>
          {isCurrentUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              Vous
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Rôle */}
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_COLORS[user.role] || "bg-secondary text-muted-foreground"}`}>
        {ROLE_LABELS[user.role] || "Inconnu"}
      </span>

      {/* Status */}
      {showActions && <UserStatusBadge status={isInactive ? "inactif" : "actif"} />}

      {/* Menu action (visible au hover) */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
            title="Modifier"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleStatus(user)}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
            title={isInactive ? "Réactiver" : "Désactiver"}
          >
            {isInactive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          {!isCurrentUser && (
            <button
              onClick={() => onDelete(user)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}