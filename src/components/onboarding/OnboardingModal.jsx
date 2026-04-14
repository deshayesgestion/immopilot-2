import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ROLE_STEP_LABELS } from "@/lib/onboardingSteps";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ChevronRight } from "lucide-react";

const ROLE_CARDS = [
  {
    role: "admin",
    emoji: "👑",
    label: "Directeur / Admin",
    desc: "Piloter l'agence, gérer l'équipe, accès complet",
    color: "border-purple-200 hover:border-purple-400",
    bg: "bg-purple-50",
    highlight: "text-purple-700",
  },
  {
    role: "responsable_location",
    emoji: "🏠",
    label: "Responsable location",
    desc: "Gérer les biens, dossiers locatifs, attributions",
    color: "border-blue-200 hover:border-blue-400",
    bg: "bg-blue-50",
    highlight: "text-blue-700",
  },
  {
    role: "agent",
    emoji: "🏡",
    label: "Agent immobilier",
    desc: "Ventes, visites, pipeline et mandats",
    color: "border-amber-200 hover:border-amber-400",
    bg: "bg-amber-50",
    highlight: "text-amber-700",
  },
  {
    role: "gestionnaire",
    emoji: "🧾",
    label: "Gestionnaire locatif",
    desc: "Loyers, incidents, préavis et sorties",
    color: "border-green-200 hover:border-green-400",
    bg: "bg-green-50",
    highlight: "text-green-700",
  },
  {
    role: "comptable",
    emoji: "💰",
    label: "Comptable",
    desc: "Finances, transactions, rapports",
    color: "border-rose-200 hover:border-rose-400",
    bg: "bg-rose-50",
    highlight: "text-rose-700",
  },
];

export default function OnboardingModal({ user, onComplete }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || "");
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    if (!selectedRole) return;
    setSaving(true);
    await base44.auth.updateMe({ role: selectedRole });
    await base44.entities.OnboardingProgress.create({
      user_email: user.email,
      steps_completed: [],
      dismissed: false,
      completed: false,
    }).catch(() => {});
    setSaving(false);
    onComplete(selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Bienvenue sur ImmoPilot !</h2>
          <p className="text-sm text-white/80 mt-1">
            Quel est votre rôle ? Nous adapterons votre expérience.
          </p>
        </div>

        {/* Role cards */}
        <div className="p-5 space-y-2">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.role}
              onClick={() => setSelectedRole(card.role)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                selectedRole === card.role
                  ? `${card.bg} ${card.color} ring-2 ring-offset-1 ring-primary/30`
                  : `border-border/50 hover:bg-secondary/30 ${card.color}`
              }`}
            >
              <span className="text-2xl flex-shrink-0">{card.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${selectedRole === card.role ? card.highlight : ""}`}>
                  {card.label}
                </p>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </div>
              {selectedRole === card.role && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <Button
            className="w-full rounded-2xl h-11 gap-2"
            disabled={!selectedRole || saving}
            onClick={handleStart}
          >
            {saving ? (
              <span className="text-sm">Personnalisation…</span>
            ) : (
              <>
                <span className="text-sm">Commencer mon onboarding</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Vous pourrez modifier votre rôle dans les paramètres
          </p>
        </div>
      </motion.div>
    </div>
  );
}