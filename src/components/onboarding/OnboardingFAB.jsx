import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OnboardingAssistant from "./OnboardingAssistant.jsx";
import OnboardingModal from "./OnboardingModal.jsx";

export default function OnboardingFAB() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Show onboarding modal if user has no role or is brand new
      if (u?.email) {
        base44.entities.OnboardingProgress.filter({ user_email: u.email })
          .then(results => {
            const hasProgress = results.length > 0;
            // Show modal only if role is missing or default "user" and no progress started
            if (!hasProgress && (!u.role || u.role === "user")) {
              setShowModal(true);
            }
            setChecked(true);
          })
          .catch(() => setChecked(true));
      } else {
        setChecked(true);
      }
    }).catch(() => setChecked(true));
  }, []);

  const handleModalComplete = (role) => {
    setUser(prev => ({ ...prev, role }));
    setShowModal(false);
  };

  if (!checked) return null;

  return (
    <>
      {/* Onboarding role selection modal (first time only) */}
      {showModal && user && (
        <OnboardingModal user={user} onComplete={handleModalComplete} />
      )}

      <OnboardingAssistant open={open} onClose={() => setOpen(false)} user={user} />

      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Assistant ImmoPilot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}