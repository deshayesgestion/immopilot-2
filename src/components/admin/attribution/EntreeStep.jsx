import { useState } from "react";
import { useAgency } from "../../../hooks/useAgency";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Key, Mail, Download, Archive, Sparkles, PartyPopper } from "lucide-react";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function generatePdfContent(dossier) {
  const locataire = dossier.locataire_selectionne || {};
  const date = new Date().toLocaleDateString("fr-FR");
  const lines = [
    "═══════════════════════════════════════════════════════",
    "              RÉCAPITULATIF DE DOSSIER LOCATIF         ",
    "═══════════════════════════════════════════════════════",
    "",
    `Référence : ${dossier.reference || "—"}`,
    `Date d'édition : ${date}`,
    "",
    "─── BIEN LOUÉ ──────────────────────────────────────────",
    `Titre        : ${dossier.property_title || "—"}`,
    `Adresse      : ${dossier.property_address || "—"}`,
    `Loyer        : ${formatEuro(dossier.loyer)}/mois`,
    `Charges      : ${formatEuro(dossier.charges)}/mois`,
    `Dépôt        : ${formatEuro(dossier.depot_garantie)}`,
    "",
    "─── LOCATAIRE ──────────────────────────────────────────",
    `Nom          : ${locataire.nom || "—"}`,
    `Email        : ${locataire.email || "—"}`,
    `Téléphone    : ${locataire.telephone || "—"}`,
    "",
    "─── ÉTAPES COMPLÉTÉES ──────────────────────────────────",
    `✓ Candidatures recueillies`,
    `✓ Dossier validé et scoring IA effectué`,
    `✓ Bail généré et signé`,
    `✓ Paiements initiaux reçus`,
    `✓ État des lieux d'entrée réalisé`,
    `✓ Entrée locataire finalisée`,
    "",
    "─── AGENT ──────────────────────────────────────────────",
    `Agent        : ${dossier.agent_name || "—"}`,
    `Email        : ${dossier.agent_email || "—"}`,
    "",
    "═══════════════════════════════════════════════════════",
    "        Document généré par ImmoPilot",
    "═══════════════════════════════════════════════════════",
  ];
  return lines.join("\n");
}

export default function EntreeStep({ dossier, onUpdate }) {
  const { agency } = useAgency();
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [done, setDone] = useState(dossier.statut === "termine");
  const [emailSent, setEmailSent] = useState(!!dossier.entree_email_sent);
  const locataire = dossier.locataire_selectionne;

  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;
    const locataire = dossier.locataire_selectionne || {};

    // Header band
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(agency?.name || "Agence Immobilière", margin, 13);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const agencyInfo = [agency?.address, agency?.phone, agency?.email].filter(Boolean).join("  ·  ");
    if (agencyInfo) doc.text(agencyInfo, margin, 21);

    // Title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RÉCAPITULATIF DOSSIER LOCATIF", pageW / 2, 42, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Réf. : ${dossier.reference || "—"}  ·  Édité le ${new Date().toLocaleDateString("fr-FR")}`, pageW / 2, 49, { align: "center" });
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 53, pageW - margin, 53);

    // Section helper
    let y = 61;
    const section = (title) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(title, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9.5);
    };
    const row = (label, value) => {
      if (!value) return;
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      doc.setTextColor(30, 30, 30);
      doc.text(String(value), margin + 45, y);
      y += 6;
    };

    section("BIEN LOUÉ");
    row("Titre :", dossier.property_title);
    row("Adresse :", dossier.property_address);
    row("Loyer :", `${formatEuro(dossier.loyer)}/mois`);
    row("Charges :", `${formatEuro(dossier.charges)}/mois`);
    row("Dépôt de garantie :", formatEuro(dossier.depot_garantie));
    y += 4;

    section("LOCATAIRE");
    row("Nom :", locataire.nom);
    row("Email :", locataire.email);
    row("Téléphone :", locataire.telephone);
    y += 4;

    section("BAILLEUR / AGENCE");
    row("Agence :", agency?.name);
    row("Adresse :", agency?.address ? `${agency.address} ${agency.postal_code || ""} ${agency.city || ""}` : null);
    row("Téléphone :", agency?.phone);
    row("Email :", agency?.email);
    row("Agent en charge :", dossier.agent_name || dossier.agent_email);
    y += 4;

    section("ÉTAPES COMPLÉTÉES");
    const steps = ["Candidatures recueillies", "Dossier validé et scoring IA effectué", "Bail généré et signé", "Paiements initiaux reçus", "État des lieux d'entrée réalisé", "Entrée locataire finalisée"];
    steps.forEach((s) => {
      doc.setTextColor(34, 197, 94);
      doc.text("✓", margin, y);
      doc.setTextColor(30, 30, 30);
      doc.text(s, margin + 6, y);
      y += 6;
    });

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
    doc.text(`${agency?.name || ""} — Document généré le ${new Date().toLocaleDateString("fr-FR")}`, margin, pageH - 9);

    doc.save(`recap-${dossier.reference || "dossier"}.pdf`);
  };

  const sendEmail = async () => {
    if (!locataire?.email) return;
    setSending(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un email de bienvenue pour un nouveau locataire qui vient d'emménager.

Locataire : ${locataire.nom}
Bien : ${dossier.property_title}
Adresse : ${dossier.property_address || ""}
Loyer : ${dossier.loyer}€/mois
Agent : ${dossier.agent_name || "L'agence"}

Génère un email chaleureux et professionnel en français.
Rappelle le loyer, les coordonnées de l'agence et souhaite la bienvenue.
Réponds UNIQUEMENT avec ce JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          sujet: { type: "string" },
          corps: { type: "string" },
        },
      },
    });

    await base44.integrations.Core.SendEmail({
      to: locataire.email,
      subject: result.sujet,
      body: result.corps,
    });
    await base44.entities.DossierLocatif.update(dossier.id, { entree_email_sent: true });
    setEmailSent(true);
    setSending(false);
  };

  const finalizeEntree = async () => {
    setArchiving(true);
    const stepsCompleted = [...(dossier.steps_completed || [])];
    if (!stepsCompleted.includes(6)) stepsCompleted.push(6);

    // 1. Finalize dossier
    await base44.entities.DossierLocatif.update(dossier.id, {
      steps_completed: stepsCompleted,
      current_step: 6,
      statut: "termine",
      date_entree: new Date().toISOString().split("T")[0],
    });

    // 2. Update property: mark as loué, remove from site
    if (dossier.property_id) {
      await base44.entities.Property.update(dossier.property_id, {
        status: "loue",
        publish_site: false,
      });
    }

    setDone(true);
    setArchiving(false);
    onUpdate();
  };

  if (done) {
    return (
      <div className="space-y-5">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-700">Dossier finalisé !</p>
          <p className="text-sm text-muted-foreground mt-1">
            {locataire?.nom || "Le locataire"} est officiellement entré dans les lieux.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="rounded-full gap-2 text-sm h-9" onClick={downloadPdf}>
            <Download className="w-4 h-4" /> Télécharger le récapitulatif
          </Button>
          {!emailSent && (
            <Button variant="outline" className="rounded-full gap-2 text-sm h-9" onClick={sendEmail} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Envoyer email de bienvenue
            </Button>
          )}
          {emailSent && (
            <p className="text-xs text-center text-green-600 font-medium">✓ Email de bienvenue envoyé</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">Entrée locataire</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dernière étape — clôture et archivage du dossier
        </p>
      </div>

      {!locataire && (
        <div className="border-2 border-dashed border-amber-200 bg-amber-50/40 rounded-2xl py-8 text-center">
          <Key className="w-7 h-7 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-700">Aucun locataire sélectionné</p>
          <p className="text-xs text-amber-600/70 mt-0.5">Complétez les étapes précédentes</p>
        </div>
      )}

      {locataire && (
        <>
          {/* Recap card */}
          <div className="bg-secondary/30 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Récapitulatif</p>
            {[
              { label: "Locataire", value: locataire.nom },
              { label: "Email", value: locataire.email },
              { label: "Bien", value: dossier.property_title },
              { label: "Adresse", value: dossier.property_address },
              { label: "Loyer", value: `${formatEuro(dossier.loyer)}/mois + ${formatEuro(dossier.charges)} charges` },
              { label: "Caution", value: formatEuro(dossier.depot_garantie) },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex items-start justify-between gap-4 text-xs">
                <span className="text-muted-foreground flex-shrink-0">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ) : null)}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="rounded-full gap-2 text-sm h-9" onClick={downloadPdf}>
              <Download className="w-4 h-4" /> Télécharger le récapitulatif PDF
            </Button>

            <Button
              variant="outline"
              className="rounded-full gap-2 text-sm h-9"
              onClick={sendEmail}
              disabled={sending || !locataire.email}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 text-primary" /><Mail className="w-3.5 h-3.5" /></>}
              {emailSent ? "Renvoyer l'email de bienvenue" : "Envoyer email de bienvenue (IA)"}
            </Button>
            {emailSent && <p className="text-xs text-center text-green-600 font-medium">✓ Email de bienvenue envoyé à {locataire.email}</p>}
          </div>

          {/* Finalize */}
          <div className="border border-border/50 rounded-2xl p-4 bg-white space-y-3">
            <p className="text-sm font-semibold">Confirmer l'entrée dans les lieux</p>
            <p className="text-xs text-muted-foreground">
              Cette action archive le dossier et marque le bien comme loué. Assurez-vous que toutes les étapes précédentes sont complètes.
            </p>
            <Button
              className="w-full rounded-full gap-2 text-sm h-10 bg-green-600 hover:bg-green-700"
              onClick={finalizeEntree}
              disabled={archiving}
            >
              {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Confirmer l'entrée locataire &amp; archiver le dossier
            </Button>
          </div>
        </>
      )}
    </div>
  );
}