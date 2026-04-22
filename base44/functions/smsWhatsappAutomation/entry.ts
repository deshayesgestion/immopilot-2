import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * smsWhatsappAutomation — Envoi automatique SMS/WhatsApp pour le SaaS immobilier
 *
 * Payload:
 *   trigger: string        — événement déclencheur (ex: "dossier_cree")
 *   source_type: string    — "dossier" | "paiement" | "ticket" | "bien"
 *   source_id: string      — ID de l'entité source
 *   source_data: object    — données de l'entité (facultatif, évite un aller-retour DB)
 *   force: boolean         — ignorer anti-doublon (défaut: false)
 *
 * Note: les SMS/WA sont journalisés dans l'entité Message (canal: "sms" ou "whatsapp")
 * pour apparaître dans le HubCommunication. L'envoi réel passe par une intégration
 * téléphonie tierce (Twilio, etc.) — ici on journalise + on génère le contenu IA.
 */

// Anti-doublon : clé unique par (automation_id + source_id + jour)
function dedupeKey(automationId, sourceId) {
  const day = new Date().toISOString().substring(0, 10);
  return `${automationId}-${sourceId}-${day}`;
}

function alreadySent(automation, sourceId) {
  const key = dedupeKey(automation.id, sourceId);
  return (automation.historique_envois || []).some(h => h.dedupe_key === key);
}

function resolveTemplate(tpl, vars) {
  if (!tpl) return '';
  return tpl
    .replace(/\{client\}/g, vars.client || 'Client')
    .replace(/\{bien\}/g, vars.bien || '')
    .replace(/\{dossier\}/g, vars.dossier || '')
    .replace(/\{montant\}/g, vars.montant || '')
    .replace(/\{date\}/g, vars.date || '')
    .replace(/\{statut\}/g, vars.statut || '');
}

const TYPE_LABELS = {
  confirmation_visite: 'confirmation de visite immobilière',
  rappel_rdv:          'rappel de rendez-vous',
  rappel_paiement:     'rappel de paiement',
  maj_dossier:         'mise à jour de dossier',
  nouveau_bien:        'nouveau bien disponible',
  bienvenue:           'message de bienvenue client',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { trigger, source_type, source_id, source_data = {}, force = false } = body;

    if (!trigger) return Response.json({ error: 'trigger requis' }, { status: 400 });

    // ── Agence ────────────────────────────────────────────────────────────
    const agencies = await base44.asServiceRole.entities.Agency.list('-created_date', 1);
    const agency = agencies[0] || {};

    // ── Automations actives pour ce trigger ───────────────────────────────
    const automations = await base44.asServiceRole.entities.MessageAutomation.filter({
      trigger,
      actif: true,
    });

    if (automations.length === 0) {
      return Response.json({ success: true, sent: 0, reason: 'no_active_automation' });
    }

    // ── Résolution destinataire & contexte ────────────────────────────────
    let recipientPhone = null;
    let recipientEmail = null;
    let recipientName  = null;
    let contextVars    = {};

    if (source_type === 'dossier') {
      const dossier = source_data.id ? source_data
        : (await base44.asServiceRole.entities.DossierImmobilier.filter({ id: source_id }))[0];
      if (dossier?.contact_ids?.length > 0) {
        const contact = (await base44.asServiceRole.entities.Contact.filter({ id: dossier.contact_ids[0] }))[0];
        recipientPhone = contact?.telephone;
        recipientEmail = contact?.email;
        recipientName  = contact?.nom;
      }
      contextVars = {
        client:  recipientName || 'Client',
        bien:    dossier?.bien_titre || '',
        dossier: dossier?.titre || dossier?.reference || '',
        statut:  dossier?.statut || '',
      };

    } else if (source_type === 'paiement') {
      const paiement = source_data.id ? source_data
        : (await base44.asServiceRole.entities.Paiement.filter({ id: source_id }))[0];
      if (paiement?.contact_id) {
        const contact = (await base44.asServiceRole.entities.Contact.filter({ id: paiement.contact_id }))[0];
        recipientPhone = contact?.telephone;
        recipientEmail = contact?.email;
        recipientName  = contact?.nom;
      }
      const bien = paiement?.bien_id
        ? (await base44.asServiceRole.entities.Bien.filter({ id: paiement.bien_id }))[0] : null;
      contextVars = {
        client:  recipientName || 'Client',
        bien:    bien?.titre || '',
        montant: paiement?.montant ? `${paiement.montant.toLocaleString('fr-FR')} €` : '',
        date:    paiement?.date_echeance ? new Date(paiement.date_echeance).toLocaleDateString('fr-FR') : '',
        statut:  paiement?.statut || '',
      };

    } else if (source_type === 'ticket') {
      const ticket = source_data.id ? source_data
        : (await base44.asServiceRole.entities.TicketIA.filter({ id: source_id }))[0];
      recipientPhone = ticket?.appelant_telephone;
      recipientEmail = ticket?.appelant_email;
      recipientName  = ticket?.appelant_nom;
      contextVars = {
        client:  recipientName || 'Client',
        bien:    ticket?.bien_titre || '',
        dossier: ticket?.numero || '',
        statut:  ticket?.statut || '',
      };

    } else if (source_type === 'bien') {
      // Pour un bien: notifier les contacts intéressés (leads actifs liés)
      const bien = source_data.id ? source_data
        : (await base44.asServiceRole.entities.Bien.filter({ id: source_id }))[0];
      // On cible l'email agence + journalise — les leads individuels seraient traités batch
      recipientEmail = agency.email;
      recipientName  = agency.name;
      contextVars = {
        client: agency.name || 'Agence',
        bien:   bien?.titre || '',
        statut: bien?.statut || '',
      };
    }

    // Si pas de téléphone ET pas de fallback email → skip
    if (!recipientPhone && !recipientEmail) {
      return Response.json({ success: true, sent: 0, reason: 'no_recipient_phone' });
    }

    let sentCount = 0;
    const results = [];

    for (const automation of automations) {
      // Filtre module
      if (automation.condition_module && automation.condition_module !== 'tous') {
        if (source_data.type && source_data.type !== automation.condition_module) continue;
        if (source_data.module && source_data.module !== automation.condition_module) continue;
      }

      // Anti-doublon
      if (!force && alreadySent(automation, source_id)) {
        results.push({ automation_id: automation.id, skipped: true, reason: 'already_sent_today' });
        continue;
      }

      // ── Générer le contenu ─────────────────────────────────────────────
      let contenu = resolveTemplate(automation.template, contextVars);

      if (!contenu) {
        const canalLabel = automation.canal === 'whatsapp' ? 'WhatsApp' : 'SMS';
        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Tu es l'assistant de l'agence immobilière "${agency.name || 'Agence'}".
Rédige un message ${canalLabel} court (${automation.canal === 'sms' ? 'max 160 caractères' : 'max 300 caractères'}) de type "${TYPE_LABELS[automation.type_message] || automation.type_message}" pour :
- Client : ${contextVars.client}
- Bien : ${contextVars.bien || 'non spécifié'}
- Dossier : ${contextVars.dossier || 'non spécifié'}
- Montant : ${contextVars.montant || 'non spécifié'}
- Date : ${contextVars.date || 'non spécifié'}
- Statut : ${contextVars.statut || 'non spécifié'}

Le message doit être professionnel, personnalisé, en français.
Pour SMS : très court, une seule phrase d'action.
Pour WhatsApp : légèrement plus détaillé, ton chaleureux.
Signe avec "${agency.name || 'Votre agence'}".`,
          response_json_schema: {
            type: 'object',
            properties: { contenu: { type: 'string' } }
          }
        });
        contenu = generated.contenu || `Bonjour ${contextVars.client}, votre agence ${agency.name || ''} vous contacte. Pour toute question, répondez à ce message.`;
      }

      // ── Canaux à envoyer ──────────────────────────────────────────────
      const canaux = automation.canal === 'les_deux' ? ['sms', 'whatsapp'] : [automation.canal];

      for (const canal of canaux) {
        // Journaliser dans Message (apparaît dans HubCommunication)
        await base44.asServiceRole.entities.Message.create({
          canal,
          contenu,
          direction: 'sortant',
          contact_email:     recipientEmail || '',
          contact_nom:       recipientName || 'Client',
          contact_telephone: recipientPhone || '',
          auteur_nom:        agency.name || 'Agence IA',
          source_type,
          source_id,
          automation_id: automation.id,
        });

        // Si SMS et téléphone connu → notification email de suivi (canal SMS simulé)
        // En production: brancher Twilio/Vonage ici
        if (recipientPhone && recipientEmail && canal === 'sms') {
          // Optionnel: envoi d'un email de confirmation de SMS
        }
      }

      // ── Journaliser dans MessageAutomation ────────────────────────────
      const logEntry = {
        dedupe_key: dedupeKey(automation.id, source_id),
        to_phone:   recipientPhone || '',
        to_email:   recipientEmail || '',
        to_nom:     recipientName,
        canal:      automation.canal,
        contenu,
        source_type,
        source_id,
        date: new Date().toISOString(),
      };

      await base44.asServiceRole.entities.MessageAutomation.update(automation.id, {
        nb_envois:        (automation.nb_envois || 0) + 1,
        dernier_envoi:    new Date().toISOString(),
        historique_envois: [...(automation.historique_envois || []).slice(-99), logEntry],
      });

      sentCount++;
      results.push({ automation_id: automation.id, sent: true, canal: automation.canal, to: recipientPhone || recipientEmail, contenu: contenu.substring(0, 80) + '…' });
    }

    return Response.json({ success: true, sent: sentCount, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});