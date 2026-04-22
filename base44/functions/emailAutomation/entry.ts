import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * emailAutomation — Cerveau d'envoi automatique d'emails immobiliers
 *
 * Payload:
 *   trigger: string          — événement déclencheur
 *   source_type: string      — "dossier" | "paiement" | "ticket" | "bien"
 *   source_id: string        — ID de l'entité source
 *   source_data: object      — données de l'entité (évite un aller-retour DB)
 *   force: boolean           — ignorer anti-doublon (défaut: false)
 */

const BRANDING_FOOTER = (agencyName) =>
  `\n\n—\n${agencyName || 'Votre agence immobilière'}\nCe message a été généré automatiquement. Pour toute question, répondez directement à cet email.`;

// Anti-doublon : clé unique par (automation_id + source_id + jour)
function dedupeKey(automationId, sourceId) {
  const day = new Date().toISOString().substring(0, 10);
  return `${automationId}-${sourceId}-${day}`;
}

function alreadySent(automation, sourceId) {
  const key = dedupeKey(automation.id, sourceId);
  return (automation.historique_envois || []).some(h => h.dedupe_key === key);
}

// Résoudre les variables template
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const {
      trigger,
      source_type,
      source_id,
      source_data = {},
      force = false,
    } = body;

    if (!trigger) return Response.json({ error: 'trigger requis' }, { status: 400 });

    // ── Charger agence ────────────────────────────────────────────────────
    const agencies = await base44.asServiceRole.entities.Agency.list('-created_date', 1);
    const agency = agencies[0] || {};

    // ── Charger automations actives pour ce trigger ───────────────────────
    const automations = await base44.asServiceRole.entities.EmailAutomation.filter({
      trigger,
      actif: true,
    });

    if (automations.length === 0) {
      return Response.json({ success: true, sent: 0, reason: 'no_active_automation' });
    }

    // ── Résoudre le destinataire selon source_type ────────────────────────
    let recipientEmail = null;
    let recipientName = null;
    let contextVars = {};

    if (source_type === 'dossier') {
      const dossier = source_data.id ? source_data : (await base44.asServiceRole.entities.DossierImmobilier.filter({ id: source_id }))[0];
      if (dossier?.contact_ids?.length > 0) {
        const contact = (await base44.asServiceRole.entities.Contact.filter({ id: dossier.contact_ids[0] }))[0];
        recipientEmail = contact?.email;
        recipientName = contact?.nom;
      }
      contextVars = {
        client: recipientName || 'Client',
        bien: dossier?.bien_titre || '',
        dossier: dossier?.titre || dossier?.reference || '',
        statut: dossier?.statut || '',
      };
    } else if (source_type === 'paiement') {
      const paiement = source_data.id ? source_data : (await base44.asServiceRole.entities.Paiement.filter({ id: source_id }))[0];
      const contact = paiement?.contact_id
        ? (await base44.asServiceRole.entities.Contact.filter({ id: paiement.contact_id }))[0]
        : null;
      recipientEmail = contact?.email;
      recipientName = contact?.nom;
      const bien = paiement?.bien_id
        ? (await base44.asServiceRole.entities.Bien.filter({ id: paiement.bien_id }))[0]
        : null;
      contextVars = {
        client: recipientName || 'Client',
        bien: bien?.titre || '',
        montant: paiement?.montant ? `${paiement.montant.toLocaleString('fr-FR')} €` : '',
        statut: paiement?.statut || '',
        date: paiement?.date_echeance ? new Date(paiement.date_echeance).toLocaleDateString('fr-FR') : '',
      };
    } else if (source_type === 'ticket') {
      const ticket = source_data.id ? source_data : (await base44.asServiceRole.entities.TicketIA.filter({ id: source_id }))[0];
      recipientEmail = ticket?.appelant_email;
      recipientName = ticket?.appelant_nom;
      contextVars = {
        client: recipientName || 'Client',
        bien: ticket?.bien_titre || '',
        dossier: ticket?.numero || '',
        statut: ticket?.statut || '',
      };
    } else if (source_type === 'bien') {
      const bien = source_data.id ? source_data : (await base44.asServiceRole.entities.Bien.filter({ id: source_id }))[0];
      // Pour un bien, on notifie l'admin de l'agence
      recipientEmail = agency.email;
      recipientName = agency.name;
      contextVars = {
        client: agency.name || 'Agence',
        bien: bien?.titre || '',
        statut: bien?.statut || '',
      };
    }

    if (!recipientEmail) {
      return Response.json({ success: true, sent: 0, reason: 'no_recipient' });
    }

    let sentCount = 0;
    const results = [];

    for (const automation of automations) {
      // Filtrer par module si condition configurée
      if (automation.condition_module && automation.condition_module !== 'tous') {
        if (source_data.type && source_data.type !== automation.condition_module) continue;
        if (source_data.module && source_data.module !== automation.condition_module) continue;
      }

      // Anti-doublon (sauf force=true)
      if (!force && alreadySent(automation, source_id)) {
        results.push({ automation_id: automation.id, skipped: true, reason: 'already_sent_today' });
        continue;
      }

      // ── Générer le contenu IA si pas de template ───────────────────────
      let sujet = resolveTemplate(automation.sujet_template, contextVars);
      let corps = resolveTemplate(automation.corps_template, contextVars);

      if (!corps) {
        const typeLabels = {
          suivi_dossier: 'suivi de dossier immobilier',
          rappel_paiement: 'rappel de paiement de loyer',
          confirmation_visite: 'confirmation de visite immobilière',
          mise_a_jour_hebdo: 'mise à jour hebdomadaire',
          bienvenue: 'accueil client',
          alerte_urgente: 'alerte urgente',
        };
        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Tu es l'assistant de l'agence immobilière "${agency.name || 'Agence'}".
Rédige un email professionnel de type "${typeLabels[automation.type_email] || automation.type_email}" pour :
- Client : ${contextVars.client}
- Bien : ${contextVars.bien || 'non spécifié'}
- Dossier / Référence : ${contextVars.dossier || 'non spécifié'}
- Montant : ${contextVars.montant || 'non spécifié'}
- Statut : ${contextVars.statut || 'non spécifié'}
- Contexte : ${trigger}

L'email doit être chaleureux, professionnel, en français, 3-5 phrases maximum.
Inclure objet ET corps séparément.`,
          response_json_schema: {
            type: 'object',
            properties: {
              sujet: { type: 'string' },
              corps: { type: 'string' },
            }
          }
        });
        sujet = sujet || generated.sujet || `Information de votre agence — ${agency.name || ''}`;
        corps = generated.corps || '';
      }

      // ── Envoi ─────────────────────────────────────────────────────────
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        from_name: agency.name || undefined,
        subject: sujet,
        body: corps + BRANDING_FOOTER(agency.name),
      });

      // ── Journaliser ───────────────────────────────────────────────────
      const logEntry = {
        dedupe_key: dedupeKey(automation.id, source_id),
        to: recipientEmail,
        to_nom: recipientName,
        sujet,
        source_type,
        source_id,
        date: new Date().toISOString(),
      };

      await base44.asServiceRole.entities.EmailAutomation.update(automation.id, {
        nb_envois: (automation.nb_envois || 0) + 1,
        dernier_envoi: new Date().toISOString(),
        historique_envois: [...(automation.historique_envois || []).slice(-99), logEntry],
      });

      sentCount++;
      results.push({ automation_id: automation.id, sent: true, to: recipientEmail, sujet });
    }

    return Response.json({ success: true, sent: sentCount, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});