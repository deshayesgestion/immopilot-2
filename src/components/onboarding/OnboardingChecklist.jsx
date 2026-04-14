import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, CreditCard, Mail, Building2,
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    id: "create_property",
    label: "Créer votre premier bien",
    description: "Ajoutez un bien en location ou en vente pour commencer.",
    icon: Home,
    path: "/admin/location",
    cta: "Ajouter un bien",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "invite_client",
    label: "Inviter un collaborateur",
    description: "Invitez un agent ou un client pour collaborer sur vos dossiers.",
    icon: Users,
    path: "/admin/equipe",
    cta: "Gérer l'équipe",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "configure_payment",
    label: "Configurer un paiement",
    description: "Enregistrez un loyer ou une transaction dans la comptabilité.",
    icon: CreditCard,
    path: "/admin/comptabilite",
    cta: "Aller à la compta",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: "connect_email",
    label: "Connecter votre boîte email",
    description: "Activez la gestion IA des emails entrants depuis vos paramètres.",
    icon: Mail,
    path: "/admin/parametres/emails",
    cta: "Configurer les emails",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "connect_bank",
    label: "Connecter votre banque",
    description: "Synchronisez vos transactions bancaires automatiquement.",
    icon: Building2,
    path: "/admin/comptabilite",
    cta: "Liaison bancaire",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export default function OnboardingChecklist({ user, onOpen }) {
  const [progress, setProgress] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.email) return;
    const res = await base44.entities.OnboardingProgress.filter({ user_email: user.email });
    if (res.length > 0) {
      setProgress(res[0]);
    } else {
      const created = await base44.entities.OnboardingProgress.create({
        user_email: user.email,
        steps_completed: [],
        dismissed: false,
        completed: false,
      });
      setProgress(created);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.email]);

  const markStep = async (stepId) => {
    if (!progress) return;
    const already = progress.steps_completed || [];
    if (already.includes(stepId)) return;
    const updated = [...already, stepId];
    const isCompleted = updated.length >= STEPS.length;
    const saved = await base44.entities.OnboardingProgress.update(progress.id, {
      steps_completed: updated,
      completed: isCompleted,
    });
    setProgress(saved);
  };

  const dismiss = async () => {
    if (!progress) return;
    const saved = await base44.entities.OnboardingProgress.update(progress.id, { dismissed: true });
    setProgress(saved);
  };

  if (loading || !progress || progress.dismissed || progress.completed) return null;

  const completed = progress.steps_completed || [];
  const doneCount = completed.length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border/50 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Prise en main — {doneCount}/{STEPS.length} étapes</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }}
            className="text-xs text-primary hover:underline font-medium hidden sm:block"
          >
            Assistant IA
          </button>
          <button onClick={(e) => { e.stopPropagation(); dismiss(); }} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/30 border-t border-border/30">
              {STEPS.map((step) => {
                const isDone = completed.includes(step.id);
                const Icon = step.icon;
                return (
                  <div key={step.id} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isDone ? "opacity-50" : "hover:bg-secondary/10"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-50" : step.bg}`}>
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Icon className={`w-4 h-4 ${step.color}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>{step.label}</p>
                      {!isDone && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                    </div>
                    {!isDone && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={step.path}>
                          <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1 border-border/60"
                            onClick={() => markStep(step.id)}>
                            {step.cta} <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}