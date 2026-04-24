# 🧪 GUIDE DE TESTING - Production Ready

**Objectif:** Procédures de test structurées pour valider le SaaS avant production

---

## 1️⃣ SETUP TEST ENVIRONMENT

### Données Test
```sql
-- Créer agence test
INSERT INTO Agency (name, email, primary_color) 
VALUES ('Agence Test', 'test@agence.com', '#4F46E5');

-- Créer utilisateurs test (5 rôles)
INSERT INTO User (full_name, email, role) 
VALUES 
  ('Admin Test', 'admin@test.com', 'admin'),
  ('Agent Test', 'agent@test.com', 'agent'),
  ('Comptable Test', 'comptable@test.com', 'comptable'),
  ('Gestionnaire Test', 'gestionnaire@test.com', 'gestionnaire'),
  ('Client Test', 'client@test.com', 'locataire');

-- Créer biens test
INSERT INTO Bien (titre, adresse, prix, type, agency_id) 
VALUES 
  ('Appartement T3 - Paris 11', '123 rue de la Paix, 75011 Paris', 850, 'location', 'AGENCY_ID'),
  ('Maison - Lyon Presqu\'île', '456 avenue des Champs, 69002 Lyon', 450000, 'vente', 'AGENCY_ID');

-- Créer contacts test
INSERT INTO Contact (nom, email, telephone, type) 
VALUES 
  ('Jean Dupont', 'jean@test.com', '06 12 34 56 78', 'locataire'),
  ('Marie Martin', 'marie@test.com', '06 87 65 43 21', 'proprietaire');
```

### Email Test
- Utiliser service gratuit: **MailHog** (local) ou **Mailtrap.io** (cloud)
- Capturer tous emails pour vérifier contenu

---

## 2️⃣ TEST WORKFLOW LOCATION

### Test Case 1: Dossier Location Complet (90 min)

**Prérequis:**
- 1 bien location créé
- 1 utilisateur Agent
- 1 adresse email test valide

**Étapes:**
```
1. Se connecter comme Agent
2. Aller à /admin/modules/location
3. Cliquer "Nouveau dossier" → Modal créer dossier
   ✓ Champs: bien_id, locataire_nom, loyer_mensuel
   ✓ Clicker "Créer"
   ✓ Redirection vers détail dossier
   ✓ Vérifier: ID dossier généré, statut="ouvert", ref="LOC-YYYY-NNN"

4. Onglet "Candidats" → "Ajouter candidat"
   ✓ Remplir: nom, email, telephone, situation_pro, revenus_mensuels
   ✓ Clicker "Ajouter"
   ✓ Candidat apparaît dans liste
   ✓ Vérifier statut: "prospect"

5. Onglet "Documents" → Upload documents candidat
   ✓ Upload 4 fichiers: identité, revenus, imposition, domicile
   ✓ Vérifier chaque dans liste avec type correct
   ✓ Vérifier file_url générée (cloud)

6. Onglet "IA" ou "Scoring" → Scorer candidat
   ✓ Clicker "Scorer IA"
   ✓ Score 0-100 retourné
   ✓ Recommandation affichée
   ✓ Justification lisible

7. Sélectionner candidat
   ✓ Bouton "Sélectionner"
   ✓ Candidat → "selectionne"
   ✓ Dossier → "candidat_valide"
   ✓ Email envoyé au candidat (vérifier MailHog)

8. Onglet "Bail" → Générer PDF Bail
   ✓ Clicker "Générer bail PDF"
   ✓ PDF généré sans erreur (vérifier console)
   ✓ Vérifier: contenu OK, loyer correct, durée OK
   ✓ bail_url sauvegardé en BD

9. Onglet "Bail" → Demander signature
   ✓ Clicker "Demander signature"
   ✓ Modal: ajouter signataires (locataire + proprio)
   ✓ Envoyer liens
   ✓ Email reçus (vérifier MailHog)

10. Signer comme locataire
    ✓ Ouvrir lien email
    ✓ Signer (interface Yousign)
    ✓ Vérifier: statut signature → "partiellement_signe"

11. Signer comme propriétaire
    ✓ Ouvrir lien email (2e)
    ✓ Signer
    ✓ Vérifier: statut signature → "signe"
    ✓ PDF final signé archivé
    ✓ Dossier → "bail_signe"

12. Onglet "EDL Entrée" → Remplir EDL
    ✓ Sélectionner pièces
    ✓ Remplir état pour chaque pièce
    ✓ Upload photos
    ✓ Générer PDF EDL
    ✓ Demander signature (2 signataires)
    ✓ Tous signent
    ✓ Dossier → "en_cours"

13. Clôturer dossier
    ✓ Onglet "EDL Sortie" → Remplir
    ✓ Comparaison IA: entrée vs sortie
    ✓ Dégradations détectées
    ✓ Restitution dépôt calculée
    ✓ Tous signent
    ✓ Clicker "Clôturer"
    ✓ Dossier → "termine"
    ✓ Email clôture envoyé

**Validation:**
✅ Dossier créé de A à Z sans blocage
✅ PDFs générés et signés
✅ Emails reçus 
✅ Statuts avancent correctement
✅ Aucune erreur console
```

---

## 3️⃣ TEST WORKFLOW VENTE

### Test Case 2: Vente Complète (60 min)

**Prérequis:**
- 1 bien vente créé
- 1 vendeur contact

**Étapes:**
```
1. Créer mandat
   ✓ Aller /admin/modules/vente → "Nouveau mandat"
   ✓ Sélectionner bien, vendeur
   ✓ Entrer prix demandé
   ✓ Clicker "Estimation IA"
   ✓ Prix min/max/recommandé retourné
   ✓ Créer mandat
   ✓ Vérifier: statut "actif", type_mandat "exclusif"

2. Générer PDF mandat
   ✓ Detail mandat → "Générer PDF"
   ✓ PDF créé (vérifier console, pas erreur jsPDF)
   ✓ mandat_url sauvegardé

3. Ajouter acquéreur
   ✓ Aller "Pipeline Acquéreur"
   ✓ "Nouveau acquéreur"
   ✓ Remplir: nom, budget, localisation
   ✓ Scoring IA + matching biens OK
   ✓ Acquéreur créé, statut "lead"

4. Créer visite
   ✓ Dossier acquéreur → "Planifier visite"
   ✓ Sélectionner bien, date/heure
   ✓ Vérifier: événement créé
   ✓ Si GCal connecté: vérifier event sync OK
   ✓ Email rappel envoyé

5. Créer offre
   ✓ Detail acquéreur → "Créer offre"
   ✓ Montant offre < prix mandat
   ✓ Conditions spécifiées
   ✓ Offre crée, statut "proposee"
   ✓ Email notification vendeur

6. Accepter offre
   ✓ Vendeur reçoit email
   ✓ Clicker "Accepter"
   ✓ Offre → "acceptee"
   ✓ Acquéreur → "offre" etape

7. Générer compromis
   ✓ Detail dossier → "Générer compromis PDF"
   ✓ PDF créé OK
   ✓ Demander signatures (vendeur + acquereur + agence)

8. Tous signent
   ✓ Chacun reçoit lien
   ✓ Chacun signe dans Yousign
   ✓ PDF final signé archivé
   ✓ Acquéreur → "compromis" etape

9. Clôture vente
   ✓ Passer à "acte" étape
   ✓ Commission calculée auto
   ✓ Statut dossier → "cloture"
   ✓ CA enregistré dans transactions
   ✓ Email clôture envoyé

**Validation:**
✅ Vente complète de mandat à clôture
✅ Tous PDFs OK
✅ Signatures OK
✅ CA tracé
```

---

## 4️⃣ TEST PERMISSIONS & SÉCURITÉ

### Test Case 3: Permissions 5 Rôles (45 min)

**Setup:**
- 5 utilisateurs créés (admin, agent, comptable, gestionnaire, client)
- 2 dossiers créés (assigné agent A, assigné agent B)

**Étapes:**
```
Test 1: Admin
✓ Se connecter comme Admin
✓ Voir dashboard complet
✓ Accès tous modules (8+ items sidebar)
✓ Peut éditer settings
✓ Voir tous utilisateurs
✓ Voir tous dossiers (même non assignés)

Test 2: Agent - Own Dossier
✓ Agent A créé dossier
✓ Se connecter comme Agent A
✓ Voir dossier créé: OUI
✓ Peut éditer: OUI

Test 3: Agent - Assigned Dossier
✓ Dossier assigné à Agent B
✓ Se connecter comme Agent B
✓ Voir dossier: OUI
✓ Peut éditer: OUI

Test 4: Agent - Non-Assigned Dossier
✓ Dossier assigné à Agent C (pas Agent A)
✓ Se connecter comme Agent A
✓ Voir dossier: NON
✓ Direct URL /admin/dossier/ID → 403 Forbidden

Test 5: Comptable
✓ Se connecter comme Comptable
✓ Accès /admin/modules/comptabilite: OUI
✓ Accès /admin/modules/location: NON (pas visible sidebar)
✓ Voir paiements: OUI
✓ Voir dossiers: NON

Test 6: Gestionnaire
✓ Se connecter comme Gestionnaire
✓ Accès /admin/taches: OUI
✓ Accès /admin/agenda: OUI
✓ Accès location: NON

Test 7: Client (Locataire)
✓ Se connecter comme locataire
✓ Redirect vers /espace/locataire
✓ Accès /admin: NON (redirect)
✓ Voir ses documents: OUI
✓ Voir ses paiements: OUI
✓ Voir autres dossiers: NON

**Validation:**
✅ Chaque rôle accès correct uniquement
✅ Zéro crossing permissions
✅ Direct URL attempt bloqué
```

---

## 5️⃣ TEST NOTIFICATIONS EMAIL

### Test Case 4: Email Automatique (30 min)

**Setup:**
- MailHog ou Mailtrap configuré
- Dossier test créé

**Étapes:**
```
1. Créer dossier location
   ✓ Email reçu par locataire (sujet: "Dossier créé")
   ✓ Contenu: nom bien, loyer, lien accès

2. Ajouter candidat + docs
   ✓ Pas d'email (normal)

3. Sélectionner candidat
   ✓ Email reçu par candidat (sujet: "Candidature acceptée")
   ✓ Contenu: félicitations, prochaines étapes

4. Demander signature bail
   ✓ Email reçu par locataire (sujet: "À signer: Bail")
   ✓ Contenu: lien signature, délai 30j
   ✓ Email reçu par propriétaire (même contenu)

5. Pas signature après 7j
   ✓ Relance email automatique
   ✓ Sujet: "Rappel signature"
   ✓ Urgent tone

6. Tous signent
   ✓ Email reçu par agent (sujet: "Bail signé")
   ✓ Contenu: confirmation, PDF joint

7. Clôturer dossier
   ✓ Email reçu par locataire (sujet: "Dossier clôturé")
   ✓ Contenu: dernier résumé, archives

**Validation:**
✅ 7 emails reçus sans perte
✅ Contenu correct, lien OK
✅ Délais respectés (< 30s)
✅ Zéro bounces
```

---

## 6️⃣ TEST PDF GENERATION

### Test Case 5: PDF - 50 Documents (60 min)

**Étapes:**
```
Batch 1: Générer 10 bails
✓ Créer 10 dossiers location
✓ Générer bail pour chaque
✓ Vérifier: 10 PDFs sans erreur
✓ Vérifier: chaque < 5MB
✓ Ouvrir chaque PDF → contenu OK

Batch 2: Générer 10 mandats
✓ Créer 10 mandats vente
✓ Générer PDF pour chaque
✓ Même vérification que batch 1

Batch 3: Générer 10 EDLs
✓ Créer 10 EDLs (upload photos)
✓ Générer PDF
✓ Vérifier photos intégrées OK

Batch 4: Stress test - 10 simultanés
✓ Générer 10 PDFs en même temps (rapid clic)
✓ Vérifier: tous OK (pas bottleneck, pas crash)

Batch 5: Regeneration
✓ Générer bail dossier #1
✓ Générer bail dossier #1 (2x)
✓ Vérifier: pas doublon, version remplacée

Batch 6: Téléchargement
✓ Télécharger 20 PDFs
✓ Ouvrir dans PDF reader → tous OK

**Validation:**
✅ 50 PDFs générés sans erreur
✅ Zéro crash jsPDF
✅ Tous archivés (file_urls générées)
✅ Tous téléchargeables
```

---

## 7️⃣ TEST SIGNATURE ÉLECTRONIQUE

### Test Case 6: Signature - Complet (45 min)

**Prérequis:**
- Yousign ou DocuSign API configuré
- 2 adresses email test valides

**Étapes:**
```
1. Demander signature bail (2 signataires)
   ✓ Create SignatureRequest
   ✓ 2 signataires listés
   ✓ Statut: "en_preparation"

2. Envoyer liens
   ✓ Clicker "Envoyer"
   ✓ 2 emails reçus (vérifier MailHog)
   ✓ Chacun a lien unique
   ✓ Statut: "envoye"

3. Signer comme signataire 1 (locataire)
   ✓ Ouvrir lien dans email
   ✓ Interface Yousign charge
   ✓ Signer (clicker signature zone)
   ✓ Confirmer signature
   ✓ Vérifier: statut → "partiellement_signe"
   ✓ Email confirmation reçu par demandeur

4. Signer comme signataire 2 (propriétaire)
   ✓ Ouvrir lien
   ✓ Signer
   ✓ Vérifier: statut → "signe"
   ✓ PDF signé visible
   ✓ Preuve horodatée présente

5. Tester relance
   ✓ Créer 2e signature request
   ✓ Envoyer
   ✓ Pas signer 7 jours
   ✓ Relance auto envoyée
   ✓ Sujet: "Rappel signature urgente"

6. Tester expiration
   ✓ Créer 3e signature request
   ✓ Envoyer
   ✓ Après 30j: statut → "expire"
   ✓ Lien plus valide
   ✓ Possibilité relancer

**Validation:**
✅ Signature 100% fonctionnelle
✅ PDFs signés OK
✅ Preuves horodatées
✅ Relances auto OK
```

---

## 8️⃣ TEST PERFORMANCE

### Test Case 7: Performance (120 min)

**Outils:** Chrome DevTools, Lighthouse

**Étapes:**
```
1. Dashboard chargement
   ✓ Ouvrir /admin
   ✓ DevTools > Performance
   ✓ Mesurer: Total time < 2s
   ✓ First Contentful Paint < 1s
   ✓ Lighthouse score > 80

2. ModuleLocation avec 100 dossiers
   ✓ Créer/importer 100 dossiers
   ✓ Ouvrir /admin/modules/location
   ✓ Mesurer: < 2s pour afficher liste
   ✓ Scroll smooth (60 fps)
   ✓ Filtre search sans lag

3. Dossier detail onglets
   ✓ Ouvrir dossier avec 5 onglets
   ✓ Mesurer: premier onglet < 1.5s
   ✓ Click tab → charge < 500ms (lazy load)

4. Image optimization
   ✓ Toutes images < 100KB (WebP si possible)
   ✓ Pas image non-compressée

5. Bundle size
   ✓ Production build
   ✓ Mesurer: JS < 500KB (gzipped)
   ✓ CSS < 100KB

6. Memory leak test
   ✓ Open DevTools > Memory
   ✓ Créer 50 dossiers
   ✓ Supprimer 50 dossiers
   ✓ Trigger GC (garbage collection)
   ✓ Vérifier: mémoire retourne baseline (pas fuite)

**Validation:**
✅ Dashboard < 2s
✅ Modules < 2s
✅ Detail < 1.5s
✅ Zéro memory leak
```

---

## 9️⃣ TEST STABILITÉ 24H

### Test Case 8: Stabilité Continue (1440 min = 24h)

**Étapes:**
```
Hour 0:
✓ Démarrer app
✓ Ouvrir DevTools > Console
✓ Vérifier: 0 errors, 0 warnings

Hour 1-23:
- Créer 5 dossiers
- Éditer 5 dossiers
- Générer 2 PDFs
- Signer 1 document
- Rafraîchir page
- Vérifier console (0 errors)

Hour 24:
✓ Mesurer mémoire (DevTools > Performance > Memory)
✓ Vérifier: stable depuis heure 0
✓ Console: 0 errors critiques
✓ App: zéro crash

**Validation:**
✅ Zéro crash sur 24h
✅ Zéro erreur bloquante
✅ Mémoire stable
```

---

## 🎯 RÉSULTAT FINAL

Tous tests PASSED ✅ = GO PRODUCTION

| Test | Status | Date | Signé |
|------|--------|------|-------|
| Workflow Location | ⏳ | - | - |
| Workflow Vente | ⏳ | - | - |
| Permissions | ⏳ | - | - |
| Notifications | ⏳ | - | - |
| PDF | ⏳ | - | - |
| Signature | ⏳ | - | - |
| Performance | ⏳ | - | - |
| Stabilité | ⏳ | - | - |

---

**Durée totale:** ~9h de testing actif
**Date cible:** 30 avril 23h59 (validation complète)