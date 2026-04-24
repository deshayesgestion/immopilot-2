/**
 * Génération PDF professionnelle pour les états des lieux (entrée/sortie)
 * Utilise jsPDF directement pour un contrôle total du rendu
 */
import { jsPDF } from "jspdf";

const ETAT_LABELS = { neuf: "NEUF", bon: "BON", moyen: "MOYEN", degrade: "DÉGRADÉ" };
const ETAT_COLORS = {
  neuf:    { r: 16,  g: 185, b: 129 },
  bon:     { r: 59,  g: 130, b: 246 },
  moyen:   { r: 245, g: 158, b: 11  },
  degrade: { r: 239, g: 68,  b: 68  },
};

const fmt = iso => iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";

export async function genererPDFEdl({ dossier, type, pieces, checklist, observations, signeLocataire, signeProprietaire, agency, dateEdl }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = { l: 14, r: 14 };
  const CW = W - M.l - M.r;
  const label = type === "edle" ? "ENTRÉE" : "SORTIE";
  const emoji = type === "edle" ? "🔑" : "📦";
  let y = 0;
  let pageNum = 1;

  // Couleur agence
  const hexToRgb = hex => {
    const h = hex.replace("#", "");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  };
  const C = hexToRgb(agency?.primary_color || "#4F46E5");

  const addFooter = () => {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`${agency?.name || "Agence"} — État des lieux ${label} — Document confidentiel`, M.l, 290);
    doc.text(`Page ${pageNum}`, W / 2, 290, { align: "center" });
    doc.text(fmt(new Date().toISOString()), W - M.r, 290, { align: "right" });
  };

  const checkPage = (needed = 30) => {
    if (y + needed > 278) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = 16;
      // Mini-header de continuité
      doc.setFillColor(C.r, C.g, C.b);
      doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`${agency?.name || ""} — ÉTAT DES LIEUX ${label} — Suite`, M.l, 7);
      y = 16;
    }
  };

  // ══════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════
  doc.setFillColor(C.r, C.g, C.b);
  doc.rect(0, 0, W, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(agency?.name || "Agence Immobilière", M.l, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const addrLine = [agency?.address, agency?.postal_code, agency?.city].filter(Boolean).join(" • ");
  if (addrLine) doc.text(addrLine, M.l, 21);
  const contactLine = [agency?.email, agency?.phone].filter(Boolean).join("  |  ");
  if (contactLine) doc.text(contactLine, M.l, 28);

  // Badge type EDL
  const badgeX = W - M.r - 40;
  doc.setFillColor(255, 255, 255, 0.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`EDL ${label}`, W - M.r, 13, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Réf: ${dossier.reference || dossier.id?.slice(0, 8) || "—"}`, W - M.r, 21, { align: "right" });
  doc.text(`Généré le ${fmt(new Date().toISOString())}`, W - M.r, 28, { align: "right" });

  y = 52;

  // ══════════════════════════════════════════════════
  // TITRE
  // ══════════════════════════════════════════════════
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`ÉTAT DES LIEUX D'${label}`, W / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const leiLabel = type === "edle" ? "Loi n°89-462 du 6 juillet 1989" : "Comparaison avec l'état des lieux d'entrée";
  doc.text(leiLabel, W / 2, y, { align: "center" });
  y += 10;

  // Séparateur
  doc.setDrawColor(C.r, C.g, C.b);
  doc.setLineWidth(0.5);
  doc.line(M.l, y, W - M.r, y);
  y += 8;

  // ══════════════════════════════════════════════════
  // INFOS GÉNÉRALES
  // ══════════════════════════════════════════════════
  const section = (title) => {
    doc.setFillColor(C.r, C.g, C.b);
    doc.rect(M.l - 2, y - 4, CW + 4, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, M.l, y + 1);
    doc.setTextColor(30, 30, 30);
    y += 11;
  };

  const row2col = (l1, v1, l2, v2) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(l1, M.l, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(v1 || "—", M.l + 35, y);
    if (l2) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(l2, M.l + CW / 2, y);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(v2 || "—", M.l + CW / 2 + 35, y);
    }
    doc.setTextColor(30, 30, 30);
    y += 7;
  };

  section("INFORMATIONS GÉNÉRALES");
  row2col("Date :", fmt(dateEdl || new Date().toISOString()), "Dossier réf :", dossier.reference || "—");
  row2col("Locataire :", dossier.locataire_nom || "—", "Téléphone :", dossier.locataire_telephone || "—");
  row2col("Bien :", dossier.bien_titre || "—", "Adresse :", "");
  if (dossier.bien_adresse) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(dossier.bien_adresse, M.l + 35, y - 7);
  }
  row2col("Loyer :", `${dossier.loyer_mensuel || 0} € + ${dossier.charges_mensuelle || 0} € charges`, "Type bail :", dossier.type_bail || "vide");
  y += 3;

  // ══════════════════════════════════════════════════
  // RÉCAPITULATIF ÉTAT DES PIÈCES (tableau)
  // ══════════════════════════════════════════════════
  checkPage(50);
  section("RÉCAPITULATIF PAR PIÈCE");

  // Tableau header
  const colW = [55, 30, 97];
  const tableX = M.l;
  doc.setFillColor(C.r, C.g, C.b);
  ["Pièce", "État", "Observations"].forEach((h, i) => {
    let x = tableX;
    for (let j = 0; j < i; j++) x += colW[j];
    doc.rect(x, y - 4, colW[i], 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(h, x + 2, y + 1);
  });
  y += 9;

  // Lignes pièces
  for (const piece of pieces) {
    checkPage(12);
    const d = checklist[piece] || {};
    const etatKey = d.etat || "bon";
    const etatColor = ETAT_COLORS[etatKey] || ETAT_COLORS.bon;

    // Fond alterné
    if (pieces.indexOf(piece) % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(tableX, y - 4, CW, 8, "F");
    }

    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(piece, tableX + 2, y);

    // Badge état coloré
    doc.setFillColor(etatColor.r, etatColor.g, etatColor.b);
    doc.roundedRect(tableX + colW[0] + 1, y - 3, 28, 5.5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(ETAT_LABELS[etatKey] || "—", tableX + colW[0] + 15, y + 0.5, { align: "center" });

    // Observation (tronquée)
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const obs = (d.commentaire || "").slice(0, 60);
    doc.text(obs || "—", tableX + colW[0] + colW[1] + 2, y);

    y += 9;

    // Photos de la pièce (miniatures intégrées si disponibles - note: les images réelles nécessitent addImage)
    if (d.photos?.length > 0) {
      doc.setFontSize(7);
      doc.setTextColor(C.r, C.g, C.b);
      doc.text(`📷 ${d.photos.length} photo(s) disponible(s)`, tableX + 2, y);
      y += 5;
    }
  }
  y += 4;

  // ══════════════════════════════════════════════════
  // DÉTAIL PAR PIÈCE (éléments)
  // ══════════════════════════════════════════════════
  checkPage(30);
  section("DÉTAIL PAR PIÈCE — ÉLÉMENTS");

  for (const piece of pieces) {
    checkPage(25);
    const d = checklist[piece] || {};
    if (!d.elements || Object.keys(d.elements).length === 0) continue;

    doc.setFillColor(245, 247, 250);
    doc.rect(M.l - 2, y - 3, CW + 4, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(C.r, C.g, C.b);
    doc.text(piece, M.l, y + 1);
    y += 8;

    for (const [el, elD] of Object.entries(d.elements)) {
      checkPage(8);
      const ec = ETAT_COLORS[elD.etat] || ETAT_COLORS.bon;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`  ${el} :`, M.l + 2, y);
      doc.setFillColor(ec.r, ec.g, ec.b);
      doc.roundedRect(M.l + 28, y - 3, 18, 4.5, 0.8, 0.8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.text(ETAT_LABELS[elD.etat] || "—", M.l + 37, y - 0.2, { align: "center" });
      if (elD.note) {
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(7.5);
        doc.text(elD.note.slice(0, 80), M.l + 50, y);
      }
      y += 6;
    }
    y += 2;
  }

  // ══════════════════════════════════════════════════
  // OBSERVATIONS GÉNÉRALES
  // ══════════════════════════════════════════════════
  if (observations) {
    checkPage(30);
    section("OBSERVATIONS GÉNÉRALES");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(observations, CW - 4);
    doc.text(lines, M.l + 2, y);
    y += lines.length * 5 + 6;
  }

  // ══════════════════════════════════════════════════
  // COMPARAISON EDL (si sortie + données disponibles)
  // ══════════════════════════════════════════════════
  if (type === "edls" && dossier.comparaison_edl) {
    checkPage(50);
    section("RÉSULTAT COMPARAISON ENTRÉE / SORTIE (ANALYSE IA)");
    const comp = dossier.comparaison_edl;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const synLines = doc.splitTextToSize(comp.synthese || "", CW - 4);
    doc.text(synLines, M.l + 2, y);
    y += synLines.length * 5 + 4;

    if (comp.degradations?.length > 0) {
      for (const deg of comp.degradations) {
        checkPage(12);
        const sev = deg.severite;
        const sevColor = sev === "eleve" ? { r: 239, g: 68, b: 68 } : sev === "moyen" ? { r: 245, g: 158, b: 11 } : { r: 100, g: 116, b: 139 };
        doc.setFillColor(sevColor.r + 50, sevColor.g + 50, sevColor.b + 50);
        doc.roundedRect(M.l - 1, y - 3, CW + 2, 9, 1, 1, "F");
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(`${deg.piece} — ${deg.description}`, M.l + 2, y + 1);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(sevColor.r - 30, sevColor.g - 30, sevColor.b - 30);
        doc.text(`${deg.montant_estime ? deg.montant_estime + " €" : "—"} • ${sev || "—"}`, W - M.r - 2, y + 1, { align: "right" });
        y += 10;
      }
      y += 2;
      // Total
      doc.setFillColor(239, 68, 68);
      doc.rect(M.l - 1, y - 3, CW + 2, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL RETENUE ESTIMÉE", M.l + 2, y + 3);
      doc.text(`${comp.total_retenue_estime || 0} €`, W - M.r - 2, y + 3, { align: "right" });
      y += 14;
    }
  }

  // ══════════════════════════════════════════════════
  // SIGNATURES
  // ══════════════════════════════════════════════════
  checkPage(65);
  section("SIGNATURES — VALIDATION DE L'ÉTAT DES LIEUX");
  y += 4;

  const sigW = (CW - 8) / 2;
  const sigH = 45;

  // Locataire
  doc.setDrawColor(C.r, C.g, C.b);
  doc.setLineWidth(0.3);
  doc.rect(M.l, y, sigW, sigH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.r, C.g, C.b);
  doc.text("LOCATAIRE", M.l + 3, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text("Nom :", M.l + 3, y + 16);
  doc.setTextColor(20, 20, 20);
  doc.text(dossier.locataire_nom || "—", M.l + 3, y + 23);
  doc.setTextColor(80, 80, 80);
  doc.text("Lu et approuvé — Signature :", M.l + 3, y + 32);
  if (signeLocataire) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(M.l + 3, y + 36, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("✓ SIGNÉ", M.l + 18, y + 40.5, { align: "center" });
  }

  // Agence/Propriétaire
  const sig2X = M.l + sigW + 8;
  doc.rect(sig2X, y, sigW, sigH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.r, C.g, C.b);
  doc.text("AGENCE / PROPRIÉTAIRE", sig2X + 3, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Représentant :", sig2X + 3, y + 16);
  doc.setTextColor(20, 20, 20);
  doc.text(agency?.name || "—", sig2X + 3, y + 23);
  doc.setTextColor(80, 80, 80);
  doc.text("Lu et approuvé — Signature :", sig2X + 3, y + 32);
  if (signeProprietaire) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(sig2X + 3, y + 36, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("✓ SIGNÉ", sig2X + 18, y + 40.5, { align: "center" });
  }

  y += sigH + 8;

  // Mention légale
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text("Document établi en 2 exemplaires. En cas de litige, ce document fait foi devant les tribunaux compétents.", M.l, y);

  addFooter();
  return doc;
}