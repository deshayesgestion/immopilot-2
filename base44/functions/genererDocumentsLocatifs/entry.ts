import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── RBAC inline ──────────────────────────────────────────────────────────────
const INTERNAL_ROLES = ["admin","responsable_location","responsable_vente","agent","gestionnaire","comptable"];
const MODULE_PERMS = { admin:{location:"full"}, responsable_location:{location:"write"}, responsable_vente:{location:"read"}, agent:{location:"write"}, gestionnaire:{location:"write"}, comptable:{location:"read"} };
function accessDenied(msg) { return Response.json({ error: msg, code: "ACCESS_DENIED", timestamp: new Date().toISOString() }, { status: 403 }); }
async function checkRole(base44) {
  let user; try { user = await base44.auth.me(); } catch { return null; } // scheduled: pas d'user → on autorise
  if (!user) return null; // appelé par automation planifiée sans user
  if (!INTERNAL_ROLES.includes(user.role)) return accessDenied(`Accès back-office refusé pour le rôle "${user.role}"`);
  const level = MODULE_PERMS[user.role]?.location ?? "none";
  if (level === "none" || level === "read") return accessDenied(`Permission refusée : "${user.role}" ne peut pas générer des documents`);
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const denied = await checkRole(base44);
  if (denied) return denied;

  // Accept both manual (with dossier_id) and scheduled (all active dossiers)
  const body = await req.json().catch(() => ({}));
  const { dossier_id } = body;

  let dossiers = [];

  if (dossier_id) {
    const res = await base44.asServiceRole.entities.DossierLocatif.filter({ id: dossier_id });
    dossiers = res;
  } else {
    // Scheduled: process all "termine" (active) dossiers
    dossiers = await base44.asServiceRole.entities.DossierLocatif.filter({ statut: "termine" });
  }

  const now = new Date();
  const moisLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const moisNum = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const results = [];

  for (const dossier of dossiers) {
    const locataire = dossier.locataire_selectionne;
    if (!locataire?.email) continue;

    const loyer = dossier.loyer || 0;
    const charges = dossier.charges || 0;
    const total = loyer + charges;
    const formatEur = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

    // ── QUITTANCE DE LOYER ────────────────────────────────────────────────
    const quittance = `
QUITTANCE DE LOYER — ${moisLabel.toUpperCase()}
══════════════════════════════════════════════════════

BAILLEUR / PROPRIÉTAIRE
${dossier.owner_name || "Le Bailleur"}

LOCATAIRE
${locataire.nom}

BIEN LOUÉ
${dossier.property_title}
${dossier.property_address || ""}

PÉRIODE
Du 1er au dernier jour du mois de ${moisLabel}

DÉTAIL DES SOMMES PERÇUES
  Loyer principal        :  ${formatEur(loyer)}
  Charges récupérables   :  ${formatEur(charges)}
  ─────────────────────────────────────────────
  TOTAL PERÇU            :  ${formatEur(total)}

Je soussigné(e) ${dossier.owner_name || "le propriétaire"} donne quittance à
${locataire.nom} pour la somme de ${formatEur(total)} reçue à titre de loyer
et charges pour la période citée ci-dessus.

Fait le ${now.toLocaleDateString("fr-FR")}

Signature du bailleur : _______________________

Cette quittance annule tous reçus ou acomptes antérieurs.
══════════════════════════════════════════════════════
    `.trim();

    // ── AVIS D'ÉCHÉANCE ───────────────────────────────────────────────────
    const prochainMois = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prochainLabel = prochainMois.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    const avisEcheance = `
AVIS D'ÉCHÉANCE — ${prochainLabel.toUpperCase()}
══════════════════════════════════════════════════════

Locataire    : ${locataire.nom}
Bien         : ${dossier.property_title}
Adresse      : ${dossier.property_address || ""}

MONTANT DÛ POUR LE MOIS DE ${prochainLabel.toUpperCase()}

  Loyer principal        :  ${formatEur(loyer)}
  Charges récupérables   :  ${formatEur(charges)}
  ─────────────────────────────────────────────
  TOTAL À RÉGLER         :  ${formatEur(total)}

DATE LIMITE DE PAIEMENT : Le 5 ${prochainLabel}

Merci de procéder au règlement avant cette date.
Pour tout renseignement : ${dossier.agent_email || "votre agence"}

Cordialement,
${dossier.agent_name || "L'agence"}
══════════════════════════════════════════════════════
    `.trim();

    // ── ENVOI EMAIL ───────────────────────────────────────────────────────
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: locataire.email,
      subject: `📄 Quittance & Avis d'échéance — ${moisLabel}`,
      body: `Bonjour ${locataire.nom},\n\nVeuillez trouver ci-dessous vos documents locatifs pour le mois de ${moisLabel}.\n\n${"─".repeat(60)}\n${quittance}\n\n${"─".repeat(60)}\n${avisEcheance}\n\nCordialement,\n${dossier.agent_name || "L'agence"}`,
    });

    // ── STOCKAGE DANS LE DOSSIER ──────────────────────────────────────────
    const docs = dossier.documents || [];
    const newDocs = [
      ...docs,
      {
        id: Date.now(),
        nom: `Quittance ${moisLabel}`,
        type: "quittance",
        contenu: quittance,
        date: now.toISOString(),
        genere_auto: true,
      },
      {
        id: Date.now() + 1,
        nom: `Avis d'échéance ${prochainLabel}`,
        type: "avis_echeance",
        contenu: avisEcheance,
        date: now.toISOString(),
        genere_auto: true,
      },
    ];

    await base44.asServiceRole.entities.DossierLocatif.update(dossier.id, { documents: newDocs });
    results.push({ dossier_id: dossier.id, locataire: locataire.email, statut: "ok" });
  }

  return Response.json({ success: true, traites: results.length, details: results });
});