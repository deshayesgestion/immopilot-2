import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, User, FileText, Upload, Mail, Calendar,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Loader2, X, Trash2
} from "lucide-react";

const DOCS_REQUIS = [
  { id: "identite", label: "Pièce d'identité" },
  { id: "revenus", label: "Justificatif de revenus" },
  { id: "contrat", label: "Contrat de travail" },
];

function AddCandidatModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.nom || !form.email) return;
    onAdd({
      id: Date.now().toString(),
      nom: form.nom,
      email: form.email,
      telephone: form.telephone,
      statut: "en_attente",
      documents: {},
      created_at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">Ajouter un candidat</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/60">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom complet *</label>
            <Input required placeholder="Marie Dupont" value={form.nom} onChange={(e) => set("nom", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
            <Input required type="email" placeholder="marie@email.fr" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
            <Input placeholder="06 12 34 56 78" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-full h-9" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 rounded-full h-9">Ajouter</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlanVisiteModal({ candidat, onClose, onSave }) {
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !heure) return;
    setSaving(true);
    await onSave({ date, heure });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">Planifier une visite</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/60"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Visite avec <strong>{candidat.nom}</strong></p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Heure</label>
            <Input required type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-full h-9" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 rounded-full h-9 gap-1.5" disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              Confirmer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandidatPanel({ candidat, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [visitModal, setVisitModal] = useState(false);

  const handleUpload = async (docId, file) => {
    setUploading(docId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = {
      ...candidat,
      documents: { ...candidat.documents, [docId]: { url: file_url, recu: true, nom: file.name } },
    };
    setUploading(null);
    onUpdate(updated);
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    const manquants = DOCS_REQUIS.filter((d) => !candidat.documents?.[d.id]?.recu).map((d) => `- ${d.label}`);
    await base44.integrations.Core.SendEmail({
      to: candidat.email,
      subject: "Documents requis pour votre candidature",
      body: `Bonjour ${candidat.nom},\n\nAfin de traiter votre dossier de candidature, nous avons besoin des documents suivants :\n\n${manquants.join("\n")}\n\nMerci de nous les transmettre dans les meilleurs délais.\n\nCordialement,\nL'équipe`,
    });
    setSendingEmail(false);
    alert("Email envoyé à " + candidat.email);
  };

  const planifierVisite = async ({ date, heure }) => {
    const updated = { ...candidat, visite: { date, heure } };
    onUpdate(updated);
  };

  const docs = candidat.documents || {};
  const docsRecus = DOCS_REQUIS.filter((d) => docs[d.id]?.recu).length;

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/20 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-full bg-white border border-border/50 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{candidat.nom}</p>
          <p className="text-xs text-muted-foreground">{candidat.email}{candidat.telephone ? ` · ${candidat.telephone}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {candidat.visite && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              📅 {candidat.visite.date} {candidat.visite.heure}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docsRecus === DOCS_REQUIS.length ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {docsRecus}/{DOCS_REQUIS.length} docs
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="p-4 space-y-5 bg-white">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setVisitModal(true)}>
              <Calendar className="w-3.5 h-3.5" /> Planifier visite
            </Button>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={sendEmail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Demande documents
            </Button>
            <button onClick={() => onDelete(candidat.id)} className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents</p>
            <div className="space-y-2">
              {DOCS_REQUIS.map((doc) => {
                const d = docs[doc.id];
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 bg-secondary/10">
                    {d?.recu ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{doc.label}</p>
                      {d?.nom && <p className="text-xs text-muted-foreground truncate">{d.nom}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {d?.recu && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Voir</a>
                      )}
                      <label className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                        d?.recu ? "bg-secondary text-muted-foreground hover:bg-secondary/80" : "bg-primary text-white hover:bg-primary/90"
                      }`}>
                        {uploading === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        {d?.recu ? "Remplacer" : "Uploader"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => e.target.files?.[0] && handleUpload(doc.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {visitModal && (
        <PlanVisiteModal candidat={candidat} onClose={() => setVisitModal(false)} onSave={planifierVisite} />
      )}
    </div>
  );
}

export default function CandidatureStep({ dossier, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const candidats = dossier.candidatures || [];

  const persist = async (newCandidats) => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, { candidatures: newCandidats });
    setSaving(false);
    onUpdate();
  };

  const addCandidat = (candidat) => {
    persist([...candidats, candidat]);
  };

  const updateCandidat = (updated) => {
    persist(candidats.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCandidat = (id) => {
    if (!window.confirm("Supprimer ce candidat ?")) return;
    persist(candidats.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Candidatures</p>
          <p className="text-xs text-muted-foreground mt-0.5">{candidats.length} candidat{candidats.length > 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setShowAdd(true)} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Ajouter
        </Button>
      </div>

      {candidats.length === 0 ? (
        <div className="border-2 border-dashed border-border/40 rounded-2xl py-10 text-center">
          <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun candidat pour l'instant</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Cliquez sur "Ajouter" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidats.map((c) => (
            <CandidatPanel
              key={c.id}
              candidat={c}
              onUpdate={updateCandidat}
              onDelete={deleteCandidat}
            />
          ))}
        </div>
      )}

      {showAdd && <AddCandidatModal onClose={() => setShowAdd(false)} onAdd={addCandidat} />}
    </div>
  );
}