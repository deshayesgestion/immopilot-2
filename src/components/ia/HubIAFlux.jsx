/**
 * HubIAFlux — Visualisation du flux IA unifié
 * Email → Analyse IA → Rounded → Ticket → Action
 */
import { Mail, Phone, Bot, TicketIcon, ArrowRight, Zap, CheckCircle2, AlertTriangle, Home, TrendingUp, CreditCard, MessageSquare } from "lucide-react";

const MODULE_COLORS = {
  location: "text-blue-600 bg-blue-50",
  vente: "text-purple-600 bg-purple-50",
  comptabilite: "text-green-600 bg-green-50",
  general: "text-gray-500 bg-gray-50",
};

const FLUX_STEPS = [
  {
    id: "entree",
    label: "Entrées",
    icon: null,
    items: [
      { icon: Mail, label: "Email entrant", color: "text-blue-600 bg-blue-50", desc: "Analyse automatique" },
      { icon: Phone, label: "Appel Rounded", color: "text-green-600 bg-green-50", desc: "Transcription IA" },
      { icon: MessageSquare, label: "Chat direct", color: "text-purple-600 bg-purple-50", desc: "Agent IA" },
    ]
  },
  {
    id: "ia",
    label: "Cerveau IA",
    icon: Bot,
    items: [
      { icon: Zap, label: "Classification", color: "text-primary bg-primary/10", desc: "Module, intention, priorité" },
      { icon: Bot, label: "Identification contact", color: "text-primary bg-primary/10", desc: "CRM, dossiers, biens" },
      { icon: AlertTriangle, label: "Priorisation", color: "text-amber-600 bg-amber-50", desc: "Urgent / Normal / Faible" },
    ]
  },
  {
    id: "action",
    label: "Actions",
    icon: null,
    items: [
      { icon: TicketIcon, label: "Ticket créé", color: "text-indigo-600 bg-indigo-50", desc: "Classé par module" },
      { icon: CheckCircle2, label: "Réponse directe", color: "text-green-600 bg-green-50", desc: "Questions simples" },
      { icon: AlertTriangle, label: "Escalade urgente", color: "text-red-600 bg-red-50", desc: "Alerte admin immédiate" },
    ]
  }
];

const RULES = [
  { trigger: "Email = incident logement (fuite, panne…)", action: "Ticket Location + alerte agent", priorite: "urgent", icon: Home },
  { trigger: "Email / appel = demande visite", action: "Ticket Vente + proposer créneaux", priorite: "normal", icon: TrendingUp },
  { trigger: "Email / appel = paiement / facture", action: "Ticket Comptabilité + dossier lié", priorite: "normal", icon: CreditCard },
  { trigger: "Prospect inconnu (email ou appel)", action: "Créer Lead CRM + ticket général", priorite: "faible", icon: Bot },
  { trigger: "Sinistre / urgence sécurité / menace légale", action: "Ticket urgent + email admin immédiat", priorite: "urgent", icon: AlertTriangle },
  { trigger: "Loyer > 2 mois de retard", action: "Ticket comptabilité urgent + relance auto", priorite: "urgent", icon: CreditCard },
];

const PRIO_COLORS = {
  urgent: "bg-red-100 text-red-700",
  normal: "bg-amber-100 text-amber-700",
  faible: "bg-gray-100 text-gray-500",
};

export default function HubIAFlux() {
  return (
    <div className="space-y-6">
      {/* Flux visuel */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <p className="text-sm font-semibold mb-5 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" /> Flux IA unifié
        </p>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {FLUX_STEPS.map((step, si) => (
            <div key={step.id} className="flex lg:flex-col items-center gap-3 flex-1">
              <div className="flex-1 w-full">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 text-center">{step.label}</p>
                <div className="space-y-2">
                  {step.items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/20">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {si < FLUX_STEPS.length - 1 && (
                <ArrowRight className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Règles d'automatisation */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <p className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Règles d'automatisation unifiées
        </p>
        <div className="space-y-2">
          {RULES.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Si : {r.trigger}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">→ {r.action}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIO_COLORS[r.priorite]}`}>
                  {r.priorite}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Infos connexion Rounded */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                Rounded — Agent vocal IA
                <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">CONNECTÉ</span>
              </p>
              <p className="text-xs text-muted-foreground">callrounded.com · Clé API configurée</p>
            </div>
          </div>
          <a href="https://app.callrounded.com" target="_blank" rel="noreferrer"
            className="text-xs text-green-700 hover:underline flex items-center gap-1">
            Ouvrir →
          </a>
        </div>
        <div className="bg-white/70 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-green-800">URL webhook à configurer dans Rounded :</p>
          <div className="bg-gray-900 text-green-400 text-xs font-mono rounded-lg px-4 py-3 flex items-center justify-between gap-2">
            <span className="break-all truncate">{window.location.origin}/functions/roundedWebhook</span>
            <button onClick={() => navigator.clipboard.writeText(window.location.origin + '/functions/roundedWebhook')}
              className="text-gray-400 hover:text-white flex-shrink-0 text-[10px] border border-gray-600 rounded px-1.5 py-0.5">
              Copier
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Événements : <code className="text-green-700">event_call_status_updated</code>, <code className="text-green-700">event_transcript</code>, <code className="text-green-700">event_post_call</code></p>
        </div>
      </div>
    </div>
  );
}