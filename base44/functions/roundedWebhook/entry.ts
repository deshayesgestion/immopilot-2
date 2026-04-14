import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * roundedWebhook — Reçoit les événements webhook de Rounded (callrounded.com)
 * À enregistrer dans le dashboard Rounded comme URL de webhook.
 * 
 * Événements traités:
 * - event_call_status_updated : mise à jour statut appel
 * - event_transcript          : transcription en temps réel
 * - event_post_call           : fin d'appel — déclenchement analyse IA + création ticket
 */
Deno.serve(async (req) => {
  try {
    // Rounded envoie les events en POST JSON
    const payload = await req.json().catch(() => null);
    if (!payload) return Response.json({ error: 'Invalid payload' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const eventType = payload.type;
    const callId = payload.call_id;

    // ── event_call_status_updated ─────────────────────────────────────────
    if (eventType === 'event_call_status_updated') {
      const { status, direction, from_phone_number, to_phone_number } = payload;

      if (status === 'connected') {
        // Chercher ou créer un ticket "en cours"
        const existing = await base44.asServiceRole.entities.TicketIA.filter({ appelant_telephone: from_phone_number, statut: 'nouveau' });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.TicketIA.create({
            source: 'appel',
            statut: 'en_cours',
            priorite: 'normal',
            module: 'general',
            type_demande: 'autre',
            appelant_telephone: from_phone_number || '',
            date_appel: new Date().toISOString(),
            numero: `TKT-RND-${callId?.substring(0, 8) || Date.now()}`,
            description: `Appel entrant Rounded (${direction}) — call_id: ${callId}`,
            historique: [{ id: Date.now(), content: `Appel connecté via Rounded`, date: new Date().toISOString() }],
          });
        }
      }

      return Response.json({ ok: true, handled: 'call_status' });
    }

    // ── event_transcript ──────────────────────────────────────────────────
    if (eventType === 'event_transcript') {
      // On stocke la transcription en temps réel sur le ticket associé
      const { text, sender } = payload;
      const tickets = await base44.asServiceRole.entities.TicketIA.filter({ statut: 'en_cours' });
      // Trouver le ticket le plus récent lié à ce call
      const ticket = tickets.find(t => t.description?.includes(callId)) || tickets[0];
      if (ticket) {
        const prev = ticket.transcription || '';
        const line = `${sender === 'agent' ? '🤖 Agent' : '👤 Appelant'}: ${text}`;
        await base44.asServiceRole.entities.TicketIA.update(ticket.id, {
          transcription: prev ? `${prev}\n${line}` : line,
        });
      }
      return Response.json({ ok: true, handled: 'transcript' });
    }

    // ── event_post_call ───────────────────────────────────────────────────
    if (eventType === 'event_post_call') {
      const {
        from_phone_number,
        to_phone_number,
        duration_seconds,
        transcript_string,
        variable_values = [],
        post_call_answers = [],
      } = payload.data || payload;

      // Extraire les variables Rounded (nom appelant, intention, etc.)
      const getVar = (name) => variable_values.find(v => v.name === name)?.value || '';
      const appelantNom = getVar('caller_name') || getVar('nom') || getVar('prenom') || '';
      const intention = getVar('intention') || getVar('demande') || '';
      const module_ = getVar('module') || 'general';
      const priorite = getVar('priorite') || 'normal';
      const bien = getVar('bien') || getVar('adresse') || '';

      // Analyse IA du résumé d'appel
      const agencies = await base44.asServiceRole.entities.Agency.list('-created_date', 1);
      const agency = agencies[0];

      let resumeIA = '';
      let intentionIA = intention || 'autre';
      let moduleIA = module_ || 'general';
      let prioriteIA = priorite || 'normal';

      if (transcript_string) {
        const analyse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Tu es un assistant IA pour l'agence immobilière "${agency?.name || 'Agence'}".
Analyse cette transcription d'appel téléphonique et fournis une classification.

TRANSCRIPTION:
${transcript_string.substring(0, 3000)}

Fournis:
1. resume: résumé en 1-2 phrases de la demande du client
2. intention: incident_logement | demande_visite | question_administrative | probleme_paiement | demande_information | autre
3. module: location | vente | comptabilite | general
4. priorite: urgent | normal | faible
5. appelant_nom: nom de l'appelant si mentionné (sinon chaîne vide)
6. bien_titre: adresse ou nom du bien mentionné (sinon chaîne vide)`,
          response_json_schema: {
            type: 'object',
            properties: {
              resume: { type: 'string' },
              intention: { type: 'string' },
              module: { type: 'string' },
              priorite: { type: 'string' },
              appelant_nom: { type: 'string' },
              bien_titre: { type: 'string' },
            }
          }
        });
        resumeIA = analyse.resume || '';
        intentionIA = analyse.intention || intentionIA;
        moduleIA = analyse.module || moduleIA;
        prioriteIA = analyse.priorite || prioriteIA;
        if (!appelantNom && analyse.appelant_nom) {
          // use from IA
        }
      }

      // Chercher un ticket en_cours lié à cet appel
      const existing = await base44.asServiceRole.entities.TicketIA.filter({ statut: 'en_cours' });
      const ticket = existing.find(t => t.description?.includes(callId) || t.appelant_telephone === from_phone_number);

      const ticketData = {
        source: 'appel',
        statut: 'nouveau',
        priorite: prioriteIA,
        module: moduleIA,
        type_demande: intentionIA,
        appelant_nom: appelantNom || from_phone_number || 'Inconnu',
        appelant_telephone: from_phone_number || '',
        description: resumeIA || transcript_string?.substring(0, 500) || '',
        resume_ia: resumeIA,
        transcription: transcript_string || '',
        bien_titre: bien,
        date_appel: new Date().toISOString(),
        duree_secondes: duration_seconds || 0,
        historique: [{ id: Date.now(), content: `Appel terminé via Rounded. Durée: ${duration_seconds || 0}s`, date: new Date().toISOString() }],
      };

      let finalTicket;
      if (ticket) {
        await base44.asServiceRole.entities.TicketIA.update(ticket.id, { ...ticketData, numero: ticket.numero });
        finalTicket = ticket;
      } else {
        finalTicket = await base44.asServiceRole.entities.TicketIA.create({
          ...ticketData,
          numero: `TKT-RND-${Date.now()}`,
        });
      }

      // Alerte email si urgent — envoi à l'admin de l'app uniquement
      if (prioriteIA === 'urgent') {
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        for (const admin of admins) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `🚨 Appel urgent — ${appelantNom || from_phone_number}`,
            body: `Un appel urgent a été traité par l'agent Rounded.\n\nAppelant: ${appelantNom || from_phone_number}\nDurée: ${duration_seconds || 0}s\nModule: ${moduleIA}\n\nRésumé:\n${resumeIA}\n\nTicket: ${finalTicket.numero}\n\n—\n${agency?.name || 'ImmoPilot'}`,
          });
        }
      }

      // Créer un lead si inconnu
      if (!appelantNom || intentionIA === 'demande_visite' || intentionIA === 'demande_information') {
        const leads = await base44.asServiceRole.entities.Lead.filter({ phone: from_phone_number });
        if (leads.length === 0 && from_phone_number) {
          await base44.asServiceRole.entities.Lead.create({
            name: appelantNom || `Appelant ${from_phone_number}`,
            email: '',
            phone: from_phone_number,
            source: 'telephone',
            type: moduleIA === 'vente' ? 'acheteur' : 'locataire',
            notes: resumeIA,
            status: 'nouveau',
          });
        }
      }

      return Response.json({ ok: true, handled: 'post_call', ticket_id: finalTicket.id });
    }

    // Événement non géré — on renvoie 200 quand même pour ne pas déclencher de retry Rounded
    return Response.json({ ok: true, handled: 'ignored', event_type: eventType });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});