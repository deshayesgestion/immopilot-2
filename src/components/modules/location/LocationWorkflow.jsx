import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, ChevronRight, Loader2, Star, Euro, Home } from "lucide-react";
import DossierCreationModal from "./workflow/DossierCreationModal";
import DossierDetail from "./workflow/DossierDetail";

const STATUT_CFG = {
  ouvert:          { label: "Ouvert",           color: "bg-slate-500",   emoji: "📂" },
  en_selection:    { label: "En sélection",     color: "bg-blue-500",    emoji: "👥" },
  candidat_valide: { label: "Candidat validé",  color: "bg-indigo-500",  emoji: "✅" },
  bail_signe:      { label: "Bail signé",        color: "bg-purple-500",  emoji: "📝" },
  en_cours:        { label: "En cours",          color: "bg-emerald-500", emoji: "🏡" },
  termine:         { label: "Terminé",           color: "bg-gray-400",    emoji: "🏁" },
};

const STATUTS_ORDER = Object.keys(STATUT_CFG);

export default function LocationWorkflow({ biens, contacts }) {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatut, setFilterStatut] = useState("all");

  useEffect(() => {
    base44.entities.DossierLocatif.list("-created_date", 200).then(data => {
      setDossiers(data);
      setLoading(false);
    });
  }, []);

  // Stats par statut
  const stats = STATUTS_ORDER.map(s => ({
    ...STATUT_CFG[s],
    id: s,
    count: dossiers.filter(d => (d.statut_dossier || "ouvert") === s).length,
  }));

  const filtered = filterStatut === "all"
    ? dossiers
    : dossiers.filter(d => (d.statut_dossier || "ouvert") === filterStatut);

  const update = (updated) => {
    setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (selected?.id === updated.id) setSelected(updated);
  };

  return (
    <div className="space-y-4">
      {/* Kanban statuts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stats.map(s => (
          <button key={s.id} onClick={() => setFilterStatut(filterStatut === s.id ? "all" : s.id)}
            className={`text-center p-3 rounded-2xl border transition-all ${
              filterStatut === s.id ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "bg-white border-border/40 hover:border-primary/30"
            }`}>
            <span className="text-xl block mb-1">{s.emoji}</span>
            <span className="text-lg font-bold block">{s.count}</span>
            <span className="text-[9px] text-muted-foreground leading-tight block">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} dossier{filtered.length > 1 ? "s" : ""}
          {filterStatut !== "all" && ` · ${STATUT_CFG[filterStatut]?.label}`}
        </p>
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
            <Plus className="w-3.5 h-3.5" /> Créer le premier dossier
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const statut = STATUT_CFG[d.statut_dossier || "ouvert"] || STATUT_CFG.ouvert;
            return (
              <div key={d.id}
                className="bg-white rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all">
                {/* Ligne principale — clic = ouvre détail */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setSelected(d)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{d.locataire_nom || "Sans nom"}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${statut.color}`}>
                        {statut.emoji} {statut.label}
                      </span>
                      {d.scoring_ia > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                          d.scoring_ia >= 70 ? "bg-green-100 text-green-700" : d.scoring_ia >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>
                          <Star className="w-2.5 h-2.5" />{d.scoring_ia}/100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      {d.bien_titre && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{d.bien_titre}</span>}
                      {d.loyer_mensuel > 0 && <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{d.loyer_mensuel?.toLocaleString("fr-FR")} €/mois</span>}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                </div>

                {/* Quick actions inline — visibles sans clic */}
                <div className="flex gap-1.5 px-4 pb-3 flex-wrap" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelected(d)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-all">
                    👁 Ouvrir
                  </button>
                  {d.statut_dossier === "ouvert" || d.statut_dossier === "en_selection" ? (
                    <button onClick={() => { setSelected(d); }}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold hover:bg-blue-500 hover:text-white transition-all">
                      👤 Candidats
                    </button>
                  ) : null}
                  {d.statut_dossier === "candidat_valide" ? (
                    <button onClick={() => setSelected(d)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold hover:bg-purple-500 hover:text-white transition-all">
                      📝 Bail
                    </button>
                  ) : null}
                  {(d.statut_dossier === "bail_signe" || d.statut_dossier === "en_cours") && (
                    <button onClick={() => setSelected(d)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-500 hover:text-white transition-all">
                      🔑 EDL
                    </button>
                  )}
                  {d.locataire_email && (
                    <a href={`mailto:${d.locataire_email}`}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 font-semibold hover:bg-slate-500 hover:text-white transition-all">
                      ✉️ Email
                    </a>
                  )}
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