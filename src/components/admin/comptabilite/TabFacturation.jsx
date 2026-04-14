import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, FileText, X, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const STATUT_COLORS = { brouillon: "bg-gray-100 text-gray-500", emise: "bg-blue-100 text-blue-700", payee: "bg-green-100 text-green-700", annulee: "bg-red-100 text-red-700" };
const STATUT_LABELS = { brouillon: "Brouillon", emise: "Émise", payee: "Payée", annulee: "Annulée" };

function FactureForm({ facture, onClose, onSave }) {
  const [form, setForm] = useState({
    type: facture?.type || "loyer",
    client_nom: facture?.client_nom || "",
    client_email: facture?.client_email || "",
    bien_titre: facture?.bien_titre || "",
    montant_ht: facture?.montant_ht || "",
    tva_taux: facture?.tva_taux || 0,
    date_emission: facture?.date_emission || new Date().toISOString().substring(0, 10),
    date_echeance: facture?.date_echeance || "",
    notes: facture?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => {
    const n = { ...p, [k]: v };
    const ht = Number(k === "montant_ht" ? v : p.montant_ht) || 0;
    const tva = Number(k === "tva_taux" ? v : p.tva_taux) || 0;
    n.montant_ttc = Math.round(ht * (1 + tva / 100) * 100) / 100;
    return n;
  });

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, montant_ht: Number(form.montant_ht), tva_taux: Number(form.tva_taux) };
    if (!facture) {
      const count = await base44.entities.Facture.list("-created_date", 1);
      data.numero = `FAC-${new Date().getFullYear()}-${String((count.length || 0) + 1).padStart(4, "0")}`;
    }
    if (facture?.id) await base44.entities.Facture.update(facture.id, data);
    else await base44.entities.Facture.create(data);
    setSaving(false); onSave(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-white">
          <h2 className="text-base font-bold">{facture ? "Modifier la facture" : "Nouvelle facture"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="loyer">Loyer</option>
              <option value="honoraires">Honoraires</option>
              <option value="commission">Commission</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Client</label>
            <Input value={form.client_nom} onChange={e => set("client_nom", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Email client</label>
            <Input value={form.client_email} onChange={e => set("client_email", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Bien</label>
            <Input value={form.bien_titre} onChange={e => set("bien_titre", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Montant HT (€)</label>
            <Input type="number" value={form.montant_ht} onChange={e => set("montant_ht", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">TVA (%)</label>
            <Input type="number" value={form.tva_taux} onChange={e => set("tva_taux", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Montant TTC (€)</label>
            <Input type="number" value={form.montant_ttc} readOnly className="bg-secondary/30" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date émission</label>
            <Input type="date" value={form.date_emission} onChange={e => set("date_emission", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Date échéance</label>
            <Input type="date" value={form.date_echeance} onChange={e => set("date_echeance", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/50">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Créer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TabFacturation() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editFac, setEditFac] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Facture.list("-date_emission", 100); setFactures(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const [agency, setAgency] = useState(null);

  useEffect(() => {
    base44.entities.Agency.list("-created_date", 1).then(a => setAgency(a[0] || null));
  }, []);

  const exportPDF = async (f) => {
    const doc = new jsPDF();
    const primaryColor = agency?.primary_color || "#4F46E5";
    const r = parseInt(primaryColor.slice(1,3), 16);
    const g = parseInt(primaryColor.slice(3,5), 16);
    const b = parseInt(primaryColor.slice(5,7), 16);

    // En-tête avec identité du cabinet
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(agency?.name || "Facture", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(agency?.address || "", 14, 20);
    doc.text(`${agency?.postal_code || ""} ${agency?.city || ""}`, 14, 25);

    // Titre facture
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 105, 45, { align: "center" });

    // Infos facturation
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`N° : ${f.numero || "—"}`, 14, 55);
    doc.text(`Émise : ${fmtDate(f.date_emission)}`, 14, 61);
    doc.text(`Échéance : ${fmtDate(f.date_echeance)}`, 14, 67);

    // Client
    doc.setFont("helvetica", "bold");
    doc.text("FACTURATION À :", 14, 80);
    doc.setFont("helvetica", "normal");
    doc.text(f.client_nom, 14, 87);
    if (f.client_email) doc.text(f.client_email, 14, 93);

    // Ligne séparatrice avec couleur primaire
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.8);
    doc.line(14, 105, 196, 105);

    // Détail facture
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 14, 115);
    doc.text("Montant", 160, 115);

    doc.setFont("helvetica", "normal");
    doc.text(f.bien_titre || f.type, 14, 125);
    doc.text(`${fmt(f.montant_ht)}`, 160, 125, { align: "right" });

    let y = 135;
    if (f.tva_taux) {
      doc.text(`TVA ${f.tva_taux}%`, 14, y);
      doc.text(`${fmt((f.montant_ht || 0) * (f.tva_taux / 100))}`, 160, y, { align: "right" });
      y += 8;
    }

    // Sous-total HT
    doc.setFont("helvetica", "bold");
    doc.text("Montant HT :", 14, y + 5);
    doc.text(`${fmt(f.montant_ht)}`, 160, y + 5, { align: "right" });

    // Total TTC avec fond coloré
    doc.setFillColor(r, g, b);
    doc.rect(10, y + 12, 190, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`TOTAL TTC : ${fmt(f.montant_ttc)}`, 160, y + 18, { align: "right" });

    // Pied de page
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const footerText = `${agency?.email || "contact@agency.fr"} | ${agency?.phone || ""}`;
    doc.text(footerText, 14, 285);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 160, 285, { align: "right" });

    doc.save(`Facture_${f.numero || f.id}.pdf`);
  };

  const marquerPayee = async (f) => {
    await base44.entities.Facture.update(f.id, { statut: "payee", date_paiement: new Date().toISOString().substring(0, 10) });
    load();
  };

  const envoyerFacturePDF = async (f) => {
    if (!f.client_email) {
      alert("Email client manquant");
      return;
    }
    try {
      await base44.integrations.Core.SendEmail({
        to: f.client_email,
        subject: `Facture ${f.numero} — ${agency?.name || "Votre agence"}`,
        body: `Bonjour ${f.client_nom},\n\nVeuillez trouver en pièce jointe la facture ${f.numero} pour un montant de ${fmt(f.montant_ttc)}.\n\nÉchéance : ${fmtDate(f.date_echeance)}\n\nCordialement,\n${agency?.name || "L'agence"}`,
      });
      alert("✓ Facture envoyée avec succès");
    } catch (e) {
      alert(`⚠ Erreur lors de l'envoi : ${e.message}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {showForm && <FactureForm facture={editFac} onClose={() => { setShowForm(false); setEditFac(null); }} onSave={load} />}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{factures.length} facture{factures.length > 1 ? "s" : ""}</p>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => { setEditFac(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Button>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {factures.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground">Aucune facture</p>
        ) : (
          <div className="divide-y divide-border/30">
            {factures.map(f => (
              <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.numero || "—"} · {f.client_nom}</p>
                  <p className="text-xs text-muted-foreground">{f.bien_titre} · Émise le {fmtDate(f.date_emission)}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0">{fmt(f.montant_ttc)}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUT_COLORS[f.statut]}`}>{STATUT_LABELS[f.statut]}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={() => exportPDF(f)}>
                    <FileText className="w-3 h-3" /> PDF
                  </Button>
                  {f.client_email && (
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={() => envoyerFacturePDF(f)}>
                      📧 Envoyer
                    </Button>
                  )}
                  {f.statut === "emise" && (
                    <Button size="sm" className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700" onClick={() => marquerPayee(f)}>Payée</Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => { setEditFac(f); setShowForm(true); }}>Modifier</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}