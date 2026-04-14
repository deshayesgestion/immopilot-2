import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Sparkles } from "lucide-react";
import { PDFTemplate, PDFUtils } from "@/lib/pdfTemplate";

const fmt = PDFUtils.formatEur;

export default function TabRapports() {
  const [transactions, setTransactions] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    Promise.all([
      base44.entities.Transaction.list("-date_echeance", 500),
      base44.entities.Depense.list("-date", 500),
    ]).then(([t, d]) => { setTransactions(t); setDepenses(d); setLoading(false); });
  }, []);

  const data = useMemo(() => {
    const prefix = String(year);
    const txYear = transactions.filter(t => (t.date_paiement || t.date_echeance || "").startsWith(prefix) && t.statut === "paye");
    const depYear = depenses.filter(d => (d.date || "").startsWith(prefix));

    const loyers = txYear.filter(t => t.type === "loyer").reduce((s, t) => s + (t.montant || 0), 0);
    const commissions = txYear.filter(t => t.type === "commission_vente").reduce((s, t) => s + (t.montant || 0), 0);
    const honoraires = txYear.filter(t => t.type === "honoraires").reduce((s, t) => s + (t.montant || 0), 0);
    const autresEntrees = txYear.filter(t => !["loyer","commission_vente","honoraires"].includes(t.type)).reduce((s, t) => s + (t.montant || 0), 0);
    const totalEntrees = loyers + commissions + honoraires + autresEntrees;
    const totalDepenses = depYear.reduce((s, d) => s + (d.montant || 0), 0);
    const resultatNet = totalEntrees - totalDepenses;

    const impayes = transactions.filter(t => t.statut === "en_retard").reduce((s, t) => s + (t.montant || 0), 0);

    const byMonth = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${prefix}-${String(m).padStart(2, "0")}`;
      const mTx = txYear.filter(t => (t.date_paiement || "").startsWith(key));
      const mDep = depYear.filter(d => (d.date || "").startsWith(key));
      byMonth[key] = {
        mois: new Date(`${key}-01`).toLocaleDateString("fr-FR", { month: "short" }),
        entrees: mTx.reduce((s, t) => s + (t.montant || 0), 0),
        sorties: mDep.reduce((s, d) => s + (d.montant || 0), 0),
      };
    }

    return { loyers, commissions, honoraires, autresEntrees, totalEntrees, totalDepenses, resultatNet, impayes, byMonth };
  }, [transactions, depenses, year]);

  const exportPDF = async () => {
    const agencies = await base44.entities.Agency.list("-created_date", 1);
    const agency = agencies[0] || null;
    const pdf = new PDFTemplate(agency);

    pdf.addHeader();
    pdf.addTitle(`Rapport financier ${year}`);
    pdf.addSpace(3);

    pdf.addSection("PRODUITS");
    pdf.addRow("Loyers perçus", fmt(data.loyers));
    pdf.addRow("Commissions vente", fmt(data.commissions));
    pdf.addRow("Honoraires", fmt(data.honoraires));
    pdf.addRow("Autres entrées", fmt(data.autresEntrees));
    pdf.addSeparator(2);
    pdf.addRow("TOTAL PRODUITS", fmt(data.totalEntrees), true);
    pdf.addSpace(4);

    pdf.addSection("CHARGES");
    pdf.addRow("Total dépenses", fmt(data.totalDepenses), true);
    pdf.addSpace(4);

    pdf.addSection("RÉSULTAT");
    pdf.addRow("RÉSULTAT NET", fmt(data.resultatNet), true);
    if (data.impayes > 0) pdf.addRow("Impayés en cours", fmt(data.impayes));

    if (aiReport) {
      pdf.addSpace(6);
      pdf.addSection("ANALYSE IA");
      pdf.addParagraph(aiReport);
    }

    pdf.save(`Rapport_${year}.pdf`);
  };

  const exportCSV = () => {
    const rows = [["Mois","Entrées","Sorties","Cashflow"]];
    Object.values(data.byMonth).forEach(m => rows.push([m.mois, m.entrees, m.sorties, m.entrees - m.sorties]));
    rows.push([]); rows.push(["Total entrées", data.totalEntrees]); rows.push(["Total sorties", data.totalDepenses]); rows.push(["Résultat net", data.resultatNet]);
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Rapport_${year}.csv`; a.click();
  };

  const genererAnalyseIA = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse financière d'une agence immobilière pour ${year}:
- Loyers perçus: ${fmt(data.loyers)}
- Commissions vente: ${fmt(data.commissions)}
- Honoraires: ${fmt(data.honoraires)}
- Total produits: ${fmt(data.totalEntrees)}
- Total charges: ${fmt(data.totalDepenses)}
- Résultat net: ${fmt(data.resultatNet)}
- Impayés en cours: ${fmt(data.impayes)}
Rédige une analyse professionnelle en 5-6 points: performance, points d'attention, recommandations.`
    });
    setAiReport(res);
    setAiLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Exercice :</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-9 rounded-full border border-input bg-white px-3 text-sm">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full gap-2 h-9 text-sm" onClick={exportCSV}><Download className="w-4 h-4" /> CSV</Button>
          <Button variant="outline" className="rounded-full gap-2 h-9 text-sm" onClick={exportPDF}><FileText className="w-4 h-4" /> PDF</Button>
        </div>
      </div>

      {/* Compte de résultat */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
        <p className="text-sm font-bold">Compte de résultat {year}</p>
        <div className="space-y-2">
          {[
            { label: "Loyers perçus", val: data.loyers, color: "text-green-600" },
            { label: "Commissions vente", val: data.commissions, color: "text-primary" },
            { label: "Honoraires", val: data.honoraires, color: "text-purple-600" },
            { label: "Autres produits", val: data.autresEntrees, color: "text-teal-600" },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-border/20">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className={`text-sm font-semibold ${r.color}`}>{fmt(r.val)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
            <span className="text-sm font-bold">Total produits</span>
            <span className="text-sm font-bold text-green-700">{fmt(data.totalEntrees)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/20">
            <span className="text-sm text-muted-foreground">Total charges</span>
            <span className="text-sm font-semibold text-red-600">-{fmt(data.totalDepenses)}</span>
          </div>
          <div className={`flex justify-between items-center py-2 rounded-lg px-3 ${data.resultatNet >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <span className="text-sm font-bold">Résultat net</span>
            <span className={`text-base font-bold ${data.resultatNet >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(data.resultatNet)}</span>
          </div>
          {data.impayes > 0 && (
            <div className="flex justify-between items-center py-1.5 bg-amber-50 rounded-lg px-3">
              <span className="text-sm text-amber-700">⚠ Impayés en cours</span>
              <span className="text-sm font-semibold text-amber-700">{fmt(data.impayes)}</span>
            </div>
          )}
        </div>
      </div>

      {/* IA Report */}
      <div className="bg-white rounded-2xl border border-primary/15 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Analyse IA du rapport</p>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={genererAnalyseIA} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Générer
          </Button>
        </div>
        {aiReport ? (
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">{aiReport}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Cliquez sur "Générer" pour obtenir une analyse IA de votre exercice {year}.</p>
        )}
      </div>
    </div>
  );
}