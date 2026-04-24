import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Upload, X, Sparkles, Send, Plus, FileText } from "lucide-react";

const ETATS = [
  { value: "neuf", label: "Neuf", cls: "bg-green-100 text-green-700" },
  { value: "bon", label: "Bon état", cls: "bg-blue-100 text-blue-700" },
  { value: "moyen", label: "Moyen", cls: "bg-amber-100 text-amber-700" },
  { value: "degrade", label: "Dégradé", cls: "bg-red-100 text-red-700" },
];

const DEFAULT_PIECES = ["Entrée", "Salon", "Cuisine", "Chambre 1", "Chambre 2", "Salle de bain", "WC", "Balcon"];

function PieceCard({ piece, data, onChange }) {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, photos: [...(data.photos || []), file_url] });
    setUploading(false);
  };

  const etatCfg = ETATS.find(e => e.value === (data?.etat || "bon")) || ETATS[1];

  return (
    <div className="bg-white border border-border/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{piece}</p>
        <div className="flex gap-1">
          {ETATS.map(e => (
            <button key={e.value} onClick={() => onChange({ ...data, etat: e.value })}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${data?.etat === e.value ? `${e.cls} ring-2 ring-current/30` : "bg-secondary/40 text-muted-foreground hover:bg-secondary"}`}>
              {e.label}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={data?.commentaire || ""}
        onChange={e => onChange({ ...data, commentaire: e.target.value })}
        placeholder="Observations sur cet espace…"
        rows={2} className="rounded-xl text-xs resize-none"
      />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer hover:underline">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Ajouter photo
          <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        </label>
        {(data?.photos || []).length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            {data.photos.map((url, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={url} alt="" className="w-10 h-10 object-cover rounded-lg border border-border/50" />
                <button onClick={() => onChange({ ...data, photos: data.photos.filter((_, j) => j !== i) })}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TabEDL({ dossier, type, onSave }) {
  const prefix = type === "edle" ? "edle" : "edls";
  const label = type === "edle" ? "Entrée" : "Sortie";

  const [checklist, setChecklist] = useState(dossier[`${prefix}_checklist`] || {});
  const [pieces, setPieces] = useState(dossier[`${prefix}_pieces`]?.length > 0 ? dossier[`${prefix}_pieces`] : DEFAULT_PIECES);
  const [observations, setObservations] = useState(dossier[`${prefix}_observations`] || "");
  const [signe, setSigne] = useState(dossier[`${prefix}_signe`] || false);
  const [signeLocataire, setSigneLocataire] = useState(dossier[`${prefix}_signe_locataire`] || false);
  const [signeProprietaire, setSigneProprietaire] = useState(dossier[`${prefix}_signe_proprietaire`] || false);
  const [nouvellePiece, setNouvellePiece] = useState("");
  const [saving, setSaving] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(dossier.comparaison_edl || null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const updatePiece = (piece, data) => setChecklist(prev => ({ ...prev, [piece]: data }));

  const save = async () => {
    setSaving(true);
    const data = {
      [`${prefix}_checklist`]: checklist,
      [`${prefix}_pieces`]: pieces,
      [`${prefix}_observations`]: observations,
      [`${prefix}_signe`]: signe,
      [`${prefix}_signe_locataire`]: signeLocataire,
      [`${prefix}_signe_proprietaire`]: signeProprietaire,
      [`${prefix}_date`]: new Date().toISOString().slice(0, 10),
    };
    await base44.entities.DossierLocatif.update(dossier.id, data);
    onSave(data);
    setSaving(false);
  };

  const comparerEDL = async () => {
    if (!dossier.edle_checklist || !dossier.edls_checklist) return;
    setComparing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert EDL immobilier. Compare ces deux états des lieux et identifie les dégradations.

EDL ENTRÉE: ${JSON.stringify(dossier.edle_checklist, null, 2)}
EDL SORTIE: ${JSON.stringify(dossier.edls_checklist, null, 2)}

Retourne JSON: { synthese: string, degradations: [{piece: string, description: string, montant_estime: number, severite: "faible"|"moyen"|"eleve"}], total_retenue_estime: number, etat_global: "bon"|"moyen"|"mauvais" }`,
      response_json_schema: { type: "object", properties: { synthese: { type: "string" }, degradations: { type: "array", items: { type: "object" } }, total_retenue_estime: { type: "number" }, etat_global: { type: "string" } } }
    });
    if (result) {
      setComparison(result);
      await base44.entities.DossierLocatif.update(dossier.id, {
        comparaison_edl: result,
        edls_degradations: result.degradations || [],
        depot_garantie_retenues: (result.degradations || []).map(d => ({ motif: `${d.piece}: ${d.description}`, montant: d.montant_estime || 0 })),
      });
      onSave({ comparaison_edl: result, edls_degradations: result.degradations || [] });
    }
    setComparing(false);
  };

  const exportPDF = () => {
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px}h1,h2{color:#1e3a5f}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:8px;font-size:13px}.etat-neuf{color:green}.etat-bon{color:blue}.etat-moyen{color:orange}.etat-degrade{color:red}</style></head>
<body>
<h1>État des lieux — ${label}</h1>
<p><strong>Locataire :</strong> ${dossier.locataire_nom} | <strong>Bien :</strong> ${dossier.bien_titre} ${dossier.bien_adresse || ""}</p>
<p><strong>Date :</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
<h2>Pièces inventoriées</h2>
<table><tr><th>Pièce</th><th>État</th><th>Observations</th></tr>
${pieces.map(p => {
  const d = checklist[p] || {};
  return `<tr><td>${p}</td><td class="etat-${d.etat || 'bon'}">${d.etat || "bon"}</td><td>${d.commentaire || "—"}</td></tr>`;
}).join("")}
</table>
<h2>Observations générales</h2>
<p>${observations || "Aucune"}</p>
<h2>Signatures</h2>
<p>Locataire : ${signeLocataire ? "✓ Signé" : "En attente"} | Propriétaire : ${signeProprietaire ? "✓ Signé" : "En attente"}</p>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `EDL-${label}-${dossier.locataire_nom?.replace(/\s+/g, "-") || "locataire"}.html`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const envoyerEDL = async () => {
    if (!dossier.locataire_email) return;
    setSendingEmail(true);
    const summary = pieces.map(p => {
      const d = checklist[p] || {};
      return `<tr><td style="padding:6px;border:1px solid #ddd">${p}</td><td style="padding:6px;border:1px solid #ddd">${d.etat || "bon"}</td><td style="padding:6px;border:1px solid #ddd">${d.commentaire || "—"}</td></tr>`;
    }).join("");
    await base44.integrations.Core.SendEmail({
      to: dossier.locataire_email,
      subject: `État des lieux ${label} — ${dossier.bien_titre}`,
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<h2 style="color:#1e3a5f">État des lieux — ${label}</h2>
<p>Bonjour ${dossier.locataire_nom},</p>
<p>Veuillez trouver ci-dessous le récapitulatif de votre état des lieux de ${label.toLowerCase()} :</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f1f5f9"><th style="padding:8px;border:1px solid #ddd;text-align:left">Pièce</th><th style="padding:8px;border:1px solid #ddd;text-align:left">État</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Observations</th></tr>${summary}</table>
${observations ? `<p><strong>Observations générales :</strong> ${observations}</p>` : ""}
<p>Cordialement,<br>L'agence de gestion</p>
</div>`,
    });
    setSendingEmail(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold">🔑 État des lieux {label}</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1" onClick={exportPDF}>
            <FileText className="w-3 h-3" /> Export HTML
          </Button>
          {dossier.locataire_email && (
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1" onClick={envoyerEDL} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Envoyer email
            </Button>
          )}
          {type === "edls" && dossier.edle_checklist && (
            <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-amber-500 hover:bg-amber-600" onClick={comparerEDL} disabled={comparing}>
              {comparing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Comparer avec entrée (IA)
            </Button>
          )}
        </div>
      </div>

      {/* Ajouter pièce */}
      <div className="flex gap-2">
        <Input value={nouvellePiece} onChange={e => setNouvellePiece(e.target.value)}
          placeholder="Nom de la pièce à ajouter…" className="h-9 rounded-xl text-sm flex-1"
          onKeyDown={e => { if (e.key === "Enter" && nouvellePiece.trim()) { setPieces(p => [...p, nouvellePiece.trim()]); setNouvellePiece(""); } }} />
        <Button size="sm" variant="outline" className="h-9 rounded-full gap-1" onClick={() => { if (nouvellePiece.trim()) { setPieces(p => [...p, nouvellePiece.trim()]); setNouvellePiece(""); } }}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {/* Checklist pièces */}
      <div className="space-y-2">
        {pieces.map(p => (
          <div key={p} className="relative">
            <PieceCard piece={p} data={checklist[p] || {}} onChange={data => updatePiece(p, data)} />
            <button onClick={() => setPieces(prev => prev.filter(x => x !== p))}
              className="absolute top-3 right-3 p-1 hover:bg-red-50 rounded-full">
              <X className="w-3 h-3 text-muted-foreground hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Observations */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Observations générales</label>
        <Textarea value={observations} onChange={e => setObservations(e.target.value)}
          placeholder="Notes globales sur l'état du logement…" rows={3} className="rounded-xl text-sm resize-none" />
      </div>

      {/* Signatures */}
      <div className="bg-secondary/20 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold">Signatures</p>
        {[
          [signeLocataire, setSigneLocataire, "Locataire"],
          [signeProprietaire, setSigneProprietaire, "Propriétaire"],
        ].map(([val, setter, label]) => (
          <label key={label} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} className="rounded accent-primary w-4 h-4" />
            <CheckCircle2 className={`w-4 h-4 ${val ? "text-green-500" : "text-muted-foreground/30"}`} />
            <span className="text-sm">{label} — {val ? "Signé ✓" : "En attente"}</span>
          </label>
        ))}
      </div>

      {/* Résultat comparaison IA */}
      {comparison && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Analyse IA — Comparaison EDL</p>
          <p className="text-xs">{comparison.synthese}</p>
          {comparison.degradations?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Dégradations identifiées :</p>
              {comparison.degradations.map((d, i) => (
                <div key={i} className="flex items-start justify-between bg-white rounded-xl px-3 py-2 text-xs">
                  <div>
                    <p className="font-medium">{d.piece} — {d.description}</p>
                    <p className={`mt-0.5 capitalize ${d.severite === "eleve" ? "text-red-600" : d.severite === "moyen" ? "text-amber-600" : "text-slate-500"}`}>Sévérité : {d.severite}</p>
                  </div>
                  <span className="font-bold text-red-600 flex-shrink-0 ml-2">{d.montant_estime ? `${d.montant_estime} €` : "?"}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2 text-sm font-bold text-red-700">
                <span>Total retenue estimée</span>
                <span>{comparison.total_retenue_estime || 0} €</span>
              </div>
            </div>
          )}
        </div>
      )}

      <Button className="w-full rounded-full gap-2" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Enregistrer l'état des lieux {label}
      </Button>
    </div>
  );
}