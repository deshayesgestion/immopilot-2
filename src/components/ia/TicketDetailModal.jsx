/**
 * TicketDetailModal — Modal de détail / mise à jour d'un ticket IA
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Zap, Home, TrendingUp, CreditCard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PRIORITE_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
  normal: { label: "Normal", color: "bg-amber-100 text-amber-700" },
  faible: { label: "Faible", color: "bg-gray-100 text-gray-500" },
};

const SOURCE_CONFIG = {
  appel:   { label: "Appel Rounded", color: "bg-green-100 text-green-700" },
  email:   { label: "Email IA",      color: "bg-blue-100 text-blue-700" },
  chat:    { label: "Chat IA",       color: "bg-purple-100 text-purple-700" },
  manuel:  { label: "Manuel",        color: "bg-gray-100 text-gray-500" },
};

const MODULE_ICONS = {
  location: <Home className="w-3.5 h-3.5 text-blue-500" />,
  vente: <TrendingUp className="w-3.5 h-3.5 text-purple-500" />,
  comptabilite: <CreditCard className="w-3.5 h-3.5 text-green-500" />,
  general: <MessageSquare className="w-3.5 h-3.5 text-gray-500" />,
};

const TYPE_LABELS = {
  incident_logement: "Incident logement",
  demande_visite: "Demande visite",
  demande_information: "Demande d'info",
  probleme_paiement: "Problème paiement",
  question_administrative: "Question admin",
  autre: "Autre",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

export default function TicketDetailModal({ ticket, onClose, onUpdate }) {
  const [statut, setStatut] = useState(ticket.statut);
  const [notes, setNotes] = useState(ticket.notes || "");
  const [saving, setSaving] = useState(false);

  const prioriteConfig = PRIORITE_CONFIG[ticket.priorite] || PRIORITE_CONFIG.normal;
  const sourceConfig = SOURCE_CONFIG[ticket.source] || SOURCE_CONFIG.manuel;

  const save = async () => {
    setSaving(true);
    await base44.entities.TicketIA.update(ticket.id, {
      statut,
      notes,
      historique: [
        ...(ticket.historique || []),
        { id: Date.now(), content: `Statut → ${statut}`, date: new Date().toISOString() }
      ]
    });
    setSaving(false);
    onUpdate?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${prioriteConfig.color}`}>
              {prioriteConfig.label}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${sourceConfig.color}`}>
              {sourceConfig.label}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">{ticket.numero}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Infos contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Contact</p>
              <p className="text-sm font-medium">{ticket.appelant_nom || "Inconnu"}</p>
              {ticket.appelant_email && <p className="text-xs text-muted-foreground">{ticket.appelant_email}</p>}
              {ticket.appelant_telephone && <p className="text-xs text-muted-foreground">{ticket.appelant_telephone}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium">{TYPE_LABELS[ticket.type_demande] || ticket.type_demande || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Module</p>
              <div className="flex items-center gap-1 mt-0.5">{MODULE_ICONS[ticket.module]}<span className="text-sm capitalize">{ticket.module || "—"}</span></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm">{fmtDate(ticket.date_appel)} {fmtTime(ticket.date_appel)}</p>
            </div>
          </div>

          {/* Bien / Dossier lié */}
          {(ticket.bien_titre || ticket.dossier_id) && (
            <div className="bg-secondary/20 rounded-xl p-3 space-y-1">
              {ticket.bien_titre && (
                <p className="text-xs"><span className="text-muted-foreground">Bien :</span> <span className="font-medium">{ticket.bien_titre}</span></p>
              )}
              {ticket.dossier_id && (
                <p className="text-xs"><span className="text-muted-foreground">Dossier :</span> <span className="font-medium font-mono text-xs">{ticket.dossier_id}</span></p>
              )}
            </div>
          )}

          {/* Résumé IA */}
          {ticket.resume_ia && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Résumé IA</p>
              <p className="text-sm">{ticket.resume_ia}</p>
            </div>
          )}

          {/* Description */}
          {ticket.description && ticket.description !== ticket.resume_ia && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm bg-secondary/20 rounded-xl p-3">{ticket.description}</p>
            </div>
          )}

          {/* Actions IA */}
          {ticket.actions_ia?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Actions IA déclenchées</p>
              <div className="flex flex-wrap gap-1.5">
                {ticket.actions_ia.map((a, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Transcription */}
          {ticket.transcription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Transcription</p>
              <p className="text-xs bg-gray-50 rounded-xl p-3 max-h-28 overflow-y-auto font-mono whitespace-pre-wrap">{ticket.transcription}</p>
            </div>
          )}

          {/* Statut */}
          <div>
            <label className="label-field">Statut</label>
            <select value={statut} onChange={e => setStatut(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="escalade">Escalade</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label-field">Notes internes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="rounded-xl text-sm resize-none" />
          </div>

          {/* Historique */}
          {ticket.historique?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Historique</p>
              <div className="space-y-1.5">
                {[...ticket.historique].reverse().slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                    <div>
                      <p>{h.content}</p>
                      <p className="text-muted-foreground">{fmtDate(h.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="rounded-full flex-1 text-sm h-9" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 text-sm h-9" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}