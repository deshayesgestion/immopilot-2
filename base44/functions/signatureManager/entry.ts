import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Génère un token unique par signataire ───────────────────────────────────
function generateToken() {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// ── Hash SHA-256 d'une chaîne ───────────────────────────────────────────────
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // ── ACTION: Créer une demande de signature ──────────────────────────────
  if (action === 'create') {
    const { document_type, document_titre, document_url, source_id, source_entity, signataires_input, date_expiration } = body;

    if (!document_type || !signataires_input?.length) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Générer un token unique par signataire
    const signataires = signataires_input.map(s => ({
      id: generateToken().slice(0, 8),
      nom: s.nom,
      email: s.email,
      role: s.role || 'signataire',
      statut: 'en_attente',
      token: generateToken(),
      signe_le: null,
      signature_data: null,
    }));

    // Hash du document pour preuve
    const hashContent = `${document_url || document_titre}|${new Date().toISOString()}|${user.email}`;
    const documentHash = await sha256(hashContent);

    const request = await base44.entities.SignatureRequest.create({
      document_type,
      document_titre,
      document_url: document_url || null,
      source_id: source_id || null,
      source_entity: source_entity || null,
      statut: 'en_preparation',
      signataires,
      date_expiration: date_expiration || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      date_envoi: null,
      preuve_horodatage: documentHash,
      relances_count: 0,
      historique: [{ date: new Date().toISOString(), action: 'Demande créée', auteur: user.email }],
    });

    return Response.json({ success: true, request });
  }

  // ── ACTION: Envoyer les liens de signature par email ────────────────────
  if (action === 'send') {
    const { request_id } = body;
    const requests = await base44.entities.SignatureRequest.filter({ id: request_id });
    const signReq = requests[0];
    if (!signReq) return Response.json({ error: 'Demande introuvable' }, { status: 404 });

    const agencies = await base44.asServiceRole.entities.Agency.list();
    const agency = agencies[0];
    const appUrl = req.headers.get('origin') || 'https://app.base44.com';

    // Envoyer un email à chaque signataire
    for (const s of signReq.signataires) {
      if (!s.email || s.statut === 'signe') continue;

      const signUrl = `${appUrl}/signature?token=${s.token}&rid=${signReq.id}`;

      const emailBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:${agency?.primary_color || '#4F46E5'};padding:24px 28px">
    <h1 style="margin:0;font-size:18px;color:#fff;font-weight:700">${agency?.name || 'Agence Immobilière'}</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Signature électronique requise</p>
  </div>
  <div style="padding:28px">
    <p style="color:#1e293b;font-size:15px;font-weight:600">Bonjour ${s.nom},</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">Vous êtes invité(e) à signer électroniquement le document suivant :</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:18px 0">
      <p style="margin:0;color:#1e293b;font-weight:700;font-size:15px">📄 ${signReq.document_titre}</p>
      <p style="margin:6px 0 0;color:#64748b;font-size:13px">Type : ${signReq.document_type?.replace(/_/g,' ')} · Expire le : ${signReq.date_expiration}</p>
      <p style="margin:6px 0 0;color:#64748b;font-size:13px">Votre rôle : <strong>${s.role}</strong></p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${signUrl}" style="background:${agency?.primary_color || '#4F46E5'};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block">
        ✍️ Signer le document
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;line-height:1.6">Ce lien est personnel et sécurisé. Il expire le <strong>${signReq.date_expiration}</strong>.<br>En signant, vous acceptez la valeur légale de la signature électronique conformément au règlement eIDAS.</p>
  </div>
  <div style="background:#f1f5f9;padding:14px 28px;text-align:center">
    <p style="margin:0;color:#94a3b8;font-size:11px">${agency?.name || ''} • ${agency?.email || ''} • ${agency?.phone || ''}</p>
  </div>
</div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: s.email,
        subject: `📝 Signature requise : ${signReq.document_titre}`,
        body: emailBody,
      });
    }

    // Mettre à jour le statut
    const updatedSignataires = signReq.signataires.map(s => ({ ...s, statut: s.statut === 'signe' ? 'signe' : 'envoye' }));
    const hist = [...(signReq.historique || []), { date: new Date().toISOString(), action: 'Liens de signature envoyés', auteur: user.email }];
    await base44.entities.SignatureRequest.update(signReq.id, {
      statut: 'envoye',
      date_envoi: new Date().toISOString(),
      signataires: updatedSignataires,
      historique: hist,
    });

    return Response.json({ success: true, sent: signReq.signataires.filter(s => s.email).length });
  }

  // ── ACTION: Valider une signature ───────────────────────────────────────
  if (action === 'sign') {
    const { token, request_id, signature_data } = body;
    if (!token || !request_id) return Response.json({ error: 'Token manquant' }, { status: 400 });

    const requests = await base44.asServiceRole.entities.SignatureRequest.filter({ id: request_id });
    const signReq = requests[0];
    if (!signReq) return Response.json({ error: 'Demande introuvable' }, { status: 404 });

    // Vérifier expiration
    if (signReq.date_expiration && new Date(signReq.date_expiration) < new Date()) {
      return Response.json({ error: 'expired', message: 'Ce lien de signature a expiré.' }, { status: 410 });
    }

    // Trouver le signataire
    const sigIdx = signReq.signataires.findIndex(s => s.token === token);
    if (sigIdx === -1) return Response.json({ error: 'Token invalide' }, { status: 403 });

    const signataire = signReq.signataires[sigIdx];
    if (signataire.statut === 'signe') {
      return Response.json({ error: 'already_signed', message: 'Vous avez déjà signé ce document.' });
    }

    // Créer preuve de signature
    const timestamp = new Date().toISOString();
    const preuveStr = `${request_id}|${token}|${signataire.nom}|${signataire.email}|${timestamp}|${signature_data?.slice(0,50) || ''}`;
    const signatureHash = await sha256(preuveStr);

    // Mettre à jour le signataire
    const updatedSignataires = [...signReq.signataires];
    updatedSignataires[sigIdx] = {
      ...signataire,
      statut: 'signe',
      signe_le: timestamp,
      signature_hash: signatureHash,
      signature_data: signature_data || null,
    };

    // Vérifier si tous ont signé
    const tousSignes = updatedSignataires.every(s => s.statut === 'signe');
    const nouveauStatut = tousSignes ? 'signe' : 'partiellement_signe';

    // Certificat de preuve
    const preuveDoc = tousSignes ? {
      hash_document: signReq.preuve_horodatage,
      timestamp_completion: timestamp,
      signataires_preuves: updatedSignataires.map(s => ({
        nom: s.nom, email: s.email, role: s.role,
        hash: s.signature_hash, date: s.signe_le,
      })),
      conforme_eidas: true,
      niveau: 'SES', // Simple Electronic Signature
    } : null;

    const hist = [...(signReq.historique || []), {
      date: timestamp,
      action: `Signé par ${signataire.nom} (${signataire.role})`,
      auteur: signataire.email,
      hash: signatureHash,
    }];

    await base44.asServiceRole.entities.SignatureRequest.update(signReq.id, {
      statut: nouveauStatut,
      signataires: updatedSignataires,
      date_signature_complete: tousSignes ? timestamp : null,
      preuve_certificat: preuveDoc || signReq.preuve_certificat,
      historique: hist,
    });

    // Si tous signés → mettre à jour l'entité source
    if (tousSignes && signReq.source_id && signReq.source_entity) {
      const updateMap = {
        DossierLocatif: { bail_signe: true, bail_statut: 'actif' },
        MandatVente: { statut_mandat: 'signe', date_signature_mandat: timestamp.slice(0, 10) },
      };
      const upd = updateMap[signReq.source_entity];
      if (upd) {
        await base44.asServiceRole.entities[signReq.source_entity]?.update?.(signReq.source_id, upd).catch(() => {});
      }
    }

    return Response.json({ success: true, tous_signes: tousSignes, signataire: signataire.nom });
  }

  // ── ACTION: Vérifier un token (page de signature publique) ──────────────
  if (action === 'verify_token') {
    const { token, request_id } = body;
    const requests = await base44.asServiceRole.entities.SignatureRequest.filter({ id: request_id });
    const signReq = requests[0];
    if (!signReq) return Response.json({ error: 'Introuvable' }, { status: 404 });

    const s = signReq.signataires.find(x => x.token === token);
    if (!s) return Response.json({ error: 'Token invalide' }, { status: 403 });

    const expired = signReq.date_expiration && new Date(signReq.date_expiration) < new Date();
    return Response.json({
      valid: !expired && s.statut !== 'signe',
      expired,
      already_signed: s.statut === 'signe',
      signataire: { nom: s.nom, email: s.email, role: s.role },
      document: { titre: signReq.document_titre, type: signReq.document_type, url: signReq.document_url },
      statut: signReq.statut,
    });
  }

  // ── ACTION: Relance ─────────────────────────────────────────────────────
  if (action === 'relance') {
    const { request_id } = body;
    const requests = await base44.entities.SignatureRequest.filter({ id: request_id });
    const signReq = requests[0];
    if (!signReq) return Response.json({ error: 'Introuvable' }, { status: 404 });

    const agencies = await base44.asServiceRole.entities.Agency.list();
    const agency = agencies[0];
    const appUrl = req.headers.get('origin') || 'https://app.base44.com';
    let sent = 0;

    for (const s of signReq.signataires.filter(x => x.statut !== 'signe' && x.email)) {
      const signUrl = `${appUrl}/signature?token=${s.token}&rid=${signReq.id}`;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: s.email,
        subject: `⏰ Rappel : Signature en attente — ${signReq.document_titre}`,
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<div style="background:${agency?.primary_color || '#4F46E5'};padding:20px;border-radius:12px 12px 0 0">
<h2 style="color:#fff;margin:0">Rappel de signature</h2></div>
<div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
<p>Bonjour <strong>${s.nom}</strong>,</p>
<p>Le document <strong>${signReq.document_titre}</strong> attend toujours votre signature.</p>
<div style="text-align:center;margin:20px 0">
<a href="${signUrl}" style="background:${agency?.primary_color || '#4F46E5'};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">✍️ Signer maintenant</a>
</div>
<p style="color:#94a3b8;font-size:12px">Expire le ${signReq.date_expiration}</p></div></div>`,
      });
      sent++;
    }

    const hist = [...(signReq.historique || []), { date: new Date().toISOString(), action: `Relance envoyée (${sent} destinataire(s))`, auteur: user.email }];
    await base44.entities.SignatureRequest.update(signReq.id, {
      relances_count: (signReq.relances_count || 0) + 1,
      derniere_relance: new Date().toISOString(),
      historique: hist,
    });

    return Response.json({ success: true, sent });
  }

  return Response.json({ error: 'Action inconnue' }, { status: 400 });
});