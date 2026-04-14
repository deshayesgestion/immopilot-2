import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Send, Loader2, CheckCircle2, Tag, Zap, TicketIcon,
  ArrowLeft, Mail, Clock, User, Home, TrendingUp, CreditCard,
  MessageSquare, AlertTriangle, RefreshCw, Archive
} from "lucide-react";

const MODULE_LABELS = { location: "Location", vente: "Vente", comptabilite: "Comptabilité", general: "Général" };
const MODULE_ICONS = {
  location: <Home className="w-3.5 h-3.5 text-blue-500" />,
  vente: <TrendingUp className="w-3.5 h-3.5 text-purple-500" />,
  comptabilite: <CreditCard className="w-3.5 h-3.5 text-green-500" />,
  general: <MessageSquare className="w-3.5 h-3.5 text-gray-400" />,
};
const INTENTION_LABELS = {
  incident_logement: "Incident logement", demande_visite: "Demande de visite",
  question_administrative: "Question administrative", paiement_facture: "Paiement / Facture",
  demande_information: "Demande d'information", lead: "Lead prospect", autre: "Autre",
};
const fmtFull = (d) => d ? new Date(d).toLocaleString("fr-FR") : "—";

export default function EmailDetail({ email, onUpdate, onClose }) {
  const [reponse, setReponse] = useState(email.reponse_ia || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(email.reponse_envoyee || false);
  const [analysing, setAnalysing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const analyser = async () => {
    setAnalysing(true);
    await base44.functions.invoke("analyserEmail", { email_id: email.id });
    setAnalysing(false);
    onUpdate();
  };

  const envoyerReponse = async () => {
    if (!reponse.trim()) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: email.de,
      subject: `Re: ${email.objet}`,
      body: reponse,
    });
    await base44.entities.EmailEntrant.update(email.id, {
      reponse_ia: reponse,
      reponse_envoyee: true,
      reponse_envoyee_le: new Date().toISOString(),
      statut: "traite",
    });
    setSent(true);
    setSending(false);
    onUpdate();
  };

  const marquerTraite = async () => {
    setUpdating(true);
    await base44.entities.EmailEntrant.update(email.id, { statut: "traite" });
    setUpdating(false);
    onUpdate();
  };

  const archiver = async () => {
    setUpdating(true);
    await base44.entities.EmailEntrant.update(email.id, { statut: "archive" });
    setUpdating(false);
    onUpdate();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate">{email.objet}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" /> {email.de_nom || email.de}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> {fmtFull(email.date_reception)}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {email.statut !== "traite" && (
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={marquerTraite} disabled={updating}>
                <CheckCircle2 className="w-3 h-3" /> Traité
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={archiver} disabled={updating}>
              <Archive className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* IA Analysis */}
        {email.resume_ia ? (
          <div className="mx-5 mt-4 bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Analyse IA
              </p>
              <button onClick={analyser} disabled={analysing} className="text-xs text-primary/60 hover:text-primary flex items-center gap-1">
                {analysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Re-analyser
              </button>
            </div>
            <p className="text-sm">{email.resume_ia}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {email.module && (
                <span className="flex items-center gap-1 text-xs bg-white border border-border/50 px-2 py-1 rounded-full">
                  {MODULE_ICONS[email.module]} {MODULE_LABELS[email.module]}
                </span>
              )}
              {email.intention && (
                <span className="text-xs bg-white border border-border/50 px-2 py-1 rounded-full">
                  {INTENTION_LABELS[email.intention]}
                </span>
              )}
              {email.priorite === "urgent" && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Urgent
                </span>
              )}
              {email.ticket_id && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                  <TicketIcon className="w-3 h-3" /> Ticket créé
                </span>
              )}
              {email.contact_identifie && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Contact identifié
                </span>
              )}
            </div>
            {(email.tags || []).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {email.tags.map(t => (
                  <span key={t} className="text-[10px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-5 mt-4 border border-dashed border-primary/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary/50" />
              <p className="text-xs text-muted-foreground">Email non analysé par l'IA</p>
            </div>
            <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={analyser} disabled={analysing}>
              {analysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Analyser
            </Button>
          </div>
        )}

        {/* Email body */}
        <div className="mx-5 mt-4 mb-4">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Message original</p>
          <div className="bg-secondary/10 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed border border-border/30">
            {email.corps || "(Corps vide)"}
          </div>
        </div>

        {/* Réponse IA */}
        <div className="mx-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Réponse</p>
            {sent && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Envoyée le {fmtFull(email.reponse_envoyee_le)}
              </span>
            )}
          </div>
          {sent ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 whitespace-pre-wrap leading-relaxed">
              {reponse}
            </div>
          ) : (
            <>
              <Textarea
                value={reponse}
                onChange={(e) => setReponse(e.target.value)}
                rows={8}
                placeholder="Réponse générée par l'IA ou rédigée manuellement..."
                className="rounded-xl text-sm resize-none"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  className="rounded-full gap-2 h-9 text-sm flex-1"
                  onClick={envoyerReponse}
                  disabled={sending || !reponse.trim()}
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Envoyer la réponse
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}