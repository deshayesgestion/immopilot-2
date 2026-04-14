import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getStepsForRole, ROLE_AI_PROMPTS, BASE_SYSTEM_PROMPT, ROLE_STEP_LABELS } from "@/lib/onboardingSteps";
import { Bot, Send, Loader2, Sparkles, CheckCircle2, X, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const QUICK_QUESTIONS = {
  admin: [
    "Comment configurer mon agence ?",
    "Comment inviter mon équipe ?",
    "Comment connecter la banque ?",
  ],
  agent: [
    "Comment créer un bien ?",
    "Comment planifier une visite ?",
    "Comment suivre mon pipeline ?",
  ],
  gestionnaire: [
    "Comment gérer les loyers ?",
    "Comment traiter un incident ?",
    "Comment gérer une sortie ?",
  ],
  comptable: [
    "Comment connecter ma banque ?",
    "Comment vérifier les transactions ?",
    "Comment générer un rapport ?",
  ],
  responsable_location: [
    "Comment créer un bien en location ?",
    "Comment lancer une attribution ?",
    "Comment suivre mes locataires ?",
  ],
};

export default function OnboardingAssistant({ open, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const messagesEndRef = useRef(null);

  const role = user?.role || "admin";
  const steps = getStepsForRole(role);
  const quickQuestions = QUICK_QUESTIONS[role] || QUICK_QUESTIONS.admin;

  useEffect(() => {
    if (open && messages.length === 0) {
      // Load progress
      if (user?.email) {
        base44.entities.OnboardingProgress.filter({ user_email: user.email })
          .then(results => setProgress(results[0] || null))
          .catch(() => {});
      }
      // Welcome message
      const completed = [];
      const nextStep = steps.find(s => !completed.includes(s.id));
      const greeting = `Bonjour ${user?.full_name?.split(" ")[0] || ""} ! 👋 Je suis votre assistant ImmoPilot.\n\nEn tant que **${ROLE_STEP_LABELS[role] || "utilisateur"}**, voici ce que je vous recommande de faire en premier :\n\n${nextStep ? `➡️ **${nextStep.label}** — ${nextStep.description}` : "Explorez le dashboard pour découvrir toutes les fonctionnalités."}\n\nComment puis-je vous aider ?`;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open, user]);

  useEffect(() => {
    if (user?.email && open) {
      base44.entities.OnboardingProgress.filter({ user_email: user.email })
        .then(results => setProgress(results[0] || null))
        .catch(() => {});
    }
  }, [open, user?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);

    const completedIds = progress?.steps_completed || [];
    const completedSteps = steps.filter(s => completedIds.includes(s.id)).map(s => s.label);
    const pendingSteps = steps.filter(s => !completedIds.includes(s.id)).map(s => s.label);

    const systemPrompt = BASE_SYSTEM_PROMPT + (ROLE_AI_PROMPTS[role] || ROLE_AI_PROMPTS.admin) + `

Progression onboarding de l'utilisateur :
- Étapes complétées : ${completedSteps.join(", ") || "aucune"}
- Étapes restantes : ${pendingSteps.join(", ") || "toutes complétées"}

Utilise cette information pour personnaliser tes réponses et suggérer les prochaines étapes pertinentes.`;

    const history = newMessages.map(m => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nConversation:\n${history}\n\nAssistant:`,
    });

    setMessages(prev => [...prev, { role: "assistant", content: res }]);
    setLoading(false);
  };

  const completedIds = progress?.steps_completed || [];
  const pct = steps.length > 0 ? Math.round((completedIds.length / steps.length) * 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Assistant ImmoPilot</p>
              <p className="text-[11px] text-white/70 capitalize">{ROLE_STEP_LABELS[role] || "Guide"}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          {steps.length > 0 && (
            <div className="px-4 py-2 border-b border-border/40 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">Progression onboarding</span>
                <span className="text-[11px] font-bold text-primary">{pct}%</span>
              </div>
              <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>

              {/* Next steps hint */}
              {pct < 100 && (
                <div className="mt-2 space-y-1">
                  {steps.filter(s => !completedIds.includes(s.id)).slice(0, 2).map(s => {
                    const Icon = s.icon;
                    return (
                      <Link key={s.id} to={s.path} onClick={onClose}>
                        <div className="flex items-center gap-2 group">
                          <div className={`w-5 h-5 rounded-md ${s.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-3 h-3 ${s.color}`} />
                          </div>
                          <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors flex-1 truncate">{s.label}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
              {pct === 100 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[11px] text-green-600 font-medium">Onboarding complété !</span>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-secondary/40 text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-secondary/40 rounded-2xl px-4 py-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] bg-accent text-accent-foreground px-2.5 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-border/40 flex-shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Posez votre question…"
              className="flex-1 h-9 rounded-xl text-xs"
            />
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl flex-shrink-0"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}