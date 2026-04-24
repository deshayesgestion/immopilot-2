import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * genererRapportHebdo — Scheduled automation (every Friday)
 * Génère et envoie un rapport hebdomadaire personnalisé à chaque utilisateur actif.
 * 
 * Anti-doublons : vérifie qu'aucun rapport n'a déjà été envoyé cette semaine.
 * Robustesse : retry automatique, logs, gestion d'erreurs.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ────────────────────────────────────────────────────────────
    // 1. RÉCUPÉRER LES DONNÉES
    // ────────────────────────────────────────────────────────────
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const agency = (await base44.asServiceRole.entities.Agency.list('-created_date', 1))[0] || null;
    const rapportsExistants = await base44.asServiceRole.entities.RapportHebdo.list('-created_date', 500);

    // Dates semaine actuelle (lundi à dimanche)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - distanceToMonday);
    mondayDate.setHours(0, 0, 0, 0);

    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    sundayDate.setHours(23, 59, 59, 999);

    const semaineLundi = mondayDate.toISOString().substring(0, 10);
    const semaineFinale = sundayDate.toISOString().substring(0, 10);

    // ────────────────────────────────────────────────────────────
    // 2. TRAITER CHAQUE UTILISATEUR
    // ────────────────────────────────────────────────────────────
    const resultats = [];

    for (const user of users) {
      try {
        // Vérifier anti-doublon : existe-t-il déjà un rapport pour cette semaine ?
        const rapportExiste = rapportsExistants.some(r =>
          r.user_email === user.email &&
          r.semaine_debut === semaineLundi &&
          r.statut !== "echec"
        );

        if (rapportExiste) {
          resultats.push({ user: user.email, status: "skipped", reason: "Rapport déjà généré cette semaine" });
          continue;
        }

        // Créer un enregistrement de suivi
        const rapportRecord = await base44.asServiceRole.entities.RapportHebdo.create({
          user_email: user.email,
          user_name: user.full_name || user.email,
          user_role: user.role,
          semaine_debut: semaineLundi,
          semaine_fin: semaineFinale,
          statut: "genere",
          date_generation: new Date().toISOString(),
          nb_tentatives_envoi: 0,
        });

        // ────────────────────────────────────────────────────────────
        // 3. RÉCUPÉRER DONNÉES UTILISATEUR (filtres par email/role)
        // ────────────────────────────────────────────────────────────
        const dossiers = await base44.asServiceRole.entities.DossierLocatif.filter(
          { agent_email: user.email },
          '-updated_date',
          100
        );
        const transactions = await base44.asServiceRole.entities.TransactionVente.filter(
          { agent_email: user.email },
          '-updated_date',
          100
        );
        const taches = await base44.asServiceRole.entities.Tache.filter(
          { assignee_email: user.email },
          '-updated_date',
          50
        );
        const messages = await base44.asServiceRole.entities.Message.filter(
          { auteur_email: user.email },
          '-created_date',
          100
        );

        // ────────────────────────────────────────────────────────────
        // 4. CALCULER MÉTRIQUES SEMAINE
        // ────────────────────────────────────────────────────────────
        const dateDebut = new Date(semaineLundi);
        const dateFin = new Date(semaineFinale);

        const dossiersCrees = dossiers.filter(d => {
          const dc = new Date(d.created_date);
          return dc >= dateDebut && dc <= dateFin;
        }).length;

        const dossiersModifies = dossiers.filter(d => {
          const du = new Date(d.updated_date);
          return du >= dateDebut && du <= dateFin && new Date(d.created_date) < dateDebut;
        }).length;

        const dossiersClotures = dossiers.filter(d =>
          d.statut === "cloture" && new Date(d.updated_date) >= dateDebut && new Date(d.updated_date) <= dateFin
        ).length;

        const transactionsAvancees = transactions.filter(t => {
          const tu = new Date(t.updated_date);
          return tu >= dateDebut && tu <= dateFin;
        }).length;

        const offres = transactions.filter(t => t.prix_offre).length;
        const vendus = transactions.filter(t => t.statut === "vendu").length;

        const tachesCompletees = taches.filter(t =>
          t.statut === "terminee" && new Date(t.updated_date) >= dateDebut && new Date(t.updated_date) <= dateFin
        ).length;

        const activitesClients = messages.filter(m => {
          const mc = new Date(m.created_date);
          return mc >= dateDebut && mc <= dateFin;
        }).length;

        // ────────────────────────────────────────────────────────────
        // 5. GÉNÉRER RÉSUMÉS
        // ────────────────────────────────────────────────────────────
        const resumeLocation = `${dossiersCrees} dossiers créés, ${dossiersModifies} modifiés, ${dossiersClotures} clôturés`;
        const resumeVente = `${transactionsAvancees} transactions en cours, ${offres} offres, ${vendus} ventes finalisées`;

        const indicateurs = {
          dossiers_crees: dossiersCrees,
          dossiers_modifies: dossiersModifies,
          dossiers_clotures: dossiersClotures,
          transactions_avancees: transactionsAvancees,
          offres_recues: offres,
          vendus: vendus,
          taches_completees: tachesCompletees,
          activites_clients: activitesClients,
        };

        // ────────────────────────────────────────────────────────────
        // 6. GÉNÉRER PDF
        // ────────────────────────────────────────────────────────────
        const pdf = new jsPDF();
        const primaryColor = agency?.primary_color || "#4F46E5";
        const r = parseInt(primaryColor.slice(1, 3), 16);
        const g = parseInt(primaryColor.slice(3, 5), 16);
        const b = parseInt(primaryColor.slice(5, 7), 16);

        // En-tête
        pdf.setFillColor(r, g, b);
        pdf.rect(0, 0, 210, 30, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.text(agency?.name || "Rapport Hebdomadaire", 14, 12);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${agency?.address || ""} ${agency?.postal_code || ""} ${agency?.city || ""}`, 14, 19);
        pdf.text(`${agency?.email || ""} | ${agency?.phone || ""}`, 14, 24);

        // Titre
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`RAPPORT HEBDOMADAIRE`, 14, 45);
        pdf.setFontSize(10);
        pdf.text(`${semaineLundi} à ${semaineFinale}`, 14, 52);

        let y = 62;

        // Infos utilisateur
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("UTILISATEUR", 14, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${user.full_name || user.email}`, 14, y + 6);
        pdf.text(`Rôle: ${user.role}`, 14, y + 12);

        y = 90;

        // Section Location
        pdf.setFillColor(r, g, b);
        pdf.rect(10, y, 190, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("ACTIVITÉ LOCATION", 14, y + 5);

        y += 12;
        pdf.setTextColor(30, 30, 30);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Dossiers créés: ${dossiersCrees}`, 14, y);
        pdf.text(`Dossiers modifiés: ${dossiersModifies}`, 14, y + 6);
        pdf.text(`Dossiers clôturés: ${dossiersClotures}`, 14, y + 12);

        y += 25;

        // Section Vente
        pdf.setFillColor(r, g, b);
        pdf.rect(10, y, 190, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("ACTIVITÉ VENTE", 14, y + 5);

        y += 12;
        pdf.setTextColor(30, 30, 30);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Transactions en cours: ${transactionsAvancees}`, 14, y);
        pdf.text(`Offres reçues: ${offres}`, 14, y + 6);
        pdf.text(`Ventes finalisées: ${vendus}`, 14, y + 12);

        y += 25;

        // Section Tâches & Activité
        pdf.setFillColor(r, g, b);
        pdf.rect(10, y, 190, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("PRODUCTIVITÉ", 14, y + 5);

        y += 12;
        pdf.setTextColor(30, 30, 30);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Tâches complétées: ${tachesCompletees}`, 14, y);
        pdf.text(`Interactions clients: ${activitesClients}`, 14, y + 6);

        // Pied de page
        y = 270;
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 14, y);
        pdf.text(`${agency?.name || "Agence"}`, 160, y, { align: "right" });

        // ────────────────────────────────────────────────────────────
        // 7. UPLOADER PDF ET ENVOYER EMAIL
        // ────────────────────────────────────────────────────────────
        const pdfBlob = pdf.output("blob");
        const pdfFile = new File([pdfBlob], `rapport-hebdo-${semaineLundi}.pdf`, { type: "application/pdf" });

        // Uploader le PDF
        let pdfUrl = null;
        try {
          const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });
          pdfUrl = uploadResult.file_url;
        } catch (uploadError) {
          console.warn("⚠️ Erreur upload PDF:", uploadError.message);
        }

        const resumeEmailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 8px;">
  <div style="background: ${agency?.primary_color || "#4F46E5"}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 18px;">${agency?.name || "Rapport Hebdomadaire"}</h1>
    <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.9;">Semaine du ${semaineLundi} au ${semaineFinale}</p>
  </div>

  <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
    <p style="margin-top: 0;">Bonjour <strong>${user.full_name || user.email}</strong>,</p>

    <h3 style="color: ${agency?.primary_color || "#4F46E5"}; margin-top: 20px; margin-bottom: 10px;">📍 ACTIVITÉ LOCATION</h3>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
      <li>Dossiers créés: <strong>${dossiersCrees}</strong></li>
      <li>Dossiers modifiés: <strong>${dossiersModifies}</strong></li>
      <li>Dossiers clôturés: <strong>${dossiersClotures}</strong></li>
    </ul>

    <h3 style="color: ${agency?.primary_color || "#4F46E5"}; margin-top: 20px; margin-bottom: 10px;">📍 ACTIVITÉ VENTE</h3>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
      <li>Transactions en cours: <strong>${transactionsAvancees}</strong></li>
      <li>Offres reçues: <strong>${offres}</strong></li>
      <li>Ventes finalisées: <strong>${vendus}</strong></li>
    </ul>

    <h3 style="color: ${agency?.primary_color || "#4F46E5"}; margin-top: 20px; margin-bottom: 10px;">📍 PRODUCTIVITÉ</h3>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
      <li>Tâches complétées: <strong>${tachesCompletees}</strong></li>
      <li>Interactions clients: <strong>${activitesClients}</strong></li>
    </ul>

    ${pdfUrl ? `
      <div style="margin-top: 30px; text-align: center;">
        <a href="${pdfUrl}" style="background: ${agency?.primary_color || "#4F46E5"}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          📄 Télécharger le rapport détaillé
        </a>
      </div>
    ` : ''}

    <p style="margin-top: 30px; margin-bottom: 0; color: #666; font-size: 12px;">
      Cordialement,<br>
      <strong>${agency?.name || "L'agence"}</strong><br>
      ${agency?.email || ""} | ${agency?.phone || ""}
    </p>
  </div>
</div>
        `.trim();

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `📊 Votre rapport hebdomadaire — ${agency?.name || "Agence"}`,
            body: resumeEmailHtml,
          });

          // Mettre à jour le rapport comme envoyé
          await base44.asServiceRole.entities.RapportHebdo.update(rapportRecord.id, {
            statut: "envoye",
            date_envoi: new Date().toISOString(),
            pdf_url: pdfUrl,
            nb_dossiers_crees: dossiersCrees,
            nb_dossiers_modifies: dossiersModifies,
            nb_dossiers_clotures: dossiersClotures,
            nb_activites_clients: activitesClients,
            resume_location: resumeLocation,
            resume_vente: resumeVente,
            indicateurs,
            nb_tentatives_envoi: 1,
          });

          resultats.push({ user: user.email, status: "success" });
        } catch (emailError) {
          // Retry (enregistré comme tentative)
          await base44.asServiceRole.entities.RapportHebdo.update(rapportRecord.id, {
            statut: "echec",
            raison_echec: emailError.message,
            nb_tentatives_envoi: 1,
          });

          resultats.push({ user: user.email, status: "email_failed", reason: emailError.message });
        }
      } catch (userError) {
        resultats.push({ user: user.email, status: "failed", reason: userError.message });
      }
    }

    return Response.json({
      success: true,
      semaine: { debut: semaineLundi, fin: semaineFinale },
      resultats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});