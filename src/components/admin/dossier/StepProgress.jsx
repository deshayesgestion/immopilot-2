import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Candidatures", short: "Cand." },
  { id: 2, label: "Visites", short: "Visites" },
  { id: 3, label: "Documents", short: "Docs" },
  { id: 4, label: "Sélection IA", short: "IA" },
  { id: 5, label: "Validation", short: "Valid." },
  { id: 6, label: "Contrat", short: "Contrat" },
  { id: 7, label: "Loyer", short: "Loyer" },
  { id: 8, label: "EDL Entrée", short: "EDL +" },
  { id: 9, label: "Suivi", short: "Suivi" },
  { id: 10, label: "EDL Sortie", short: "EDL -" },
  { id: 11, label: "Clôture", short: "Fin" },
];

export { STEPS };

export default function StepProgress({ currentStep, completedSteps = [], onStepClick }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isLocked = step.id > currentStep && !isCompleted;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => !isLocked && onStepClick(step.id)}
                disabled={isLocked}
                className={`flex flex-col items-center gap-1.5 group ${isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isCompleted
                    ? "bg-foreground text-white"
                    : isCurrent
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap hidden sm:block ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {step.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`h-px w-6 sm:w-10 mx-1 transition-colors ${completedSteps.includes(step.id) ? "bg-foreground" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}