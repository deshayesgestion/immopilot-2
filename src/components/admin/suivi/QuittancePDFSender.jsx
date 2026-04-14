import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Mail } from "lucide-react";
import { jsPDF } from "jspdf";

const formatEur = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

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
      const doc = new jsPDF();
      const primaryColor = agency?.primary_color || "#4F46E5";
      const r = parseInt(primaryColor.slice(1, 3), 16);
      const g = parseInt(primaryColor.slice(3, 5), 16);
      const b = parseInt(primaryColor.slice(5, 7), 16);

      // En-tête
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(agency?.name || "Quittance de loyer", 14, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${agency?.address || ""} ${agency?.postal_code || ""} ${agency?.city || ""}`, 14, 19);
      doc.text(`${agency?.email || ""} | ${agency?.phone || ""}`, 14, 24);

      // Titre
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`QUITTANCE DE LOYER — ${mois.toUpperCase()}`, 14, 45);

      let y = 55;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("PROPRIÉTAIRE", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(agency?.name || dossier.owner_name || "—", 14, y + 6);
      doc.text(agency?.address || "—", 14, y + 12);

      y = 80;
      doc.setFont("helvetica", "bold");
      doc.text("LOCATAIRE", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(locataire.nom, 14, y + 6);
      doc.text(locataire.email, 14, y + 12);

      y = 105;
      doc.setFont("helvetica", "bold");
      doc.text("BIEN", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(dossier.property_title, 14, y + 6);
      doc.text(dossier.property_address || "", 14, y + 12);

      y = 135;
      doc.setFillColor(r, g, b);
      doc.rect(10, y, 190, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("MONTANTS PERÇUS", 14, y + 5);

      y += 15;
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.text("Loyer principal", 14, y);
      doc.text(formatEur(loyer), 150, y, { align: "right" });

      y += 7;
      doc.text("Charges", 14, y);
      doc.text(formatEur(charges), 150, y, { align: "right" });

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", 14, y);
      doc.text(formatEur(total), 150, y, { align: "right" });

      y = 220;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Je soussigné(e) ${agency?.name || dossier.owner_name} donne quittance à ${locataire.nom} pour`,
        14,
        y
      );
      doc.text(
        `la somme de ${formatEur(total)} reçue à titre de loyer et charges pour le mois de ${mois}.`,
        14,
        y + 6
      );

      y += 18;
      doc.text(`Fait le ${fmtDate(now)}`, 14, y);
      y += 12;
      doc.text("Signature : _______________________________", 14, y);

      // Pied de page
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 14, 285);

      // ── ENVOYER EMAIL ──────────────────────────────────────────────────
      await base44.integrations.Core.SendEmail({
        to: locataire.email,
        subject: `📄 Quittance de loyer — ${mois}`,
        body: `Bonjour ${locataire.nom},\n\nVeuillez trouver ci-joint votre quittance de loyer pour ${mois}.\n\n📋 Montants :\n- Loyer : ${formatEur(loyer)}\n- Charges : ${formatEur(charges)}\n- Total : ${formatEur(total)}\n\nBien : ${dossier.property_title}\n\nPour toute question, n'hésitez pas à nous contacter.\n\nCordialement,\n${agency?.name || "L'agence"}\n${agency?.email || ""}\n${agency?.phone || ""}`,
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