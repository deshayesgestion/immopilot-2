import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * analyserEmail — Analyse un email entrant avec l'IA et crée un ticket si nécessaire
 * Payload: { email_id } ou { de, de_nom, objet, corps, date_reception }
 * Accès requis : rôle interne + accès IA generate
 */

// ── RBAC inline ──────────────────────────────────────────────────────────────
const INTERNAL_ROLES = ["admin","responsable_location","responsable_vente","agent","gestionnaire","comptable"];
const IA_PERMS = { admin:{generate:true}, responsable_location:{generate:false}, responsable_vente:{generate:false}, agent:{generate:true}, gestionnaire:{generate:false}, comptable:{generate:false} };
function accessDenied(msg) { return Response.json({ error: msg, code: "ACCESS_DENIED", timestamp: new Date().toISOString() }, { status: 403 }); }
async function checkRole(base44, requiredRoles, requiredIa) {
  let user; try { user = await base44.auth.me(); } catch { return Response.json({ error:"Authentification requise", code:"UNAUTHENTICATED" }, { status:401 }); }
  if (!user?.email) return Response.json({ error:"Authentification requise", code:"UNAUTHENTICATED" }, { status:401 });
  if (!INTERNAL_ROLES.includes(user.role)) return accessDenied(`Accès back-office refusé pour le rôle "${user.role}"`);
  if (requiredIa && !IA_PERMS[user.role]?.[requiredIa]) return accessDenied(`Accès IA refusé : "${user.role}" ne peut pas utiliser "${requiredIa}"`);
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const denied = await checkRole(base44, INTERNAL_ROLES, "generate");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    let email;
    if (body.email_id) {
      const res = await base44.entities.EmailEntrant.filter({ id: body.email_id });
      email = res[0];
      if (!email) return Response.json({ error: 'Email introuvable' }, { status: 404 });
    } else {
      // Créer l'email depuis les données brutes
      email = await base44.entities.EmailEntrant.create({
        de: body.de || '',
        de_nom: body.de_nom || '',
        objet: body.objet || '',
        corps: body.corps || '',
        date_reception: body.date_reception || new Date().toISOString(),
        statut: 'non_lu',
      });
    }

    // ── ANALYSE IA ────────────────────────────────────────────────────────
    const agencies = await base44.entities.Agency.list('-created_date', 1);
    const agency = agencies[0];

    const analyse = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un assistant IA pour une agence immobilière nommée "${agency?.name || 'Agence'}".
Analyse cet email reçu et fournis une classification complète.

DE: ${email.de_nom || email.de}
OBJET: ${email.objet}
CORPS: ${email.corps?.substring(0, 2000) || '(vide)'}

Classifie et fournis:
1. intention (une seule): incident_logement | demande_visite | question_administrative | paiement_facture | demande_information | lead | autre
2. priorite: urgent | normal | faible (urgent si sinistre, urgence technique, menace légale)
3. module: location | vente | comptabilite | general
4. contact_type: locataire | proprietaire | acquereur | prospect | inconnu
5. resume_ia: résumé en 1-2 phrases claires
6. reponse_ia: brouillon de réponse email professionnelle, personnalisée, en français, signée au nom de "${agency?.name || "l'agence"}"
7. creer_ticket: true si l'email nécessite une action (incident, visite, paiement, plainte), false si information simple
8. tags: liste de mots-clés (ex: ["loyer", "fuite", "appartement"])`,
      response_json_schema: {
        type: "object",
        properties: {
          intention: { type: "string" },
          priorite: { type: "string" },
          module: { type: "string" },
          contact_type: { type: "string" },
          resume_ia: { type: "string" },
          reponse_ia: { type: "string" },
          creer_ticket: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    });

    // ── MISE À JOUR EMAIL ─────────────────────────────────────────────────
    const updateData = {
      intention: analyse.intention,
      priorite: analyse.priorite,
      module: analyse.module,
      contact_type: analyse.contact_type,
      resume_ia: analyse.resume_ia,
      reponse_ia: analyse.reponse_ia,
      tags: analyse.tags || [],
      statut: 'lu',
    };

    // ── IDENTIFICATION CONTACT & DOSSIER ─────────────────────────────────
    if (email.de) {
      // 1. Chercher dans Contact (entité CRM unifiée)
      const contacts = await base44.entities.Contact.filter({ email: email.de });
      if (contacts.length > 0) {
        updateData.contact_identifie = true;
        // Chercher un DossierImmobilier lié à ce contact
        const dossiers = await base44.entities.DossierImmobilier.filter({ type: analyse.module === 'vente' ? 'vente' : 'location' });
        const dossierLie = dossiers.find(d => d.contact_ids?.includes(contacts[0].id));
        if (dossierLie) {
          updateData.dossier_id = dossierLie.id;
          if (dossierLie.bien_id) updateData.bien_id = dossierLie.bien_id;
          if (dossierLie.bien_titre) updateData.bien_titre = dossierLie.bien_titre;
        }
      }
      // 2. Fallback: DossierLocatif (ancien système)
      if (!updateData.dossier_id) {
        const dossiersLocatifs = await base44.entities.DossierLocatif.filter({ agent_email: email.de });
        if (dossiersLocatifs.length > 0) {
          updateData.dossier_id = dossiersLocatifs[0].id;
          updateData.contact_identifie = true;
        }
      }
      // 3. Acquereur
      const acquereurs = await base44.entities.Acquereur.filter({ email: email.de });
      if (acquereurs.length > 0) updateData.contact_identifie = true;
    }

    await base44.entities.EmailEntrant.update(email.id, updateData);

    // ── CRÉATION TICKET SI NÉCESSAIRE ────────────────────────────────────
    let ticket = null;
    if (analyse.creer_ticket) {
      ticket = await base44.entities.TicketIA.create({
        source: 'email',
        statut: 'nouveau',
        priorite: analyse.priorite,
        module: analyse.module,
        type_demande: analyse.intention === 'demande_visite' ? 'demande_visite'
          : analyse.intention === 'incident_logement' ? 'incident_logement'
          : analyse.intention === 'paiement_facture' ? 'probleme_paiement'
          : analyse.intention === 'question_administrative' ? 'question_administrative'
          : 'autre',
        appelant_nom: email.de_nom || email.de,
        appelant_email: email.de,
        description: analyse.resume_ia,
        resume_ia: analyse.resume_ia,
        dossier_id: updateData.dossier_id,
        date_appel: email.date_reception,
        numero: `TKT-EMAIL-${Date.now()}`,
        historique: [{ id: Date.now(), content: `Ticket créé automatiquement depuis email: ${email.objet}`, date: new Date().toISOString() }],
      });
      await base44.entities.EmailEntrant.update(email.id, { ticket_id: ticket.id, statut: 'en_cours' });
    }

    // ── CRÉATION LEAD SI PROSPECT ──────────────────────────────────────
    if (analyse.contact_type === 'prospect' || analyse.intention === 'lead') {
      await base44.entities.Lead.create({
        name: email.de_nom || email.de,
        email: email.de,
        source: 'email',
        type: analyse.module === 'vente' ? 'acheteur' : 'locataire',
        notes: analyse.resume_ia,
        status: 'nouveau',
      });
    }

    // ── ALERTE AGENT SI URGENT ────────────────────────────────────────
    if (analyse.priorite === 'urgent' && agency?.email) {
      await base44.integrations.Core.SendEmail({
        to: agency.email,
        subject: `🚨 Email urgent reçu — ${email.objet}`,
        body: `Un email urgent a été reçu et nécessite votre attention.\n\nDE: ${email.de_nom || email.de} (${email.de})\nOBJET: ${email.objet}\n\nRésumé IA:\n${analyse.resume_ia}\n\nModule: ${analyse.module}\nTicket créé: ${ticket ? ticket.numero : 'Non'}\n\n—\n${agency?.name || 'ImmoPilot'}`,
      });
    }

    return Response.json({
      success: true,
      email_id: email.id,
      analyse,
      ticket_id: ticket?.id || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});