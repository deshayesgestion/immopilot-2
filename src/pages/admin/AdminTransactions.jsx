import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, ArrowRight, Home, Loader2, X } from "lucide-react";

const STEPS = ["prospection", "visites", "offre", "verification", "compromis", "notaire", "vendu"];
const STEP_LABELS = {
  prospection: "Prospection",
  visites: "Visites",
  offre: "Offre",
  verification: "Vérification",
  compromis: "Compromis",
  notaire: "Notaire",
  vendu: "Vendu",
  annule: "Annulé",
};
const STEP_COLORS = {
  prospection: "bg-gray-100 text-gray-600",
  visites: "bg-blue-100 text-blue-700",
  offre: "bg-amber-100 text-amber-700",
  verification: "bg-purple-100 text-purple-700",
  compromis: "bg-orange-100 text-orange-700",
  notaire: "bg-indigo-100 text-indigo-700",
  vendu: "bg-green-100 text-green-700",
  annule: "bg-red-100 text-red-700",
};

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function NewTransactionModal({ onClose, onSave }) {
  const [biens, setBiens] = useState([]);
  const [acquereurs, setAcquereurs] = useState([]);
  const [form, setForm] = useState({ property_id: "", acquereur_id: "", agent_nom: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Property.filter({ transaction: "vente" }),
      base44.entities.Acquereur.list("-created_date", 50),
    ]).then(([b, a]) => { setBiens(b); setAcquereurs(a); });
  }, []);

  const selectedBien = biens.find((b) => b.id === form.property_id);
  const selectedAcquereur = acquereurs.find((a) => a.id === form.acquereur_id);

  const handleSave = async () => {
    if (!form.property_id || !form.acquereur_id) return;
    setSaving(true);
    await base44.entities.TransactionVente.create({
      property_id: form.property_id,
      property_title: selectedBien?.title || "",
      property_address: selectedBien?.address || "",
      prix_affiche: selectedBien?.price || 0,
      acquereur_id: form.acquereur_id,
      acquereur_nom: selectedAcquereur?.nom || "",
      acquereur_email: selectedAcquereur?.email || "",
      agent_nom: form.agent_nom,
      notes: form.notes,
      statut: "prospection",
      current_step: 1,
      reference: `VENTE-${Date.now()}`,
      historique: [{ id: Date.now(), content: "Transaction créée.", date: new Date().toISOString() }],
    });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold">Nouvelle transaction</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bien à vendre</label>
            <select value={form.property_id} onChange={(e) => setForm((p) => ({ ...p, property_id: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Sélectionner un bien</option>
              {biens.map((b) => <option key={b.id} value={b.id}>{b.title} — {fmt(b.price)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Acquéreur</label>
            <select value={form.acquereur_id} onChange={(e) => setForm((p) => ({ ...p, acquereur_id: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Sélectionner un acquéreur</option>
              {acquereurs.map((a) => <option key={a.id} value={a.id}>{a.nom} — {a.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agent responsable</label>
            <Input value={form.agent_nom} onChange={(e) => setForm((p) => ({ ...p, agent_nom: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full" onClick={handleSave} disabled={saving || !form.property_id || !form.acquereur_id}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.TransactionVente.list("-created_date", 100).then(setTransactions).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((t) =>
      [t.property_title, t.acquereur_nom, t.reference].some((v) => v?.toLowerCase().includes(q))
    );
  }, [transactions, search]);

  const stats = {
    total: transactions.filter((t) => t.statut !== "annule").length,
    enCours: transactions.filter((t) => !["vendu", "annule"].includes(t.statut)).length,
    vendus: transactions.filter((t) => t.statut === "vendu").length,
    ca: transactions.filter((t) => t.statut === "vendu").reduce((s, t) => s + (t.prix_vente_final || 0), 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showNew && <NewTransactionModal onClose={() => setShowNew(false)} onSave={load} />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline de vente immobilière</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setShowNew(true)} className="rounded-full gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Nouvelle transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold text-amber-600">{stats.enCours}</p>
          <p className="text-sm text-muted-foreground mt-0.5">En cours</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-3xl font-bold text-green-600">{stats.vendus}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Vendus</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-primary">{fmt(stats.ca)}</p>
          <p className="text-sm text-muted-foreground mt-0.5">CA réalisé</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-sm text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-16">
          <Home className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium">Aucune transaction</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b">
            {["Bien", "Acquéreur", "Réf.", "Statut", ""].map((h, i) => (
              <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-border/30">
            {filtered.map((t) => {
              const stepIdx = STEPS.indexOf(t.statut);
              const progress = stepIdx >= 0 ? Math.round(((stepIdx + 1) / STEPS.length) * 100) : 0;
              return (
                <div key={t.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.property_title || "—"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-20 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">{fmt(t.prix_affiche)}</span>
                    </div>
                  </div>
                  <p className="text-sm truncate">{t.acquereur_nom || "—"}</p>
                  <p className="text-xs text-muted-foreground">{t.reference || "—"}</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${STEP_COLORS[t.statut] || ""}`}>
                    {STEP_LABELS[t.statut] || t.statut}
                  </span>
                  <Link to={`/admin/vente/transactions/${t.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                    Voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t bg-secondary/20">
            <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}