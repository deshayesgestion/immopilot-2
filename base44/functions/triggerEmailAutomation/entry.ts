import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * triggerEmailAutomation — Handler d'automation entity
 * Appelé par les automations Base44 (DossierImmobilier, Paiement, TicketIA, Bien)
 *
 * Payload (entity automation):
 *   event: { type, entity_name, entity_id }
 *   data: {...}
 *   old_data: {...}
 *   changed_fields: [...]
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { event = {}, data = {}, old_data = {} } = body;
    const { type: eventType, entity_name, entity_id } = event;

    // Mapper entity_name → trigger + source_type
    let trigger = null;
    let source_type = null;

    if (entity_name === 'DossierImmobilier') {
      if (eventType === 'create') {
        trigger = 'dossier_cree';
        source_type = 'dossier';
      } else if (eventType === 'update' && data.statut !== old_data?.statut) {
        trigger = 'dossier_statut_change';
        source_type = 'dossier';
      }
    } else if (entity_name === 'Paiement') {
      if (eventType === 'create' || (eventType === 'update' && data.statut !== old_data?.statut)) {
        trigger = 'paiement_enregistre';
        source_type = 'paiement';
      }
    } else if (entity_name === 'TicketIA') {
      if (eventType === 'create') {
        trigger = 'ticket_cree';
        source_type = 'ticket';
      }
    } else if (entity_name === 'Bien') {
      if (eventType === 'update' && data.statut !== old_data?.statut) {
        trigger = 'bien_statut_change';
        source_type = 'bien';
      }
    }

    if (!trigger || !source_type) {
      return Response.json({ ok: true, skipped: true, reason: 'no_matching_trigger' });
    }

    // Déléguer à emailAutomation ET smsWhatsappAutomation en parallèle
    const [emailResult, smsResult] = await Promise.all([
      base44.asServiceRole.functions.invoke('emailAutomation', {
        trigger, source_type, source_id: entity_id, source_data: data,
      }),
      base44.asServiceRole.functions.invoke('smsWhatsappAutomation', {
        trigger, source_type, source_id: entity_id, source_data: data,
      }),
    ]);

    return Response.json({
      ok: true, trigger,
      email: emailResult?.data || emailResult,
      sms_wa: smsResult?.data || smsResult,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});