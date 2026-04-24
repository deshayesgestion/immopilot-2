import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, from_name } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Send email via Base44 Core integration
    const result = await base44.integrations.Core.SendEmail({
      to,
      subject,
      body,
      from_name: from_name || 'Agence Immobilière'
    });

    return Response.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      to,
      subject 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});