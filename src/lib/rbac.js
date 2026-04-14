/**
 * RBAC Backend Middleware — ImmoPilot
 *
 * Usage in backend functions (Deno):
 *
 *   import { requirePermission, requireAdmin, requireInternalRole } from '../lib/rbac.js';
 *
 *   Deno.serve(async (req) => {
 *     const base44 = createClientFromRequest(req);
 *     const user = await base44.auth.me();
 *
 *     const denied = requireInternalRole(user);
 *     if (denied) return denied;
 *
 *     const denied2 = requirePermission(user, "comptabilite", "supprimer");
 *     if (denied2) return denied2;
 *
 *     // ... logique métier
 *   });
 */

// ── PERMISSION MATRIX ────────────────────────────────────────────────────

const INTERNAL_ROLES = ["admin", "responsable_location", "responsable_vente", "agent", "gestionnaire", "comptable"];

const ROLE_PERMISSIONS = {
  admin:                { location: "full",  vente: "full",  comptabilite: "full",  parametres: "full",  equipe: "full"  },
  responsable_location: { location: "write", vente: "read",  comptabilite: "none",  parametres: "none",  equipe: "read"  },
  responsable_vente:    { location: "read",  vente: "write", comptabilite: "none",  parametres: "none",  equipe: "read"  },
  agent:                { location: "write", vente: "write", comptabilite: "none",  parametres: "none",  equipe: "read"  },
  gestionnaire:         { location: "write", vente: "read",  comptabilite: "write", parametres: "none",  equipe: "read"  },
  comptable:            { location: "read",  vente: "read",  comptabilite: "full",  parametres: "none",  equipe: "none"  },
};

const IA_PERMISSIONS = {
  admin:                { chat: true,  generate: true,  export_sensitive: true  },
  responsable_location: { chat: true,  generate: false, export_sensitive: false },
  responsable_vente:    { chat: true,  generate: false, export_sensitive: false },
  agent:                { chat: true,  generate: true,  export_sensitive: false },
  gestionnaire:         { chat: true,  generate: false, export_sensitive: false },
  comptable:            { chat: false, generate: false, export_sensitive: false },
};

// ── CORE HELPERS ─────────────────────────────────────────────────────────

function getPermissionLevel(user, module) {
  const role = user?.role;
  if (!role || !ROLE_PERMISSIONS[role]) return "none";
  return ROLE_PERMISSIONS[role][module] ?? "none";
}

function checkCan(user, module, action) {
  const level = getPermissionLevel(user, module);
  switch (action) {
    case "voir":      return level !== "none";
    case "creer":     return level === "write" || level === "full";
    case "modifier":  return level === "write" || level === "full";
    case "supprimer": return level === "full";
    default:          return false;
  }
}

function checkCanIA(user, feature) {
  const role = user?.role;
  if (!role) return false;
  return IA_PERMISSIONS[role]?.[feature] === true;
}

// ── RESPONSE HELPERS ─────────────────────────────────────────────────────

function denied(message, status = 403) {
  return Response.json({ error: message, code: "RBAC_DENIED" }, { status });
}

function unauthorized() {
  return Response.json({ error: "Authentification requise", code: "UNAUTHENTICATED" }, { status: 401 });
}

// ── MIDDLEWARE GUARDS ────────────────────────────────────────────────────

/**
 * Blocks unauthenticated requests.
 * Returns a 401 Response if user is null/undefined, null otherwise.
 */
export function requireAuth(user) {
  if (!user?.email) return unauthorized();
  return null;
}

/**
 * Blocks CLIENT_ROLES from accessing back-office routes.
 * Returns a 403 Response if user is not an internal role, null otherwise.
 */
export function requireInternalRole(user) {
  const authCheck = requireAuth(user);
  if (authCheck) return authCheck;
  if (!INTERNAL_ROLES.includes(user.role)) {
    return denied(`Accès back-office refusé pour le rôle "${user.role}"`);
  }
  return null;
}

/**
 * Requires admin role.
 * Returns a 403 Response if user is not admin, null otherwise.
 */
export function requireAdmin(user) {
  const authCheck = requireAuth(user);
  if (authCheck) return authCheck;
  if (user.role !== "admin") {
    return denied(`Accès admin requis — rôle actuel : "${user.role}"`);
  }
  return null;
}

/**
 * Requires a specific permission on a module.
 * Actions: "voir" | "creer" | "modifier" | "supprimer"
 * Returns a 403 Response if permission denied, null otherwise.
 *
 * Example: requirePermission(user, "comptabilite", "supprimer")
 */
export function requirePermission(user, module, action) {
  const internalCheck = requireInternalRole(user);
  if (internalCheck) return internalCheck;
  if (!checkCan(user, module, action)) {
    return denied(`Permission refusée : "${user.role}" ne peut pas "${action}" sur "${module}"`);
  }
  return null;
}

/**
 * Requires an IA feature access.
 * Features: "chat" | "generate" | "export_sensitive"
 * Returns a 403 Response if IA access denied, null otherwise.
 *
 * Example: requireIA(user, "export_sensitive")
 */
export function requireIA(user, feature) {
  const internalCheck = requireInternalRole(user);
  if (internalCheck) return internalCheck;
  if (!checkCanIA(user, feature)) {
    return denied(`Accès IA refusé : "${user.role}" ne peut pas utiliser "${feature}"`);
  }
  return null;
}

/**
 * Prevents privilege escalation: a user cannot assign a role
 * higher than or equal to their own (except admin who can assign anything).
 *
 * Returns a 403 Response if escalation detected, null otherwise.
 */
const ROLE_HIERARCHY = {
  admin: 100,
  responsable_location: 60,
  responsable_vente: 60,
  agent: 40,
  gestionnaire: 40,
  comptable: 30,
  locataire: 10,
  proprietaire: 10,
  acquereur: 10,
  prestataire: 10,
};

export function requireNoEscalation(actingUser, targetRole) {
  const actorLevel = ROLE_HIERARCHY[actingUser?.role] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  if (actorLevel < 100 && targetLevel >= actorLevel) {
    return denied(
      `Escalade de privilège refusée : "${actingUser?.role}" (niveau ${actorLevel}) ne peut pas attribuer le rôle "${targetRole}" (niveau ${targetLevel})`
    );
  }
  return null;
}