# 👥 Guide de Gestion des Utilisateurs & Rôles

**Status:** ✅ Complètement intégré  
**Route:** `/admin/utilisateurs`  
**Version:** 1.0

---

## 🎯 Vue d'ensemble

La section **Utilisateurs & Rôles** permet aux administrateurs de:
- ✅ **Visualiser** tous les utilisateurs (équipe interne + clients)
- ✅ **Inviter** de nouveaux utilisateurs avec un rôle spécifique
- ✅ **Modifier** les données et rôles des utilisateurs
- ✅ **Désactiver/Réactiver** des comptes
- ✅ **Consulter** la matrice des rôles et permissions
- ✅ **Supprimer** des utilisateurs (confirmé)

---

## 📊 Rôles Disponibles

### **Équipe Interne** (6 rôles)

| Rôle | Description | Permissions |
|------|-------------|------------|
| **Admin** | Accès complet à tous les modules | Full accès partout |
| **Resp. Location** | Gestion location + lecture vente | Location: Write, Vente: Read |
| **Resp. Vente** | Gestion vente + lecture location | Vente: Write, Location: Read |
| **Agent** | Gestion biens, dossiers, transactions | Location & Vente: Write |
| **Gestionnaire** | Gestion locative + comptabilité | Location: Write, Compta: Write |
| **Comptable** | Accès comptabilité complet | Comptabilité: Full |

### **Clients** (4 rôles)

| Rôle | Description | Accès |
|------|-------------|-------|
| **Locataire** | Espace client location | Espace: locataire |
| **Propriétaire** | Espace client propriétaire | Espace: proprietaire |
| **Acquéreur** | Espace client acheteur | Espace: acquereur |
| **Prestataire** | Fournisseur/Prestataire | Accès limité |

---

## 🚀 Fonctionnalités

### **1. Inviter un utilisateur**

**Bouton:** "Inviter" (haut droit)

```jsx
// Modal d'invitation
1. Email (obligatoire)
2. Rôle (obligatoire - choix dans liste)
3. Message (optionnel)

// Résultat: Email d'invitation envoyé
// Statut: "Invitation en attente" jusqu'à acceptation
```

**Restrictions:**
- Seuls les **Admin** peuvent inviter
- Ne pas inviter un utilisateur existant (verification email)

---

### **2. Visualiser les utilisateurs**

**Onglet:** "Utilisateurs"

La liste affiche:
- **Avatar** (initiale du nom)
- **Nom complet** + Email
- **Rôle** (badge coloré)
- **Statut** (Actif/Inactif/Invitation)
- **Actions au hover:** Modifier, Désactiver, Supprimer

**Recherche:** Filtrer par nom ou email en temps réel

---

### **3. Modifier un utilisateur**

**Icône:** Crayon/Modifier (hover)

**Modal de modification:**
```
- Email (lecture seule)
- Nom complet (éditable)
- Rôle (éditable sauf pour soi-même)
- Boutons: Annuler / Enregistrer
```

**Règles:**
- Chaque utilisateur **ne peut pas modifier son propre rôle** (sécurité)
- Seulement les **Admin** peuvent modifier les rôles
- Les modifications sont sauvegardées en temps réel

---

### **4. Désactiver/Réactiver**

**Icône:** Cadenas (au hover)

- **Cadenas fermé** = Utilisateur actif
- **Cadenas ouvert** = Utilisateur inactif

**Effet:**
- Compte inactif → l'utilisateur ne peut plus se connecter
- Données conservées (pas de suppression)
- Réactivation possible à tout moment

---

### **5. Supprimer un utilisateur**

**Icône:** Poubelle (au hover)

⚠️ **Actions irréversibles:**
1. Confirmation demandée
2. Suppression de tous les enregistrements
3. Pas de récupération possible

**Restrictions:**
- Ne pas supprimer l'utilisateur courant (vous-même)
- Confirmation obligatoire

---

### **6. Matrice des Rôles & Permissions**

**Onglet:** "Rôles & Permissions"

Affiche pour chaque rôle:
- ✅ Nom et description
- ✅ Modules accessibles
- ✅ Niveaux de permission:
  - **Lecture:** Consultation seulement
  - **Écriture:** Créer + Modifier
  - **Admin:** Écriture + Suppression
  - **—** Pas d'accès

**Bénéfice:** Aide les admins à comprendre les restrictions de chaque rôle

---

## 📱 Interface Responsive

| Écran | Comportement |
|-------|------------|
| **Mobile (<640px)** | List compacte, actions au tap |
| **Tablet (640-1024px)** | List avec actions, rôle visible |
| **Desktop (>1024px)** | List complète + menu hover |

---

## 🔐 Sécurité

**Contrôles d'accès (RBAC):**

```javascript
// Seul l'Admin peut:
- Inviter des utilisateurs
- Modifier les rôles
- Désactiver/Réactiver
- Supprimer des utilisateurs

// Chaque utilisateur peut:
- Voir son propre profil
- Modifier ses données (nom, etc)
- Pas changer son rôle
```

**Validation:**
- Email unique obligatoire
- Rôle non vide
- Confirmation pour actions sensibles

---

## 🛠️ Implémentation Technique

### **Fichiers principaux:**

```
pages/admin/AdminUsers.jsx              # Page principale
├── components/admin/users/
│   ├── UserEditModal.jsx               # Modal modification
│   ├── UserListItem.jsx                # Ligne utilisateur
│   ├── UserStatusBadge.jsx             # Badge statut
│   └── RolesPermissionTab.jsx          # Matrice rôles
```

### **Dépendances:**

- `base44.entities.User` — Liste/Get/Update utilisateurs
- `base44.auth.me()` — Utilisateur courant
- `base44.users.inviteUser()` — Créer invitation
- `RBAC helpers` — Gestion permissions (lib/roles.js)

---

## 📋 Checklist Admin

Lors du setup initial:

- [ ] Inviter tous les membres de l'équipe
- [ ] Attribuer les rôles corrects
- [ ] Vérifier les permissions dans "Rôles & Permissions"
- [ ] Tester accès pour chaque rôle
- [ ] Documenter les responsabilités de chaque rôle
- [ ] Configurer les templates d'invitation (optionnel)

---

## ❓ FAQ

**Q: Comment réinitialiser le mot de passe d'un utilisateur?**  
A: L'utilisateur reçoit un lien de réinitialisation lors de l'invitation. Pour un reset: inviter à nouveau ou contact support.

**Q: Peux-je changer mon propre rôle?**  
A: Non, c'est une sécurité intentionnelle. Un autre admin doit changer votre rôle.

**Q: Que se passe-t-il si je désactive un utilisateur?**  
A: Il ne peut plus se connecter. Ses données restent intactes et peuvent être réactivées.

**Q: Quelle différence entre "Resp. Location" et "Agent"?**  
A: Resp. Location gère la location ET peut lire la vente. Agent gère les deux mais sous supervision.

---

## 🚀 Prochaines évolutions

- [ ] Import en masse via CSV
- [ ] Modèles de rôles personnalisés
- [ ] Audit log des modifications
- [ ] 2FA pour accounts sensibles
- [ ] Authentification SSO

---

**Besoin d'aide?** Consultez la documentation RBAC complète dans `lib/roles.js