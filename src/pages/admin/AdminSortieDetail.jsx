import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import Step1Preavis from "../../components/admin/sortie/Step1Preavis";
import Step2EDL from "../../components/admin/sortie/Step2EDL";
import Step3Comparaison from "../../components/admin/sortie/Step3Comparaison";
import Step4Caution from "../../components/admin/sortie/Step4Caution";
import Step5Cloture from "../../components/admin/sortie/Step5Cloture";

const STEPS = [
  { id: 1, label: "Préavis & départ", statuts: ["ouvert"] },
  { id: 2, label: "État des lieux", statuts: ["edl_planifie"] },
  { id: 3, label: "Comparaison EDL", statuts: ["edl_realise"] },
  { id: 4, label: "Caution", statuts: ["restitution_caution"] },
  { id: 5, label: "Clôture", statuts: ["cloture"] },
];

function getStepIndex(statut) {
  if (statut === "ouvert") return 0;
  if (statut === "edl_planifie") return 1;
  if (statut === "edl_realise") return 2;
  if (statut === "restitution_caution") return 3;
  if (statut === "cloture") return 4;
  return 0;
}

export default function AdminSortieDetail() {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  const load = async () => {
    const res = await base44.entities.DossierSortie.filter({ id });
    const d = res[0] || null;
    setDossier(d);
    if (d) setActiveStep(getStepIndex(d.statut));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (!dossier) return (
    <div className="text-center py-24">
      <p className="text-sm text-muted-foreground">Dossier introuvable.</p>
      <Link to="/admin/sortie" className="text-primary text-sm hover:underline mt-2 inline-block">← Retour</Link>
    </div>
  );

  const currentStepIdx = getStepIndex(dossier.statut);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/sortie" className="mt-1 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">Sortie — {dossier.property_title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dossier.locataire?.nom} · Réf. {dossier.reference}
          </p>
        </div>
        {dossier.statut === "cloture" && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">Clôturé</span>
        )}
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const isDone = i < currentStepIdx;
            const isCurrent = i === currentStepIdx;
            const isClickable = i <= currentStepIdx;
            return (
              <div key={step.id} className="flex items-center gap-1 flex-1 min-w-0">
                <button
                  onClick={() => isClickable && setActiveStep(i)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all w-full ${
                    activeStep === i
                      ? "bg-primary text-white shadow-sm"
                      : isDone
                      ? "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                      : isCurrent
                      ? "bg-primary/10 text-primary cursor-pointer"
                      : "bg-secondary/30 text-muted-foreground cursor-default opacity-50"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      activeStep === i ? "border-white text-white" : isCurrent ? "border-primary text-primary" : "border-muted-foreground/30"
                    }`}>{step.id}</span>
                  )}
                  <span className="truncate hidden sm:block">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      {activeStep === 0 && <Step1Preavis dossier={dossier} onUpdate={load} onNext={() => setActiveStep(1)} />}
      {activeStep === 1 && <Step2EDL dossier={dossier} onUpdate={load} onNext={() => setActiveStep(2)} onPrev={() => setActiveStep(0)} />}
      {activeStep === 2 && <Step3Comparaison dossier={dossier} onUpdate={load} onNext={() => setActiveStep(3)} onPrev={() => setActiveStep(1)} />}
      {activeStep === 3 && <Step4Caution dossier={dossier} onUpdate={load} onNext={() => setActiveStep(4)} onPrev={() => setActiveStep(2)} />}
      {activeStep === 4 && <Step5Cloture dossier={dossier} onUpdate={load} onPrev={() => setActiveStep(3)} />}
    </div>
  );
}