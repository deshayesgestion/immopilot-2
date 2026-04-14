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
 * syncBancaire - Synchronise les transactions bancaires et effectue le matching IA
 * 
 * Mode "import": simule ou reçoit des transactions bancaires externes,
 *   les sauvegarde et tente le matching avec les transactions comptables.
 * 
 * Mode "match": re-tente le matching sur les transactions non assignées.
 * 
 * En production, remplacer la section "données bancaires" par un appel
 * à un agrégateur bancaire (ex: Budget Insight / Powens, Linxo, Bridge, Plaid).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const denied = await checkRole(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const { mode = 'match', compte_id, transactions_input } = body;

    const results = { matched: 0, suggestions: 0, unmatched: 0, anomalies: 0 };

    // ── ÉTAPE 1 : Import de transactions bancaires ──────────────────────────
    if (mode === 'import' && transactions_input?.length) {
      for (const raw of transactions_input) {
        const ref = `${compte_id}-${raw.date}-${raw.montant}-${raw.libelle?.substring(0, 20)}`;
        const existing = await base44.asServiceRole.entities.TransactionBancaire.filter({ reference_externe: ref });
        if (existing.length > 0) continue;

        const compte = compte_id ? (await base44.asServiceRole.entities.CompteBancaire.filter({ id: compte_id }))[0] : null;

        await base44.asServiceRole.entities.TransactionBancaire.create({
          compte_id: compte_id || '',
          compte_nom: compte?.nom || '',
          date: raw.date,
          libelle: raw.libelle,
          montant: raw.montant,
          type: raw.montant >= 0 ? 'credit' : 'debit',
          beneficiaire: raw.beneficiaire || '',
          reference_externe: ref,
          statut_matching: 'non_assigne',
        });
      }

      // Mettre à jour le solde du compte
      if (compte_id && transactions_input.length > 0) {
        const last = transactions_input[transactions_input.length - 1];
        if (last.solde_apres !== undefined) {
          await base44.asServiceRole.entities.CompteBancaire.update(compte_id, {
            solde: last.solde_apres,
            derniere_sync: new Date().toISOString(),
          });
        }
      }
    }

    // ── ÉTAPE 2 : Matching IA sur les transactions non assignées ───────────
    const txBancaires = await base44.asServiceRole.entities.TransactionBancaire.filter({ statut_matching: 'non_assigne' });
    const txComptables = await base44.asServiceRole.entities.Transaction.filter({ statut: 'en_attente' });
    const txRetard = await base44.asServiceRole.entities.Transaction.filter({ statut: 'en_retard' });
    const allTxComptables = [...txComptables, ...txRetard];

    for (const txB of txBancaires) {
      if (txB.montant <= 0) continue; // Ignorer les débits pour le matching loyer/vente

      let bestMatch = null;
      let bestScore = 0;

      for (const txC of allTxComptables) {
        let score = 0;

        // Score montant exact
        if (Math.abs(txB.montant - txC.montant) < 0.01) score += 50;
        // Score montant approché (±5%)
        else if (Math.abs(txB.montant - txC.montant) / txC.montant < 0.05) score += 30;
        // Score montant partiel
        else if (txB.montant < txC.montant && txB.montant / txC.montant > 0.5) score += 15;

        // Score nom locataire/tiers dans libellé
        const libelleLower = (txB.libelle || '').toLowerCase();
        const tiersNom = (txC.tiers_nom || '').toLowerCase();
        if (tiersNom && libelleLower.includes(tiersNom.split(' ')[0])) score += 30;
        if (tiersNom && libelleLower.includes(tiersNom)) score += 20; // bonus nom complet

        // Score référence
        if (txC.reference && libelleLower.includes(txC.reference.toLowerCase())) score += 20;

        // Score date (même mois)
        if (txB.date && txC.date_echeance) {
          const bMois = txB.date.substring(0, 7);
          const cMois = txC.date_echeance.substring(0, 7);
          if (bMois === cMois) score += 10;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = txC;
        }
      }

      // Détection anomalie : montant très différent ou libellé inhabituel
      const anomalie = bestMatch && Math.abs(txB.montant - bestMatch.montant) / bestMatch.montant > 0.2;

      if (bestScore >= 70 && bestMatch) {
        // Match automatique fiable
        const isParcial = Math.abs(txB.montant - bestMatch.montant) > 1;
        
        await base44.asServiceRole.entities.TransactionBancaire.update(txB.id, {
          statut_matching: 'assigne',
          transaction_id: bestMatch.id,
          match_score: bestScore,
          anomalie: !!anomalie,
          anomalie_detail: anomalie ? `Montant incohérent: ${txB.montant}€ vs ${bestMatch.montant}€ attendu` : '',
        });

        // Mettre à jour la transaction comptable
        await base44.asServiceRole.entities.Transaction.update(bestMatch.id, {
          statut: 'paye',
          date_paiement: txB.date,
          notes: (bestMatch.notes || '') + ` | Payé via virement bancaire le ${txB.date} — ${txB.libelle}`,
        });

        // Résoudre les relances associées
        const relances = await base44.asServiceRole.entities.Relance.filter({ transaction_id: bestMatch.id });
        for (const r of relances) {
          if (r.statut !== 'resolue') {
            await base44.asServiceRole.entities.Relance.update(r.id, { statut: 'resolue' });
          }
        }

        results.matched++;
        if (anomalie) results.anomalies++;

      } else if (bestScore >= 40 && bestMatch) {
        // Suggestion (matching incertain)
        await base44.asServiceRole.entities.TransactionBancaire.update(txB.id, {
          statut_matching: 'suggestion',
          match_score: bestScore,
          match_suggestion: {
            transaction_id: bestMatch.id,
            tiers_nom: bestMatch.tiers_nom,
            montant: bestMatch.montant,
            bien_titre: bestMatch.bien_titre,
            score: bestScore,
          },
          anomalie: !!anomalie,
        });
        results.suggestions++;
      } else {
        // Aucun match : catégoriser avec IA basique
        let categorie = 'autre';
        const lib = (txB.libelle || '').toLowerCase();
        if (lib.includes('loyer') || lib.includes('loc ')) categorie = 'loyer';
        else if (lib.includes('virement') && lib.includes('agence')) categorie = 'commission_vente';
        else if (lib.includes('assurance')) categorie = 'assurance';
        else if (lib.includes('taxe') || lib.includes('impot')) categorie = 'impots';

        await base44.asServiceRole.entities.TransactionBancaire.update(txB.id, {
          categorie_ia: categorie,
        });
        results.unmatched++;
      }
    }

    return Response.json({ success: true, ...results, total_processed: txBancaires.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});