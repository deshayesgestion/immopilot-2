// ─── Rôles internes (accès back-office) ─────────────────────────────────────
export const INTERNAL_ROLES = [
  "admin",               // 👑 Accès total
  "directeur",           // 👑 Alias legacy admin
  "responsable_location",// 🏠 Module location uniquement
  "responsable_vente",   // 🏡 Module vente uniquement
  "comptable",           // 💰 Module comptabilité uniquement
  "agent",               // 👤 Ses dossiers/biens/tâches
  "gestionnaire",        // 🔑 Gestion locative + compta partielle
  "responsable",         // Legacy — traité comme admin
];

// Rôles clients (pas d'accès back-office)
export const CLIENT_ROLES = ["locataire", "proprietaire", "acquereur", "prestataire"];

// Rôles pouvant gérer les utilisateurs
export const USER_MANAGEMENT_ROLES = ["admin", "directeur", "responsable"];

// ─── Labels & couleurs ───────────────────────────────────────────────────────
export const ROLE_LABELS = {
  admin:                "Admin Agence",
  directeur:            "Directeur",
  responsable_location: "Resp. Location",
  responsable_vente:    "Resp. Vente",
  comptable:            "Comptable",
  agent:                "Agent",
  gestionnaire:         "Gestionnaire",
  responsable:          "Responsable",
  locataire:            "Locataire",
  proprietaire:         "Propriétaire",
  acquereur:            "Acquéreur",
  prestataire:          "Prestataire",
};

export const ROLE_COLORS = {
  admin:                "bg-purple-100 text-purple-700",
  directeur:            "bg-purple-100 text-purple-700",
  responsable_location: "bg-blue-100 text-blue-700",
  responsable_vente:    "bg-green-100 text-green-700",
  comptable:            "bg-emerald-100 text-emerald-700",
  agent:                "bg-sky-100 text-sky-700",
  gestionnaire:         "bg-teal-100 text-teal-700",
  responsable:          "bg-indigo-100 text-indigo-700",
  locataire:            "bg-orange-100 text-orange-700",
  proprietaire:         "bg-amber-100 text-amber-700",
  acquereur:            "bg-lime-100 text-lime-700",
  prestataire:          "bg-gray-100 text-gray-600",
};

export const ROLE_DESCRIPTIONS = {
  admin:                "Accès total — configuration système, IA, tous modules, gestion utilisateurs",
  directeur:            "Accès complet à tous les modules (alias admin legacy)",
  responsable_location: "Module location uniquement — dossiers, EDL, bail, loyers, compta lecture",
  responsable_vente:    "Module vente uniquement — mandats, visites, offres, CRM acquéreurs",
  comptable:            "Module comptabilité uniquement — factures, rapprochement, exports",
  agent:                "Ses dossiers, ses biens, ses tâches — pas d'accès compta ni config",
  gestionnaire:         "Gestion locative complète + comptabilité partielle",
  responsable:          "Gestion complète location/vente (legacy)",
};

// ─── Permissions par module ───────────────────────────────────────────────────
// Niveaux : none < read < write < full
// none  : aucun accès
// read  : lecture seule
// write : lecture + création + modification
// full  : write + suppression + config

export const ROLE_PERMISSIONS = {
  admin: {
    location:     "full",
    vente:        "full",
    comptabilite: "full",
    biens:        "full",
    parametres:   "full",
    utilisateurs: "full",
    ia:           "full",
    signatures:   "full",
    agenda:       "full",
    taches:       "full",
    communications:"full",
    bi:           "full",
    agents:       "full",
  },
  directeur: {
    location:     "full",
    vente:        "full",
    comptabilite: "full",
    biens:        "full",
    parametres:   "full",
    utilisateurs: "full",
    ia:           "full",
    signatures:   "full",
    agenda:       "full",
    taches:       "full",
    communications:"full",
    bi:           "full",
    agents:       "full",
  },
  responsable: {
    location:     "write",
    vente:        "write",
    comptabilite: "read",
    biens:        "write",
    parametres:   "none",
    utilisateurs: "write",
    ia:           "read",
    signatures:   "write",
    agenda:       "write",
    taches:       "write",
    communications:"write",
    bi:           "read",
    agents:       "read",
  },
  responsable_location: {
    location:     "full",
    vente:        "none",
    comptabilite: "read",
    biens:        "write",
    parametres:   "none",
    utilisateurs: "none",
    ia:           "read",
    signatures:   "write",
    agenda:       "write",
    taches:       "write",
    communications:"write",
    bi:           "read",
    agents:       "none",
  },
  responsable_vente: {
    location:     "none",
    vente:        "full",
    comptabilite: "none",
    biens:        "write",
    parametres:   "none",
    utilisateurs: "none",
    ia:           "read",
    signatures:   "write",
    agenda:       "write",
    taches:       "write",
    communications:"write",
    bi:           "read",
    agents:       "none",
  },
  comptable: {
    location:     "read",
    vente:        "read",
    comptabilite: "full",
    biens:        "read",
    parametres:   "none",
    utilisateurs: "none",
    ia:           "none",
    signatures:   "read",
    agenda:       "read",
    taches:       "read",
    communications:"none",
    bi:           "read",
    agents:       "none",
  },
  agent: {
    location:     "write",
    vente:        "write",
    comptabilite: "none",
    biens:        "write",
    parametres:   "none",
    utilisateurs: "none",
    ia:           "read",
    signatures:   "write",
    agenda:       "write",
    taches:       "write",
    communications:"read",
    bi:           "none",
    agents:       "none",
  },
  gestionnaire: {
    location:     "write",
    vente:        "read",
    comptabilite: "write",
    biens:        "write",
    parametres:   "none",
    utilisateurs: "none",
    ia:           "read",
    signatures:   "write",
    agenda:       "write",
    taches:       "write",
    communications:"read",
    bi:           "none",
    agents:       "none",
  },
};

// ─── Permissions IA ──────────────────────────────────────────────────────────
export const IA_PERMISSIONS = {
  admin:                { chat: true,  generate: true,  export_sensitive: true  },
  directeur:            { chat: true,  generate: true,  export_sensitive: true  },
  responsable:          { chat: true,  generate: true,  export_sensitive: false },
  responsable_location: { chat: true,  generate: false, export_sensitive: false },
  responsable_vente:    { chat: true,  generate: false, export_sensitive: false },
  agent:                { chat: true,  generate: true,  export_sensitive: false },
  gestionnaire:         { chat: true,  generate: false, export_sensitive: false },
  comptable:            { chat: false, generate: false, export_sensitive: false },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL_ROLES = new Set([...INTERNAL_ROLES, ...CLIENT_ROLES]);

export function getPermission(user, module) {
  const role = user?.role;
  if (!role || !ALL_ROLES.has(role)) return "none";
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return "none";
  return perms[module] ?? "none";
}

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

export function canIA(user, feature) {
  const role = user?.role;
  if (!role || !ALL_ROLES.has(role)) return false;
  const perms = IA_PERMISSIONS[role];
  if (!perms) return false;
  return perms[feature] === true;
}

export function assertCan(user, module, action) {
  if (!can(user, module, action)) {
    throw new Error(`[RBAC] Accès refusé : rôle "${user?.role}" ne peut pas "${action}" sur "${module}"`);
  }
}

export function assertCanIA(user, feature) {
  if (!canIA(user, feature)) {
    throw new Error(`[RBAC] Accès IA refusé : rôle "${user?.role}" ne peut pas utiliser "${feature}"`);
  }
}

export function assertInternalRole(user) {
  if (!user?.role || !INTERNAL_ROLES.includes(user.role)) {
    throw new Error(`[RBAC] Accès back-office refusé pour le rôle "${user?.role}"`);
  }
}

export function assertCanManageUsers(user) {
  if (!USER_MANAGEMENT_ROLES.includes(user?.role)) {
    throw new Error(`[RBAC] Gestion utilisateurs refusée — rôle actuel : "${user?.role}"`);
  }
}

export function assertDirecteur(user) {
  if (user?.role !== "directeur" && user?.role !== "admin") {
    throw new Error(`[RBAC] Accès admin requis — rôle actuel : "${user?.role}"`);
  }
}

// ─── Legacy compat ───────────────────────────────────────────────────────────
export function getPermissions(user) {
  const modules = ["location", "vente", "comptabilite", "biens", "parametres", "utilisateurs", "ia", "signatures", "bi"];
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
  result.ia = IA_PERMISSIONS[user?.role] || { chat: false, generate: false, export_sensitive: false };
  return result;
}

// Hiérarchie pour anti-escalade
export const ROLE_HIERARCHY = {
  admin: 100, directeur: 100,
  responsable: 80,
  responsable_location: 60, responsable_vente: 60,
  gestionnaire: 40, agent: 40,
  comptable: 30,
  locataire: 10, proprietaire: 10, acquereur: 10, prestataire: 10,
};