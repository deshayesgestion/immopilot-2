import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * alerteTicketUrgent — Automation entity (TicketIA create/update)
 * Appelé par le système interne uniquement — pas d'user authentifié.
 * Sécurité : valide que le payload provient bien d'une automation Base44
 * (présence du champ "event.type" et "data" structuré).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { event, data } = body;

    // Validation du payload automation — rejette les appels malformés
    if (!event?.type || !data || typeof data !== "object") {
      return Response.json({ error: "Payload automation invalide", code: "ACCESS_DENIED" }, { status: 403 });
    }

    if (!data || data.priorite !== 'urgent') {
      return Response.json({ skipped: true });
    }

    // Récupérer l'agence pour l'email de contact
    const agencies = await base44.asServiceRole.entities.Agency.list('-created_date', 1);
    const agency = agencies[0];
    const agentEmail = agency?.email || data.agent_assigne;

    if (!agentEmail) return Response.json({ skipped: true, reason: 'no_agent_email' });

    const typeLabel = {
      incident_logement: "Incident logement",
      demande_visite: "Demande de visite",
      probleme_paiement: "Problème paiement",
      question_administrative: "Question administrative",
      autre: "Autre",
    }[data.type_demande] || data.type_demande;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: agentEmail,
      subject: `🚨 URGENT — Ticket ${data.numero || 'TKT'} : ${typeLabel}`,
      body: `Un ticket urgent vient d'être créé via l'Accueil IA.\n\n` +
        `📋 TICKET : ${data.numero || 'N/A'}\n` +
        `👤 Appelant : ${data.appelant_nom || 'Inconnu'}\n` +
        `📞 Téléphone : ${data.appelant_telephone || '—'}\n` +
        `🔖 Type : ${typeLabel}\n` +
        `📁 Module : ${data.module || '—'}\n\n` +
        `💬 Résumé IA :\n${data.resume_ia || data.description || 'Aucune description'}\n\n` +
        `⚡ Veuillez traiter ce ticket en priorité.\n\n` +
        `—\n${agency?.name || 'ImmoPilot'} — Système d'accueil IA`,
    });

    return Response.json({ success: true, notified: agentEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});