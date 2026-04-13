import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Crée automatiquement une transaction de commission lors de la finalisation d'une vente
// Appelé via automation entity sur TransactionVente (event: update, statut → vendu)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Vérifier que c'est bien une mise à jour vers "vendu"
    if (event?.type !== 'update') return Response.json({ skipped: 'not an update' });
    if (data?.statut !== 'vendu') return Response.json({ skipped: 'not vendu' });

    const tx = data;
    const ref = `COMMISSION-${tx.id}`;

    // Vérifier si la transaction comptable existe déjà
    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: ref });
    if (existing.length > 0) return Response.json({ skipped: 'already exists' });

    // Créer la transaction de commission
    if (tx.commission_agence) {
      await base44.asServiceRole.entities.Transaction.create({
        type: 'commission_vente',
        statut: 'paye',
        montant: tx.commission_agence,
        tiers_nom: tx.acquereur_nom || 'Acquéreur',
        tiers_email: tx.acquereur_email || '',
        bien_titre: tx.property_title || '',
        bien_id: tx.property_id || '',
        dossier_id: tx.id,
        dossier_type: 'vente',
        date_echeance: tx.date_acte_signe || new Date().toISOString().substring(0, 10),
        date_paiement: tx.date_acte_signe || new Date().toISOString().substring(0, 10),
        reference: ref,
        notes: `Commission vente — ${tx.property_title} — Réf. ${tx.reference}`,
        agent_email: tx.agent_email || '',
        categorie: 'commission_vente',
      });
    }

    // Créer également la transaction du prix de vente si besoin
    if (tx.prix_vente_final) {
      await base44.asServiceRole.entities.Transaction.create({
        type: 'honoraires',
        statut: 'paye',
        montant: tx.prix_vente_final,
        tiers_nom: tx.acquereur_nom || 'Acquéreur',
        tiers_email: tx.acquereur_email || '',
        bien_titre: tx.property_title || '',
        bien_id: tx.property_id || '',
        dossier_id: tx.id,
        dossier_type: 'vente',
        date_echeance: tx.date_acte_signe || new Date().toISOString().substring(0, 10),
        date_paiement: tx.date_acte_signe || new Date().toISOString().substring(0, 10),
        reference: `VENTE-${tx.id}`,
        notes: `Prix de vente — ${tx.property_title} — Réf. ${tx.reference}`,
        agent_email: tx.agent_email || '',
      });
    }

    return Response.json({ success: true, commission: tx.commission_agence, prix: tx.prix_vente_final });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});