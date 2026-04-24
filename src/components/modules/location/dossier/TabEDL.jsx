import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, Loader2, Send, Plus, FileText, Download,
  Archive, Sparkles, XCircle, AlertTriangle, Camera, X
} from "lucide-react";
import EDLPieceCard from "./edl/EDLPieceCard";
import { genererPDFEdl } from "./edl/EDLPdfGenerator";

const DEFAULT_PIECES = ["Entrée", "Salon", "Cuisine", "Chambre 1", "Chambre 2", "Salle de bain", "WC", "Balcon"];

export default function TabEDL({ dossier, type, onSave }) {
  const prefix = type === "edle" ? "edle" : "edls";
  const label = type === "edle" ? "Entrée" : "Sortie";
  const labelEmoji = type === "edle" ? "🔑" : "📦";

  const [checklist, setChecklist] = useState(dossier[`${prefix}_checklist`] || {});
  const [pieces, setPieces] = useState(
    dossier[`${prefix}_pieces`]?.length > 0 ? dossier[`${prefix}_pieces`] : DEFAULT_PIECES
  );
  const [observations, setObservations] = useState(dossier[`${prefix}_observations`] || "");
  const [signeLocataire, setSigneLocataire] = useState(dossier[`${prefix}_signe_locataire`] || false);
  const [signeProprietaire, setSigneProprietaire] = useState(dossier[`${prefix}_signe_proprietaire`] || false);
  const [dateEdl, setDateEdl] = useState(dossier[`${prefix}_date`] || new Date().toISOString().slice(0, 10));
  const [nouvellePiece, setNouvellePiece] = useState("");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(dossier.comparaison_edl || null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [agency, setAgency] = useState(null);
  const [archivedUrl, setArchivedUrl] = useState(
    type === "edle" ? dossier.edle_pdf_url : dossier.edls_pdf_url
  );

  useEffect(() => {
    base44.entities.Agency.list().then(list => { if (list[0]) setAgency(list[0]); });
  }, []);

  const totalPhotos = pieces.reduce((acc, p) => acc + (checklist[p]?.photos?.length || 0), 0);
  const piecesAvecPhoto = pieces.filter(p => (checklist[p]?.photos?.length || 0) > 0).length;
  const piecesRenseignees = pieces.filter(p => checklist[p]?.etat).length;
  const completude = Math.round((piecesRenseignees / Math.max(pieces.length, 1)) * 100);

  // ── SAUVEGARDE ─────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    const data = {
      [`${prefix}_checklist`]: checklist,
      [`${prefix}_pieces`]: pieces,
      [`${prefix}_observations`]: observations,
      [`${prefix}_signe`]: signeLocataire && signeProprietaire,
      [`${prefix}_signe_locataire`]: signeLocataire,
      [`${prefix}_signe_proprietaire`]: signeProprietaire,
      [`${prefix}_date`]: dateEdl,
    };
    const histEntry = {
      date: new Date().toISOString(),
      action: `EDL ${label} sauvegardé (${piecesRenseignees}/${pieces.length} pièces, ${totalPhotos} photo${totalPhotos > 1 ? "s" : ""})`,
      auteur: "Agent",
      type: type === "edle" ? "edle" : "edls"
    };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { ...data, historique: hist });
    onSave({ ...data, historique: hist });
    setSaving(false);
  };

  // ── GÉNÉRATION PDF ─────────────────────────────────────────────
  const genererPDF = async () => {
    setGenerating(true);
    const doc = await genererPDFEdl({
      dossier, type, pieces, checklist, observations,
      signeLocataire, signeProprietaire, agency, dateEdl,
    });
    const blob = doc.output("blob");
    const fileName = `EDL-${label}-${(dossier.locataire_nom || "locataire").replace(/\s+/g, "-")}-${dateEdl || new Date().toISOString().slice(0, 10)}.pdf`;
    setPdfBlob(blob);
    setPdfFileName(fileName);
    setGenerating(false);
  };

  const telechargerPDF = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a"); a.href = url; a.download = pdfFileName;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── ARCHIVAGE ─────────────────────────────────────────────────
  const archiverPDF = async () => {
    if (!pdfBlob) return;
    setArchiving(true);
    const file = new File([pdfBlob], pdfFileName, { type: "application/pdf" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setArchivedUrl(file_url);
    const updateData = { [`${prefix}_pdf_url`]: file_url };
    const histEntry = {
      date: new Date().toISOString(),
      action: `PDF EDL ${label} archivé dans le dossier`,
      auteur: "Agent",
      type: type === "edle" ? "edle" : "edls"
    };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { ...updateData, historique: hist });
    onSave({ ...updateData, historique: hist });
    setArchiving(false);
  };

  // ── ENVOI EMAIL ────────────────────────────────────────────────
  const envoyerEDL = async () => {
    if (!dossier.locataire_email) return;
    setSendingEmail(true);

    const tableRows = pieces.map(p => {
      const d = checklist[p] || {};
      const etatColor = d.etat === "neuf" ? "#10b981" : d.etat === "bon" ? "#3b82f6" : d.etat === "moyen" ? "#f59e0b" : d.etat === "degrade" ? "#ef4444" : "#64748b";
      return `<tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:500">${p}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">
          <span style="background:${etatColor};color:white;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">${(d.etat || "bon").toUpperCase()}</span>
        </td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;color:#64748b;font-size:13px">${d.commentaire || "—"}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px">${d.photos?.length ? `📷 ${d.photos.length}` : "—"}</td>
      </tr>`;
    }).join("");

    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:${agency?.primary_color || "#4F46E5"};padding:28px 32px">
    <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700">${agency?.name || "Agence Immobilière"}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">État des lieux ${label.toLowerCase()} — ${dossier.bien_titre || ""}</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#1e293b;font-size:15px;font-weight:600;margin:0 0 4px">Bonjour ${dossier.locataire_nom || ""},</p>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">Veuillez trouver ci-dessous le récapitulatif de votre état des lieux d'${label.toLowerCase()} pour le bien :</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:20px">
      <p style="margin:0;font-weight:600;color:#1e293b">${dossier.bien_titre || "—"} — ${dossier.bien_adresse || ""}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px">Date EDL : ${new Date(dateEdl).toLocaleDateString("fr-FR")} • Locataire : ${dossier.locataire_nom}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
      <thead><tr style="background:#f1f5f9">
        <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Pièce</th>
        <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">État</th>
        <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Observations</th>
        <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">Photos</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    ${observations ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px"><p style="margin:0;font-size:13px;color:#92400e"><strong>Observations générales :</strong> ${observations}</p></div>` : ""}
    ${archivedUrl ? `<div style="text-align:center;margin:20px 0"><a href="${archivedUrl}" style="background:${agency?.primary_color || "#4F46E5"};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">📄 Télécharger le PDF de l'EDL</a></div>` : ""}
    <p style="color:#475569;font-size:13px;line-height:1.7">Cordialement,<br><strong>${agency?.name || "L'agence"}</strong></p>
  </div>
  <div style="background:#f8fafc;padding:14px 32px;text-align:center">
    <p style="margin:0;color:#94a3b8;font-size:11px">${agency?.address || ""} • ${agency?.phone || ""} • ${agency?.email || ""}</p>
  </div>
</div>`;

    await base44.integrations.Core.SendEmail({
      to: dossier.locataire_email,
      subject: `État des lieux ${label} — ${dossier.bien_titre || ""}`,
      body: emailBody
    });
    if (agency?.email) {
      await base44.integrations.Core.SendEmail({
        to: agency.email,
        subject: `[Copie] EDL ${label} — ${dossier.locataire_nom} / ${dossier.bien_titre}`,
        body: emailBody
      });
    }
    const histEntry = { date: new Date().toISOString(), action: `EDL ${label} envoyé par email à ${dossier.locataire_email}`, auteur: "Agent", type: type === "edle" ? "edle" : "edls" };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { historique: hist });
    onSave({ historique: hist });
    setSendingEmail(false);
  };

  // ── COMPARAISON IA ─────────────────────────────────────────────
  const comparerEDL = async () => {
    if (!dossier.edle_checklist || !dossier.edls_checklist) return;
    setComparing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert EDL immobilier français. Compare ces deux états des lieux et identifie précisément les dégradations imputables au locataire.

EDL ENTRÉE: ${JSON.stringify(dossier.edle_checklist, null, 2)}
EDL SORTIE: ${JSON.stringify(dossier.edls_checklist, null, 2)}
Loyer de référence: ${dossier.loyer_mensuel || 0}€
Dépôt de garantie disponible: ${dossier.depot_garantie_montant || 0}€

Retourne JSON: {
  synthese: string (résumé en 2-3 phrases),
  degradations: [{piece: string, description: string, montant_estime: number, severite: "faible"|"moyen"|"eleve", imputable_locataire: boolean}],
  total_retenue_estime: number,
  etat_global: "bon"|"moyen"|"mauvais",
  recommandation_depot: string
}`,
      response_json_schema: {
        type: "object",
        properties: {
          synthese: { type: "string" },
          degradations: { type: "array", items: { type: "object" } },
          total_retenue_estime: { type: "number" },
          etat_global: { type: "string" },
          recommandation_depot: { type: "string" }
        }
      }
    });
    if (result) {
      setComparison(result);
      const histEntry = { date: new Date().toISOString(), action: `Comparaison EDL IA effectuée — ${result.degradations?.length || 0} dégradation(s), retenue estimée : ${result.total_retenue_estime || 0}€`, auteur: "IA", type: "edls" };
      const hist = [...(dossier.historique || []), histEntry];
      await base44.entities.DossierLocatif.update(dossier.id, {
        comparaison_edl: result,
        edls_degradations: result.degradations || [],
        depot_garantie_retenues: (result.degradations || []).filter(d => d.imputable_locataire).map(d => ({ motif: `${d.piece}: ${d.description}`, montant: d.montant_estime || 0 })),
        historique: hist
      });
      onSave({ comparaison_edl: result, edls_degradations: result.degradations || [], historique: hist });
    }
    setComparing(false);
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">{labelEmoji} État des lieux {label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{piecesRenseignees}/{pieces.length} pièces · {totalPhotos} photo{totalPhotos > 1 ? "s" : ""}</p>
        </div>
        {/* Barre de complétude */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${completude >= 80 ? "bg-green-500" : completude >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${completude}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{completude}%</span>
        </div>
      </div>

      {/* ── PDF ARCHIVÉ ────────────────────────────────────────── */}
      {archivedUrl && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">PDF archivé dans ce dossier</p>
          </div>
          <a href={archivedUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Voir PDF
          </a>
        </div>
      )}

      {/* ── DATE ET INFOS ──────────────────────────────────────── */}
      <div className="bg-slate-50 border border-border/50 rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date de l'EDL {label}</label>
            <Input type="date" value={dateEdl} onChange={e => setDateEdl(e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div className="flex items-end">
            <div className="text-xs space-y-0.5">
              <p><span className="text-muted-foreground">Locataire :</span> <span className="font-medium">{dossier.locataire_nom || "—"}</span></p>
              <p><span className="text-muted-foreground">Bien :</span> <span className="font-medium">{dossier.bien_titre || "—"}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ── AJOUTER PIÈCE ──────────────────────────────────────── */}
      <div className="flex gap-2">
        <Input value={nouvellePiece} onChange={e => setNouvellePiece(e.target.value)}
          placeholder="Ajouter une pièce (ex: Débarras, Cave…)"
          className="h-9 rounded-xl text-sm flex-1"
          onKeyDown={e => { if (e.key === "Enter" && nouvellePiece.trim()) { setPieces(p => [...p, nouvellePiece.trim()]); setNouvellePiece(""); }}} />
        <Button size="sm" variant="outline" className="h-9 rounded-full gap-1 flex-shrink-0"
          onClick={() => { if (nouvellePiece.trim()) { setPieces(p => [...p, nouvellePiece.trim()]); setNouvellePiece(""); }}}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {/* ── CHECKLIST PIÈCES ───────────────────────────────────── */}
      <div className="space-y-2">
        {pieces.map(p => (
          <EDLPieceCard
            key={p}
            piece={p}
            data={checklist[p] || {}}
            onChange={data => setChecklist(prev => ({ ...prev, [p]: data }))}
            onRemove={() => setPieces(prev => prev.filter(x => x !== p))}
            compareData={type === "edls" ? dossier.edle_checklist?.[p] : null}
          />
        ))}
      </div>

      {/* ── OBSERVATIONS ───────────────────────────────────────── */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Observations générales</label>
        <Textarea value={observations} onChange={e => setObservations(e.target.value)}
          placeholder="Remarques globales sur l'état du logement, équipements, mètres compteurs…"
          rows={3} className="rounded-xl text-sm resize-none" />
      </div>

      {/* ── SIGNATURES ─────────────────────────────────────────── */}
      <div className="bg-secondary/20 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Signatures</p>
        {[
          [signeLocataire, setSigneLocataire, "Locataire", dossier.locataire_nom],
          [signeProprietaire, setSigneProprietaire, "Agence / Propriétaire", agency?.name],
        ].map(([val, setter, role, nom]) => (
          <label key={role} className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} className="rounded accent-primary w-4 h-4" />
            <CheckCircle2 className={`w-4 h-4 transition-colors ${val ? "text-green-500" : "text-muted-foreground/30"}`} />
            <div>
              <span className="text-sm font-medium">{role}</span>
              {nom && <span className="text-xs text-muted-foreground ml-2">{nom}</span>}
              <span className={`ml-2 text-xs font-semibold ${val ? "text-green-600" : "text-muted-foreground/60"}`}>{val ? "✓ Signé" : "En attente"}</span>
            </div>
          </label>
        ))}
        {signeLocataire && signeProprietaire && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-bold text-green-800">EDL {label} signé par toutes les parties ✓</p>
          </div>
        )}
      </div>

      {/* ── ACTIONS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button className="rounded-full gap-1.5 h-9 text-xs" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Enregistrer
        </Button>
        <Button variant="outline" className="rounded-full gap-1.5 h-9 text-xs border-indigo-300 text-indigo-700" onClick={genererPDF} disabled={generating}>
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {generating ? "Génération…" : "Générer PDF"}
        </Button>
        {pdfBlob && (
          <>
            <Button variant="outline" className="rounded-full gap-1.5 h-9 text-xs" onClick={telechargerPDF}>
              <Download className="w-3.5 h-3.5" /> Télécharger
            </Button>
            <Button variant="outline" className="rounded-full gap-1.5 h-9 text-xs border-green-300 text-green-700" onClick={archiverPDF} disabled={archiving}>
              {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              {archiving ? "Archivage…" : "Archiver"}
            </Button>
          </>
        )}
        {dossier.locataire_email && (
          <Button variant="outline" className="rounded-full gap-1.5 h-9 text-xs border-blue-300 text-blue-700" onClick={envoyerEDL} disabled={sendingEmail}>
            {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sendingEmail ? "Envoi…" : "Envoyer email"}
          </Button>
        )}
        {type === "edls" && dossier.edle_checklist && (
          <Button className="rounded-full gap-1.5 h-9 text-xs bg-amber-500 hover:bg-amber-600" onClick={comparerEDL} disabled={comparing}>
            {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {comparing ? "Analyse IA…" : "Comparer avec entrée (IA)"}
          </Button>
        )}
      </div>

      {/* ── RÉSULTAT COMPARAISON IA ────────────────────────────── */}
      {comparison && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Comparaison EDL — Analyse IA</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              comparison.etat_global === "bon" ? "bg-green-100 text-green-700" :
              comparison.etat_global === "moyen" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}>{(comparison.etat_global || "").toUpperCase()}</span>
          </div>
          <p className="text-xs text-amber-900 italic">{comparison.synthese}</p>

          {comparison.degradations?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Dégradations identifiées :</p>
              {comparison.degradations.map((d, i) => (
                <div key={i} className={`flex items-start justify-between rounded-xl px-3 py-2 text-xs ${
                  d.severite === "eleve" ? "bg-red-50 border border-red-200" :
                  d.severite === "moyen" ? "bg-amber-50 border border-amber-200" : "bg-white border border-border/40"
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{d.piece} — {d.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${
                        d.severite === "eleve" ? "bg-red-100 text-red-700" :
                        d.severite === "moyen" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}>{d.severite}</span>
                      {d.imputable_locataire && <span className="text-[9px] text-red-600 font-medium">⚠ Imputable locataire</span>}
                    </div>
                  </div>
                  <span className="font-bold text-red-600 flex-shrink-0 ml-3">{d.montant_estime ? `${d.montant_estime} €` : "?"}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-red-600 text-white rounded-xl px-4 py-2.5">
                <span className="text-sm font-bold">Total retenue estimée</span>
                <span className="text-lg font-bold">{comparison.total_retenue_estime || 0} €</span>
              </div>
              {comparison.recommandation_depot && (
                <div className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                  <span className="font-semibold">Recommandation dépôt :</span> {comparison.recommandation_depot}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}