import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, X, Search, Upload, Sparkles } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const CATEGORIES = ["travaux", "maintenance", "frais_agence", "assurance", "impots", "publicite", "autre"];
const CAT_LABELS = { travaux: "Travaux", maintenance: "Maintenance", frais_agence: "Frais agence", assurance: "Assurance", impots: "Impôts/taxes", publicite: "Publicité", autre: "Autre" };
const CAT_COLORS = { travaux: "bg-orange-100 text-orange-700", maintenance: "bg-blue-100 text-blue-700", frais_agence: "bg-purple-100 text-purple-700", assurance: "bg-teal-100 text-teal-700", impots: "bg-red-100 text-red-700", publicite: "bg-pink-100 text-pink-700", autre: "bg-gray-100 text-gray-600" };

function DepenseForm({ depense, onClose, onSave }) {
  const [form, setForm] = useState({
    libelle: depense?.libelle || "",
    categorie: depense?.categorie || "autre",
    montant: depense?.montant || "",
    date: depense?.date || new Date().toISOString().substring(0, 10),
    fournisseur: depense?.fournisseur || "",
    bien_titre: depense?.bien_titre || "",
    notes: depense?.notes || "",
    statut: depense?.statut || "payee",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(depense?.facture_url || "");
  const [aiLoading, setAiLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setUploading(false);
  };

  const categoriserIA = async () => {
    if (!form.libelle) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Catégorise cette dépense immobilière: "${form.libelle}" ${form.fournisseur ? `(fournisseur: ${form.fournisseur})` : ""}.
Choisis parmi: travaux, maintenance, frais_agence, assurance, impots, publicite, autre.
Réponds uniquement avec la catégorie, rien d'autre.`
    });
    const cat = res?.trim().toLowerCase();
    if (CATEGORIES.includes(cat)) set("categorie", cat);
    setAiLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, montant: Number(form.montant), facture_url: fileUrl };
    if (depense?.id) await base44.entities.Depense.update(depense.id, data);
    else await base44.entities.Depense.create(data);
    setSaving(false); onSave(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-white">
          <h2 className="text-base font-bold">{depense ? "Modifier la dépense" : "Nouvelle dépense"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Libellé *</label>
            <Input value={form.libelle} onChange={e => set("libelle", e.target.value)} placeholder="Ex: Remplacement chaudière..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Catégorie</label>
                <button onClick={categoriserIA} className="text-xs text-primary flex items-center gap-1 hover:underline" disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} IA
                </button>
              </div>
              <select value={form.categorie} onChange={e => set("categorie", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Montant (€) *</label>
              <Input type="number" value={form.montant} onChange={e => set("montant", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
              <select value={form.statut} onChange={e => set("statut", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="payee">Payée</option>
                <option value="a_payer">À payer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fournisseur</label>
            <Input value={form.fournisseur} onChange={e => set("fournisseur", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bien associé</label>
            <Input value={form.bien_titre} onChange={e => set("bien_titre", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Facture (upload)</label>
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border/50 rounded-lg px-3 py-2 hover:bg-secondary/30 transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{uploading ? "Upload..." : fileUrl ? "Fichier joint ✓" : "Joindre une facture"}</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} disabled={uploading} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/50">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full gap-2" onClick={handleSave} disabled={saving || uploading}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TabDepenses() {
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDep, setEditDep] = useState(null);

  const load = async () => { setLoading(true); const d = await base44.entities.Depense.list("-date", 200); setDepenses(d); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return depenses.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || [d.libelle, d.fournisseur, d.bien_titre].some(v => v?.toLowerCase().includes(q));
      const matchCat = !filterCat || d.categorie === filterCat;
      return matchSearch && matchCat;
    });
  }, [depenses, search, filterCat]);

  const total = filtered.reduce((s, d) => s + (d.montant || 0), 0);
  const byCategory = useMemo(() => {
    const cat = {};
    depenses.forEach(d => { cat[d.categorie] = (cat[d.categorie] || 0) + (d.montant || 0); });
    return cat;
  }, [depenses]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {showForm && <DepenseForm depense={editDep} onClose={() => { setShowForm(false); setEditDep(null); }} onSave={load} />}

      {/* Stats par catégorie */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(byCategory).map(([cat, total]) => (
          <div key={cat} className={`px-3 py-1.5 rounded-full text-xs font-medium ${CAT_COLORS[cat] || CAT_COLORS.autre} cursor-pointer`} onClick={() => setFilterCat(filterCat === cat ? "" : cat)}>
            {CAT_LABELS[cat]} · {fmt(total)}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
        </div>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => { setEditDep(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground">Aucune dépense</p>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(d => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.libelle}</p>
                  <p className="text-xs text-muted-foreground">{d.fournisseur || "—"} · {d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "—"}</p>
                </div>
                {d.bien_titre && <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">{d.bien_titre}</p>}
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_COLORS[d.categorie] || CAT_COLORS.autre}`}>{CAT_LABELS[d.categorie]}</span>
                <p className="text-sm font-bold flex-shrink-0 text-red-600">-{fmt(d.montant)}</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full flex-shrink-0" onClick={() => { setEditDep(d); setShowForm(true); }}>Modifier</Button>
              </div>
            ))}
          </div>
        )}
        <div className="px-5 py-3 border-t border-border/30 bg-secondary/20 flex justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} dépense{filtered.length > 1 ? "s" : ""}</p>
          <p className="text-xs font-semibold text-red-600">Total : -{fmt(total)}</p>
        </div>
      </div>
    </div>
  );
}