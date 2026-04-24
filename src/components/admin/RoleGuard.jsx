/**
 * RoleGuard — Protège une page ou une section selon le rôle RBAC.
 *
 * Usage :
 *   <RoleGuard module="comptabilite" action="voir">
 *     <ModuleComptabilite />
 *   </RoleGuard>
 *
 *   <RoleGuard roles={["admin", "directeur"]}>
 *     <AdminSettings />
 *   </RoleGuard>
 */
import { useUser } from "@/lib/UserContext";
import { Lock, ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function RoleGuard({ children, module, action = "voir", roles, fallback }) {
  const { user, role, can, loading } = useUser();

  if (loading) return null;

  let allowed = true;

  // Check by explicit roles list
  if (roles && roles.length > 0) {
    allowed = roles.includes(role);
  }
  // Check by module+action
  else if (module) {
    allowed = can(module, action);
  }

  if (!allowed) {
    if (fallback) return fallback;
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Accès restreint</h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          Votre rôle <span className="font-semibold">«&nbsp;{role}&nbsp;»</span> ne vous permet pas d'accéder à cette section.
        </p>
        <Link to="/admin" className="text-xs text-primary hover:underline">← Retour au dashboard</Link>
      </div>
    );
  }

  return children;
}

// Inline guard for small UI sections (ne rend rien si non autorisé)
export function CanDo({ module, action = "voir", roles, children }) {
  const { role, can, loading } = useUser();
  if (loading) return null;
  if (roles) return roles.includes(role) ? children : null;
  if (module) return can(module, action) ? children : null;
  return children;
}