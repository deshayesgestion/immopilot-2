import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getStepsForRole, ROLE_STEP_LABELS } from "@/lib/onboardingSteps";
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles,
  ArrowRight, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingChecklist({ user, progress, onProgressChange }) {
  const [expanded, setExpanded] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  const role = user?.role || "admin";
  const steps = getStepsForRole(role);
  const completedIds = progress?.steps_completed || [];
  const completedCount = completedIds.length;
  const totalCount = steps.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount >= totalCount;

  const toggleStep = async (stepId) => {
    const isCompleted = completedIds.includes(stepId);
    const newCompleted = isCompleted
      ? completedIds.filter(id => id !== stepId)
      : [...completedIds, stepId];

    const newCompleted_all = newCompleted.length >= totalCount;

    let updated;
    if (progress?.id) {
      updated = await base44.entities.OnboardingProgress.update(progress.id, {
        steps_completed: newCompleted,
        completed: newCompleted_all,
      });
    } else {
      updated = await base44.entities.OnboardingProgress.create({
        user_email: user.email,
        steps_completed: newCompleted,
        completed: newCompleted_all,
        dismissed: false,
      });
    }
    onProgressChange(updated);
  };

  const dismiss = async () => {
    setDismissing(true);
    if (progress?.id) {
      const updated = await base44.entities.OnboardingProgress.update(progress.id, { dismissed: true });
      onProgressChange(updated);
    } else {
      const created = await base44.entities.OnboardingProgress.create({
        user_email: user.email,
        steps_completed: completedIds,
        dismissed: true,
        completed: false,
      });
      onProgressChange(created);
    }
    setDismissing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm font-semibold">
              {allDone ? "🎉 Onboarding terminé !" : `Démarrage — ${ROLE_STEP_LABELS[role] || "Utilisateur"}`}
            </p>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {completedCount}/{totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-semibold text-primary w-8 text-right">{pct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={dismiss}
            disabled={dismissing}
            className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            title="Masquer le guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Steps list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {allDone ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Trophy className="w-10 h-10 text-amber-500" />
                <p className="text-sm font-semibold text-center">Bravo ! Vous avez complété toutes les étapes.</p>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Vous maîtrisez les bases d'ImmoPilot. L'assistant IA reste disponible en bas à droite pour vous accompagner.
                </p>
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs mt-1" onClick={dismiss}>
                  Masquer ce guide
                </Button>
              </div>
            ) : (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {steps.map((step) => {
                  const isCompleted = completedIds.includes(step.id);
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 rounded-xl p-3 border transition-all ${
                        isCompleted
                          ? "bg-green-50/50 border-green-100 opacity-70"
                          : "bg-secondary/20 border-transparent hover:border-border/50"
                      }`}
                    >
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {isCompleted
                          ? <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                          : <Circle className="w-4.5 h-4.5 text-muted-foreground/40 hover:text-primary transition-colors" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-md ${step.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3 h-3 ${step.color}`} />
                          </div>
                          <p className={`text-xs font-semibold leading-snug ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {step.label}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {step.description}
                        </p>
                        {!isCompleted && (
                          <Link to={step.path}>
                            <button
                              onClick={() => toggleStep(step.id)}
                              className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                            >
                              {step.cta} <ArrowRight className="w-3 h-3" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}