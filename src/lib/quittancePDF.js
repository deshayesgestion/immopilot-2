/**
 * Génération PDF professionnelle de quittance de loyer
 */
import { jsPDF } from "jspdf";

const fmt = iso => iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
const fmtEur = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);

const MOIS_LABELS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
export const getMoisLabel = mois => {
  if (!mois) return "—";
  const [y, m] = mois.split("-");
  return `${MOIS_LABELS[parseInt(m) - 1]} ${y}`;
};

export function genererQuittancePDF(quittance, agency) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = { l: 20, r: 20 };
  const CW = W - M.l - M.r;
  let y = 0;

  const hexToRgb = hex => {
    const h = (hex || "#4F46E5").replace("#", "");
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  };
  const C = hexToRgb(agency?.primary_color);

  // ── HEADER ────────────────────────────────────────────────────
  doc.setFillColor(C.r, C.g, C.b);
  doc.rect(0, 0, W, 40, "F");
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text(agency?.name || "Agence Immobilière", M.l, 14);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
  const addr = [agency?.address, agency?.postal_code, agency?.city].filter(Boolean).join(" ");
  if (addr) doc.text(addr, M.l, 22);
  const contact = [agency?.email, agency?.phone].filter(Boolean).join("  •  ");
  if (contact) doc.text(contact, M.l, 29);
  doc.setFont("helvetica","bold"); doc.setFontSize(9);
  doc.text("QUITTANCE DE LOYER", W - M.r, 14, { align: "right" });
  doc.setFont("helvetica","normal"); doc.setFontSize(8);
  doc.text(`Période : ${getMoisLabel(quittance.mois)}`, W - M.r, 22, { align: "right" });
  doc.text(`Émise le ${fmt(new Date().toISOString())}`, W - M.r, 29, { align: "right" });
  y = 50;

  // ── TITRE ─────────────────────────────────────────────────────
  doc.setTextColor(30,30,30);
  doc.setFont("helvetica","bold"); doc.setFontSize(20);
  doc.text("QUITTANCE DE LOYER", W/2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.setTextColor(100,100,100);
  doc.text(`Période : ${getMoisLabel(quittance.mois)}`, W/2, y, { align: "center" });
  y += 10;
  doc.setDrawColor(C.r, C.g, C.b); doc.setLineWidth(0.6);
  doc.line(M.l, y, W-M.r, y); y += 10;

  // ── PARTIES ───────────────────────────────────────────────────
  const col1 = M.l, col2 = W/2 + 5, colW = CW/2 - 5;

  // Bailleur
  doc.setFillColor(248,250,252);
  doc.rect(col1-2, y-4, colW+4, 40, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(C.r, C.g, C.b);
  doc.text("BAILLEUR", col1, y+1);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(40,40,40);
  doc.text(agency?.name || "—", col1, y+9);
  if (addr) { const l = doc.splitTextToSize(addr, colW-2); doc.text(l, col1, y+16); }
  if (agency?.email) doc.text(agency.email, col1, y+26);
  if (agency?.phone) doc.text(agency.phone, col1, y+32);

  // Locataire
  doc.setFillColor(248,250,252);
  doc.rect(col2-2, y-4, colW+4, 40, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(C.r, C.g, C.b);
  doc.text("LOCATAIRE", col2, y+1);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(40,40,40);
  doc.text(quittance.locataire_nom || "—", col2, y+9);
  if (quittance.bien_adresse) { const l = doc.splitTextToSize(quittance.bien_adresse, colW-2); doc.text(l, col2, y+16); }
  y += 46;

  // ── BIEN ───────────────────────────────────────────────────────
  doc.setFillColor(C.r, C.g, C.b);
  doc.rect(M.l-2, y-4, CW+4, 8, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(9);
  doc.text("LOGEMENT CONCERNÉ", M.l, y+1); y += 11;
  doc.setTextColor(40,40,40); doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text(`${quittance.bien_titre || "—"}`, M.l+2, y); y += 7;
  if (quittance.bien_adresse) { doc.text(quittance.bien_adresse, M.l+2, y); y += 7; }
  y += 4;

  // ── DÉTAIL PAIEMENT ───────────────────────────────────────────
  doc.setFillColor(C.r, C.g, C.b);
  doc.rect(M.l-2, y-4, CW+4, 8, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(9);
  doc.text("DÉTAIL DU PAIEMENT", M.l, y+1); y += 11;

  const rows = [
    ["Loyer mensuel (hors charges)", fmtEur(quittance.montant_loyer)],
    ["Charges locatives", fmtEur(quittance.montant_charges)],
  ];
  for (const [label, val] of rows) {
    doc.setTextColor(80,80,80); doc.setFont("helvetica","normal"); doc.setFontSize(9);
    doc.text(label, M.l+2, y);
    doc.setTextColor(20,20,20); doc.setFont("helvetica","bold");
    doc.text(val, W-M.r, y, { align: "right" }); y += 7;
  }
  // Ligne totale
  doc.setDrawColor(C.r,C.g,C.b); doc.setLineWidth(0.4);
  doc.line(M.l, y, W-M.r, y); y += 4;
  doc.setFillColor(C.r,C.g,C.b);
  doc.rect(M.l-2, y-2, CW+4, 10, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("TOTAL PAYÉ", M.l+2, y+5);
  doc.text(fmtEur(quittance.montant_total), W-M.r-2, y+5, { align: "right" });
  y += 16;

  // ── DATES ─────────────────────────────────────────────────────
  doc.setTextColor(60,60,60); doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text(`Période couverte : ${getMoisLabel(quittance.mois)}`, M.l+2, y);
  doc.text(`Date de paiement : ${fmt(quittance.date_paiement)}`, M.l+2, y+7);
  doc.text(`Date d'échéance : ${fmt(quittance.date_echeance)}`, M.l+2, y+14);
  if (quittance.mode_paiement) doc.text(`Mode de paiement : ${quittance.mode_paiement}`, M.l+2, y+21);
  y += 32;

  // ── ATTESTATION ───────────────────────────────────────────────
  doc.setFillColor(240,253,244);
  doc.rect(M.l-2, y-4, CW+4, 22, "F");
  doc.setDrawColor(16,185,129); doc.setLineWidth(0.4);
  doc.rect(M.l-2, y-4, CW+4, 22);
  doc.setTextColor(6,78,59); doc.setFont("helvetica","bold"); doc.setFontSize(9);
  doc.text("✓ ATTESTATION DE PAIEMENT", M.l+2, y+2);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
  const attestation = doc.splitTextToSize(
    `Je soussigné(e) ${agency?.name || "le bailleur"}, certifie avoir reçu de ${quittance.locataire_nom} la somme de ${fmtEur(quittance.montant_total)} au titre du loyer du mois de ${getMoisLabel(quittance.mois)} pour le logement situé ${quittance.bien_adresse || quittance.bien_titre || "—"}.`,
    CW-4
  );
  doc.text(attestation, M.l+2, y+10);
  y += 28;

  // ── SIGNATURE ─────────────────────────────────────────────────
  y = Math.max(y, 235);
  const sigW = 70, sigH = 30;
  doc.setDrawColor(C.r,C.g,C.b); doc.setLineWidth(0.3);
  doc.rect(W-M.r-sigW, y, sigW, sigH);
  doc.setTextColor(C.r,C.g,C.b); doc.setFont("helvetica","bold"); doc.setFontSize(8);
  doc.text("Signature du bailleur", W-M.r-sigW+3, y+7);
  doc.setTextColor(80,80,80); doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
  doc.text(agency?.name || "—", W-M.r-sigW+3, y+14);
  doc.text(fmt(new Date().toISOString()), W-M.r-sigW+3, y+20);

  // ── PIED ──────────────────────────────────────────────────────
  doc.setTextColor(150,150,150); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text(`${agency?.name || ""} — Quittance de loyer — Document officiel`, M.l, 290);
  doc.text(fmt(new Date().toISOString()), W-M.r, 290, { align: "right" });

  return doc;
}