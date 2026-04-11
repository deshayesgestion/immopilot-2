import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, Loader2, ArrowRight, Home, Plus, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  "Candidatures",
  "Validation",
  "Bail",
  "Paiement",
  "État des lieux",
  "Entrée locataire",
];

const STATUT_CONFIG = {
  en_cours: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  en_attente: { label: "En attente", color: "bg-gray-100 text-gray-500" },
  termine: { label: "Terminé", color: "bg-green-100 text-green-700" },
  archive: { label: "Archivé", color: "bg-gray-100 text-gray-400" },
};

function StepPipeline({ currentStep, stepsCompleted = [] }) {
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const done = stepsCompleted.includes(stepNum) || currentStep > stepNum;
        const active = currentStep === stepNum;
        return (
          <div key={step} className="flex items-center gap-0.5">
            <div
              title={step}
              className={`h-1.5 rounded-full transition-all ${
                done
                  ? "bg-green-500"
                  : active
                  ? "bg-primary"
                  : "bg-border"
              }`}
              style={{ width: 28 }}
            />
          </div>
        );
      })}
      <span className="ml-2 text-xs text-muted-foreground">
        {STEPS[Math.min((currentStep || 1) - 1, STEPS.length - 1)]}
      </span>
    </div>
  );
}

function DossierCard({ dossier }) {
  const statut = STATUT_CONFIG[dossier.statut] || STATUT_CONFIG.en_cours;
  const progress = Math.round(((dossier.current_step || 1) - 1) / STEPS.length * 100);

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Home className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{dossier.property_title || "Bien sans titre"}</p>
            <p className="text-xs text-muted-foreground">{dossier.reference}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statut.color}`}>
          {statut.label}
        </span>
      </div>

      {/* Agent & loyer */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {dossier.agent_name && <span>👤 {dossier.agent_name}</span>}
        {dossier.loyer > 0 && <span>💶 {dossier.loyer}€/mois</span>}
      </div>

      {/* Pipeline */}
      <StepPipeline currentStep={dossier.current_step || 1} stepsCompleted={dossier.steps_completed || []} />

      {/* Progress & CTA */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">{progress}% complété</span>
        <Link
          to={`/admin/attribution/${dossier.id}`}
          className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Ouvrir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function KanbanColumn({ label, color, dossiers }) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${color}`}>
        <span className="text-xs font-semibold">{label}</span>
        <span className="ml-auto text-xs font-bold">{dossiers.length}</span>
      </div>
      <div className="space-y-3">
        {dossiers.map((d) => (
          <DossierCard key={d.id} dossier={d} />
        ))}
        {dossiers.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground/50 border-2 border-dashed border-border/30 rounded-2xl">
            Aucun dossier
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAttribution() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("pipeline"); // pipeline | list

  const load = () => {
    setLoading(true);
    base44.entities.DossierLocatif.list("-created_date", 100)
      .then(setDossiers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const grouped = {
    en_cours: dossiers.filter((d) => d.statut === "en_cours"),
    en_attente: dossiers.filter((d) => d.statut === "en_attente"),
    termine: dossiers.filter((d) => d.statut === "termine"),
    archive: dossiers.filter((d) => d.statut === "archive"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attribution</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline de sélection des locataires</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
            {[{ id: "pipeline", label: "Pipeline" }, { id: "list", label: "Liste" }].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v.id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Steps legend */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-border/50 shadow-sm px-5 py-3">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-1.5 rounded-full bg-primary/30" />
            <span>{idx + 1}. {step}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : dossiers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium">Aucun dossier d'attribution</p>
          <p className="text-xs text-muted-foreground mt-1">
            Créez une attribution depuis l'onglet <span className="font-medium">Biens</span>.
          </p>
        </div>
      ) : view === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn label="En cours" color="bg-amber-50 text-amber-700" dossiers={grouped.en_cours} />
          <KanbanColumn label="En attente" color="bg-gray-100 text-gray-600" dossiers={grouped.en_attente} />
          <KanbanColumn label="Terminé" color="bg-green-50 text-green-700" dossiers={grouped.termine} />
          <KanbanColumn label="Archivé" color="bg-gray-50 text-gray-400" dossiers={grouped.archive} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {dossiers.map((d) => {
              const statut = STATUT_CONFIG[d.statut] || STATUT_CONFIG.en_cours;
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.property_title || "Bien sans titre"}</p>
                    <StepPipeline currentStep={d.current_step || 1} stepsCompleted={d.steps_completed || []} />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statut.color}`}>
                    {statut.label}
                  </span>
                  <Link
                    to={`/admin/attribution/${d.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium flex-shrink-0"
                  >
                    Voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}