# 🎯 PLAN D'ACTIONS TECHNIQUES - Production Ready

**Période:** 24 avril - 1er mai 2026 (7 jours)  
**Responsabilité:** Stabilisation + déploiement production

---

## JOUR 1-2 : VALIDATION WORKFLOWS CRITIQUES

### ✅ Task 1.1 : Tester Workflow Location Complet
**Temps:** 4h  
**Checklist:**
```
1. Créer dossier location (bien + locataire_nom + loyer)
   - Vérifier: création OK, redirect detail OK, status "ouvert" OK
   
2. Ajouter 2 candidats complets
   - Vérifier: form validation, upload docs OK, list affichage
   
3. Scoring IA candidat
   - Vérifier: prompt envoyé avec data correcte
   - Vérifier: score 0-100 retourné
   - Vérifier: recommandation lisible
   
4. Sélection candidat
   - Vérifier: statut candidat → "selectionne"
   - Vérifier: dossier statut → "candidat_valide"
   - Vérifier: email envoyé au candidat
   
5. Génération bail PDF
   - Vérifier: PDF généré sans erreur jsPDF
   - Vérifier: URL archivée en cloud
   - Vérifier: téléchargement OK
   
6. Signature électronique bail
   - Vérifier: demande signature crée
   - Vérifier: liens envoyés par email
   - Vérifier: signature collectée (test avec 2 signataires)
   - Vérifier: PDF final signé archivé
   
7. EDL Entrée
   - Vérifier: formulaire pièces OK
   - Vérifier: upload photos OK
   - Vérifier: PDF généré + signé
   
8. Clôture dossier
   - Vérifier: statut → "termine"
   - Vérifier: email clôture envoyé

Résultat attendu: Dossier location complet de A à Z sans blocage
```

**Fichiers à vérifier:**
- `ModuleLocation.jsx` → structure workflow OK?
- `LocationWorkflow.jsx` → création dossier OK?
- `DossierDetail.jsx` → onglets accessibles?
- `TabCandidats.jsx` → scoring intégré?
- `TabBail.jsx` → PDF generation OK?
- `SignaturePanel.jsx` → signature OK?

**Si bug trouvé:** Créer issue avec repro steps + fix

---

### ✅ Task 1.2 : Tester Workflow Vente Complet
**Temps:** 4h  
**Checklist:**
```
1. Créer mandat vente (bien + vendeur + estimation IA)
   - Vérifier: prix recommandé retourné
   - Vérifier: PDF mandat OK
   
2. Ajouter 2 acquéreurs
   - Vérifier: création OK
   - Vérifier: scoring IA + matching bien OK
   
3. Créer visites (2 RDV)
   - Vérifier: créations OK
   - Vérifier: sync Google Calendar (si connecté)
   
4. Créer + accepter offres
   - Vérifier: offre crée, email notification OK
   - Vérifier: acceptance enregistrée
   
5. Signer compromis
   - Vérifier: PDF généré OK
   - Vérifier: signature électronique OK
   
6. Clôture vente (passage acte)
   - Vérifier: commission calculée
   - Vérifier: statut → "cloture"

Résultat attendu: Vente complète de mandat à clôture sans blocage
```

**Fichiers à vérifier:**
- `ModuleVente.jsx` → pipelines OK?
- `PipelineVendeur.jsx` → mandat OK?
- `PipelineAcquereur.jsx` → acquisitions OK?
- `KanbanVente.jsx` → drag OK?

---

## JOUR 2-3 : SIGNATURE ÉLECTRONIQUE & PDF

### ✅ Task 2.1 : Valider Signature Électronique 100%
**Temps:** 3h  
**Responsable:** Tester avec Yousign/DocuSign API

```
Checklist:
1. Créer demande signature (bail + 2 signataires)
2. Envoyer liens par email (vérifier réception)
3. Signer comme locataire (dans email link)
4. Vérifier: statut partiellement_signe
5. Signer comme propriétaire
6. Vérifier: statut signe + PDF final archivé
7. Vérifier: preuve horodatée OK
8. Tester expiration signature (30j)
9. Tester relance signature (7j)
10. Test 10 signatures complètes sans erreur

Si échec: Vérifier:
- signatureManager function (logs)
- SignatureRequest entity (vérifier création)
- Email delivery (vérifier envoi)
- Yousign API credentials (secrets)
```

**Fichiers critiques:**
- `functions/signatureManager.js` → fonction existe? tests OK?
- `components/signature/SignaturePanel.jsx` → UI OK?
- `entities/SignatureRequest.json` → schema OK?

---

### ✅ Task 2.2 : Tester PDF Generation - 50+ Documents
**Temps:** 4h  
**Checklist:**
```
1. Générer 50 PDFs (bails + mandats + EDLs)
   - Vérifier: zéro crash
   - Vérifier: tous archivés en cloud
   - Vérifier: taille < 10MB par doc
   
2. Test charge: générer 10 PDFs simultanément
   - Vérifier: pas bottleneck, tous OK
   
3. Test regeneration: générer PDF 2x même dossier
   - Vérifier: pas doublon, version remplacée
   
4. Test téléchargement: télécharger 20 PDFs
   - Vérifier: tous ouvrent correctement
   
5. Test corruption: ouvrir PDF corrompu
   - Vérifier: affichage erreur gracieuse (pas crash)

Si erreur: Vérifier:
- jsPDF version compatible
- Cloud upload function (file_url generation)
- PDF template formatting
```

---

## JOUR 3-4 : MULTI-UTILISATEURS & PERMISSIONS

### ✅ Task 3.1 : Tester Permissions 5 Rôles
**Temps:** 3h  
**Setup:** Créer 5 users différents (admin, agent, comptable, gestionnaire, client)

```
Checklist:
1. Admin: accès à tous modules
   - Vérifier: dashboard complet, 8+ items sidebar
   - Vérifier: peut éditer settings
   - Vérifier: voit tous utilisateurs
   
2. Agent: ses dossiers + modules assignés
   - Créer dossier comme agent A
   - Assigner à agent B
   - Agent A peut voir? (doit être OUI si créateur ou collaborateur)
   - Agent B peut voir? (doit être OUI si assigné)
   - Agent C ne peut pas voir (doit être NON si non assigné)
   
3. Comptable: compta + paiements
   - Vérifier: accès /admin/modules/comptabilite OK
   - Vérifier: pas accès /admin/modules/location
   
4. Gestionnaire: tâches + agenda
   - Vérifier: accès /admin/taches OK
   - Vérifier: accès /admin/agenda OK
   
5. Client (locataire): espace dédié read-only
   - Vérifier: peut voir ses documents
   - Vérifier: peut voir ses paiements
   - Vérifier: ne peut pas créer/éditer

Test sécurité:
- Agent A tente accès URL dossier agent C → 403 Forbidden
- Client tente accès /admin → redirect /espace/locataire
- Non-admin tente éditer settings → 403

Résultat: Zéro crossing permissions
```

**Fichiers à vérifier:**
- `lib/UserContext.jsx` → permissions logique OK?
- `lib/rbac.js` → roles définis correctement?
- `components/admin/RoleGuard.jsx` → protection pages OK?

---

### ✅ Task 3.2 : Tester Isolation Données
**Temps:** 2h  
**Setup:** Créer 2 agences + 2 users différents

```
Checklist:
1. User A (agence 1) crée dossier
2. User B (agence 2) ne doit PAS voir dossier A
3. Requête API: dossiers listés filtrés par agency_id
4. Direct URL attempt: /admin/dossier/ID_AGENCE_1 → access denied pour user B
5. API attack: requête sans agency_id → backend ajoute automatiquement

Résultat: Zéro leakage données entre agences
```

---

## JOUR 4-5 : NOTIFICATIONS & CALENDRIER

### ✅ Task 4.1 : Tester Email Automatique
**Temps:** 2h  
**Setup:** Utiliser adresse test email

```
Checklist:
1. Créer dossier → email confirmation au locataire
2. Demander signature → email link aux signataires (x2)
3. Signer → email confirmation au demandeur
4. Après 7j pas signé → relance automatique
5. Clôturer dossier → email clôture parties

Vérifier:
- Tous emails reçus dans délai < 30s
- Contenu correct (nom dossier, lien, date)
- Zéro bounces
- Test 20+ emails sans perte

Si problème: Vérifier:
- SendEmail integration (logs)
- Email templates (corps correct?)
- Récurrence automatique
```

---

### ✅ Task 4.2 : Google Calendar Sync (si intégration prioritaire)
**Temps:** 3h  
**Setup:** Connecter Google Calendar via OAuth

```
Checklist:
1. Créer RDV visite dans SaaS
2. Vérifier: événement créé dans GCal automatiquement
3. Vérifier: titre, date, description OK
4. Vérifier: participant ajouté (agent + client)
5. Vérifier: alarme 24h + 1h synced
6. Modifier RDV dans SaaS → GCal update OK
7. Annuler RDV → GCal event supprimé

Si échoue: Vérifier:
- GoogleCalendar connector authorized
- Automation trigger: entity "Evenement" create
- Fonction: genererCalendarEvent
```

---

## JOUR 5-6 : IA & ALERTES

### ✅ Task 5.1 : Valider Scoring IA Candidat
**Temps:** 2h  
**Checklist:**
```
1. Tester avec 10 candidats réels (vrais dossiers)
2. Scoring IA retourné pour chaque
3. Vérifier recommandations:
   - ACCEPTER (score > 70): candidat fiable
   - REFUSER (score < 50): risque élevé
   - À COMPLETER (50-70): besoin clarification
4. Vérifier aucun biais discriminatoire (âge, genre, etc)
5. Vérifier justification détaillée fournie
6. Humaniser: admin valide recommandation (OUI/NON)

Si score incorrect: 
- Revoir prompt IA (dans TabIA)
- Ajuster pondération critères
```

---

### ✅ Task 5.2 : Tester Alertes IA
**Temps:** 2h  
**Checklist:**
```
1. Alerte: mandat >60j sans progression
   - Vérifier: alerté dans dashboard
   
2. Alerte: loyer en retard >7j
   - Vérifier: alerte visible + notification agent
   
3. Alerte: signature expirée
   - Vérifier: alerte + option relancer
   
4. Alerte: dossier bloqué >30j
   - Vérifier: escalade vers super-admin

Résultat: Alertes pertinentes sans faux-positifs
```

---

## JOUR 6 : PERFORMANCE & STABILITÉ

### ✅ Task 6.1 : Test Performance
**Temps:** 3h  
**Outils:** Chrome DevTools, Lighthouse

```
Checklist:
1. Dashboard: < 2s chargement
   - Mesuré: console perf
   
2. ModuleLocation: < 2s avec 100 dossiers
   - Test: ajouter 100 dossiers, mesurer latence
   
3. Dossier detail: < 1.5s
   - Test: ouvrir 10 dossiers différents
   
4. Search (filtre) sans lag
   - Test: filtrer 1000 dossiers, débounce OK (300ms)
   
5. Lazy loading: onglets charge au clic (pas tout d'un coup)
   - Vérifier: TabBail charge seulement si cliqué
   
6. Images optimisées < 100KB
   - Vérifier: pas images non-optimisées

Si lent: Optimiser:
- Ajouter React.memo sur composants lourds
- Utiliser lazy() + Suspense
- Réduire bundle: nextjs? webpack-bundle-analyzer?
```

---

### ✅ Task 6.2 : Test Stabilité 24h
**Temps:** 24h (parallèle)  
**Checklist:**
```
1. Démarrer app à 9h
2. Utilisation réelle: créer dossiers, signer, generer PDFs
3. Toutes les heures: vérifier console (0 errors)
4. Après 24h: mesurer memory (DevTools)
   - Vérifier: mémoire stable (pas fuite)
   
Résultat: Zéro crash, zéro error

Si crash détecté:
- Capturer stack trace
- Reproduire issue
- Fixer + retester
```

---

## JOUR 7 : FINAL CHECK & DÉPLOIEMENT

### ✅ Task 7.1 : Checklist Prédéploiement
**Temps:** 2h  

```
CRITIQUES (Bloquant déploiement):
☑ Workflows location testés complets
☑ Workflows vente testés complets
☑ Signature électronique 100% fonctionnelle
☑ Génération PDF sans crash (50+ test)
☑ Permissions multi-rôles correctes
☑ Zéro leakage données
☑ Stabilité 24h sans crash
☑ IA scoring validée (humain approuve)

IMPORTANTS (Avant déploiement):
☑ Google Calendar sync (si prioritaire)
☑ Emails automatiques OK
☑ Alertes IA actives
☑ Performance acceptable (<2s)
☑ Logs traçabilité complets

NICE-TO-HAVE (Post-déploiement OK):
☑ SMS notifications
☑ Advanced BI

Si un CRITIQUE ❌: NO-GO production, fixer d'abord
Si tous CRITIQUES + IMPORTANTS ✅: GO production
```

---

### ✅ Task 7.2 : Déploiement & Validation
**Temps:** 2h  

```
1. Déployer version sur prod
2. Smoke test:
   - Créer dossier test
   - Signer test
   - Vérifier données OK en BD
3. Vérifier logs (zéro error critique)
4. Notifier utilisateurs early-access
5. Support live pour premiers jours
```

---

## 📊 TIMELINE RÉSUMÉE

| Jour | Task | Temps | Status |
|------|------|-------|--------|
| 24-25 | Workflow Location + Vente | 8h | 🔄 En cours |
| 25-26 | Signature + PDF | 7h | ⏳ À faire |
| 26-27 | Permissions + Isolation | 5h | ⏳ À faire |
| 27-28 | Email + Calendar | 5h | ⏳ À faire |
| 28-29 | IA + Alertes | 4h | ⏳ À faire |
| 29-30 | Performance + Stabilité | 27h (24h + 3h) | ⏳ À faire |
| 30 | Final check + Déploiement | 4h | ⏳ À faire |

**Total:** 60 heures de QA/validation/déploiement

---

## 🎯 CRITÈRES GO/NO-GO PRODUCTION

### GO si:
✅ Tous CRITIQUES validés  
✅ Zéro crash sur 24h  
✅ Workflows complets testés  
✅ Signature + PDF OK  
✅ Permissions correctes  

### NO-GO si:
❌ Bug bloquant trouvé  
❌ Crash sur action core  
❌ Leakage données  
❌ Signature non fiable  
❌ Performance inacceptable  

---

## 🚀 DATE CIBLE

**Production:** 1er mai 2026 (00h00)