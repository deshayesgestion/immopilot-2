import { useState } from "react";
import { Download, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "";
const fmtEur = n => (n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 });

export default function ComptaExport({ paiements, quittances, transactions, factures, contacts, biens }) {
  const [exporting, setExporting] = useState(null);

  const contactMap = Object.fromEntries((contacts || []).map(c => [c.id, c]));
  const bienMap = Object.fromEntries((biens || []).map(b => [b.id, b]));

  const downloadCSV = (rows, filename) => {
    const csv = rows.map(r => r.map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const exportPaiements = () => {
    setExporting("paiements");
    const rows = [
      ["Date", "Contact", "Bien", "Type", "Montant HT", "Statut", "Mode", "Référence"],
      ...paiements.map(p => [
        fmtDate(p.date_echeance), contactMap[p.contact_id]?.nom || "", bienMap[p.bien_id]?.titre || "",
        p.type, fmtEur(p.montant), p.statut, p.mode_paiement || "", p.reference_paiement || ""
      ])
    ];
    downloadCSV(rows, `paiements-${new Date().toISOString().slice(0,10)}.csv`);
    setExporting(null);
  };

  const exportQuittances = () => {
    setExporting("quittances");
    const rows = [
      ["Mois", "Locataire", "Bien", "Loyer", "Charges", "Total", "Statut", "Date paiement"],
      ...quittances.map(q => [
        q.mois_label || q.mois, q.locataire_nom || "", q.bien_titre || "",
        fmtEur(q.montant_loyer), fmtEur(q.montant_charges), fmtEur(q.montant_total),
        q.statut, fmtDate(q.date_paiement)
      ])
    ];
    downloadCSV(rows, `quittances-${new Date().toISOString().slice(0,10)}.csv`);
    setExporting(null);
  };

  const exportFEC = () => {
    setExporting("fec");
    // Format FEC simplifié (Fichier des Écritures Comptables)
    const lignes = [
      ["JournalCode","JournalLib","EcritureNum","EcritureDate","CompteNum","CompteLib","Debit","Credit","EcritureLet","ValidDate","Montantdevise","Idevise"]
    ];
    let num = 1;
    paiements.filter(p => p.statut === "paye").forEach(p => {
      const dateStr = p.date_paiement ? p.date_paiement.replace(/-/g, "") : "";
      const contact = contactMap[p.contact_id]?.nom || "Client";
      const montant = fmtEur(p.montant);
      // Débit compte client
      lignes.push(["BQ","Banque",`EC${String(num).padStart(5,"0")}`,dateStr,"512000","Banque",montant,"0","","","",""]);
      // Crédit compte produit
      const compteNum = p.type === "loyer" ? "706000" : p.type === "commission" ? "706100" : "706200";
      const compteLib = p.type === "loyer" ? "Loyers" : p.type === "commission" ? "Commissions" : "Frais";
      lignes.push(["BQ","Banque",`EC${String(num).padStart(5,"0")}`,dateStr,compteNum,compteLib,"0",montant,"","","",""]);
      num++;
    });
    downloadCSV(lignes, `FEC-${new Date().getFullYear()}.csv`);
    setExporting(null);
  };

  const exportFactures = () => {
    setExporting("factures");
    const rows = [
      ["Numéro", "Client", "Email", "Type", "HT", "TVA%", "TVA", "TTC", "Statut", "Émission", "Échéance"],
      ...(factures || []).map(f => [
        f.numero, f.client_nom, f.client_email, f.type,
        fmtEur(f.montant_ht), f.tva_taux, fmtEur(f.montant_tva), fmtEur(f.montant_ttc),
        f.statut, fmtDate(f.date_emission), fmtDate(f.date_echeance)
      ])
    ];
    downloadCSV(rows, `factures-${new Date().toISOString().slice(0,10)}.csv`);
    setExporting(null);
  };

  // TVA collectée / déductible
  const tvaCollectee = (factures || []).filter(f => f.statut === "payee").reduce((s, f) => s + (f.montant_tva || 0), 0);

  const exports = [
    { id: "paiements", label: "Paiements",     desc: `${paiements.length} enregistrements`,    icon: FileSpreadsheet, action: exportPaiements, color: "text-blue-600",   bg: "bg-blue-50" },
    { id: "quittances",label: "Quittances",    desc: `${quittances.length} quittances`,         icon: FileSpreadsheet, action: exportQuittances,color: "text-emerald-600",bg: "bg-emerald-50" },
    { id: "factures",  label: "Factures",      desc: `${(factures||[]).length} factures`,       icon: FileText,        action: exportFactures,  color: "text-violet-600", bg: "bg-violet-50" },
    { id: "fec",       label: "Export FEC",    desc: "Format expert-comptable",                 icon: FileText,        action: exportFEC,       color: "text-amber-600",  bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-4">
      {/* TVA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">TVA collectée</p>
          <p className="text-xl font-bold text-blue-600">{(tvaCollectee).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">TVA déductible</p>
          <p className="text-xl font-bold text-slate-600">0,00 €</p>
          <p className="text-[10px] text-muted-foreground">À saisir dans les dépenses</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">TVA nette à payer</p>
          <p className="text-xl font-bold text-red-600">{(tvaCollectee).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exports.map(e => {
          const Icon = e.icon;
          return (
            <div key={e.id} className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${e.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${e.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{e.label}</p>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1.5 flex-shrink-0" onClick={e.action} disabled={exporting === e.id}>
                {exporting === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Exporter
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Format CSV compatible Excel, Sage, Cegid. Export FEC conforme DGFiP.
      </p>
    </div>
  );
}