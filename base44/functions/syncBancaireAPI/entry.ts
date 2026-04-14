import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── RBAC inline ──────────────────────────────────────────────────────────────
const INTERNAL_ROLES = ["admin","responsable_location","responsable_vente","agent","gestionnaire","comptable"];
const MODULE_PERMS = { admin:{comptabilite:"full"}, responsable_location:{comptabilite:"none"}, responsable_vente:{comptabilite:"none"}, agent:{comptabilite:"none"}, gestionnaire:{comptabilite:"write"}, comptable:{comptabilite:"full"} };
function accessDenied(msg) { return Response.json({ error: msg, code: "ACCESS_DENIED", timestamp: new Date().toISOString() }, { status: 403 }); }
async function checkRole(base44) {
  let user; try { user = await base44.auth.me(); } catch { return Response.json({ error:"Authentification requise", code:"UNAUTHENTICATED" }, { status:401 }); }
  if (!user?.email) return Response.json({ error:"Authentification requise", code:"UNAUTHENTICATED" }, { status:401 });
  if (!INTERNAL_ROLES.includes(user.role)) return accessDenied(`Accès back-office refusé pour le rôle "${user.role}"`);
  const level = MODULE_PERMS[user.role]?.comptabilite ?? "none";
  if (level === "none") return accessDenied(`Permission refusée : "${user.role}" n'a pas accès à la comptabilité`);
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * syncBancaireAPI - Synchronise via API bancaire, détecte anomalies, teste connexion, met à jour soldes
 * 
 * Modes:
 * - "full": Import API + matching + anomalies + test connexion
 * - "reconcile": Réconciliation fin de mois
 * - "test": Test de connexion uniquement
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const denied = await checkRole(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const { mode = 'full' } = body;

    const results = { 
      imported: 0, matched: 0, anomalies: 0, connection_errors: 0, 
      reconciled: 0, timestamp: new Date().toISOString() 
    };

    // ── ÉTAPE 1 : Récupérer tous les comptes connectés ──────────────────────
    const comptes = await base44.asServiceRole.entities.CompteBancaire.filter({ actif: true });

    for (const compte of comptes) {
      // Sauter les comptes en import manuel
      if (compte.api_provider === 'manual') continue;

      // ── TEST CONNEXION ─────────────────────────────────────────────────
      try {
        // En production : appel à l'API du provider (ex: Plaid /auth/get, Linxo /validate_token)
        // Pour la démo, on simule un test réussi
        const connectionOk = compte.api_token && compte.api_token.length > 10;
        
        if (!connectionOk) throw new Error('Token API invalide ou expiré');

        await base44.asServiceRole.entities.CompteBancaire.update(compte.id, {
          statut_connexion: 'connecte',
          erreur_connexion: null,
        });

      } catch (err) {
        results.connection_errors++;
        await base44.asServiceRole.entities.CompteBancaire.update(compte.id, {
          statut_connexion: 'erreur',
          erreur_connexion: err.message,
        });
        continue;
      }

      // ── IMPORT TRANSACTIONS VIA API ────────────────────────────────────
      if (mode === 'full' || mode === 'reconcile') {
        try {
          // En production : appel à l'API du provider
          // ex: const response = await fetch('https://api.plaid.com/transactions/get', {...});
          // Pour la démo, on utilise des données fictives
          const txsFromApi = [
            { date: new Date().toISOString().substring(0, 10), libelle: 'VIR LOYER AVRIL', montant: 2550, beneficiaire: 'IMMOPILOT' },
            { date: new Date(Date.now() - 86400000).toISOString().substring(0, 10), libelle: 'VIR DUPONT JEAN', montant: 850, beneficiaire: 'JEAN DUPONT' },
          ];

          for (const raw of txsFromApi) {
            const ref = `${compte.id}-${raw.date}-${raw.montant}`;
            const existing = await base44.asServiceRole.entities.TransactionBancaire.filter({ reference_externe: ref });
            if (existing.length > 0) continue;

            await base44.asServiceRole.entities.TransactionBancaire.create({
              agency_id: compte.agency_id,
              compte_id: compte.id,
              compte_nom: compte.nom,
              date: raw.date,
              libelle: raw.libelle,
              montant: raw.montant,
              type: 'credit',
              beneficiaire: raw.beneficiaire,
              reference_externe: ref,
              statut_matching: 'non_assigne',
            });
            results.imported++;
          }

          // Mettre à jour le solde et la date de sync
          await base44.asServiceRole.entities.CompteBancaire.update(compte.id, {
            solde: 12450, // En prod : solde_apres du dernier appel API
            derniere_sync: new Date().toISOString(),
          });

        } catch (err) {
          console.error(`Erreur import API ${compte.nom}:`, err.message);
          continue;
        }
      }

      // ── DÉTECTION ANOMALIES ────────────────────────────────────────────
      if (mode === 'full') {
        const txs = await base44.asServiceRole.entities.TransactionBancaire.filter({ compte_id: compte.id });
        
        for (const tx of txs) {
          let anomalieDetectee = false;
          let detail = '';

          // Montant suspect : transaction 10x plus grosse que la moyenne
          const montantsMoyens = txs
            .filter(t => t.montant > 0)
            .map(t => t.montant)
            .sort((a, b) => a - b);
          const mediane = montantsMoyens[Math.floor(montantsMoyens.length / 2)];
          if (mediane > 0 && tx.montant > mediane * 10) {
            anomalieDetectee = true;
            detail = `Montant anormal : ${tx.montant}€ (médiane : ${mediane}€)`;
          }

          // Bénéficiaire nouveau/suspect : pas de transaction précédente avec ce nom
          if (!anomalieDetectee && tx.beneficiaire) {
            const previous = txs.filter(t => 
              t.beneficiaire?.toLowerCase() === tx.beneficiaire.toLowerCase() && 
              t.date < tx.date
            );
            if (previous.length === 0 && txs.length > 10) {
              // Nouveau bénéficiaire dans une base active
              const lib = (tx.libelle || '').toLowerCase();
              if (!lib.includes('virement') && !lib.includes('loyer')) {
                anomalieDetectee = true;
                detail = `Nouveau bénéficiaire : ${tx.beneficiaire}`;
              }
            }
          }

          // Doublon potentiel : même montant le même jour
          if (!anomalieDetectee) {
            const doublons = txs.filter(t => 
              t.date === tx.date && 
              t.montant === tx.montant && 
              t.id !== tx.id
            );
            if (doublons.length > 0) {
              anomalieDetectee = true;
              detail = 'Transaction dupliquée détectée';
            }
          }

          if (anomalieDetectee) {
            await base44.asServiceRole.entities.TransactionBancaire.update(tx.id, {
              anomalie: true,
              anomalie_detail: detail,
            });
            results.anomalies++;
          }
        }
      }

      // ── RÉCONCILIATION FIN DE MOIS ─────────────────────────────────────
      if (mode === 'reconcile') {
        const maintenant = new Date();
        const estFinDeMois = maintenant.getDate() >= 27; // Entre 27 et 31
        
        if (estFinDeMois) {
          const dernierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
          const moisActuel = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;

          // Récupérer toutes les transactions du mois
          const txsMois = await base44.asServiceRole.entities.TransactionBancaire.filter({ 
            compte_id: compte.id,
            date: { $gte: `${moisActuel}-01`, $lte: `${moisActuel}-31` }
          });

          // Récupérer les transactions comptables du mois
          const txsComptables = await base44.asServiceRole.entities.Transaction.filter({
            date_echeance: { $gte: `${moisActuel}-01`, $lte: `${moisActuel}-31` }
          });

          // Calculer les écarts
          const totalBancaire = txsMois.reduce((s, t) => s + (t.montant || 0), 0);
          const totalComptable = txsComptables.reduce((s, t) => s + (t.montant || 0), 0);
          const ecart = totalBancaire - totalComptable;

          // Créer un rapport de réconciliation
          if (Math.abs(ecart) > 0.01) {
            const rapportId = `RECONCILE-${compte.id}-${moisActuel}`;
            // Créer ou mettre à jour un "Dossier de réconciliation"
            // (on pourrait créer une entité Reconciliation)
            console.log(`Réconciliation ${compte.nom} (${moisActuel}): Écart de ${ecart}€`);
            results.reconciled++;
          } else {
            console.log(`Réconciliation ${compte.nom} (${moisActuel}): OK, solde équilibré`);
            results.reconciled++;
          }
        }
      }
    }

    // ── LANCER LE MATCHING APRÈS IMPORT ────────────────────────────────────
    if (mode === 'full' && results.imported > 0) {
      await base44.asServiceRole.functions.invoke('syncBancaire', { mode: 'match' });
      results.matched = results.imported; // Approximate
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});