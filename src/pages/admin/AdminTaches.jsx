import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Star, Circle, CheckCircle2, Plus, Loader2,
  Sparkles, X, Clock, User, Tag, ChevronDown, ChevronUp,
  Flame, ArrowUpCircle, Minus, Trash2, RotateCcw, Brain,
  ListTodo, Filter
} from "lucide-react";

const PRIORITE = {
  urgent:     { label: "Urgent",     icon: Flame,           color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    badge: "bg-red-100 text-red-700",    dot: "bg-red-500" },
  important:  { label: "Important",  icon: ArrowUpCircle,   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  secondaire: { label: "Secondaire", icon: Minus,           color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200",  badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

const STATUT = {
  a_faire:  { label: "À faire",   color: "text-blue-600",  badge: "bg-blue-100 text-blue-700" },
  en_cours: { label: "En cours",  color: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  terminee: { label: "Terminée",  color: "text-green-600", badge: "bg-green-100 text-green-700" },
  annulee:  { label: "Annulée",   color: "text-gray-400",  badge: "bg-gray-100 text-gray-500" },
};

const CATEGORIES = ["location", "vente", "comptabilite", "admin", "client", "autre"];

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : null;
const isOverdue = (t) => t.date_echeance && new Date(t.date_echeance) < new Date() && t.statut !== "terminee";

// ── Task form modal ───────────────────────────────────────────────────────
function TacheModal({ tache, onClose, onSaved, currentUser }) {
  const [form, setForm] = useState(tache || {
    titre: "", description: "", priorite: "important", statut: "a_faire",
    categorie: "autre", assignee_email: currentUser?.email || "",
    assignee_nom: currentUser?.full_name || "", date_echeance: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.titre.trim()) return;
    setSaving(true);
    if (tache?.id) {
      await base44.entities.Tache.update(tache.id, form);
    } else {
      await base44.entities.Tache.create(form);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
          <p className="font-semibold text-sm">{tache?.id ? "Modifier la tâche" : "Nouvelle tâche"}</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Titre *</label>
            <Input value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
              placeholder="Décrivez la tâche…" className="h-9 rounded-xl text-sm" autoFocus />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} className="rounded-xl text-sm resize-none" placeholder="Détails optionnels…" />
          </div>

          {/* Priorité buttons */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Priorité</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITE).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} onClick={() => setForm(p => ({ ...p, priorite: k }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                      form.priorite === k ? `${v.bg} ${v.border} ${v.color}` : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}>
                    <Icon className="w-3 h-3" />{v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Catégorie</label>
              <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
              <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Échéance</label>
              <Input type="date" value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))}
                className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assigné à</label>
              <Input value={form.assignee_nom} onChange={e => setForm(p => ({ ...p, assignee_nom: e.target.value }))}
                placeholder="Nom agent…" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 h-9 text-sm" onClick={save} disabled={saving || !form.titre.trim()}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : tache?.id ? "Sauvegarder" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── AI Suggestion panel ───────────────────────────────────────────────────
function AISuggestions({ taches, onReprioritize }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyse = async () => {
    setLoading(true);
    const tachesList = taches
      .filter(t => t.statut !== "terminee" && t.statut !== "annulee")
      .slice(0, 20)
      .map(t => ({
        id: t.id,
        titre: t.titre,
        priorite: t.priorite,
        categorie: t.categorie,
        date_echeance: t.date_echeance,
        statut: t.statut,
      }));

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un assistant de gestion immobilière. Analyse ces tâches et suggère une priorisation intelligente.

Tâches actuelles (JSON):
${JSON.stringify(tachesList, null, 2)}

Pour chaque tâche, évalue sa priorité réelle en tenant compte de:
- L'urgence (échéance proche, impact client immédiat)
- L'importance stratégique (impact business, répercussions)
- Le contexte immobilier (une fuite d'eau = URGENT, un rapport mensuel = secondaire)

Retourne un objet JSON avec:
- "top3": tableau des 3 tâches les plus prioritaires (id, titre, raison en 1 phrase)
- "suggestions": liste des tâches avec id, priorite_suggeree (urgent/important/secondaire), score (0-100), raison (1 phrase courte)
- "resume": un paragraphe de conseil global (max 2 phrases)`,
      response_json_schema: {
        type: "object",
        properties: {
          top3: { type: "array", items: { type: "object", properties: { id: { type: "string" }, titre: { type: "string" }, raison: { type: "string" } } } },
          suggestions: { type: "array", items: { type: "object", properties: { id: { type: "string" }, priorite_suggeree: { type: "string" }, score: { type: "number" }, raison: { type: "string" } } } },
          resume: { type: "string" }
        }
      }
    });
    setSuggestions(res);
    setLoading(false);
  };

  const applyAll = async () => {
    if (!suggestions?.suggestions) return;
    setLoading(true);
    for (const s of suggestions.suggestions) {
      if (s.priorite_suggeree && s.id) {
        await base44.entities.Tache.update(s.id, {
          priorite: s.priorite_suggeree,
          score_ia: s.score,
          raison_ia: s.raison,
        });
      }
    }
    setLoading(false);
    onReprioritize();
    setSuggestions(null);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-accent to-primary/5 rounded-2xl border border-primary/15 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Priorisation IA</p>
            <p className="text-xs text-muted-foreground">Analyse intelligente de vos tâches actives</p>
          </div>
        </div>
        <Button size="sm" className="rounded-full h-9 text-xs gap-1.5" onClick={analyse} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /> Analyser</>}
        </Button>
      </div>

      {suggestions && (
        <>
          {/* Global advice */}
          {suggestions.resume && (
            <div className="bg-white/80 rounded-xl p-3.5 text-sm text-foreground/80 italic border border-primary/10">
              {suggestions.resume}
            </div>
          )}

          {/* Top 3 */}
          {suggestions.top3?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> À traiter en priorité absolue
              </p>
              {suggestions.top3.map((t, i) => (
                <div key={t.id} className="flex items-start gap-3 bg-white/70 rounded-xl px-3.5 py-2.5 border border-primary/10">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{t.titre}</p>
                    <p className="text-xs text-muted-foreground">{t.raison}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions list */}
          {suggestions.suggestions?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Suggestions de repriorisation</p>
              {suggestions.suggestions.filter(s => {
                const t = taches.find(t => t.id === s.id);
                return t && t.priorite !== s.priorite_suggeree;
              }).slice(0, 6).map(s => {
                const tache = taches.find(t => t.id === s.id);
                if (!tache) return null;
                const from = PRIORITE[tache.priorite];
                const to = PRIORITE[s.priorite_suggeree];
                if (!from || !to) return null;
                return (
                  <div key={s.id} className="flex items-center gap-2 bg-white/60 rounded-xl px-3.5 py-2 text-xs">
                    <span className={`font-medium px-1.5 py-0.5 rounded-full ${from.badge}`}>{from.label}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className={`font-medium px-1.5 py-0.5 rounded-full ${to.badge}`}>{to.label}</span>
                    <span className="flex-1 text-muted-foreground truncate ml-1">{tache.titre}</span>
                    <span className="text-muted-foreground/60">{s.score}pts</span>
                  </div>
                );
              })}
            </div>
          )}

          <Button size="sm" className="w-full rounded-full h-9 text-xs gap-1.5 bg-primary" onClick={applyAll} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Appliquer les suggestions IA</>}
          </Button>
        </>
      )}
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────
function TacheCard({ tache, onEdit, onDelete, onToggleStatut }) {
  const p = PRIORITE[tache.priorite] || PRIORITE.important;
  const s = STATUT[tache.statut] || STATUT.a_faire;
  const Icon = p.icon;
  const overdue = isOverdue(tache);

  return (
    <div className={`bg-white rounded-xl border ${overdue ? "border-red-300" : "border-border/50"} px-4 py-3.5 hover:shadow-sm transition-all group`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleStatut(tache)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            tache.statut === "terminee" ? "bg-green-500 border-green-500" : "border-border hover:border-primary"
          }`}>
          {tache.statut === "terminee" && <CheckCircle2 className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={`text-sm font-medium flex-1 min-w-0 ${tache.statut === "terminee" ? "line-through text-muted-foreground" : ""}`}>
              {tache.titre}
            </p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${p.badge}`}>
              <Icon className="w-2.5 h-2.5" />{p.label}
            </span>
          </div>

          {tache.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{tache.description}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {tache.categorie && (
              <span className="text-[10px] bg-secondary/60 rounded-full px-2 py-0.5 text-muted-foreground">{tache.categorie}</span>
            )}
            {tache.assignee_nom && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <User className="w-2.5 h-2.5" />{tache.assignee_nom}
              </span>
            )}
            {tache.date_echeance && (
              <span className={`text-[10px] flex items-center gap-1 ${overdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                <Clock className="w-2.5 h-2.5" />{overdue ? "En retard · " : ""}{fmt(tache.date_echeance)}
              </span>
            )}
            {tache.score_ia !== undefined && tache.score_ia !== null && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Brain className="w-2.5 h-2.5" />Score IA: {tache.score_ia}
              </span>
            )}
          </div>

          {tache.raison_ia && (
            <p className="text-[10px] text-primary/70 mt-1 italic">{tache.raison_ia}</p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(tache)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <Tag className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(tache.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AdminTaches() {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTache, setEditTache] = useState(null);
  const [filterStatut, setFilterStatut] = useState("actif"); // actif | terminee | all
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("kanban"); // kanban | liste

  const load = async () => {
    const [ts, me] = await Promise.all([
      base44.entities.Tache.list("-created_date", 200),
      base44.auth.me(),
    ]);
    setTaches(ts);
    setCurrentUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => taches.filter(t => {
    if (filterStatut === "actif" && (t.statut === "terminee" || t.statut === "annulee")) return false;
    if (filterStatut === "terminee" && t.statut !== "terminee") return false;
    if (filterCategorie !== "all" && t.categorie !== filterCategorie) return false;
    if (search && !t.titre?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [taches, filterStatut, filterCategorie, search]);

  const byPriorite = useMemo(() => ({
    urgent:     filtered.filter(t => t.priorite === "urgent"),
    important:  filtered.filter(t => t.priorite === "important"),
    secondaire: filtered.filter(t => t.priorite === "secondaire"),
  }), [filtered]);

  const handleToggle = async (tache) => {
    const newStatut = tache.statut === "terminee" ? "a_faire" : "terminee";
    await base44.entities.Tache.update(tache.id, { statut: newStatut });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Tache.delete(id);
    load();
  };

  const stats = useMemo(() => ({
    urgent:    taches.filter(t => t.priorite === "urgent" && t.statut !== "terminee").length,
    important: taches.filter(t => t.priorite === "important" && t.statut !== "terminee").length,
    overdue:   taches.filter(t => isOverdue(t)).length,
    done:      taches.filter(t => t.statut === "terminee").length,
  }), [taches]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-primary" /> Gestion des tâches
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Priorisation intelligente par IA</p>
        </div>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => { setEditTache(null); setShowModal(true); }}>
          <Plus className="w-3.5 h-3.5" /> Nouvelle tâche
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Urgentes", value: stats.urgent, Icon: Flame, color: "text-red-600", bg: "bg-red-50" },
          { label: "Importantes", value: stats.important, Icon: ArrowUpCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "En retard", value: stats.overdue, Icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Terminées", value: stats.done, Icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
              <s.Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — filters + kanban */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 rounded-full text-sm bg-secondary/40 border-0" />
            </div>
            <div className="flex gap-1">
              {[["actif", "Actives"], ["terminee", "Terminées"], ["all", "Toutes"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilterStatut(v)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    filterStatut === v ? "bg-primary text-white" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}>{l}</button>
              ))}
            </div>
            <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}
              className="h-8 rounded-full border border-input bg-white px-3 text-xs">
              <option value="all">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-5">
              {Object.entries(byPriorite).map(([priorite, items]) => {
                const config = PRIORITE[priorite];
                const Icon = config.icon;
                return (
                  <div key={priorite}>
                    <div className={`flex items-center gap-2 mb-2.5 px-1`}>
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      <p className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>{config.label}</p>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>
                    {items.length === 0 ? (
                      <div className={`rounded-xl border-2 border-dashed ${config.border} p-4 text-center`}>
                        <p className="text-xs text-muted-foreground">Aucune tâche {config.label.toLowerCase()}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map(t => (
                          <TacheCard key={t.id} tache={t}
                            onEdit={t => { setEditTache(t); setShowModal(true); }}
                            onDelete={handleDelete}
                            onToggleStatut={handleToggle}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && !loading && (
                <div className="text-center py-16">
                  <ListTodo className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune tâche trouvée</p>
                  <Button size="sm" variant="outline" className="rounded-full mt-3 text-xs"
                    onClick={() => { setEditTache(null); setShowModal(true); }}>
                    Créer une tâche
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — AI panel */}
        <div>
          <AISuggestions taches={taches} onReprioritize={load} />
        </div>
      </div>

      {showModal && (
        <TacheModal
          tache={editTache}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}