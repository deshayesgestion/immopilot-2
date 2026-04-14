// Rôles internes (accès back-office)
export const INTERNAL_ROLES = ["admin", "directeur", "responsable", "agent", "gestionnaire", "comptable"];

// Rôles clients (pas d'accès back-office)
export const CLIENT_ROLES = ["locataire", "proprietaire", "acquereur", "prestataire"];

// Rôles avec accès complet à la gestion des utilisateurs internes
export const USER_MANAGEMENT_ROLES = ["directeur", "responsable"];

export const ROLE_LABELS = {
  directeur: "Directeur",
  responsable: "Responsable",
  agent: "Agent",
  gestionnaire: "Gestionnaire",
  comptable: "Comptable",
  locataire: "Locataire",
  proprietaire: "Propriétaire",
  acquereur: "Acquéreur",
  prestataire: "Prestataire",
};

export const ROLE_COLORS = {
  directeur: "bg-purple-100 text-purple-700",
  responsable: "bg-blue-100 text-blue-700",
  agent: "bg-sky-100 text-sky-700",
  gestionnaire: "bg-teal-100 text-teal-700",
  comptable: "bg-emerald-100 text-emerald-700",
  locataire: "bg-orange-100 text-orange-700",
  proprietaire: "bg-amber-100 text-amber-700",
  acquereur: "bg-green-100 text-green-700",
  prestataire: "bg-gray-100 text-gray-600",
};

export const ROLE_DESCRIPTIONS = {
  directeur: "Accès complet à tous les modules, gestion équipe complète",
  responsable: "Gestion complète location/vente, gestion équipe complète",
  agent: "Gestion des biens, dossiers location et vente",
  gestionnaire: "Gestion locative, suivi, sorties et comptabilité",
  comptable: "Accès comptabilité, factures et transactions",
};

// Permission levels: none | read | write | full
// - none  : aucun accès
// - read  : consultation uniquement
// - write : consultation + création + modification
// - full  : write + suppression

// IA permission flags per role:
// - chat             : accès au chat IA
// - generate         : génération de contenu IA (descriptions, relances…)
// - export_sensitive : export de données sensibles via IA (directeur uniquement)
export const IA_PERMISSIONS = {
  directeur:   { chat: true,  generate: true,  export_sensitive: true  },
  responsable: { chat: true,  generate: true,  export_sensitive: false },
  agent:       { chat: true,  generate: true,  export_sensitive: false },
  gestionnaire:{ chat: true,  generate: false, export_sensitive: false },
  comptable:   { chat: false, generate: false, export_sensitive: false },
};

export const ROLE_PERMISSIONS = {
  directeur: {
    location:     "full",
    vente:        "full",
    comptabilite: "full",
    parametres:   "full",
    utilisateurs: "full",
  },
  responsable: {
    location:     "write",
    vente:        "write",
    comptabilite: "read",
    parametres:   "none",
    utilisateurs: "full",
  },
  agent: {
    location:     "write",
    vente:        "write",
    comptabilite: "none",
    parametres:   "none",
    utilisateurs: "none",
  },
  gestionnaire: {
    location:     "write",
    vente:        "read",
    comptabilite: "write",
    parametres:   "none",
    utilisateurs: "none",
  },
  comptable: {
    location:     "read",
    vente:        "read",
    comptabilite: "full",
    parametres:   "none",
    utilisateurs: "none",
  },
};

// Ensemble des rôles valides — tout rôle non listé est traité comme "none"
const ALL_ROLES = new Set([...INTERNAL_ROLES, ...CLIENT_ROLES]);

// Helper: get permission level for a user on a module
// SECURITY: no implicit fallback — unknown/missing role = "none" everywhere
export function getPermission(user, module) {
  const role = user?.role;
  if (!role || !ALL_ROLES.has(role)) return "none";
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return "none";
  return perms[module] ?? "none";
}

// Helper: check if a user can perform an action on a module
// Actions: "voir" | "creer" | "modifier" | "supprimer"
export function can(user, module, action) {
  const level = getPermission(user, module);
  switch (action) {
    case "voir":      return level !== "none";
    case "creer":     return level === "write" || level === "full";
    case "modifier":  return level === "write" || level === "full";
    case "supprimer": return level === "full";
    default:          return false;
  }
}

// Helper: check IA capabilities for a user
// feature: "chat" | "generate" | "export_sensitive"
// SECURITY: unknown role = no IA access
export function canIA(user, feature) {
  const role = user?.role;
  if (!role || !ALL_ROLES.has(role)) return false;
  const perms = IA_PERMISSIONS[role];
  if (!perms) return false;
  return perms[feature] === true;
}

// Guard: throws if user does not have required permission (for use in UI guards)
// Usage: assertCan(user, "comptabilite", "supprimer") — throws if not allowed
export function assertCan(user, module, action) {
  if (!can(user, module, action)) {
    throw new Error(`[RBAC] Accès refusé : rôle "${user?.role}" ne peut pas "${action}" sur "${module}"`);
  }
}

// Guard: throws if user does not have required IA feature
export function assertCanIA(user, feature) {
  if (!canIA(user, feature)) {
    throw new Error(`[RBAC] Accès IA refusé : rôle "${user?.role}" ne peut pas utiliser "${feature}"`);
  }
}

// Guard: throws if user is not an internal role (blocks all CLIENT_ROLES from back-office)
export function assertInternalRole(user) {
  if (!user?.role || !INTERNAL_ROLES.includes(user.role)) {
    throw new Error(`[RBAC] Accès back-office refusé pour le rôle "${user?.role}"`);
  }
}

// Guard: throws if user is not directeur or responsable (user management access)
export function assertCanManageUsers(user) {
  if (!USER_MANAGEMENT_ROLES.includes(user?.role)) {
    throw new Error(`[RBAC] Accès gestion utilisateurs refusé — rôle actuel : "${user?.role}"`);
  }
}

// Guard: throws if user is not directeur
export function assertDirecteur(user) {
  if (user?.role !== "directeur") {
    throw new Error(`[RBAC] Accès directeur requis — rôle actuel : "${user?.role}"`);
  }
}

// Legacy helper kept for backward compatibility
export function getPermissions(user) {
  const modules = ["location", "vente", "comptabilite", "parametres", "utilisateurs"];
  const result = {};
  for (const mod of modules) {
    const level = getPermission(user, mod);
    result[mod] = {
      voir:      level !== "none",
      creer:     level === "write" || level === "full",
      modifier:  level === "write" || level === "full",
      supprimer: level === "full",
    };
  }
  // IA permissions (granular)
  result.ia = IA_PERMISSIONS[user?.role] || { chat: false, generate: false, export_sensitive: false };
  return result;
}