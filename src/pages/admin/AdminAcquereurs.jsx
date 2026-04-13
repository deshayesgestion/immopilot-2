import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, RefreshCw, Users, X, Loader2, Sparkles, CheckCircle2, Euro } from "lucide-react";

const STATUT_COLORS = {
  actif: "bg-green-100 text-green-700",
  en_attente: "bg-amber-100 text-amber-700",
  inactif: "bg-gray-100 text-gray-500",
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function AcquereurModal({ acquereur, onClose, onSave }) {
  const [form, setForm] = useState({
    nom: acquereur?.nom || "",
    email: acquereur?.email || "",
    telephone: acquereur?.telephone || "",
    budget_min: acquereur?.budget_min || "",
    budget_max: acquereur?.budget_max || "",
    surface_min: acquereur?.surface_min || "",
    nb_pieces_min: acquereur?.nb_pieces_min || "",
    localisations: acquereur?.localisations?.join(", ") || "",
    financement_valide: acquereur?.financement_valide || false,
    banque: acquereur?.banque || "",
    apport: acquereur?.apport || "",
    notes: acquereur?.notes || "",
    statut: acquereur?.statut || "actif",
    source: acquereur?.source || "site_web",
  });
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      budget_min: Number(form.budget_min),
      budget_max: Number(form.budget_max),
      surface_min: Number(form.surface_min),
      nb_pieces_min: Number(form.nb_pieces_min),
      localisations: form.localisations.split(",").map((s) => s.trim()).filter(Boolean),
      apport: Number(form.apport),
    };
    if (acquereur?.id) await base44.entities.Acquereur.update(acquereur.id, data);
    else await base44.entities.Acquereur.create(data);
    setSaving(false);
    onSave();
    onClose();
  };

  const scorerIA = async () => {
    setScoring(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert immobilier. Évalue la solvabilité et le sérieux de cet acquéreur sur 100.\nNom: ${form.nom}\nBudget: ${form.budget_min}€ - ${form.budget_max}€\nApport: ${form.apport}€\nFinancement validé: ${form.financement_valide ? "Oui" : "Non"}\nBanque: ${form.banque}\nNotes: ${form.notes}\nRéponds uniquement avec un score entre 0 et 100 (nombre entier seul).`,
    });
    const score = parseInt(res.trim());
    if (!isNaN(score) && acquereur?.id) {
      await base44.entities.Acquereur.update(acquereur.id, { score_ia: score });
    }
    setScoring(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold">{acquereur ? "Fiche acquéreur" : "Nouvel acquéreur"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom complet</label>
              <Input value={form.nom} onChange={(e) => set("nom", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Téléphone</label>
              <Input value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget min (€)</label>
              <Input type="number" value={form.budget_min} onChange={(e) => set("budget_min", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget max (€)</label>
              <Input type="number" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Surface min (m²)</label>
              <Input type="number" value={form.surface_min} onChange={(e) => set("surface_min", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pièces min</label>
              <Input type="number" value={form.nb_pieces_min} onChange={(e) => set("nb_pieces_min", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Localisations souhaitées (séparées par virgule)</label>
              <Input value={form.localisations} onChange={(e) => set("localisations", e.target.value)} placeholder="Paris 15, Boulogne, Issy..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Apport (€)</label>
              <Input type="number" value={form.apport} onChange={(e) => set("apport", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Banque</label>
              <Input value={form.banque} onChange={(e) => set("banque", e.target.value)} />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <input type="checkbox" id="fin" checked={form.financement_valide} onChange={(e) => set("financement_valide", e.target.checked)} className="w-4 h-4" />
              <label htmlFor="fin" className="text-sm font-medium cursor-pointer">Financement validé (accord de principe)</label>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Statut</label>
              <select value={form.statut} onChange={(e) => set("statut", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="actif">Actif</option>
                <option value="en_attente">En attente</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Source</label>
              <select value={form.source} onChange={(e) => set("source", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="site_web">Site web</option>
                <option value="telephone">Téléphone</option>
                <option value="recommandation">Recommandation</option>
                <option value="portail">Portail</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes internes</label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>
          </div>

          {acquereur && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Score IA : {acquereur.score_ia != null ? <strong>{acquereur.score_ia}/100</strong> : "Non calculé"}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={scorerIA} disabled={scoring}>
                {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {acquereur.score_ia != null ? "Recalculer" : "Scorer"}
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {acquereur ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAcquereurs() {
  const [acquereurs, setAcquereurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Acquereur.list("-created_date", 100);
    setAcquereurs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return acquereurs;
    const q = search.toLowerCase();
    return acquereurs.filter((a) =>
      [a.nom, a.email, a.telephone, ...(a.localisations || [])].some((v) => v?.toLowerCase().includes(q))
    );
  }, [acquereurs, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {(showForm || selected) && (
        <AcquereurModal
          acquereur={selected}
          onClose={() => { setShowForm(false); setSelected(null); }}
          onSave={load}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Acquéreurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Base d'acheteurs potentiels</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => { setSelected(null); setShowForm(true); }} className="rounded-full gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold">{acquereurs.filter((a) => a.statut === "actif").length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Actifs</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-green-600">{acquereurs.filter((a) => a.financement_valide).length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Financement validé</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-primary">{acquereurs.filter((a) => a.score_ia >= 70).length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Score IA ≥ 70</p>
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
          <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium">Aucun acquéreur</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={() => setSelected(a)}>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  {a.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.nom}</p>
                  <p className="text-xs text-muted-foreground">{a.email} · {(a.localisations || []).join(", ")}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {a.financement_valide && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Financement
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground font-medium">{fmt(a.budget_min)} – {fmt(a.budget_max)}</p>
                  {a.score_ia != null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.score_ia >= 70 ? "bg-green-100 text-green-700" : a.score_ia >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {a.score_ia}/100
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[a.statut] || ""}`}>
                    {a.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}