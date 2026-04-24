import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Download, Send, Loader2, CheckCircle2, X, Euro } from "lucide-react";

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const TVA_TAUX = [0, 5.5, 10, 20];

const STATUT_COLORS = {
  brouillon:  "bg-slate-100 text-slate-600",
  envoyee:    "bg-blue-100 text-blue-700",
  payee:      "bg-green-100 text-green-700",
  en_retard:  "bg-red-100 text-red-700",
  partielle:  "bg-amber-100 text-amber-700",
};

function NouvelleFactureModal({ contacts, onClose, onCreated }) {
  const [form, setForm] = useState({
    client_nom: "", client_email: "", type: "honoraires_location",
    description: "", montant_ht: "", tva_taux: 20,
    date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const montant_tva = ((Number(form.montant_ht) || 0) * form.tva_taux / 100);
  const montant_ttc = (Number(form.montant_ht) || 0) + montant_tva;

  // Numéro légal auto
  const numero = `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  const save = async () => {
    if (!form.client_nom || !form.montant_ht) return;
    setSaving(true);
    const facture = await base44.entities.Facture.create({
      numero,
      client_nom: form.client_nom,
      client_email: form.client_email,
      type: form.type,
      description: form.description,
      montant_ht: Number(form.montant_ht),
      tva_taux: form.tva_taux,
      montant_tva,
      montant_ttc,
      statut: "brouillon",
      date_emission: new Date().toISOString().slice(0, 10),
      date_echeance: form.date_echeance,
    });
    onCreated(facture);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Nouvelle facture</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Client *</label>
            <Input value={form.client_nom} onChange={e => set("client_nom", e.target.value)} placeholder="Nom du client" className="h-9 rounded-xl text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <Input type="email" value={form.client_email} onChange={e => set("client_email", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="honoraires_location">Honoraires location</option>
              <option value="commission_vente">Commission vente</option>
              <option value="prestation">Prestation</option>
              <option value="frais_dossier">Frais dossier</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">TVA (%)</label>
            <select value={form.tva_taux} onChange={e => set("tva_taux", Number(e.target.value))}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              {TVA_TAUX.map(t => <option key={t} value={t}>{t}%</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Montant HT (€) *</label>
            <Input type="number" value={form.montant_ht} onChange={e => set("montant_ht", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Échéance</label>
            <Input type="date" value={form.date_echeance} onChange={e => set("date_echeance", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Objet de la facture…" className="h-9 rounded-xl text-sm" />
          </div>
        </div>
        {/* Récapitulatif */}
        <div className="bg-secondary/20 rounded-xl p-3 space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">HT</span><span className="font-medium">{fmtEur(Number(form.montant_ht))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">TVA {form.tva_taux}%</span><span className="font-medium">{fmtEur(montant_tva)}</span></div>
          <div className="flex justify-between border-t border-border/40 pt-1"><span className="font-bold">TTC</span><span className="font-black text-primary">{fmtEur(montant_ttc)}</span></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full text-xs h-9" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full text-xs h-9 gap-1.5" onClick={save} disabled={saving || !form.client_nom || !form.montant_ht}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Créer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ComptaFacturation({ contacts }) {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    base44.entities.Facture.list("-created_date", 100).then(f => { setFactures(f); setLoading(false); });
  }, []);

  const totalHT = factures.reduce((s, f) => s + (f.montant_ht || 0), 0);
  const totalTTC = factures.reduce((s, f) => s + (f.montant_ttc || 0), 0);
  const totalPayee = factures.filter(f => f.statut === "payee").reduce((s, f) => s + (f.montant_ttc || 0), 0);
  const totalEnAttente = factures.filter(f => f.statut !== "payee").reduce((s, f) => s + (f.montant_ttc || 0), 0);

  const envoyerFacture = async (f) => {
    if (!f.client_email) return;
    setSending(f.id);
    await base44.integrations.Core.SendEmail({
      to: f.client_email,
      subject: `Facture ${f.numero} — ${fmtEur(f.montant_ttc)}`,
      body: `<p>Bonjour ${f.client_nom},</p>
<p>Veuillez trouver ci-joint votre facture <strong>${f.numero}</strong>.</p>
<table style="border-collapse:collapse;width:100%;max-width:400px;margin:16px 0">
  <tr><td style="padding:8px;color:#64748b">Type</td><td style="padding:8px;font-weight:600">${f.type}</td></tr>
  <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Montant HT</td><td style="padding:8px;font-weight:600">${fmtEur(f.montant_ht)}</td></tr>
  <tr><td style="padding:8px;color:#64748b">TVA ${f.tva_taux}%</td><td style="padding:8px">${fmtEur(f.montant_tva)}</td></tr>
  <tr style="background:#eff6ff"><td style="padding:8px;font-weight:700">Total TTC</td><td style="padding:8px;font-weight:800;color:#4F46E5">${fmtEur(f.montant_ttc)}</td></tr>
  <tr><td style="padding:8px;color:#64748b">Échéance</td><td style="padding:8px">${fmtDate(f.date_echeance)}</td></tr>
</table>
<p>Cordialement,<br>L'agence</p>`,
    });
    await base44.entities.Facture.update(f.id, { statut: "envoyee" });
    setFactures(p => p.map(x => x.id === f.id ? { ...x, statut: "envoyee" } : x));
    setSending(null);
  };

  const marquerPayee = async (f) => {
    await base44.entities.Facture.update(f.id, { statut: "payee", date_paiement: new Date().toISOString().slice(0, 10) });
    setFactures(p => p.map(x => x.id === f.id ? { ...x, statut: "payee" } : x));
  };

  const exportCSV = () => {
    const rows = [
      ["Numéro", "Client", "Type", "HT", "TVA%", "TTC", "Statut", "Émission", "Échéance"],
      ...factures.map(f => [f.numero, f.client_nom, f.type, f.montant_ht, f.tva_taux, f.montant_ttc, f.statut, f.date_emission, f.date_echeance])
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "factures.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "CA HT total",    value: fmtEur(totalHT),      color: "text-slate-700",   bg: "bg-slate-50", border: "border-slate-100" },
          { label: "CA TTC total",   value: fmtEur(totalTTC),     color: "text-primary",     bg: "bg-primary/5", border: "border-primary/10" },
          { label: "Encaissé",       value: fmtEur(totalPayee),   color: "text-green-700",   bg: "bg-green-50", border: "border-green-100" },
          { label: "En attente",     value: fmtEur(totalEnAttente), color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-2xl border ${k.border} p-4`}>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{factures.length} facture(s)</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={exportCSV}>
            <Download className="w-3 h-3" /> Export CSV
          </Button>
          <Button size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="w-3 h-3" /> Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Liste factures */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : factures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-12 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune facture</p>
          <Button className="mt-4 rounded-full gap-2 h-8 text-xs" onClick={() => setShowNew(true)}><Plus className="w-3 h-3" /> Créer</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="divide-y divide-border/30">
            {factures.map(f => (
              <div key={f.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-muted-foreground">{f.numero}</span>
                    <span className="text-xs font-semibold">{f.client_nom}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[f.statut] || "bg-secondary"}`}>
                      {f.statut}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.type?.replace(/_/g," ")} · Échéance {fmtDate(f.date_echeance)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-black">{fmtEur(f.montant_ttc)}</span>
                  <span className="text-[10px] text-muted-foreground">HT {fmtEur(f.montant_ht)}</span>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {f.client_email && f.statut === "brouillon" && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full px-2 gap-1" onClick={() => envoyerFacture(f)} disabled={sending === f.id}>
                      {sending === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Envoyer
                    </Button>
                  )}
                  {f.statut !== "payee" && (
                    <Button size="sm" className="h-7 text-[10px] rounded-full px-2 gap-1 bg-green-500 hover:bg-green-600" onClick={() => marquerPayee(f)}>
                      <CheckCircle2 className="w-3 h-3" /> Payée
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew && <NouvelleFactureModal contacts={contacts} onClose={() => setShowNew(false)} onCreated={f => setFactures(p => [f, ...p])} />}
    </div>
  );
}