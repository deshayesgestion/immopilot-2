import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Mail } from "lucide-react";
import { PDFTemplate, PDFUtils } from "@/lib/pdfTemplate";

const formatEur = PDFUtils.formatEur;
const fmtDate = PDFUtils.formatDate;

export default function QuittancePDFSender({ dossier, agency, onSent }) {
  const [sending, setSending] = useState(false);

  const generateAndSendQuittance = async () => {
    const locataire = dossier.locataire_selectionne;
    if (!locataire?.email) {
      alert("❌ Email locataire manquant");
      return;
    }

    setSending(true);

    try {
      const now = new Date();
      const mois = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      const loyer = dossier.loyer || 0;
      const charges = dossier.charges || 0;
      const total = loyer + charges;

      // ── GÉNÉRER PDF ────────────────────────────────────────────────────
      const pdf = new PDFTemplate(agency);
      pdf.addHeader();
      pdf.addTitle(`QUITTANCE DE LOYER — ${mois.toUpperCase()}`);
      pdf.addSpace(5);

      pdf.addSection("PROPRIÉTAIRE");
      pdf.addRow("Nom", agency?.name || dossier.owner_name || "—");
      pdf.addRow("Adresse", agency?.address || "—");

      pdf.addSection("LOCATAIRE");
      pdf.addRow("Nom", locataire.nom);
      pdf.addRow("Email", locataire.email);

      pdf.addSection("BIEN LOUÉ");
      pdf.addRow("Adresse", dossier.property_address || dossier.property_title || "—");

      pdf.addSection("MONTANTS");
      pdf.addRow("Loyer principal", formatEur(loyer));
      pdf.addRow("Charges", formatEur(charges));
      pdf.addSeparator(2);
      pdf.addRow("TOTAL PERÇU", formatEur(total), true);
      pdf.addSpace(8);

      pdf.addParagraph(
        `Je soussigné(e) ${agency?.name || dossier.owner_name} donne quittance à ${locataire.nom} pour la somme de ${formatEur(total)} reçue à titre de loyer et charges pour le mois de ${mois}.`
      );
      pdf.addSpace(6);
      pdf.addRow("Fait le", fmtDate(now));
      pdf.addSpace(4);
      pdf.addRow("Signature", "_______________________________");

      // ── ENVOYER EMAIL ──────────────────────────────────────────────────
      pdf.save(`Quittance_${locataire.nom}_${mois}.pdf`);

      await base44.integrations.Core.SendEmail({
        to: locataire.email,
        subject: `📄 Quittance de loyer — ${mois}`,
        body: `Bonjour ${locataire.nom},\n\nVeuillez trouver ci-joint votre quittance de loyer pour ${mois}.\n\nBien : ${dossier.property_title}\nMontant : ${formatEur(total)} (Loyer: ${formatEur(loyer)} + Charges: ${formatEur(charges)})\n\nPour toute question, n'hésitez pas à nous contacter.\n\nCordialement,\n${agency?.name || "L'agence"}\n${agency?.email || ""}\n${agency?.phone || ""}`,
      });

      alert(`✓ Quittance générée et envoyée à ${locataire.email}`);
      if (onSent) onSent();
    } catch (e) {
      console.error("Erreur:", e);
      alert(`⚠ Erreur : ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      size="sm"
      className="rounded-full gap-2 h-9 text-sm"
      onClick={generateAndSendQuittance}
      disabled={sending}
    >
      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
      Envoyer quittance PDF
    </Button>
  );
}