/**
 * Template PDF standardisé — ImmoPilot
 * Utilisé par tous les documents (factures, quittances, rapports, devis, contrats)
 * Garantit une cohérence visuelle complète
 */

import { jsPDF } from 'jspdf';

const DEFAULT_MARGINS = { top: 14, right: 14, bottom: 20, left: 14 };

/**
 * Classe réutilisable pour générer des PDFs standardisés
 */
export class PDFTemplate {
  constructor(agency = null, options = {}) {
    this.doc = new jsPDF();
    this.agency = agency || {};
    this.margins = { ...DEFAULT_MARGINS, ...options.margins };
    this.color = this.parseColor(agency?.primary_color || "#4F46E5");
    this.y = this.margins.top;
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.contentWidth = this.pageWidth - (this.margins.left + this.margins.right);
    this.footerY = this.pageHeight - 15;
  }

  parseColor(hexColor) {
    const hex = hexColor.replace("#", "");
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // ─── EN-TÊTE ──────────────────────────────────────────────────────────
  addHeader() {
    const headerHeight = 35;
    
    // Fond coloré
    this.doc.setFillColor(this.color.r, this.color.g, this.color.b);
    this.doc.rect(0, 0, this.pageWidth, headerHeight, "F");

    // Texte blanc
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(13);
    this.doc.text(this.agency.name || "Document", this.margins.left, 12);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    const addr = `${this.agency.address || ""} ${this.agency.postal_code || ""} ${this.agency.city || ""}`.trim();
    if (addr) this.doc.text(addr, this.margins.left, 20);
    
    const contact = `${this.agency.email || ""} | ${this.agency.phone || ""}`.trim();
    if (contact) this.doc.text(contact, this.margins.left, 26);

    this.y = headerHeight + 10;
  }

  // ─── PIED DE PAGE ──────────────────────────────────────────────────────
  addFooter() {
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7);

    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR");
    this.doc.text(`Généré le ${dateStr}`, this.margins.left, this.footerY);
    this.doc.text(`Page 1`, this.pageWidth / 2, this.footerY, { align: "center" });
    this.doc.text(this.agency.name || "Agence", this.pageWidth - this.margins.right, this.footerY, { align: "right" });
  }

  // ─── TITRE PRINCIPAL ─────────────────────────────────────────────────
  addTitle(text) {
    this.doc.setTextColor(30, 30, 30);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.text(text, this.pageWidth / 2, this.y, { align: "center" });
    this.y += 12;
  }

  // ─── SECTION AVEC FOND COLORÉ ───────────────────────────────────────
  addSection(title) {
    // Fond coloré
    this.doc.setFillColor(this.color.r, this.color.g, this.color.b);
    this.doc.rect(this.margins.left - 4, this.y - 4, this.contentWidth + 8, 8, "F");

    // Texte blanc
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.text(title, this.margins.left, this.y + 1);

    this.doc.setTextColor(30, 30, 30);
    this.y += 10;
  }

  // ─── PAIRE CLÉ-VALEUR ──────────────────────────────────────────────────
  addRow(label, value, bold = false) {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.doc.text(label, this.margins.left, this.y);
    this.doc.text(String(value || "—"), this.pageWidth - this.margins.right, this.y, { align: "right" });
    this.y += 7;
  }

  // ─── LIGNE SÉPARATRICE ──────────────────────────────────────────────────
  addSeparator(spacing = 4) {
    this.doc.setDrawColor(this.color.r, this.color.g, this.color.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margins.left, this.y, this.pageWidth - this.margins.right, this.y);
    this.y += spacing;
  }

  // ─── TABLEAU SIMPLE ────────────────────────────────────────────────────
  addTable(headers, rows, colWidths = null) {
    const totalWidth = this.contentWidth;
    const numCols = headers.length;
    const defaultColWidth = totalWidth / numCols;
    const cols = colWidths || Array(numCols).fill(defaultColWidth);

    // En-têtes
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFillColor(this.color.r, this.color.g, this.color.b);
    this.doc.setTextColor(255, 255, 255);

    let x = this.margins.left;
    for (let i = 0; i < headers.length; i++) {
      this.doc.rect(x, this.y - 5, cols[i], 8, "F");
      this.doc.text(headers[i], x + 2, this.y + 1);
      x += cols[i];
    }
    this.y += 10;

    // Lignes
    this.doc.setTextColor(30, 30, 30);
    this.doc.setFont("helvetica", "normal");
    for (const row of rows) {
      x = this.margins.left;
      for (let i = 0; i < row.length; i++) {
        this.doc.text(String(row[i] || ""), x + 2, this.y);
        x += cols[i];
      }
      this.y += 7;
    }
    this.y += 3;
  }

  // ─── TEXTE LONG (PARAGRAPHE) ──────────────────────────────────────────
  addParagraph(text, options = {}) {
    const { fontSize = 9, alignment = "left", maxWidth = this.contentWidth, lineHeight = 5 } = options;
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(30, 30, 30);

    const lines = this.doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      this.doc.text(line, this.margins.left, this.y, { align: alignment });
      this.y += lineHeight;
    }
  }

  // ─── ESPACER ──────────────────────────────────────────────────────────
  addSpace(height = 8) {
    this.y += height;
  }

  // ─── SAUVEGARDER ──────────────────────────────────────────────────────
  save(filename) {
    this.addFooter();
    this.doc.save(filename);
  }

  // ─── RETOURNER LE DOCUMENT ────────────────────────────────────────────
  getDocument() {
    return this.doc;
  }
}

/**
 * Utilitaires de formatage
 */
export const PDFUtils = {
  formatEur: (n) => new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(n || 0),

  formatDate: (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—",

  formatDateFr: (d) => d ? new Date(d).toLocaleDateString("fr-FR", { 
    weekday: "long", 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  }) : "—",
};