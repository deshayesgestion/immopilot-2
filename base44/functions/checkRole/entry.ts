/**
 * checkRole — Middleware RBAC centralisé pour les fonctions backend ImmoPilot
 *
 * Importez directement les fonctions dans vos autres fonctions backend :
 *
 *   const { checkRole, RBAC } = await import('./checkRole.js');
 *
 *   const denied = await checkRole(base44, RBAC.COMPTABILITE.WRITE);
 *   if (denied) return denied;
 *
 * Ce fichier expose aussi un endpoint GET /checkRole?ping=1 pour vérifier
 * qu'il est bien déployé (retourne { ok: true }).
 */

// ── PERMISSION MATRIX ────────────────────────────────────────────────────────

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

// ── PERMISSION CONSTANTS ─────────────────────────────────────────────────────

export const RBAC = {
  LOCATION:     { READ: { module:"location",     action:"voir" },  WRITE: { module:"location",     action:"creer" },  DELETE: { module:"location",     action:"supprimer" } },
  VENTE:        { READ: { module:"vente",         action:"voir" },  WRITE: { module:"vente",         action:"creer" },  DELETE: { module:"vente",         action:"supprimer" } },
  COMPTABILITE: { READ: { module:"comptabilite",  action:"voir" },  WRITE: { module:"comptabilite",  action:"creer" },  DELETE: { module:"comptabilite",  action:"supprimer" } },
  EQUIPE:       { READ: { module:"equipe",        action:"voir" },  WRITE: { module:"equipe",        action:"creer" },  DELETE: { module:"equipe",        action:"supprimer" } },
  PARAMETRES:   { READ: { module:"parametres",    action:"voir" },  WRITE: { module:"parametres",    action:"creer" },  DELETE: { module:"parametres",    action:"supprimer" } },
  IA: {
    CHAT:             { ia: "chat"             },
    GENERATE:         { ia: "generate"         },
    EXPORT_SENSITIVE: { ia: "export_sensitive" },
  },
  ADMIN_ONLY:    { role: "admin"    },
  INTERNAL_ONLY: { role: "internal" },
};

// ── HELPERS INTERNES ─────────────────────────────────────────────────────────

function _getLevel(role, module) {
  if (!role || !ROLE_PERMISSIONS[role]) return "none";
  return ROLE_PERMISSIONS[role][module] ?? "none";
}

function _checkModule(role, module, action) {
  const level = _getLevel(role, module);
  if (action === "voir")      return level !== "none";
  if (action === "creer" || action === "modifier") return level === "write" || level === "full";
  if (action === "supprimer") return level === "full";
  return false;
}

function _checkIa(role, feature) {
  if (!role || !IA_PERMISSIONS[role]) return false;
  return IA_PERMISSIONS[role][feature] === true;
}

function _denied(message, code = "ACCESS_DENIED") {
  return Response.json({ error: message, code, timestamp: new Date().toISOString() }, { status: 403 });
}

function _unauth() {
  return Response.json({ error: "Authentification requise", code: "UNAUTHENTICATED", timestamp: new Date().toISOString() }, { status: 401 });
}

// ── EXPORTS PUBLICS ───────────────────────────────────────────────────────────

/**
 * checkRole(base44, permission | permission[])
 *
 * Vérifie l'authentification + la/les permissions requises.
 * @returns {Promise<Response|null>} null si autorisé, Response erreur sinon.
 *
 * Exemples:
 *   await checkRole(base44, RBAC.COMPTABILITE.WRITE)
 *   await checkRole(base44, [RBAC.LOCATION.READ, RBAC.IA.GENERATE])
 *   await checkRole(base44, RBAC.ADMIN_ONLY)
 */
export async function checkRole(base44, permissions) {
  let user;
  try { user = await base44.auth.me(); } catch { return _unauth(); }
  if (!user?.email) return _unauth();

  const role = user.role;
  const list = Array.isArray(permissions) ? permissions : [permissions];

  for (const perm of list) {
    if (perm.role === "admin") {
      if (role !== "admin") return _denied(`Accès admin requis — rôle actuel : "${role}"`);
      continue;
    }
    if (perm.role === "internal") {
      if (!INTERNAL_ROLES.includes(role)) return _denied(`Accès back-office refusé pour le rôle "${role}"`);
      continue;
    }
    if (perm.ia) {
      if (!INTERNAL_ROLES.includes(role)) return _denied(`Accès IA refusé pour le rôle "${role}"`);
      if (!_checkIa(role, perm.ia)) return _denied(`Accès IA refusé : "${role}" ne peut pas utiliser "${perm.ia}"`);
      continue;
    }
    if (perm.module && perm.action) {
      if (!INTERNAL_ROLES.includes(role)) return _denied(`Accès back-office refusé pour le rôle "${role}"`);
      if (!_checkModule(role, perm.module, perm.action)) {
        return _denied(`Permission refusée : "${role}" ne peut pas "${perm.action}" sur "${perm.module}"`);
      }
      continue;
    }
  }
  return null; // ✅ Autorisé
}

/**
 * checkNoEscalation(actingUser, targetRole)
 * Empêche d'attribuer un rôle >= au sien (sauf admin).
 */
export function checkNoEscalation(actingUser, targetRole) {
  const actorLevel  = ROLE_HIERARCHY[actingUser?.role] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  if (actorLevel < 100 && targetLevel >= actorLevel) {
    return _denied(
      `Escalade de privilège refusée : "${actingUser?.role}" (niv.${actorLevel}) → "${targetRole}" (niv.${targetLevel})`,
      "PRIVILEGE_ESCALATION"
    );
  }
  return null;
}

// ── HANDLER (ping de santé + matrice de permissions) ─────────────────────────

Deno.serve(async (req) => {
  return Response.json({
    ok: true,
    module: "checkRole",
    version: "1.0",
    description: "Middleware RBAC centralisé ImmoPilot",
    note: "Ce fichier exporte checkRole() et RBAC pour import inline dans les autres fonctions backend",
    permission_matrix: ROLE_PERMISSIONS,
    ia_permissions: IA_PERMISSIONS,
    role_hierarchy: ROLE_HIERARCHY,
  });
});