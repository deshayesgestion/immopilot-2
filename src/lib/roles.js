// Rôles internes (accès back-office)
export const INTERNAL_ROLES = ["admin", "responsable_location", "responsable_vente", "agent", "gestionnaire", "comptable"];

// Rôles clients (pas d'accès back-office)
export const CLIENT_ROLES = ["locataire", "proprietaire", "acquereur", "prestataire"];

export const ROLE_LABELS = {
  admin: "Admin",
  responsable_location: "Resp. Location",
  responsable_vente: "Resp. Vente",
  agent: "Agent",
  gestionnaire: "Gestionnaire",
  comptable: "Comptable",
  locataire: "Locataire",
  proprietaire: "Propriétaire",
  acquereur: "Acquéreur",
  prestataire: "Prestataire",
};

export const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-700",
  responsable_location: "bg-blue-100 text-blue-700",
  responsable_vente: "bg-amber-100 text-amber-700",
  agent: "bg-sky-100 text-sky-700",
  gestionnaire: "bg-blue-100 text-blue-700",
  comptable: "bg-emerald-100 text-emerald-700",
  locataire: "bg-orange-100 text-orange-700",
  proprietaire: "bg-amber-100 text-amber-700",
  acquereur: "bg-green-100 text-green-700",
  prestataire: "bg-gray-100 text-gray-600",
};

export const ROLE_DESCRIPTIONS = {
  admin: "Accès complet à tous les modules et paramètres",
  responsable_location: "Gestion location complète, vente et équipe en lecture",
  responsable_vente: "Gestion vente complète, location et équipe en lecture",
  agent: "Gestion des biens, dossiers location et vente",
  gestionnaire: "Gestion locative, suivi et sorties",
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
// - export_sensitive : export de données sensibles via IA (admin uniquement)
export const IA_PERMISSIONS = {
  admin:                { chat: true,  generate: true,  export_sensitive: true  },
  responsable_location: { chat: true,  generate: false, export_sensitive: false },
  responsable_vente:    { chat: true,  generate: false, export_sensitive: false },
  agent:                { chat: true,  generate: true,  export_sensitive: false },
  gestionnaire:         { chat: true,  generate: false, export_sensitive: false },
  comptable:            { chat: false, generate: false, export_sensitive: false },
};

export const ROLE_PERMISSIONS = {
  admin: {
    location:     "full",
    vente:        "full",
    comptabilite: "full",
    parametres:   "full",
    equipe:       "full",
  },
  responsable_location: {
    location:     "write",
    vente:        "read",
    comptabilite: "none",
    parametres:   "none",
    equipe:       "read",
  },
  responsable_vente: {
    location:     "read",
    vente:        "write",
    comptabilite: "none",
    parametres:   "none",
    equipe:       "read",
  },
  agent: {
    location:     "write",
    vente:        "write",
    comptabilite: "none",
    parametres:   "none",
    equipe:       "read",
  },
  gestionnaire: {
    location:     "write",
    vente:        "read",
    comptabilite: "write",
    parametres:   "none",
    equipe:       "read",
  },
  comptable: {
    location:     "read",
    vente:        "read",
    comptabilite: "full",
    parametres:   "none",
    equipe:       "none",
  },
};

// Helper: get permission level for a user on a module
export function getPermission(user, module) {
  const perms = ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.agent;
  return perms[module] || "none";
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
export function canIA(user, feature) {
  const perms = IA_PERMISSIONS[user?.role];
  if (!perms) return false;
  return perms[feature] === true;
}

// Legacy helper kept for backward compatibility
export function getPermissions(user) {
  const modules = ["location", "vente", "comptabilite", "parametres", "equipe"];
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