# 🔐 Système RBAC - Gestion des Utilisateurs & Rôles

**Status:** ✅ Implémenté et sécurisé  
**Route protégée:** `/admin/utilisateurs`  
**Version:** 2.0

---

## 📋 Rôles du Système

### **5 Rôles Internes** (Équipe)

| Rôle | Description | Accès Utilisateurs | Invitations |
|------|-------------|---|---|
| **Directeur** | Accès complet tous modules | ✅ Full (gestion complète) | ✅ Tous les rôles |
| **Responsable** | Gestion location/vente complet | ✅ Full (gestion complète) | ✅ Tous les rôles |
| **Agent** | Gestion biens, dossiers, transactions | ❌ Aucun | ⚠️ Clients uniquement |
| **Gestionnaire** | Gestion locative + comptabilité | ❌ Aucun | ⚠️ Clients uniquement |
| **Comptable** | Comptabilité complète | ❌ Aucun | ⚠️ Clients uniquement |

### **4 Rôles Clients** (Espaces)

| Rôle | Description |
|------|-------------|
| **Locataire** | Accès espace locataire |
| **Propriétaire** | Accès espace propriétaire |
| **Acquéreur** | Accès espace acquéreur |
| **Prestataire** | Accès limité |

---

## 🎯 Règles d'Accès à `/admin/utilisateurs`

### **1. ACCÈS À LA PAGE**

```javascript
// SEULS les Directeur + Responsable peuvent voir cette page
const canManageUsers = USER_MANAGEMENT_ROLES.includes(user.role);
// USER_MANAGEMENT_ROLES = ["directeur", "responsable"]

if (!canManageUsers) {
  // Afficher: "Accès refusé"
  // Les autres rôles ne voient pas cette page du tout
}
```

**Résultat:**
- ✅ Directeur → Accès complet
- ✅ Responsable → Accès complet
- ❌ Agent, Gestionnaire, Comptable → Page inaccessible
- ❌ Clients (locataire, etc.) → Page inaccessible

---

## 👥 Actions Autorisées par Rôle

### **Directeur + Responsable**

| Action | Permission | Notes |
|--------|-----------|-------|
| **Voir la page** | ✅ OUI | Accès complet à `/admin/utilisateurs` |
| **Inviter utilisateurs internes** | ✅ OUI | Peut inviter: Directeur, Responsable, Agent, Gestionnaire, Comptable |
| **Inviter clients** | ✅ OUI | Peut inviter: Locataire, Propriétaire, Acquéreur, Prestataire |
| **Modifier un utilisateur** | ✅ OUI | Nom, email, rôle (sauf soi-même) |
| **Changer le rôle** | ✅ OUI | Permet change rôle d'autres, PAS son propre rôle |
| **Désactiver/Réactiver** | ✅ OUI | Confirmation obligatoire |
| **Supprimer** | ✅ OUI | Confirmation obligatoire + ne peut pas se supprimer |
| **Voir matrice rôles** | ✅ OUI | Onglet "Rôles & Permissions" |

### **Autres Rôles (Agent, Gestionnaire, Comptable)**

| Action | Permission | Notes |
|--------|-----------|-------|
| **Voir la page** | ❌ NON | Accès refusé, message "Accès refusé" |
| **Inviter utilisateurs internes** | ❌ NON | Interdiction stricte |
| **Inviter clients** | ⚠️ Partiellement | Voir section "Invitations clients" |
| **Modifier un utilisateur** | ❌ NON | Interdiction |
| **Changer le rôle** | ❌ NON | Interdiction |
| **Désactiver/Réactiver** | ❌ NON | Interdiction |
| **Supprimer** | ❌ NON | Interdiction |
| **Voir matrice rôles** | ❌ NON | Page inaccessible |

---

## 📨 Système d'Invitations

### **Directeur + Responsable**

```javascript
// Modal d'invitation affiche TOUS les rôles
<optgroup label="Équipe interne">
  <option>Directeur</option>
  <option>Responsable</option>
  <option>Agent</option>
  <option>Gestionnaire</option>
  <option>Comptable</option>
</optgroup>

<optgroup label="Clients">
  <option>Locataire</option>
  <option>Propriétaire</option>
  <option>Acquéreur</option>
  <option>Prestataire</option>
</optgroup>
```

**Résultat:** Peuvent inviter n'importe quel rôle.

### **Autres Rôles (Agent, Gestionnaire, Comptable)**

```javascript
// Modal d'invitation affiche SEULEMENT les clients
// (pas d'optgroup "Équipe interne")

<optgroup label="Clients">
  <option>Locataire</option>
  <option>Propriétaire</option>
  <option>Acquéreur</option>
  <option>Prestataire</option>
</optgroup>
```

**Résultat:** Peuvent inviter SEULEMENT les clients.

---

## 🔒 Sécurité Obligatoire

### **1. Empêcher Auto-Modification de Rôle**

```javascript
// UserEditModal.jsx
if (user.id === currentUser.id && form.role !== user.role) {
  // Afficher erreur: "Vous ne pouvez pas modifier votre propre rôle"
  // Désactiver le champ rôle pour soi-même
}
```

**Scénario:** Un Directeur ne peut pas se changer en "Agent"

### **2. Empêcher Auto-Suppression**

```javascript
// UserListItem.jsx
const canDelete = currentUser.id !== user.id && canManageUsers;

if (!canDelete) {
  // Bouton "Supprimer" désactivé ou caché
}
```

**Scénario:** Un Directeur ne peut pas se supprimer lui-même

### **3. Confirmation Obligatoire pour Actions Sensibles**

```javascript
// Actions nécessitant confirmation:
- Changement de rôle → Confirmation: "Êtes-vous sûr?"
- Désactivation d'utilisateur → Confirmation: "Compte sera inaccessible"
- Suppression d'utilisateur → Confirmation: "Action irréversible"
```

### **4. Contrôle d'Accès à la Page**

```javascript
// AdminUsers.jsx
if (!USER_MANAGEMENT_ROLES.includes(currentUser.role)) {
  return (
    <div className="access-denied">
      ⛔ Accès refusé: Seuls Directeur/Responsable
    </div>
  );
}
```

---

## 🛡️ Implémentation Technique

### **Fichiers clés:**

```
lib/roles.js
├── USER_MANAGEMENT_ROLES = ["directeur", "responsable"]
├── assertCanManageUsers(user) → Lance erreur si pas de permissions
└── can(user, "utilisateurs", "full")

pages/admin/AdminUsers.jsx
├── canManageUsers = USER_MANAGEMENT_ROLES.includes(user.role)
├── Redirection si accès refusé
└── Contrôle de tous les boutons d'action

components/admin/users/UserEditModal.jsx
├── Empêche modification de propre rôle
├── Validation des données
└── Confirmation avant enregistrement

components/admin/users/UserListItem.jsx
├── Masque actions si pas de permissions
├── showActions prop = canManageUsers
└── Désactive auto-suppression
```

### **Helpers de sécurité:**

```javascript
// Vérifier accès (lance erreur)
assertCanManageUsers(user)         // Seul Directeur/Responsable
assertDirecteur(user)               // Seul Directeur

// Vérifier permission (retourne booléen)
can(user, "utilisateurs", "full")   // Écriture + suppression
USER_MANAGEMENT_ROLES.includes(user.role)
```

---

## 📊 Matrice de Permissions Complète

### **Module "utilisateurs"**

| Rôle | Permission | Niveau | Actions |
|------|-----------|--------|---------|
| Directeur | ✅ | full | Voir + Créer + Modifier + Supprimer |
| Responsable | ✅ | full | Voir + Créer + Modifier + Supprimer |
| Agent | ❌ | none | — |
| Gestionnaire | ❌ | none | — |
| Comptable | ❌ | none | — |

```javascript
// Dans ROLE_PERMISSIONS:
export const ROLE_PERMISSIONS = {
  directeur: { utilisateurs: "full" },
  responsable: { utilisateurs: "full" },
  agent: { utilisateurs: "none" },
  gestionnaire: { utilisateurs: "none" },
  comptable: { utilisateurs: "none" },
};
```

---

## 🚨 Scenarios de Sécurité

### **Scenario 1: Agent essaie d'inviter un Directeur**

```
1. Agent navigue à /admin/utilisateurs
   ❌ Message: "Accès refusé"
   ❌ Redirection ou page vide

2. Agent accède directement par URL
   ❌ Contrôle côté frontend: accessDenied = true
```

### **Scenario 2: Directeur modifie son propre rôle en Agent**

```
1. Modal d'édition ouvre
2. Utilisateur change le champ "Rôle" en "Agent"
3. Avant de soumettre, UserEditModal vérifie:
   if (user.id === currentUser.id && form.role !== user.role)
   ❌ Erreur: "Vous ne pouvez pas modifier votre propre rôle"
   ❌ Champ "Rôle" est disabled
```

### **Scenario 3: Responsable supprime un Directeur**

```
1. Responsable clique sur "Supprimer"
2. Confirmation: "Êtes-vous sûr?"
3. Suppression s'effectue
4. ✅ Action autorisée (Responsable peut supprimer autres)
```

### **Scenario 4: Directeur essaie de se supprimer**

```
1. Directeur clique sur "Supprimer"
   ❌ Bouton désactivé ou caché
   ❌ Message: "Vous ne pouvez pas vous supprimer"
   ❌ Aucune action n'est envoyée
```

---

## ✅ Checklist de Sécurité

- [ ] Seul Directeur + Responsable peuvent accéder à `/admin/utilisateurs`
- [ ] Message clair "Accès refusé" pour les autres rôles
- [ ] Modal d'invitation affiche rôles internes seulement pour Directeur/Responsable
- [ ] Autres rôles ne peuvent inviter que des clients
- [ ] Champ "Rôle" disabled pour modification de soi-même
- [ ] Bouton "Supprimer" caché pour soi-même
- [ ] Confirmation obligatoire pour changement rôle
- [ ] Confirmation obligatoire pour désactivation
- [ ] Confirmation obligatoire pour suppression
- [ ] Logs audit pour toutes les actions (recommandé)

---

## 🔄 Flux Audit (Recommandé)

Pour chaque action sensible, créer une entrée dans AuditLog:

```javascript
await base44.entities.AuditLog.create({
  user_email: currentUser.email,
  action: "update",
  entity: "User",
  entity_id: editedUser.id,
  entity_label: editedUser.full_name,
  changes: { role: oldRole + " → " + newRole },
  details: "Changement de rôle par Directeur",
  timestamp: new Date().toISOString(),
});
```

---

## 🚀 Évolutions Futures

- [ ] Audit log de toutes les modifications utilisateurs
- [ ] Activation 2FA pour Directeur/Responsable
- [ ] Rôles personnalisés (RBAC avancé)
- [ ] Logs d'accès à `/admin/utilisateurs`
- [ ] Notifications email pour invitations
- [ ] Historique des modifications d'utilisateurs

---

**Document officiel RBAC — Dernière mise à jour: 2026-04-14**