import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, ImagePlus, Trash2, Plus, ClipboardCheck } from "lucide-react";

const PIECES_DEFAULT = ["Entrée", "Salon", "Cuisine", "Chambre", "Salle de bain", "WC", "Couloir"];

const ETATS = ["Bon état", "Usage normal", "À signaler", "Dégradé"];
const ETAT_COLORS = {
  "Bon état": "bg-green-100 text-green-700",
  "Usage normal": "bg-blue-100 text-blue-700",
  "À signaler": "bg-amber-100 text-amber-700",
  "Dégradé": "bg-red-100 text-red-600",
};

function PieceRow({ piece, onChange, onRemove }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files) => {
    setUploading(true);
    const urls = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    onChange({ ...piece, photos: [...(piece.photos || []), ...urls] });
    setUploading(false);
  };

  const removePhoto = (idx) => {
    onChange({ ...piece, photos: piece.photos.filter((_, i) => i !== idx) });
  };

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30">
        <p className="text-sm font-semibold flex-1">{piece.nom}</p>
        <div className="flex gap-1.5">
          {ETATS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange({ ...piece, etat: e })}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${
                piece.etat === e ? ETAT_COLORS[e] + " border-transparent" : "bg-white border-border/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <Textarea
          placeholder="Observations pour cette pièce..."
          className="text-sm rounded-xl resize-none min-h-[60px] bg-white"
          value={piece.commentaire || ""}
          onChange={(e) => onChange({ ...piece, commentaire: e.target.value })}
        />

        <div className="flex flex-wrap gap-2 items-center">
          {(piece.photos || []).map((url, idx) => (
            <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-border/50 bg-secondary/40">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            <span className="text-[10px] mt-0.5">Photo</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function EdlStep({ dossier, onUpdate }) {
  const saved = dossier.edl_entree || {};
  const [pieces, setPieces] = useState(saved.pieces || PIECES_DEFAULT.map((nom) => ({ nom, etat: "Bon état", commentaire: "", photos: [] })));
  const [observations, setObservations] = useState(saved.observations || "");
  const [newPiece, setNewPiece] = useState("");
  const [sigBailleur, setSigBailleur] = useState(saved.sig_bailleur || false);
  const [sigLocataire, setSigLocataire] = useState(saved.sig_locataire || false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const allSigned = sigBailleur && sigLocataire;

  const addPiece = () => {
    if (!newPiece.trim()) return;
    setPieces((p) => [...p, { nom: newPiece.trim(), etat: "Bon état", commentaire: "", photos: [] }]);
    setNewPiece("");
  };

  const saveEdl = async () => {
    setSaving(true);
    const edl = { pieces, observations, sig_bailleur: sigBailleur, sig_locataire: sigLocataire, date: new Date().toISOString() };
    await base44.entities.DossierLocatif.update(dossier.id, { edl_entree: edl });
    setSaving(false);
  };

  const finalize = async () => {
    setFinalizing(true);
    const edl = { pieces, observations, sig_bailleur: true, sig_locataire: true, date: new Date().toISOString(), signe: true };
    const stepsCompleted = [...(dossier.steps_completed || [])];
    if (!stepsCompleted.includes(5)) stepsCompleted.push(5);
    await base44.entities.DossierLocatif.update(dossier.id, {
      edl_entree: edl,
      steps_completed: stepsCompleted,
      current_step: Math.max(dossier.current_step || 1, 6),
    });
    setSigBailleur(true);
    setSigLocataire(true);
    setFinalizing(false);
    onUpdate();
  };

  const edlSigned = saved.signe;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">État des lieux d'entrée</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pieces.length} pièce{pieces.length > 1 ? "s" : ""} · Photos et observations</p>
        </div>
        <div className="flex gap-2">
          {edlSigned && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> EDL signé
            </span>
          )}
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={saveEdl} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Pièces */}
      <div className="space-y-3">
        {pieces.map((piece, idx) => (
          <PieceRow
            key={idx}
            piece={piece}
            onChange={(updated) => setPieces((p) => p.map((pp, i) => i === idx ? updated : pp))}
            onRemove={() => setPieces((p) => p.filter((_, i) => i !== idx))}
          />
        ))}
      </div>

      {/* Add piece */}
      <div className="flex gap-2">
        <Input
          placeholder="Ajouter une pièce..."
          value={newPiece}
          onChange={(e) => setNewPiece(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPiece()}
          className="h-9 rounded-full text-sm bg-secondary/40 border-0"
        />
        <Button size="sm" variant="outline" className="rounded-full h-9 px-4 gap-1.5 text-xs flex-shrink-0" onClick={addPiece}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {/* Observations générales */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Observations générales</p>
        <Textarea
          placeholder="Remarques globales sur l'état général du logement..."
          className="text-sm rounded-xl resize-none min-h-[70px]"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        />
      </div>

      {/* Signatures */}
      <div className="border border-border/50 rounded-2xl p-4 space-y-3 bg-white">
        <p className="text-sm font-semibold">Signatures des parties</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "bailleur", label: "Bailleur / Agent", state: sigBailleur, set: setSigBailleur },
            { key: "locataire", label: "Locataire", state: sigLocataire, set: setSigLocataire },
          ].map(({ key, label, state, set }) => (
            <button
              key={key}
              onClick={() => set(!state)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-medium text-sm ${
                state ? "border-green-400 bg-green-50 text-green-700" : "border-dashed border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {state ? <CheckCircle2 className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
              {label}
              <span className="text-xs">{state ? "✓ Signé" : "Cliquer pour signer"}</span>
            </button>
          ))}
        </div>

        {allSigned && !edlSigned && (
          <Button className="w-full rounded-full gap-2 text-sm h-10 bg-green-600 hover:bg-green-700" onClick={finalize} disabled={finalizing}>
            {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Finaliser et signer l'état des lieux
          </Button>
        )}
        {edlSigned && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">État des lieux signé · Étape suivante débloquée</p>
          </div>
        )}
      </div>
    </div>
  );
}