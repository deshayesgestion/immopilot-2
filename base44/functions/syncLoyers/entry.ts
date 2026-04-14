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
  if (level === "none") return accessDenied(`Permission refusée : "${user.role}" ne peut pas accéder à la comptabilité`);
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

// Génère les transactions de loyer mensuelles pour tous les baux actifs
// et détecte les retards automatiquement
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const denied = await checkRole(base44);
    if (denied) return denied;

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.toISOString().substring(0, 10);

    // Récupérer tous les dossiers actifs
    const dossiers = await base44.asServiceRole.entities.DossierLocatif.filter({ statut: 'en_cours' });
    
    const results = { created: 0, updated_retard: 0, skipped: 0, errors: [] };

    for (const dossier of dossiers) {
      if (!dossier.loyer) continue;
      
      const montant = (dossier.loyer || 0) + (dossier.charges || 0);
      const echeance = `${thisMonth}-05`; // Échéance le 5 du mois
      const locataire = dossier.locataire_selectionne || {};
      const ref = `LOYER-${dossier.id}-${thisMonth}`;

      // Vérifier si la transaction existe déjà
      const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: ref });
      
      if (existing.length === 0) {
        // Créer la transaction
        await base44.asServiceRole.entities.Transaction.create({
          type: 'loyer',
          statut: 'en_attente',
          montant,
          tiers_nom: locataire.nom || 'Locataire',
          tiers_email: locataire.email || '',
          bien_titre: dossier.property_title || '',
          bien_id: dossier.property_id || '',
          dossier_id: dossier.id,
          dossier_type: 'location',
          date_echeance: echeance,
          reference: ref,
          notes: `Loyer ${thisMonth} — ${dossier.property_title}`,
          agent_email: dossier.agent_email || '',
        });
        results.created++;
      }
    }

    // Détecter les retards: transactions en_attente dont l'échéance est passée
    const enAttente = await base44.asServiceRole.entities.Transaction.filter({ statut: 'en_attente', type: 'loyer' });
    
    for (const tx of enAttente) {
      if (!tx.date_echeance) continue;
      if (tx.date_echeance < today) {
        await base44.asServiceRole.entities.Transaction.update(tx.id, { statut: 'en_retard' });
        
        // Créer une relance automatique niveau 1 si elle n'existe pas
        const relancesExisting = await base44.asServiceRole.entities.Relance.filter({ transaction_id: tx.id, niveau: 1 });
        if (relancesExisting.length === 0) {
          const joursRetard = Math.floor((new Date() - new Date(tx.date_echeance)) / 86400000);
          await base44.asServiceRole.entities.Relance.create({
            transaction_id: tx.id,
            tiers_nom: tx.tiers_nom,
            tiers_email: tx.tiers_email,
            bien_titre: tx.bien_titre,
            montant: tx.montant,
            niveau: 1,
            statut: 'planifiee',
            auto: true,
            contenu: `Bonjour ${tx.tiers_nom},\n\nNous vous rappelons que votre loyer du mois en cours d'un montant de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tx.montant)} est en retard de ${joursRetard} jour(s).\n\nMerci de régulariser votre situation dans les meilleurs délais.\n\nCordialement,\nL'équipe de gestion`,
          });
        }
        results.updated_retard++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});