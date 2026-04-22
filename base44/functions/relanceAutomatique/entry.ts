import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * relanceAutomatique — Moteur de relances intelligentes
 *
 * Analyse l'ensemble des données CRM et génère des relances ciblées :
 *  - Paiements en retard (Paiement.statut = "en_retard")
 *  - Dossiers inactifs (DossierImmobilier sans mise à jour depuis N jours)
 *  - Messages sans réponse (EmailEntrant non traités depuis N jours)
 *  - Visites non confirmées (TicketIA type "demande_visite" non résolu)
 *
 * Anti-doublon : une relance par (contact_id + type_relance + jour)
 * Fréquence max : configurable (défaut 3j entre deux relances du même type)
 *
 * Peut être appelé :
 *  - Par l'automation planifiée quotidienne
 *  - Manuellement depuis l'UI (payload: { manual: true, dry_run: true })
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(dateA, dateB) {
  return Math.floor(Math.abs(new Date(dateA) - new Date(dateB)) / DAY_MS);
}

function todayKey() {
  return new Date().toISOString().substring(0, 10);
}

function dedupeKey(contactId, typeRelance) {
  return `${contactId}-${typeRelance}-${todayKey()}`;
}

// Vérifie si une relance du même type a déjà été envoyée aujourd'hui pour ce contact
function alreadyRelanced(existingRelances, contactId, typeRelance, minIntervalDays = 3) {
  const recent = existingRelances.filter(
    r => r.contact_id === contactId && r.type_relance === typeRelance &&
      ['envoyee', 'planifiee'].includes(r.statut)
  );
  if (recent.length === 0) return false;
  const last = recent.sort((a, b) => new Date(b.date_envoi || b.created_date) - new Date(a.date_envoi || a.created_date))[0];
  const daysSince = daysBetween(new Date(), last.date_envoi || last.created_date);
  return daysSince < minIntervalDays;
}

// Choix du canal le plus adapté selon les données contact
function chooseBestCanal(contact) {
  if (contact?.telephone) return 'sms';
  if (contact?.email) return 'email';
  return 'email';
}

// Niveau de relance selon le nombre de tentatives précédentes
function computeNiveau(existingRelances, contactId, typeRelance) {
  const prev = existingRelances.filter(
    r => r.contact_id === contactId && r.type_relance === typeRelance && r.statut === 'envoyee'
  );
  return Math.min(prev.length + 1, 3);
}

const NIVEAU_LABELS = { 1: 'rappel doux', 2: 'relance ferme', 3: 'mise en demeure' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { dry_run = false, manual = false, force = false } = body;

    // ── Charger données de base ───────────────────────────────────────────
    const [agencies, paiements, dossiers, emails, tickets, contacts, existingRelances] = await Promise.all([
      base44.asServiceRole.entities.Agency.list('-created_date', 1),
      base44.asServiceRole.entities.Paiement.filter({ statut: 'en_retard' }),
      base44.asServiceRole.entities.DossierImmobilier.list('-updated_date', 200),
      base44.asServiceRole.entities.EmailEntrant.filter({ statut: 'non_lu' }),
      base44.asServiceRole.entities.TicketIA.list('-created_date', 100),
      base44.asServiceRole.entities.Contact.list('-created_date', 500),
      base44.asServiceRole.entities.Relance.list('-created_date', 500),
    ]);

    const agency = agencies[0] || {};
    const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
    const now = new Date();

    const relancesACreer = [];

    // ══════════════════════════════════════════════════════════════════════
    // 1. PAIEMENTS EN RETARD
    // ══════════════════════════════════════════════════════════════════════
    for (const p of paiements) {
      const contact = contactMap[p.contact_id];
      if (!contact) continue;

      const joursRetard = p.date_echeance
        ? daysBetween(now, new Date(p.date_echeance))
        : 0;

      if (joursRetard < 1) continue; // Pas encore en retard

      if (!force && alreadyRelanced(existingRelances, p.contact_id, 'paiement_retard')) continue;

      const niveau = computeNiveau(existingRelances, p.contact_id, 'paiement_retard');
      const canal = chooseBestCanal(contact);

      relancesACreer.push({
        type_relance: 'paiement_retard',
        canal,
        niveau,
        contact_id: p.contact_id,
        contact_nom: contact.nom,
        contact_email: contact.email || '',
        contact_telephone: contact.telephone || '',
        paiement_id: p.id,
        bien_id: p.bien_id || null,
        montant: p.montant,
        jours_retard: joursRetard,
        raison: `Paiement de ${p.montant?.toLocaleString('fr-FR')} € en retard de ${joursRetard} jours (échéance : ${p.date_echeance ? new Date(p.date_echeance).toLocaleDateString('fr-FR') : 'N/A'})`,
        contextVars: {
          client: contact.nom,
          montant: p.montant ? `${p.montant.toLocaleString('fr-FR')} €` : '',
          date: p.date_echeance ? new Date(p.date_echeance).toLocaleDateString('fr-FR') : '',
          jours: String(joursRetard),
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. DOSSIERS INACTIFS (pas de mise à jour depuis 7 jours)
    // ══════════════════════════════════════════════════════════════════════
    const INACTIVITE_SEUIL = 7;
    const dossiersActifs = dossiers.filter(d => ['nouveau', 'en_cours'].includes(d.statut));

    for (const d of dossiersActifs) {
      const joursInactivite = daysBetween(now, d.updated_date || d.created_date);
      if (joursInactivite < INACTIVITE_SEUIL) continue;

      if (!d.contact_ids?.length) continue;
      const contact = contactMap[d.contact_ids[0]];
      if (!contact) continue;

      if (!force && alreadyRelanced(existingRelances, contact.id, 'dossier_inactif', 7)) continue;

      const niveau = computeNiveau(existingRelances, contact.id, 'dossier_inactif');
      const canal = chooseBestCanal(contact);

      relancesACreer.push({
        type_relance: 'dossier_inactif',
        canal,
        niveau,
        contact_id: contact.id,
        contact_nom: contact.nom,
        contact_email: contact.email || '',
        contact_telephone: contact.telephone || '',
        dossier_id: d.id,
        dossier_titre: d.titre || d.reference || '',
        bien_id: d.bien_id || null,
        bien_titre: d.bien_titre || '',
        jours_inactivite: joursInactivite,
        raison: `Dossier "${d.titre || d.reference}" inactif depuis ${joursInactivite} jours (statut: ${d.statut})`,
        contextVars: {
          client: contact.nom,
          dossier: d.titre || d.reference || '',
          bien: d.bien_titre || '',
          jours: String(joursInactivite),
          statut: d.statut,
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. EMAILS SANS RÉPONSE (> 3 jours)
    // ══════════════════════════════════════════════════════════════════════
    const EMAIL_DELAI = 3;
    const emailsVieux = emails.filter(e => {
      const jours = daysBetween(now, e.date_reception || e.created_date);
      return jours >= EMAIL_DELAI;
    });

    for (const e of emailsVieux) {
      if (!e.de) continue;
      // Trouver le contact par email
      const contact = contacts.find(c => c.email === e.de) || {
        nom: e.de_nom || e.de,
        email: e.de,
        telephone: null,
        id: `email-${e.id}`,
      };

      const pseudoId = `email-${e.id}`;
      if (!force && alreadyRelanced(existingRelances, pseudoId, 'reponse_client')) continue;

      relancesACreer.push({
        type_relance: 'reponse_client',
        canal: 'email',
        niveau: 1,
        contact_id: pseudoId,
        contact_nom: contact.nom,
        contact_email: e.de,
        contact_telephone: contact.telephone || '',
        raison: `Email de "${e.de_nom || e.de}" sans réponse depuis ${daysBetween(now, e.date_reception || e.created_date)} jours (objet: ${e.objet || 'N/A'})`,
        contextVars: {
          client: e.de_nom || e.de,
          sujet: e.objet || '',
          jours: String(daysBetween(now, e.date_reception || e.created_date)),
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. VISITES NON CONFIRMÉES (tickets demande_visite > 2 jours)
    // ══════════════════════════════════════════════════════════════════════
    const VISITE_DELAI = 2;
    const visitesNonConfirmees = tickets.filter(t =>
      t.type_demande === 'demande_visite' &&
      ['nouveau', 'en_cours'].includes(t.statut) &&
      daysBetween(now, t.date_appel || t.created_date) >= VISITE_DELAI
    );

    for (const t of visitesNonConfirmees) {
      if (!t.appelant_email && !t.appelant_telephone) continue;

      const pseudoId = `ticket-${t.id}`;
      if (!force && alreadyRelanced(existingRelances, pseudoId, 'visite_non_confirmee')) continue;

      const contact = contacts.find(c => c.email === t.appelant_email) || {
        nom: t.appelant_nom || 'Client',
        email: t.appelant_email,
        telephone: t.appelant_telephone,
        id: pseudoId,
      };
      const canal = t.appelant_telephone ? 'sms' : 'email';

      relancesACreer.push({
        type_relance: 'visite_non_confirmee',
        canal,
        niveau: 1,
        contact_id: pseudoId,
        contact_nom: t.appelant_nom || 'Client',
        contact_email: t.appelant_email || '',
        contact_telephone: t.appelant_telephone || '',
        dossier_id: null,
        bien_titre: t.bien_titre || '',
        raison: `Demande de visite de "${t.appelant_nom}" non confirmée depuis ${daysBetween(now, t.date_appel || t.created_date)} jours`,
        contextVars: {
          client: t.appelant_nom || 'Client',
          bien: t.bien_titre || '',
          jours: String(daysBetween(now, t.date_appel || t.created_date)),
        },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // DRY RUN : retourner sans créer
    // ══════════════════════════════════════════════════════════════════════
    if (dry_run) {
      return Response.json({
        dry_run: true,
        total: relancesACreer.length,
        relances: relancesACreer.map(r => ({
          type: r.type_relance, canal: r.canal, niveau: r.niveau,
          contact: r.contact_nom, raison: r.raison,
        })),
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // CRÉER + ENVOYER les relances
    // ══════════════════════════════════════════════════════════════════════
    const created = [];

    for (const relanceData of relancesACreer) {
      const { contextVars, ...entityData } = relanceData;

      // Générer le message IA
      const niveauLabel = NIVEAU_LABELS[relanceData.niveau] || 'rappel';
      const typeLabels = {
        paiement_retard: 'rappel de paiement en retard',
        dossier_inactif: 'relance dossier immobilier inactif',
        reponse_client: 'suivi de demande client sans réponse',
        visite_non_confirmee: 'confirmation de visite immobilière',
      };

      const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Tu es l'assistant de l'agence immobilière "${agency.name || 'Agence'}".
Rédige un message de ${typeLabels[relanceData.type_relance]} (niveau : ${niveauLabel}) ${relanceData.canal === 'email' ? 'email professionnel' : `${relanceData.canal.toUpperCase()} court (max ${relanceData.canal === 'sms' ? '160' : '300'} caractères)`}.

Contexte :
- Client : ${contextVars.client}
- Raison : ${relanceData.raison}
${contextVars.montant ? `- Montant : ${contextVars.montant}` : ''}
${contextVars.dossier ? `- Dossier : ${contextVars.dossier}` : ''}
${contextVars.bien ? `- Bien : ${contextVars.bien}` : ''}
${contextVars.jours ? `- Délai : ${contextVars.jours} jours` : ''}

Instructions selon niveau :
- Niveau 1 (rappel doux) : ton amical, bienveillant, simple rappel
- Niveau 2 (relance ferme) : ton professionnel, insistant, délai mentionné
- Niveau 3 (mise en demeure) : ton formel, conséquences mentionnées

${relanceData.canal === 'email' ? 'Génère un objet (sujet) ET un corps de message.' : 'Une seule phrase concise d\'action.'}
Agence : ${agency.name || 'Votre agence'}`,
        response_json_schema: {
          type: 'object',
          properties: {
            sujet: { type: 'string' },
            contenu: { type: 'string' },
          }
        }
      });

      const contenuFinal = generated.contenu || `Bonjour ${contextVars.client}, merci de bien vouloir répondre à notre message. ${agency.name || 'Votre agence'}`;
      const sujetFinal = generated.sujet || `Relance — ${typeLabels[relanceData.type_relance]}`;

      // Créer l'entité Relance
      const relanceCreee = await base44.asServiceRole.entities.Relance.create({
        ...entityData,
        contenu_ia: contenuFinal,
        statut: 'envoyee',
        auto: true,
        date_envoi: new Date().toISOString(),
        historique: [{
          date: new Date().toISOString(),
          canal: relanceData.canal,
          contenu: contenuFinal,
          statut: 'envoyee',
          niveau: relanceData.niveau,
        }],
      });

      // Envoyer via le bon canal
      if (relanceData.canal === 'email' && relanceData.contact_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: relanceData.contact_email,
          from_name: agency.name || undefined,
          subject: sujetFinal,
          body: contenuFinal + `\n\n—\n${agency.name || 'Votre agence immobilière'}\nMessage automatique.`,
        });
      }

      // Journaliser dans Message (HubCommunication) pour SMS/WA et aussi email
      await base44.asServiceRole.entities.Message.create({
        canal: relanceData.canal,
        contenu: contenuFinal,
        direction: 'sortant',
        contact_email: relanceData.contact_email || '',
        contact_nom: relanceData.contact_nom,
        contact_telephone: relanceData.contact_telephone || '',
        auteur_nom: agency.name || 'Agence IA',
        source_type: 'relance',
        source_id: relanceCreee.id,
      });

      created.push({
        id: relanceCreee.id,
        type: relanceData.type_relance,
        canal: relanceData.canal,
        contact: relanceData.contact_nom,
        niveau: relanceData.niveau,
      });
    }

    return Response.json({
      success: true,
      created: created.length,
      relances: created,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});