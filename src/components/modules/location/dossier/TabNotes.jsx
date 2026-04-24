import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Lock, Clock, Edit3, Check, X, Loader2 } from "lucide-react";

const fmtDT = iso => iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function NoteCard({ note, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.contenu);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await onEdit({ ...note, contenu: text.trim(), modifie_le: new Date().toISOString() });
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
            <Lock className="w-3 h-3 text-amber-700" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-amber-800">{note.auteur || "Agent"}</p>
            <p className="text-[9px] text-amber-600/70 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {fmtDT(note.date)}
              {note.modifie_le && <span className="ml-1 italic">· modifié {fmtDT(note.modifie_le)}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => setEditing(e => !e)} className="p-1.5 hover:bg-amber-100 rounded-full">
            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-100 rounded-full">
            <X className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea value={text} onChange={e => setText(e.target.value)} rows={3} className="rounded-xl text-sm resize-none bg-white border-amber-300" />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs rounded-full gap-1 bg-amber-500 hover:bg-amber-600" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Sauvegarder
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-amber-300" onClick={() => { setEditing(false); setText(note.contenu); }}>Annuler</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{note.contenu}</p>
      )}

      {note.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {note.tags.map(t => (
            <span key={t} className="text-[9px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TabNotes({ dossier, onUpdate }) {
  const [notes, setNotes] = useState(dossier.notes_internes || []);
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [adding, setAdding] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Charger user au montage
  useState(() => { base44.auth.me().then(u => setCurrentUser(u)); });

  const TAGS_RAPIDES = ["Urgent", "Décision", "Info", "Suivi", "Propriétaire", "Locataire"];

  const persist = async (newNotes, logAction) => {
    setNotes(newNotes);
    const hist = [...(dossier.historique || []), {
      date: new Date().toISOString(),
      action: logAction || "Note interne mise à jour",
      auteur: currentUser?.full_name || "Agent",
      type: "note"
    }];
    await base44.entities.DossierLocatif.update(dossier.id, { notes_internes: newNotes, historique: hist });
    onUpdate({ notes_internes: newNotes, historique: hist });
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAdding(true);
    const note = {
      id: Date.now(),
      contenu: newNote.trim(),
      auteur: currentUser?.full_name || "Agent",
      date: new Date().toISOString(),
      tags: selectedTags,
      modifie_le: null,
    };
    const newNotes = [note, ...notes];
    await persist(newNotes, `Note ajoutée : "${newNote.slice(0, 50)}${newNote.length > 50 ? "…" : ""}"`);
    setNewNote("");
    setSelectedTags([]);
    setAdding(false);
  };

  const handleEdit = async (updated) => {
    const newNotes = notes.map(n => n.id === updated.id ? updated : n);
    await persist(newNotes, "Note modifiée");
  };

  const handleDelete = async (id) => {
    const newNotes = notes.filter(n => n.id !== id);
    await persist(newNotes, "Note supprimée");
  };

  const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600" /> Notes internes agence
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Réservé aux agents · Non visible côté client
        </p>
      </div>

      {/* Formulaire nouvelle note */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Ajouter une note interne… (décision, observation, échange)"
          rows={3}
          className="rounded-xl text-sm resize-none bg-white border-amber-200"
        />

        {/* Tags rapides */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Tags :</span>
          {TAGS_RAPIDES.map(t => (
            <button key={t} onClick={() => toggleTag(t)}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                selectedTags.includes(t) ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}>
              {t}
            </button>
          ))}
        </div>

        <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs bg-amber-500 hover:bg-amber-600" onClick={addNote} disabled={adding || !newNote.trim()}>
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Ajouter la note
        </Button>
      </div>

      {/* Liste des notes */}
      {notes.length === 0 ? (
        <div className="text-center py-10 bg-secondary/20 rounded-2xl">
          <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune note interne</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Utilisez les notes pour les décisions et échanges internes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <NoteCard
              key={n.id}
              note={n}
              onEdit={handleEdit}
              onDelete={() => handleDelete(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}