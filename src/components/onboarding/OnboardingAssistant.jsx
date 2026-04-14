import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "Comment ajouter un bien immobilier ?",
  "Comment inviter un collaborateur ?",
  "Comment fonctionne la comptabilité ?",
  "Comment connecter ma boîte email ?",
  "Comment créer un ticket IA ?",
];

const SYSTEM_PROMPT = `Tu es l'assistant d'onboarding d'ImmoPilot, un SaaS de gestion immobilière pour les agences.
Tu aides les nouveaux utilisateurs à comprendre et utiliser la plateforme.

Modules disponibles :
- Location : gestion des biens, candidatures, dossiers locatifs (attribution, suivi, sortie)
- Vente : mandats, transactions, acquéreurs, clôtures
- Comptabilité : loyers, transactions, facturation, dépenses, relances, liaison bancaire
- Accueil IA : standardiste vocal IA (Rounded), tickets automatiques
- Emails IA : lecture, analyse et réponse automatique aux emails entrants
- Paramètres : configuration agence, équipe, couleurs, réseaux sociaux

Sois concis, friendly, pratique. Réponds en français. Utilise des emojis modérément.`;

export default function OnboardingAssistant({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Bonjour 👋 Je suis votre assistant ImmoPilot ! Comment puis-je vous aider à démarrer ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages
      .map((m) => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
      .join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nConversation:\n${history}\n\nAssistant:`,
    });

    setMessages((prev) => [...prev, { role: "assistant", content: res }]);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
          style={{ maxHeight: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Assistant ImmoPilot</p>
              <p className="text-[11px] text-white/70">Aide à la prise en main</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-secondary/40 text-foreground"
                }`}>
                  {msg.role === "user" ? (
                    <p>{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-secondary/40 rounded-2xl px-3.5 py-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-[11px] bg-primary/5 hover:bg-primary/10 text-primary rounded-full px-2.5 py-1 transition-colors border border-primary/15">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-4 py-3 border-t border-border/50">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Posez votre question..."
              className="flex-1 h-9 rounded-xl text-sm"
            />
            <Button size="icon" className="h-9 w-9 rounded-xl" onClick={() => send()} disabled={loading || !input.trim()}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}