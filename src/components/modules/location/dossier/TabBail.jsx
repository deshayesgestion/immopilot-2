import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PDFTemplate, PDFUtils } from "@/lib/pdfTemplate";
import {
  CheckCircle2, Loader2, FileText, Send, ExternalLink, Sparkles,
  AlertTriangle, Download, Archive, Lock, BadgeCheck, XCircle, Info
} from "lucide-react";
import SignaturePanel from "@/components/signature/SignaturePanel";

const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

// ─── Génération PDF bail ────────────────────────────────────────────────────
function genererPDFBail(dossier, localData, agency) {
  const pdf = new PDFTemplate(agency, {});
  const { doc } = pdf;
  const M = { l: 14, r: 14 };
  const W = 210;
  const CW = W - M.l - M.r;
  let y = 0;

  // ── HEADER agence ──────────────────────────────────────────────────────
  const c = pdf.color;
  doc.setFillColor(c.r, c.g, c.b);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(agency?.name || "Agence Immobilière", M.l, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const addr = [agency?.address, agency?.postal_code, agency?.city].filter(Boolean).join(" ");
  if (addr) doc.text(addr, M.l, 21);
  const contact = [agency?.email, agency?.phone].filter(Boolean).join("  |  ");
  if (contact) doc.text(contact, M.l, 28);
  doc.setFont("helvetica", "italic");
  doc.text(`Réf. dossier : ${dossier.reference || dossier.id?.slice(0, 8) || "—"}`, W - M.r, 13, { align: "right" });
  y = 48;

  // ── TITRE ─────────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const titreMap = { vide: "CONTRAT DE LOCATION", meuble: "CONTRAT DE LOCATION MEUBLÉE", commercial: "BAIL COMMERCIAL" };
  doc.text(titreMap[localData.type_bail] || "CONTRAT DE LOCATION", W / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Loi n°89-462 du 6 juillet 1989 • Généré le ${new Date().toLocaleDateString("fr-FR")}`, W / 2, y, { align: "center" });
  y += 12;

  // ── SÉPARATEUR ──────────────────────────────────────────────────────
  const sep = () => {
    doc.setDrawColor(c.r, c.g, c.b);
    doc.setLineWidth(0.4);
    doc.line(M.l, y, W - M.r, y);
    y += 6;
  };

  // ── SECTION HEADER ──────────────────────────────────────────────────
  const section = (title) => {
    doc.setFillColor(c.r, c.g, c.b);
    doc.rect(M.l - 2, y - 4, CW + 4, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, M.l, y + 1);
    doc.setTextColor(30, 30, 30);
    y += 11;
  };

  // ── ROW ─────────────────────────────────────────────────────────────
  const row = (label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(label, M.l + 2, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(String(value || "—"), M.l + 90, y);
    y += 6.5;
  };

  // ── NOUVEAU PAGE CHECK ──────────────────────────────────────────────
  const pageCheck = (needed = 20) => {
    if (y + needed > 275) {
      // Pied de page avant saut
      addFooter();
      doc.addPage();
      y = 18;
    }
  };

  const addFooter = () => {
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`${agency?.name || ""} • Document confidentiel`, M.l, 290);
    doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, W / 2, 290, { align: "center" });
    doc.text(new Date().toLocaleDateString("fr-FR"), W - M.r, 290, { align: "right" });
  };

  // ══════════════════════════════════════════════════════════════════
  // ARTICLE 1 — PARTIES
  // ══════════════════════════════════════════════════════════════════
  section("ARTICLE 1 — PARTIES AU CONTRAT");

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(c.r, c.g, c.b);
  doc.text("BAILLEUR / AGENCE", M.l + 2, y);
  y += 6;
  row("Nom de l'agence :", agency?.name || "—");
  row("Adresse :", addr || "—");
  row("Email :", agency?.email || "—");
  row("Téléphone :", agency?.phone || "—");
  if (dossier.proprietaire_nom) row("Représentant propriétaire :", dossier.proprietaire_nom);
  y += 2;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(c.r, c.g, c.b);
  doc.text("LOCATAIRE", M.l + 2, y);
  doc.setTextColor(30, 30, 30);
  y += 6;
  row("Nom complet :", dossier.locataire_nom || "—");
  row("Email :", dossier.locataire_email || "—");
  row("Téléphone :", dossier.locataire_telephone || "—");
  y += 4;
  sep();

  // ══════════════════════════════════════════════════════════════════
  // ARTICLE 2 — BIEN LOUÉ
  // ══════════════════════════════════════════════════════════════════
  pageCheck(50);
  section("ARTICLE 2 — DÉSIGNATION DU BIEN LOUÉ");
  row("Désignation :", dossier.bien_titre || "—");
  row("Adresse :", dossier.bien_adresse || "—");
  row("Type de location :", localData.type_bail === "vide" ? "Logement vide" : localData.type_bail === "meuble" ? "Logement meublé" : "Commercial");
  y += 4;
  sep();

  // ══════════════════════════════════════════════════════════════════
  // ARTICLE 3 — CONDITIONS FINANCIÈRES
  // ══════════════════════════════════════════════════════════════════
  pageCheck(60);
  section("ARTICLE 3 — CONDITIONS FINANCIÈRES");
  row("Loyer mensuel (hors charges) :", PDFUtils.formatEur(dossier.loyer_mensuel), true);
  row("Charges mensuelles :", PDFUtils.formatEur(dossier.charges_mensuelle || 0));
  row("Total mensuel :", PDFUtils.formatEur((dossier.loyer_mensuel || 0) + (dossier.charges_mensuelle || 0)), true);
  row("Dépôt de garantie :", PDFUtils.formatEur(localData.depot_garantie_montant || 0));
  row("Mode de paiement :", "Virement bancaire");
  row("Échéance :", "Le 1er de chaque mois");
  y += 4;
  sep();

  // ══════════════════════════════════════════════════════════════════
  // ARTICLE 4 — DURÉE
  // ══════════════════════════════════════════════════════════════════
  pageCheck(40);
  section("ARTICLE 4 — DURÉE DU BAIL");
  row("Date de début :", PDFUtils.formatDate(localData.date_debut_bail));
  const dateFin = localData.date_fin_bail || (() => {
    if (!localData.date_debut_bail) return null;
    const d = new Date(localData.date_debut_bail);
    d.setMonth(d.getMonth() + (localData.duree_mois || 12));
    return d.toISOString().slice(0, 10);
  })();
  row("Date de fin :", PDFUtils.formatDate(dateFin));
  row("Durée totale :", `${localData.duree_mois || 12} mois`);
  row("Renouvellement :", "Tacite reconduction, sauf préavis légal");
  y += 4;
  sep();

  // ══════════════════════════════════════════════════════════════════
  // ARTICLE 5 — OBLIGATIONS
  // ══════════════════════════════════════════════════════════════════
  pageCheck(80);
  section("ARTICLE 5 — OBLIGATIONS DES PARTIES");

  const obligs = [
    ["Bailleur :", "Assurer la délivrance du logement en bon état. Garantir la jouissance paisible. Réaliser les réparations (hors usage normal). Remettre une quittance sur demande."],
    ["Locataire :", "Payer le loyer et les charges aux échéances. Utiliser le logement conformément à sa destination. Prendre en charge les réparations locatives. Souscrire une assurance habitation. Restituer les lieux en bon état."],
  ];

  for (const [who, text] of obligs) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(c.r, c.g, c.b);
    doc.text(who, M.l + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, CW - 10);
    y += 6;
    doc.text(lines, M.l + 8, y);
    y += lines.length * 5 + 4;
    pageCheck(20);
  }
  sep();

  // ══════════════════════════════════════════════════════════════════
  // ARTICLE 6 — CONDITIONS GÉNÉRALES
  // ══════════════════════════════════════════════════════════════════
  pageCheck(60);
  section("ARTICLE 6 — CONDITIONS GÉNÉRALES");

  const cgs = [
    "Résiliation : Le locataire peut résilier à tout moment avec un préavis de 1 mois (logement meublé) ou 3 mois (logement vide), sauf motif légal.",
    "Révision du loyer : Le loyer est révisable chaque année à la date anniversaire, selon l'IRL publié par l'INSEE.",
    "Sous-location : Toute sous-location est formellement interdite sans accord écrit du bailleur.",
    "Travaux : Aucun travaux de transformation ne peut être réalisé sans l'accord préalable écrit du bailleur.",
    "Assurance : Le locataire est tenu de justifier d'une assurance habitation lors de la remise des clés et à chaque renouvellement.",
  ];

  for (const cg of cgs) {
    pageCheck(15);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(`• ${cg}`, CW - 4);
    doc.text(lines, M.l + 2, y);
    y += lines.length * 5 + 2;
  }
  y += 4;
  sep();

  // ══════════════════════════════════════════════════════════════════
  // SIGNATURES
  // ══════════════════════════════════════════════════════════════════
  pageCheck(60);
  section("ARTICLE 7 — SIGNATURES");
  y += 4;

  const sigWidth = (CW - 10) / 2;
  const sigBoxH = 40;
  const sigX1 = M.l;
  const sigX2 = M.l + sigWidth + 10;

  // Bailleur
  doc.setDrawColor(c.r, c.g, c.b);
  doc.setLineWidth(0.3);
  doc.rect(sigX1, y, sigWidth, sigBoxH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(c.r, c.g, c.b);
  doc.text("LE BAILLEUR / L'AGENCE", sigX1 + 2, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Nom :", sigX1 + 2, y + 16);
  doc.text(agency?.name || "—", sigX1 + 2, y + 22);
  doc.text("Signature :", sigX1 + 2, y + 30);
  doc.text("Date :", sigX1 + 2, y + 37);

  // Locataire
  doc.rect(sigX2, y, sigWidth, sigBoxH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(c.r, c.g, c.b);
  doc.text("LE LOCATAIRE", sigX2 + 2, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Nom :", sigX2 + 2, y + 16);
  doc.text(dossier.locataire_nom || "—", sigX2 + 2, y + 22);
  doc.text("Signature :", sigX2 + 2, y + 30);
  doc.text("Date :", sigX2 + 2, y + 37);
  y += sigBoxH + 8;

  // ── PIED DE PAGE FINAL ──────────────────────────────────────────
  addFooter();

  return doc;
}

// ─── Composant principal ────────────────────────────────────────────────────
export default function TabBail({ dossier, onSave }) {
  const [localData, setLocalData] = useState({
    date_debut_bail: dossier.date_debut_bail || "",
    date_fin_bail: dossier.date_fin_bail || "",
    duree_mois: dossier.duree_mois || 12,
    type_bail: dossier.type_bail || "vide",
    depot_garantie_montant: dossier.depot_garantie_montant || dossier.loyer_mensuel || 0,
    bail_url: dossier.bail_url || "",
    bail_signe: dossier.bail_signe || false,
  });
  const [agency, setAgency] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null); // résultat vérif IA
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [bailArchivedUrl, setBailArchivedUrl] = useState(dossier.bail_url || null);
  const [step, setStep] = useState("form"); // "form" | "generated"
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setLocalData(p => ({ ...p, [k]: v }));

  // Vérification prérequis
  const candidatSelectionne = !!dossier.candidat_selectionne_id || dossier.statut_dossier === "candidat_valide" || dossier.statut_dossier === "bail_signe" || dossier.statut_dossier === "en_cours";
  const bailDejaExistant = !!bailArchivedUrl && bailArchivedUrl.startsWith("http");

  useEffect(() => {
    base44.entities.Agency.list().then(list => { if (list[0]) setAgency(list[0]); });
  }, []);

  const saveLocale = async () => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, localData);
    onSave(localData);
    setSaving(false);
  };

  // ── VÉRIFICATION IA avant génération ──────────────────────────────
  const verifierDonnees = async () => {
    setVerifying(true);
    setVerification(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es expert juridique immobilier français. Vérifie ces données avant génération d'un bail :
Locataire : ${dossier.locataire_nom || "MANQUANT"}, Email : ${dossier.locataire_email || "MANQUANT"}, Tel : ${dossier.locataire_telephone || "manquant"}
Bien : ${dossier.bien_titre || "MANQUANT"}, Adresse : ${dossier.bien_adresse || "MANQUANT"}
Loyer : ${dossier.loyer_mensuel || 0}€, Charges : ${dossier.charges_mensuelle || 0}€, DG : ${localData.depot_garantie_montant || 0}€
Type bail : ${localData.type_bail}, Durée : ${localData.duree_mois}mois, Début : ${localData.date_debut_bail || "NON DÉFINI"}

Retourne JSON strict: { ok: boolean, score: number (0-100), erreurs: string[] (champs critiques manquants), avertissements: string[] (recommandations), resume: string (1 phrase) }`,
      response_json_schema: { type: "object", properties: { ok: { type: "boolean" }, score: { type: "number" }, erreurs: { type: "array", items: { type: "string" } }, avertissements: { type: "array", items: { type: "string" } }, resume: { type: "string" } } }
    });
    setVerification(result);
    setVerifying(false);
  };

  // ── GÉNÉRATION PDF ─────────────────────────────────────────────────
  const genererBail = async () => {
    setGenerating(true);
    const doc = genererPDFBail(dossier, localData, agency);
    const blob = doc.output("blob");
    const fileName = `bail-${(dossier.locataire_nom || "locataire").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
    setPdfBlob(blob);
    setPdfFileName(fileName);
    setStep("generated");
    setGenerating(false);
  };

  // ── TÉLÉCHARGEMENT ─────────────────────────────────────────────────
  const telecharger = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url; a.download = pdfFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── ARCHIVAGE dans dossier ─────────────────────────────────────────
  const archiverPDF = async () => {
    if (!pdfBlob) return;
    setArchiving(true);
    const file = new File([pdfBlob], pdfFileName, { type: "application/pdf" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBailArchivedUrl(file_url);
    const histEntry = { date: new Date().toISOString(), action: `Bail généré et archivé : ${pdfFileName}`, auteur: "Agent", type: "bail" };
    const hist = [...(dossier.historique || []), histEntry];
    const updateData = { ...localData, bail_url: file_url, bail_statut: "en_preparation", historique: hist };
    await base44.entities.DossierLocatif.update(dossier.id, updateData);
    onSave({ ...updateData, bail_url: file_url });
    setArchiving(false);
  };

  // ── ENVOI EMAIL ────────────────────────────────────────────────────
  const envoyerBail = async () => {
    if (!dossier.locataire_email) return;
    setSendingEmail(true);
    const lienBail = bailArchivedUrl && bailArchivedUrl.startsWith("http") ? bailArchivedUrl : null;
    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:${agency?.primary_color || "#4F46E5"};padding:28px 32px">
    <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700">${agency?.name || "Votre Agence Immobilière"}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${agency?.address || ""} • ${agency?.email || ""}</p>
  </div>
  <div style="padding:32px">
    <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px">Votre contrat de location</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">Bonjour <strong>${dossier.locataire_nom || ""}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">Nous avons le plaisir de vous transmettre votre contrat de bail pour le bien suivant :</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b;width:45%">Bien loué</td><td style="padding:6px 0;color:#1e293b;font-weight:600">${dossier.bien_titre || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Adresse</td><td style="padding:6px 0;color:#1e293b">${dossier.bien_adresse || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Loyer mensuel</td><td style="padding:6px 0;color:#1e293b;font-weight:600">${dossier.loyer_mensuel?.toLocaleString("fr-FR")} € + ${dossier.charges_mensuelle || 0} € charges</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Type de bail</td><td style="padding:6px 0;color:#1e293b">${localData.type_bail === "vide" ? "Location vide" : localData.type_bail === "meuble" ? "Location meublée" : "Bail commercial"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Durée</td><td style="padding:6px 0;color:#1e293b">${localData.duree_mois} mois</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Début du bail</td><td style="padding:6px 0;color:#1e293b">${fmt(localData.date_debut_bail)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Dépôt de garantie</td><td style="padding:6px 0;color:#1e293b;font-weight:600">${localData.depot_garantie_montant?.toLocaleString("fr-FR")} €</td></tr>
      </table>
    </div>
    ${lienBail ? `<div style="text-align:center;margin:24px 0"><a href="${lienBail}" style="background:${agency?.primary_color || "#4F46E5"};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">📄 Accéder à mon bail</a></div>` : ""}
    <p style="color:#475569;font-size:13px;line-height:1.7;margin-top:24px">Merci de prendre connaissance de ce document et de contacter votre agent en cas de question.</p>
    <p style="color:#475569;font-size:13px">Cordialement,<br><strong>${agency?.name || "L'agence"}</strong></p>
  </div>
  <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
    <p style="margin:0;color:#94a3b8;font-size:11px">${agency?.address || ""} • ${agency?.phone || ""} • ${agency?.email || ""}</p>
  </div>
</div>`;

    await base44.integrations.Core.SendEmail({ to: dossier.locataire_email, subject: `Votre contrat de location — ${dossier.bien_titre || ""}`, body: emailBody });
    // Envoyer à l'agence aussi
    if (agency?.email) {
      await base44.integrations.Core.SendEmail({ to: agency.email, subject: `[Copie] Bail envoyé — ${dossier.locataire_nom} / ${dossier.bien_titre}`, body: emailBody });
    }
    // Historiser
    const histEntry = { date: new Date().toISOString(), action: `Bail envoyé par email à ${dossier.locataire_email}`, auteur: "Agent", type: "bail" };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { historique: hist });
    onSave({ historique: hist });
    setSendingEmail(false);
  };

  // ── SIGNER ────────────────────────────────────────────────────────
  const signerBail = async () => {
    setSaving(true);
    const updateData = { ...localData, bail_signe: true, bail_statut: "actif", statut_dossier: "bail_signe" };
    const histEntry = { date: new Date().toISOString(), action: "Bail marqué comme signé — dossier actif", auteur: "Agent", type: "bail" };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { ...updateData, historique: hist });
    onSave({ ...updateData, historique: hist });
    setLocalData(p => ({ ...p, bail_signe: true }));
    setSaving(false);
  };

  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── PRÉREQUIS ─────────────────────────────────────────────── */}
      {!candidatSelectionne && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Génération du bail verrouillée</p>
            <p className="text-xs text-amber-700 mt-0.5">Un candidat doit être sélectionné et le dossier doit être en statut <strong>"Candidat validé"</strong> avant de générer le bail.</p>
          </div>
        </div>
      )}

      {/* ── BAIL EXISTANT ─────────────────────────────────────────── */}
      {bailDejaExistant && (
        <div className="bg-green-50 border border-green-300 rounded-2xl px-4 py-3 flex items-center gap-3">
          <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-800">Bail archivé dans ce dossier</p>
            <p className="text-xs text-green-700 mt-0.5">Un bail est déjà généré et enregistré.</p>
          </div>
          <a href={bailArchivedUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-green-700 font-semibold hover:underline flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5" /> Voir le bail
          </a>
        </div>
      )}

      {/* ── STATUT SIGNATURE ─────────────────────────────────────── */}
      {localData.bail_signe && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-800">Bail signé ✓ — Dossier actif</p>
        </div>
      )}

      {/* ── FORMULAIRE DONNÉES BAIL ───────────────────────────────── */}
      <div className="bg-slate-50 border border-border/50 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Paramètres du bail</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type de bail</label>
            <select value={localData.type_bail} onChange={e => set("type_bail", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="vide">Location vide (3 ans)</option>
              <option value="meuble">Location meublée (1 an)</option>
              <option value="commercial">Bail commercial</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Durée (mois)</label>
            <Input type="number" value={localData.duree_mois} onChange={e => set("duree_mois", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date de début</label>
            <Input type="date" value={localData.date_debut_bail} onChange={e => set("date_debut_bail", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dépôt de garantie (€)</label>
            <Input type="number" value={localData.depot_garantie_montant} onChange={e => set("depot_garantie_montant", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={saveLocale} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Enregistrer les paramètres
        </Button>
      </div>

      {/* ── VÉRIFICATION IA ───────────────────────────────────────── */}
      {candidatSelectionne && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Vérification IA avant génération</p>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-violet-300 text-violet-700" onClick={verifierDonnees} disabled={verifying}>
              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {verifying ? "Analyse…" : "Vérifier"}
            </Button>
          </div>

          {verification && (
            <div className={`rounded-xl border p-3 space-y-2 ${verification.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {verification.ok
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className={`text-sm font-bold ${verification.ok ? "text-green-800" : "text-red-800"}`}>
                    {verification.ok ? "Dossier complet" : "Données incomplètes"}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  verification.score >= 80 ? "bg-green-100 text-green-700" :
                  verification.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                }`}>{verification.score}/100</span>
              </div>
              {verification.resume && <p className="text-xs text-muted-foreground italic">{verification.resume}</p>}
              {verification.erreurs?.length > 0 && (
                <div className="space-y-1">
                  {verification.erreurs.map((e, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                      <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}
                    </div>
                  ))}
                </div>
              )}
              {verification.avertissements?.length > 0 && (
                <div className="space-y-1">
                  {verification.avertissements.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />{w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GÉNÉRATION PDF ────────────────────────────────────────── */}
      {candidatSelectionne && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2"><FileText className="w-4 h-4" /> Génération du bail PDF</p>
          <p className="text-xs text-muted-foreground">Génère un bail professionnel A4 complet (parties, bien, conditions financières, durée, obligations, signatures).</p>

          {step === "form" && (
            <Button
              className="rounded-full gap-1.5 h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
              onClick={genererBail}
              disabled={generating || (verification && !verification.ok && verification.erreurs?.length > 0)}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? "Génération en cours…" : bailDejaExistant ? "Regénérer le bail" : "Générer le bail PDF"}
            </Button>
          )}

          {step === "generated" && pdfBlob && (
            <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Bail généré — {pdfFileName}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1 border-indigo-300 text-indigo-700" onClick={telecharger}>
                  <Download className="w-3 h-3" /> Télécharger
                </Button>
                <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={archiverPDF} disabled={archiving}>
                  {archiving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                  {archiving ? "Archivage…" : "Archiver dans le dossier"}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs rounded-full" onClick={() => setStep("form")}>
                  Regénérer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ENVOI EMAIL ───────────────────────────────────────────── */}
      {candidatSelectionne && dossier.locataire_email && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-800 flex items-center gap-2"><Send className="w-4 h-4" /> Envoi du bail par email</p>
          <p className="text-xs text-muted-foreground">Email envoyé à <strong>{dossier.locataire_email}</strong>{agency?.email ? ` et copie à ${agency.email}` : ""}.</p>
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={envoyerBail} disabled={sendingEmail}>
            {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {sendingEmail ? "Envoi en cours…" : "Envoyer le bail par email"}
          </Button>
        </div>
      )}

      {/* ── SIGNATURE ─────────────────────────────────────────────── */}
      <div className="bg-white border border-border/50 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">✍️ Suivi de signature</p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Lien bail / URL signature externe</label>
          <Input value={localData.bail_url} onChange={e => { set("bail_url", e.target.value); setBailArchivedUrl(e.target.value); }}
            placeholder="https://docusign.com/… ou lien de votre document" className="h-9 rounded-xl text-sm" />
        </div>
        {localData.bail_url && (
          <a href={localData.bail_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> Ouvrir le document
          </a>
        )}
        {!localData.bail_signe && candidatSelectionne && (
          <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={signerBail} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Marquer comme signé
          </Button>
        )}
        {localData.bail_signe && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold text-green-800">Bail signé ✓ — Statut dossier mis à jour</p>
          </div>
        )}
      </div>

      {/* ── SIGNATURE ÉLECTRONIQUE ───────────────────────────────── */}
      {candidatSelectionne && bailArchivedUrl && (
        <div className="bg-white border border-border/50 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold">✍️ Signature électronique</p>
          <SignaturePanel
            compact
            documentType="bail"
            documentTitre={`Bail — ${dossier.locataire_nom || ""} — ${dossier.bien_titre || ""}`}
            documentUrl={bailArchivedUrl}
            sourceId={dossier.id}
            sourceEntity="DossierLocatif"
          />
        </div>
      )}

      {/* ── RÉCAP DONNÉES DU BAIL ─────────────────────────────────── */}
      <div className="bg-secondary/30 rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Récapitulatif du bail</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div><span className="text-muted-foreground">Locataire : </span><span className="font-medium">{dossier.locataire_nom || "—"}</span></div>
          <div><span className="text-muted-foreground">Bien : </span><span className="font-medium">{dossier.bien_titre || "—"}</span></div>
          <div><span className="text-muted-foreground">Loyer : </span><span className="font-medium">{dossier.loyer_mensuel?.toLocaleString("fr-FR")} €/mois</span></div>
          <div><span className="text-muted-foreground">Charges : </span><span className="font-medium">{dossier.charges_mensuelle || 0} €</span></div>
          <div><span className="text-muted-foreground">Type : </span><span className="font-medium capitalize">{localData.type_bail}</span></div>
          <div><span className="text-muted-foreground">Durée : </span><span className="font-medium">{localData.duree_mois} mois</span></div>
          <div><span className="text-muted-foreground">Début : </span><span className="font-medium">{fmt(localData.date_debut_bail)}</span></div>
          <div><span className="text-muted-foreground">Dépôt : </span><span className="font-medium">{localData.depot_garantie_montant?.toLocaleString("fr-FR")} €</span></div>
        </div>
      </div>
    </div>
  );
}