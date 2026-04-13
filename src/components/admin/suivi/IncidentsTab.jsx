import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Loader2, Mic, MicOff, Mail, MessageSquare, X,
  AlertTriangle, CheckCircle2, Clock, Wrench, ChevronDown, ChevronUp, Send, Sparkles
} from "lucide-react";

const GRAVITE_CONFIG = {
  faible: { label: "Faible", color: "bg-blue-100 text-blue-700" },
  moyen: { label: "Moyen", color: "bg-amber-100 text-amber-700" },
  eleve: { label: "Élevé", color: "bg-red-100 text-red-600" },
  urgent: { label: "Urgent", color: "bg-red-600 text-white" },
};

const STATUT_CONFIG = {
  ouvert: { label: "Ouvert", color: "bg-amber-100 text-amber-700", icon: Clock },
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-700", icon: Wrench },
  resolu: { label: "Résolu", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

const SOURCE_CONFIG = {
  manuel: { label: "Manuel", color: "bg-gray-100 text-gray-500" },
  vocal: { label: "🎤 Vocal", color: "bg-purple-100 text-purple-700" },
  email: { label: "📧 Email", color: "bg-blue-100 text-blue-700" },
};

const EMPTY_FORM = { titre: "", description: "", gravite: "moyen", categorie: "autre", intervenant: "", source: "manuel" };

// ── TICKET DETAIL MODAL ─────────────────────────────────────────────────────
function TicketModal({ ticket, dossier, onClose, onUpdate }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatut, setUpdatingStatut] = useState(false);

  const incidents = dossier.incidents || [];

  const sendMessage = async () => {
    if (!msg.trim()) return;
    setSending(true);
    const newMsg = { id: Date.now(), content: msg, date: new Date().toISOString(), auteur: "Agent" };
    const messages = [...(ticket.messages || []), newMsg];
    const updated = incidents.map((i) => i.id === ticket.id ? { ...i, messages } : i);
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    setMsg("");
    setSending(false);
    onUpdate();
  };

  const updateStatut = async (statut) => {
    setUpdatingStatut(true);
    const updated = incidents.map((i) => i.id === ticket.id ? { ...i, statut, date_resolution: statut === "resolu" ? new Date().toISOString() : undefined } : i);
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    setUpdatingStatut(false);
    onUpdate();
  };

  const updateIntervenant = async (val) => {
    const updated = incidents.map((i) => i.id === ticket.id ? { ...i, intervenant: val } : i);
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    onUpdate();
  };

  const notifyLocataire = async () => {
    const loc = dossier.locataire_selectionne;
    if (!loc?.email) return;
    await base44.integrations.Core.SendEmail({
      to: loc.email,
      subject: `Mise à jour de votre signalement — ${ticket.titre}`,
      body: `Bonjour ${loc.nom},\n\nNous vous informons que votre signalement "${ticket.titre}" est maintenant en statut : ${STATUT_CONFIG[ticket.statut]?.label || ticket.statut}.\n\n${ticket.intervenant ? `Intervenant assigné : ${ticket.intervenant}\n\n` : ""}Cordialement,\n${dossier.agent_name || "L'agence"}`,
    });
  };

  const g = GRAVITE_CONFIG[ticket.gravite] || GRAVITE_CONFIG.moyen;
  const s = STATUT_CONFIG[ticket.statut] || STATUT_CONFIG.ouvert;
  const src = SOURCE_CONFIG[ticket.source] || SOURCE_CONFIG.manuel;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border/50">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.color}`}>{g.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${src.color}`}>{src.label}</span>
              {ticket.categorie && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full capitalize">{ticket.categorie}</span>}
            </div>
            <h2 className="text-base font-semibold">{ticket.titre}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(ticket.date).toLocaleString("fr-FR")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Description */}
          {ticket.description && (
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Description</p>
              <p className="text-sm">{ticket.description}</p>
            </div>
          )}

          {/* Status & Intervention */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Statut</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUT_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={key} onClick={() => updateStatut(key)} disabled={updatingStatut}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${ticket.statut === key ? cfg.color + " border-transparent" : "border-border/50 text-muted-foreground hover:bg-secondary"}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Intervenant</label>
              <Input
                placeholder="Nom ou société..."
                defaultValue={ticket.intervenant || ""}
                onBlur={(e) => updateIntervenant(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Notify button */}
          <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={notifyLocataire}>
            <Mail className="w-3 h-3" /> Notifier le locataire
          </Button>

          {/* Messages thread */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Échanges & suivi</p>
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {(ticket.messages || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun échange</p>
              ) : (ticket.messages || []).map((m) => (
                <div key={m.id} className="bg-secondary/20 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-primary">{m.auteur}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(m.date).toLocaleString("fr-FR")}</p>
                  </div>
                  <p className="text-sm">{m.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Ajouter un message ou une action..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="text-sm resize-none min-h-[70px] rounded-xl flex-1"
              />
              <Button size="icon" className="h-auto rounded-xl" onClick={sendMessage} disabled={sending || !msg.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── VOICE RECORDER ──────────────────────────────────────────────────────────
function VoiceTicketModal({ onClose, onCreated }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscript(t);
    };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const analyzeWithAI = async () => {
    if (!transcript.trim()) return;
    setAnalyzing(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Extrait les informations d'un signalement d'incident locatif depuis cette description vocale : "${transcript}"\n\nRéponds en JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          titre: { type: "string" },
          description: { type: "string" },
          gravite: { type: "string", enum: ["faible", "moyen", "eleve", "urgent"] },
          categorie: { type: "string" },
        },
      },
    });
    setResult({ ...res, source: "vocal" });
    setAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">🎤 Ticket vocal</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-muted-foreground">Décrivez l'incident à voix haute, l'IA structurera automatiquement le ticket.</p>

        {/* Record button */}
        <div className="flex flex-col items-center gap-4">
          <button onClick={recording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${recording ? "bg-red-500 animate-pulse" : "bg-primary"}`}>
            {recording ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>
          <p className="text-xs text-muted-foreground">{recording ? "Enregistrement en cours... Cliquez pour arrêter" : "Cliquez pour démarrer"}</p>
        </div>

        {transcript && (
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Transcription</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {result ? (
          <div className="space-y-3 border border-primary/20 bg-primary/5 rounded-xl p-4">
            <p className="text-xs font-semibold text-primary flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Ticket structuré par l'IA</p>
            <p className="text-sm font-medium">{result.titre}</p>
            <p className="text-xs text-muted-foreground">{result.description}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${GRAVITE_CONFIG[result.gravite]?.color || ""}`}>{result.gravite}</span>
              {result.categorie && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{result.categorie}</span>}
            </div>
            <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 w-full" onClick={() => onCreated(result)}>
              <Plus className="w-3 h-3" /> Créer ce ticket
            </Button>
          </div>
        ) : (
          transcript && !recording && (
            <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 w-full" onClick={analyzeWithAI} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Analyser avec l'IA
            </Button>
          )
        )}
      </div>
    </div>
  );
}

// ── EMAIL PARSER MODAL ──────────────────────────────────────────────────────
function EmailTicketModal({ onClose, onCreated }) {
  const [emailText, setEmailText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeEmail = async () => {
    if (!emailText.trim()) return;
    setAnalyzing(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse cet email d'un locataire et crée un ticket d'incident :\n\n"${emailText}"\n\nExtrait les informations structurées.`,
      response_json_schema: {
        type: "object",
        properties: {
          titre: { type: "string" },
          description: { type: "string" },
          gravite: { type: "string", enum: ["faible", "moyen", "eleve", "urgent"] },
          categorie: { type: "string" },
        },
      },
    });
    setResult({ ...res, source: "email" });
    setAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">📧 Ticket depuis email</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground">Collez le contenu de l'email du locataire. L'IA créera automatiquement le ticket.</p>
        <Textarea
          placeholder="Bonjour, je vous contacte car depuis hier soir..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          className="text-sm resize-none min-h-[120px] rounded-xl"
        />

        {result ? (
          <div className="space-y-3 border border-blue-200 bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Ticket extrait de l'email</p>
            <p className="text-sm font-medium">{result.titre}</p>
            <p className="text-xs text-muted-foreground">{result.description}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${GRAVITE_CONFIG[result.gravite]?.color || ""}`}>{result.gravite}</span>
              {result.categorie && <span className="text-xs bg-white text-muted-foreground px-2 py-0.5 rounded-full border">{result.categorie}</span>}
            </div>
            <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 w-full" onClick={() => onCreated(result)}>
              <Plus className="w-3 h-3" /> Créer ce ticket
            </Button>
          </div>
        ) : (
          <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 w-full" onClick={analyzeEmail} disabled={analyzing || !emailText.trim()}>
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyser avec l'IA
          </Button>
        )}
      </div>
    </div>
  );
}

// ── TICKET CARD ─────────────────────────────────────────────────────────────
function TicketCard({ ticket, dossier, onUpdate }) {
  const [open, setOpen] = useState(false);
  const g = GRAVITE_CONFIG[ticket.gravite] || GRAVITE_CONFIG.moyen;
  const s = STATUT_CONFIG[ticket.statut] || STATUT_CONFIG.ouvert;
  const src = SOURCE_CONFIG[ticket.source] || SOURCE_CONFIG.manuel;
  const SIcon = s.icon;
  const msgCount = (ticket.messages || []).length;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${ticket.statut === "resolu" ? "opacity-60 bg-secondary/10 border-border/30" : "bg-white border-border/50 hover:border-primary/30"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.color}`}>{g.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${src.color}`}>{src.label}</span>
              {ticket.categorie && <span className="text-xs text-muted-foreground capitalize">{ticket.categorie}</span>}
            </div>
            <p className="text-sm font-semibold">{ticket.titre}</p>
            {ticket.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.color}`}>
              <SIcon className="w-3 h-3" /> {s.label}
            </span>
            {msgCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" /> {msgCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-muted-foreground">{new Date(ticket.date).toLocaleDateString("fr-FR")}</p>
          {ticket.intervenant && <p className="text-[11px] text-muted-foreground">👷 {ticket.intervenant}</p>}
        </div>
      </div>

      {open && (
        <TicketModal
          ticket={ticket}
          dossier={dossier}
          onClose={() => { setOpen(false); }}
          onUpdate={() => { onUpdate(); }}
        />
      )}
    </>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function IncidentsTab({ dossier, onUpdate }) {
  const incidents = dossier.incidents || [];
  const [adding, setAdding] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const saveTicket = async (data) => {
    setSaving(true);
    const ticket = {
      ...data,
      id: Date.now(),
      statut: "ouvert",
      date: new Date().toISOString(),
      messages: [],
    };
    const updated = [...incidents, ticket];
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    setSaving(false);
    setAdding(false);
    setForm(EMPTY_FORM);
    onUpdate();
  };

  const handleVoiceCreated = async (data) => {
    setShowVoice(false);
    await saveTicket(data);
  };

  const handleEmailCreated = async (data) => {
    setShowEmail(false);
    await saveTicket(data);
  };

  const filtered = filter === "all" ? incidents : incidents.filter((i) => i.statut === filter);
  const open = incidents.filter((i) => i.statut !== "resolu").length;
  const resolved = incidents.filter((i) => i.statut === "resolu").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Tickets incidents</p>
          <p className="text-xs text-muted-foreground">{open} ouvert{open > 1 ? "s" : ""} · {resolved} résolu{resolved > 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowVoice(true)}
            className="p-2 rounded-xl hover:bg-purple-50 text-purple-500 border border-purple-200 transition-colors" title="Ticket vocal">
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowEmail(true)}
            className="p-2 rounded-xl hover:bg-blue-50 text-blue-500 border border-blue-200 transition-colors" title="Ticket depuis email">
            <Mail className="w-3.5 h-3.5" />
          </button>
          <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3" /> Nouveau
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {[["all", "Tous"], ["ouvert", "Ouverts"], ["en_cours", "En cours"], ["resolu", "Résolus"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === val ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Manual form */}
      {adding && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nouveau ticket</p>
          <Input placeholder="Titre de l'incident *" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="h-8 text-sm" />
          <Textarea placeholder="Description détaillée..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-sm resize-none min-h-[70px]" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gravité</label>
              <select value={form.gravite} onChange={(e) => setForm({ ...form, gravite: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Catégorie</label>
              <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="plomberie">Plomberie</option>
                <option value="electricite">Électricité</option>
                <option value="chauffage">Chauffage</option>
                <option value="serrurerie">Serrurerie</option>
                <option value="nuisances">Nuisances</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Intervenant</label>
              <Input placeholder="Optionnel" value={form.intervenant} onChange={(e) => setForm({ ...form, intervenant: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }}>Annuler</Button>
            <Button size="sm" className="rounded-full h-8 text-xs" onClick={() => saveTicket(form)} disabled={saving || !form.titre.trim()}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Créer le ticket"}
            </Button>
          </div>
        </div>
      )}

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun incident {filter !== "all" ? `(${filter})` : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...filtered].reverse().map((inc) => (
            <TicketCard key={inc.id} ticket={inc} dossier={dossier} onUpdate={onUpdate} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showVoice && <VoiceTicketModal onClose={() => setShowVoice(false)} onCreated={handleVoiceCreated} />}
      {showEmail && <EmailTicketModal onClose={() => setShowEmail(false)} onCreated={handleEmailCreated} />}
    </div>
  );
}