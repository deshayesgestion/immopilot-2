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

// Définition des permissions par rôle
// modules: location, vente, comptabilite, parametres, equipe
// actions: voir, creer, modifier, supprimer
export const ROLE_PERMISSIONS = {
  admin: {
    location: { voir: true, creer: true, modifier: true, supprimer: true },
    vente: { voir: true, creer: true, modifier: true, supprimer: true },
    comptabilite: { voir: true, creer: true, modifier: true, supprimer: true },
    parametres: { voir: true, creer: true, modifier: true, supprimer: true },
    equipe: { voir: true, creer: true, modifier: true, supprimer: true },
    ia: { voir: true, creer: true, modifier: true, supprimer: true },
  },
  agent: {
    location: { voir: true, creer: true, modifier: true, supprimer: false },
    vente: { voir: true, creer: true, modifier: true, supprimer: false },
    comptabilite: { voir: false, creer: false, modifier: false, supprimer: false },
    parametres: { voir: false, creer: false, modifier: false, supprimer: false },
    equipe: { voir: true, creer: false, modifier: false, supprimer: false },
    ia: { voir: true, creer: true, modifier: false, supprimer: false },
  },
  gestionnaire: {
    location: { voir: true, creer: true, modifier: true, supprimer: false },
    vente: { voir: true, creer: false, modifier: false, supprimer: false },
    comptabilite: { voir: true, creer: true, modifier: true, supprimer: false },
    parametres: { voir: false, creer: false, modifier: false, supprimer: false },
    equipe: { voir: true, creer: false, modifier: false, supprimer: false },
    ia: { voir: true, creer: false, modifier: false, supprimer: false },
  },
  responsable_location: {
    location: { voir: true, creer: true, modifier: true, supprimer: false },
    vente: { voir: true, creer: false, modifier: false, supprimer: false },
    comptabilite: { voir: false, creer: false, modifier: false, supprimer: false },
    parametres: { voir: false, creer: false, modifier: false, supprimer: false },
    equipe: { voir: true, creer: false, modifier: false, supprimer: false },
    ia: { voir: true, creer: false, modifier: false, supprimer: false },
  },
  responsable_vente: {
    location: { voir: true, creer: false, modifier: false, supprimer: false },
    vente: { voir: true, creer: true, modifier: true, supprimer: false },
    comptabilite: { voir: false, creer: false, modifier: false, supprimer: false },
    parametres: { voir: false, creer: false, modifier: false, supprimer: false },
    equipe: { voir: true, creer: false, modifier: false, supprimer: false },
    ia: { voir: true, creer: false, modifier: false, supprimer: false },
  },
  comptable: {
    location: { voir: true, creer: false, modifier: false, supprimer: false },
    vente: { voir: true, creer: false, modifier: false, supprimer: false },
    comptabilite: { voir: true, creer: true, modifier: true, supprimer: true },
    parametres: { voir: false, creer: false, modifier: false, supprimer: false },
    equipe: { voir: false, creer: false, modifier: false, supprimer: false },
    ia: { voir: false, creer: false, modifier: false, supprimer: false },
  },
};

export function getPermissions(user) {
  const base = ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.agent;
  if (!user?.permissions) return base;
  // Merge custom permissions (override)
  const merged = {};
  for (const mod of Object.keys(base)) {
    merged[mod] = { ...base[mod], ...(user.permissions[mod] || {}) };
  }
  return merged;
}

export function can(user, module, action) {
  const perms = getPermissions(user);
  return perms[module]?.[action] === true;
}