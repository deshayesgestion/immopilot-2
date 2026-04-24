import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email_id, to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing to, subject, or body' }, { status: 400 });
    }

    // Send email via Base44 Core integration
    const result = await base44.integrations.Core.SendEmail({
      to,
      subject,
      body,
      from_name: 'Agence Immobilière'
    });

    // Mark email response as sent if it's from an incoming email
    if (email_id) {
      await base44.asServiceRole.entities.EmailEntrant.update(email_id, {
        reponse_envoyee: true,
        reponse_envoyee_le: new Date().toISOString(),
        statut: 'traite'
      });
    }

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Send email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});