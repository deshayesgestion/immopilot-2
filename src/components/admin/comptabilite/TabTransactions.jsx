import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, X } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const TYPE_LABELS = { loyer: "Loyer", commission_vente: "Commission vente", honoraires: "Honoraires", depense: "Dépense", remboursement: "Remboursement", autre: "Autre" };
const STATUT_COLORS = { paye: "bg-green-100 text-green-700", en_attente: "bg-amber-100 text-amber-700", en_retard: "bg-red-100 text-red-700", annule: "bg-gray-100 text-gray-500" };
const STATUT_LABELS = { paye: "Payé", en_attente: "En attente", en_retard: "En retard", annule: "Annulé" };

function TransactionForm({ tx, onClose, onSave }) {
  const [form, setForm] = useState({
    type: tx?.type || "loyer",
    statut: tx?.statut || "en_attente",
    montant: tx?.montant || "",
    tiers_nom: tx?.tiers_nom || "",
    tiers_email: tx?.tiers_email || "",
    bien_titre: tx?.bien_titre || "",
    date_echeance: tx?.date_echeance || "",
    date_paiement: tx?.date_paiement || "",
    notes: tx?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, montant: Number(form.montant) };
    if (!data.reference) data.reference = `TX-${Date.now()}`;
    if (tx?.id) await base44.entities.Transaction.update(tx.id, data);
    else await base44.entities.Transaction.create(data);
    setSaving(false); onSave(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-white">
          <h2 className="text-base font-bold">{tx ? "Modifier" : "Nouvelle transaction"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label>
            <Input type="number" value={form.montant} onChange={e => set("montant", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
            <select value={form.statut} onChange={e => set("statut", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tiers (nom)</label>
            <Input value={form.tiers_nom} onChange={e => set("tiers_nom", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email tiers</label>
            <Input value={form.tiers_email} onChange={e => set("tiers_email", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Bien</label>
            <Input value={form.bien_titre} onChange={e => set("bien_titre", e.target.value)} placeholder="Titre du bien..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date échéance</label>
            <Input type="date" value={form.date_echeance} onChange={e => set("date_echeance", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date paiement</label>
            <Input type="date" value={form.date_paiement} onChange={e => set("date_paiement", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <Input value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/50">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TabTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Transaction.list("-date_echeance", 200);
    setTransactions(data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || [t.tiers_nom, t.bien_titre, t.reference].some(v => v?.toLowerCase().includes(q));
      const matchType = !filterType || t.type === filterType;
      const matchStatut = !filterStatut || t.statut === filterStatut;
      return matchSearch && matchType && matchStatut;
    });
  }, [transactions, search, filterType, filterStatut]);

  const total = filtered.reduce((s, t) => t.statut !== "annule" ? s + (t.montant || 0) : s, 0);

  return (
    <div className="space-y-4">
      {showForm && <TransactionForm tx={editTx} onClose={() => { setShowForm(false); setEditTx(null); }} onSave={load} />}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-9 rounded-full border border-input bg-white px-3 text-sm">
          <option value="">Tous types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="h-9 rounded-full border border-input bg-white px-3 text-sm">
          <option value="">Tous statuts</option>
          {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => { setEditTx(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <p className="text-center py-12 text-sm text-muted-foreground">Aucune transaction</p>
            ) : filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{t.tiers_nom || "—"}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{TYPE_LABELS[t.type]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.bien_titre} {t.date_echeance ? `· Échéance ${fmtDate(t.date_echeance)}` : ""}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0">{fmt(t.montant)}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUT_COLORS[t.statut]}`}>{STATUT_LABELS[t.statut]}</span>
                <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full flex-shrink-0" onClick={() => { setEditTx(t); setShowForm(true); }}>Modifier</Button>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border/30 bg-secondary/20 flex justify-between">
            <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</p>
            <p className="text-xs font-semibold">Total : {fmt(total)}</p>
          </div>
        </div>
      )}
    </div>
  );
}