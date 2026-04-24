import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, ChevronRight, Loader2, Star, CheckCircle2 } from "lucide-react";
import DossierCreationModal from "./workflow/DossierCreationModal";
import DossierDetail from "./workflow/DossierDetail";

const ETAPES = [
  { id: "candidat",   label: "Candidat",      emoji: "👤", color: "bg-slate-500" },
  { id: "documents",  label: "Documents",     emoji: "📂", color: "bg-blue-500" },
  { id: "validation", label: "Validation IA", emoji: "✅", color: "bg-amber-500" },
  { id: "rdv_visite", label: "RDV Visite",    emoji: "📅", color: "bg-indigo-500" },
  { id: "visite",     label: "Visite faite",  emoji: "🏠", color: "bg-cyan-500" },
  { id: "signature",  label: "Signature",     emoji: "📝", color: "bg-purple-500" },
  { id: "edle",       label: "EDL Entrée",    emoji: "🔑", color: "bg-teal-500" },
  { id: "vie_bail",   label: "Vie du bail",   emoji: "🏡", color: "bg-emerald-500" },
  { id: "edls",       label: "EDL Sortie",    emoji: "📦", color: "bg-orange-500" },
  { id: "cloture",    label: "Clôture",       emoji: "🏁", color: "bg-gray-500" },
];
const ETAPE_IDX = Object.fromEntries(ETAPES.map((e, i) => [e.id, i]));

export default function LocationWorkflow({ biens, contacts }) {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterEtape, setFilterEtape] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  useEffect(() => {
    base44.entities.DossierLocatif.list("-created_date", 200).then(data => {
      setDossiers(data);
      setLoading(false);
    });
  }, []);

  const stats = ETAPES.map(e => ({ ...e, count: dossiers.filter(d => d.etape === e.id).length }));

  const filtered = dossiers.filter(d => {
    if (filterEtape !== "all" && d.etape !== filterEtape) return false;
    if (filterStatut === "actifs" && d.statut_dossier === "termine") return false;
    if (filterStatut === "termines" && d.statut_dossier !== "termine") return false;
    return true;
  });

  const update = (updated) => {
    setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (selected?.id === updated.id) setSelected(updated);
  };

  return (
    <div className="space-y-4">
      {/* Pipeline étapes cliquables */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {stats.map(e => (
          <button key={e.id} onClick={() => setFilterEtape(filterEtape === e.id ? "all" : e.id)}
            className={`text-center p-2 rounded-xl border transition-all ${
              filterEtape === e.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-white border-border/40 hover:border-primary/30"
            }`}>
            <span className="text-base block">{e.emoji}</span>
            <span className="text-sm font-bold block">{e.count}</span>
            <span className="text-[8px] text-muted-foreground leading-tight block truncate">{e.label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</p>
          <div className="flex gap-1 bg-white border border-border/50 rounded-xl p-0.5">
            {[
              { id: "all", label: "Tous" },
              { id: "actifs", label: "Actifs" },
              { id: "termines", label: "Terminés" },
            ].map(f => (
              <button key={f.id} onClick={() => setFilterStatut(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterStatut === f.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}>{f.label}</button>
            ))}
          </div>
        </div>
        <Button className="rounded-full gap-1.5 h-9 text-sm" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouveau dossier
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun dossier locatif</p>
          <Button className="rounded-full gap-2 mt-4 h-9 text-sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3.5 h-3.5" /> Créer un dossier
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const etapeCfg = ETAPES.find(e => e.id === d.etape) || ETAPES[0];
            const idx = ETAPE_IDX[d.etape] ?? 0;
            const progress = Math.round((idx / (ETAPES.length - 1)) * 100);
            const isTermine = d.statut_dossier === "termine";
            return (
              <div key={d.id} onClick={() => setSelected(d)}
                className={`bg-white rounded-2xl border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${
                  isTermine ? "border-border/30 opacity-70" : "border-border/50"
                }`}>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{d.locataire_nom}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${etapeCfg.color}`}>
                        {etapeCfg.emoji} {etapeCfg.label}
                      </span>
                      {d.validation_statut === "valide" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Validé
                        </span>
                      )}
                      {d.validation_statut === "refuse" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Refusé</span>
                      )}
                      {isTermine && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Terminé</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.bien_titre || "—"} · {d.loyer_mensuel?.toLocaleString("fr-FR")} €/mois
                      {d.reference && <span className="ml-2 opacity-50">· {d.reference}</span>}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-secondary/40 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {d.scoring_ia > 0 && (
                      <div className={`text-xs font-bold ${d.scoring_ia >= 70 ? "text-green-600" : d.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        <Star className="w-3 h-3 inline mr-0.5" />{d.scoring_ia}/100
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <DossierCreationModal
          biens={biens} contacts={contacts}
          onClose={() => setShowNew(false)}
          onCreated={d => { setDossiers(p => [d, ...p]); setSelected(d); setShowNew(false); }}
        />
      )}
      {selected && (
        <DossierDetail
          dossier={selected}
          onClose={() => setSelected(null)}
          onUpdate={update}
        />
      )}
    </div>
  );
}