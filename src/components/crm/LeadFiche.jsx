import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Phone, Mail, Home, Star, MessageSquare, Calendar, ChevronDown, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUTS = [
  { id: "nouveau", label: "Nouveau", color: "bg-blue-100 text-blue-700" },
  { id: "contacte", label: "Contacté", color: "bg-yellow-100 text-yellow-700" },
  { id: "qualifie", label: "Qualifié", color: "bg-green-100 text-green-700" },
  { id: "perdu", label: "Perdu", color: "bg-red-100 text-red-600" },
];

function HistoriqueItem({ entry }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <Clock className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm">{entry.texte}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{entry.date}</p>
      </div>
    </div>
  );
}

export default function LeadFiche({ lead, contact, bien, biens, contacts, onClose, onUpdate }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [historique, setHistorique] = useState(
    lead.notes ? [{ texte: lead.notes, date: "Note existante" }] : []
  );

  const currentStatut = STATUTS.find(s => s.id === lead.statut) || STATUTS[0];

  const changeStatut = async (newStatut) => {
    setSaving(true);
    const updated = await base44.entities.Lead.update(lead.id, { statut: newStatut });
    onUpdate({ ...lead, statut: newStatut });
    setHistorique(prev => [{ texte: `Statut changé → ${newStatut}`, date: new Date().toLocaleDateString("fr-FR") }, ...prev]);
    setSaving(false);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const newNotes = lead.notes ? lead.notes + "\n" + note : note;
    await base44.entities.Lead.update(lead.id, { notes: newNotes });
    onUpdate({ ...lead, notes: newNotes });
    setHistorique(prev => [{ texte: note, date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    setNote("");
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{contact?.nom?.charAt(0) || "?"}</span>
            </div>
            <div>
              <h2 className="font-bold text-base">{contact?.nom || "Contact inconnu"}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentStatut.color}`}>
                {currentStatut.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact info */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Contact</p>
            <div className="space-y-2">
              {contact?.telephone && (
                <a href={`tel:${contact.telephone}`} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{contact.telephone}</span>
                  <span className="ml-auto text-[10px] text-green-600 opacity-0 group-hover:opacity-100">Appeler →</span>
                </a>
              )}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 truncate">{contact.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Bien associé */}
          {bien && (
            <div className="px-5 py-4 border-b border-border/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Bien associé</p>
              <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
                <div className="p-2 bg-white rounded-lg">
                  <Home className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bien.titre}</p>
                  {bien.adresse && <p className="text-xs text-muted-foreground">{bien.adresse}</p>}
                  {bien.prix && <p className="text-xs font-bold text-foreground mt-0.5">{bien.prix.toLocaleString("fr-FR")} €</p>}
                </div>
              </div>
            </div>
          )}

          {/* Score IA */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Score IA</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${lead.score >= 70 ? "bg-green-500" : lead.score >= 40 ? "bg-yellow-400" : lead.score > 0 ? "bg-red-400" : "bg-secondary"}`}
                  style={{ width: lead.score ? `${lead.score}%` : "0%" }}
                />
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-lg font-bold">{lead.score ?? "—"}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            {!lead.score && <p className="text-[11px] text-muted-foreground mt-2">Score non calculé (IA en préparation)</p>}
          </div>

          {/* Actions rapides — changer statut */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Changer le statut</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => changeStatut(s.id)}
                  disabled={lead.statut === s.id || saving}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                    lead.statut === s.id
                      ? `${s.color} border-transparent`
                      : "bg-white border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {lead.statut === s.id && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ajouter une note */}
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Ajouter une note</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note interne, observation, compte-rendu d'appel..."
              className="w-full h-20 text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" className="mt-2 w-full rounded-xl" onClick={addNote} disabled={!note.trim() || saving}>
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Enregistrer la note
            </Button>
          </div>

          {/* Historique */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Activité & historique</p>
            {historique.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune activité enregistrée</p>
            ) : (
              <div className="space-y-3">
                {historique.map((h, i) => <HistoriqueItem key={i} entry={h} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}