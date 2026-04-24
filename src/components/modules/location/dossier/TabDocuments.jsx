import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, FileText, CheckCircle2, X, ExternalLink, Image } from "lucide-react";

const DOCS_TYPES = [
  { key: "docs_identite",   label: "Pièce d'identité",        required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "docs_revenus",    label: "Justif. de revenus",       required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "docs_imposition", label: "Avis d'imposition",        required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "docs_domicile",   label: "Justif. de domicile",      required: false, accept: ".pdf,.jpg,.jpeg,.png" },
];

function DropZone({ docType, candidat, onUpdate }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const urls = [...(candidat.docs_urls || []).filter(u => !u.startsWith(`__${docType.key}__`)), `__${docType.key}__${file_url}`];
    await base44.entities.CandidatLocataire.update(candidat.id, { [docType.key]: true, docs_urls: urls });
    onUpdate({ ...candidat, [docType.key]: true, docs_urls: urls });
    setUploading(false);
  };

  const onDrop = async (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const docUrls = (candidat.docs_urls || []).filter(u => u.startsWith(`__${docType.key}__`)).map(u => u.replace(`__${docType.key}__`, ""));
  const hasDoc = !!candidat[docType.key];

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      dragging ? "border-primary bg-primary/5 scale-[1.01]" :
      hasDoc ? "border-green-300 bg-green-50" :
      docType.required ? "border-dashed border-red-200 bg-red-50/30" :
      "border-dashed border-border/50 bg-secondary/10"
    } p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {hasDoc
            ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <FileText className={`w-4 h-4 flex-shrink-0 ${docType.required ? "text-red-400" : "text-muted-foreground/50"}`} />
          }
          <div>
            <p className="text-xs font-semibold">{docType.label}</p>
            {docType.required && !hasDoc && <p className="text-[9px] text-red-500 font-medium">Obligatoire</p>}
            {hasDoc && <p className="text-[9px] text-green-600 font-medium">Reçu ✓</p>}
          </div>
        </div>
        {hasDoc && (
          <button onClick={() => { onUpdate({ ...candidat, [docType.key]: false }); base44.entities.CandidatLocataire.update(candidat.id, { [docType.key]: false }); }}
            className="p-0.5 hover:bg-red-100 rounded-full">
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`mt-2 rounded-xl flex flex-col items-center justify-center py-4 gap-2 cursor-pointer transition-all ${
          dragging ? "bg-primary/10" : "bg-white/60 hover:bg-white"
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Upload className={`w-5 h-5 ${dragging ? "text-primary" : "text-muted-foreground/40"}`} />
        )}
        <p className="text-[10px] text-muted-foreground text-center">
          {uploading ? "Upload en cours…" : "Glisser-déposer ou cliquer"}
        </p>
        <input ref={inputRef} type="file" accept={docType.accept} className="hidden" onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* Fichiers uploadés */}
      {docUrls.length > 0 && (
        <div className="mt-2 space-y-1">
          {docUrls.map((url, i) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split("?")[0]);
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-primary hover:underline">
                {isImage ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                <span className="truncate">Fichier {i + 1}</span>
                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CandidatDocs({ candidat: initial, onUpdate }) {
  const [candidat, setCandidat] = useState(initial);

  const handleUpdate = (updated) => {
    setCandidat(updated);
    onUpdate(updated);
  };

  const totalDocs = DOCS_TYPES.filter(d => candidat[d.key]).length;
  const mandatoryOk = DOCS_TYPES.filter(d => d.required).every(d => candidat[d.key]);

  return (
    <div className="bg-white border border-border/50 rounded-2xl overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 border-b ${mandatoryOk ? "bg-green-50 border-green-200" : "bg-secondary/20"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
            candidat.scoring_ia >= 70 ? "bg-green-100 text-green-700" :
            candidat.scoring_ia >= 50 ? "bg-amber-100 text-amber-700" :
            candidat.scoring_ia > 0 ? "bg-red-100 text-red-700" : "bg-secondary text-muted-foreground"
          }`}>
            {candidat.scoring_ia > 0 ? candidat.scoring_ia : "?"}
          </div>
          <div>
            <p className="text-sm font-semibold">{candidat.nom}</p>
            <p className="text-[10px] text-muted-foreground">{totalDocs}/{DOCS_TYPES.length} documents · {mandatoryOk ? "✓ Dossier complet" : "Manque des docs"}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {DOCS_TYPES.map(d => (
            <div key={d.key} className={`w-2.5 h-2.5 rounded-full ${candidat[d.key] ? "bg-green-500" : d.required ? "bg-red-300" : "bg-gray-200"}`} title={d.label} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {DOCS_TYPES.map(dt => (
          <DropZone key={dt.key} docType={dt} candidat={candidat} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  );
}

export default function TabDocuments({ dossier }) {
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dossier.bien_id) { setLoading(false); return; }
    base44.entities.CandidatLocataire.filter({ bien_id: dossier.bien_id }).then(data => {
      setCandidats(data.filter(c => c.statut !== "refuse"));
      setLoading(false);
    });
  }, [dossier.bien_id]);

  const updateCandidat = (updated) => setCandidats(prev => prev.map(c => c.id === updated.id ? updated : c));

  const totalDocs = candidats.reduce((sum, c) => sum + DOCS_TYPES.filter(d => c[d.key]).length, 0);
  const totalExpected = candidats.length * DOCS_TYPES.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">📂 Documents candidats</p>
          {candidats.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalDocs}/{totalExpected} docs collectés · Drag & Drop activé
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : candidats.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Ajoutez des candidats pour gérer leurs documents</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidats.map(c => <CandidatDocs key={c.id} candidat={c} onUpdate={updateCandidat} />)}
        </div>
      )}
    </div>
  );
}