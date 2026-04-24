import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, FileText, Send, ExternalLink, Sparkles } from "lucide-react";

const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function TabBail({ dossier, onSave }) {
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [localData, setLocalData] = useState({
    date_debut_bail: dossier.date_debut_bail || "",
    date_fin_bail: dossier.date_fin_bail || "",
    duree_mois: dossier.duree_mois || 12,
    type_bail: dossier.type_bail || "vide",
    depot_garantie_montant: dossier.depot_garantie_montant || dossier.loyer_mensuel || 0,
    bail_url: dossier.bail_url || "",
    bail_signe: dossier.bail_signe || false,
  });
  const set = (k, v) => setLocalData(p => ({ ...p, [k]: v }));

  const saveLocale = async () => {
    await base44.entities.DossierLocatif.update(dossier.id, localData);
    onSave(localData);
  };

  const genererBail = async () => {
    setGenerating(true);
    const prompt = `Génère un contrat de bail locatif français complet au format HTML lisible.

Informations :
- Locataire : ${dossier.locataire_nom || "—"}
- Email locataire : ${dossier.locataire_email || "—"}
- Téléphone : ${dossier.locataire_telephone || "—"}
- Bien : ${dossier.bien_titre || "—"} — ${dossier.bien_adresse || "—"}
- Loyer mensuel : ${dossier.loyer_mensuel || 0} € + charges ${dossier.charges_mensuelle || 0} €
- Type de bail : ${localData.type_bail}
- Durée : ${localData.duree_mois} mois
- Date de début : ${localData.date_debut_bail || "À définir"}
- Dépôt de garantie : ${localData.depot_garantie_montant} €
- Propriétaire : ${dossier.proprietaire_nom || "—"}
- Agence : Gestion locative

Génère un bail complet avec : identification parties, description du bien, conditions financières, durée, dépôt de garantie, obligations, résiliation. Format HTML propre avec sections claires.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });

    if (result) {
      const blob = new Blob([`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}h1,h2,h3{color:#1e3a5f}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head><body>${result}</body></html>`], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `bail-${dossier.locataire_nom?.replace(/\s+/g, "-") || "locataire"}.html`;
      a.click(); URL.revokeObjectURL(url);
    }
    setGenerating(false);
  };

  const envoyerBail = async () => {
    if (!dossier.locataire_email) return;
    setSendingEmail(true);
    await base44.integrations.Core.SendEmail({
      to: dossier.locataire_email,
      subject: `Votre bail de location — ${dossier.bien_titre}`,
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<h2 style="color:#1e3a5f">Votre contrat de bail</h2>
<p>Bonjour ${dossier.locataire_nom},</p>
<p>Veuillez trouver ci-joint les informations de votre futur bail :</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Bien</td><td style="padding:8px;border:1px solid #ddd">${dossier.bien_titre} — ${dossier.bien_adresse}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Loyer</td><td style="padding:8px;border:1px solid #ddd">${dossier.loyer_mensuel} € / mois</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Type</td><td style="padding:8px;border:1px solid #ddd">${localData.type_bail}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Durée</td><td style="padding:8px;border:1px solid #ddd">${localData.duree_mois} mois</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Début</td><td style="padding:8px;border:1px solid #ddd">${fmt(localData.date_debut_bail)}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Dépôt de garantie</td><td style="padding:8px;border:1px solid #ddd">${localData.depot_garantie_montant} €</td></tr>
</table>
${localData.bail_url ? `<p><a href="${localData.bail_url}" style="color:#4F46E5">Accéder au bail en ligne →</a></p>` : ""}
<p>Cordialement,<br>L'agence de gestion</p>
</div>`,
    });
    setSendingEmail(false);
  };

  return (
    <div className="space-y-5">
      {/* Infos bail */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-purple-800 flex items-center gap-2"><FileText className="w-4 h-4" /> Informations du bail</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type de bail</label>
            <select value={localData.type_bail} onChange={e => set("type_bail", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="vide">Location vide</option>
              <option value="meuble">Location meublée</option>
              <option value="commercial">Bail commercial</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Durée (mois)</label>
            <Input type="number" value={localData.duree_mois} onChange={e => set("duree_mois", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Début du bail</label>
            <Input type="date" value={localData.date_debut_bail} onChange={e => set("date_debut_bail", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dépôt de garantie (€)</label>
            <Input type="number" value={localData.depot_garantie_montant} onChange={e => set("depot_garantie_montant", Number(e.target.value))} className="h-9 rounded-xl text-sm" />
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={saveLocale}>Enregistrer</Button>
      </div>

      {/* Génération bail */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Génération automatique du bail</p>
        <p className="text-xs text-muted-foreground">L'IA génère un contrat de bail complet au format HTML avec toutes les informations du dossier.</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={genererBail} disabled={generating}>
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {generating ? "Génération en cours…" : "Générer le bail (PDF/HTML)"}
          </Button>
          {dossier.locataire_email && (
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 h-8 text-xs border-indigo-300 text-indigo-700" onClick={envoyerBail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Envoyer par email
            </Button>
          )}
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white border border-border/50 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">✍️ Signature du bail</p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Lien bail / URL signature</label>
          <Input value={localData.bail_url} onChange={e => set("bail_url", e.target.value)}
            placeholder="https://docusign.com/… ou lien de votre document" className="h-9 rounded-xl text-sm" />
        </div>
        {localData.bail_url && (
          <a href={localData.bail_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> Ouvrir le lien
          </a>
        )}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={localData.bail_signe} onChange={e => set("bail_signe", e.target.checked)} className="rounded accent-primary w-4 h-4" />
          <CheckCircle2 className={`w-4 h-4 ${localData.bail_signe ? "text-green-500" : "text-muted-foreground/30"}`} />
          <span className="text-sm">Bail signé par toutes les parties</span>
        </label>
        {localData.bail_signe && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold text-green-800">Bail signé ✓ — Dossier actif</p>
          </div>
        )}
        <Button size="sm" className="rounded-full h-8 text-xs" onClick={() => {
          base44.entities.DossierLocatif.update(dossier.id, { ...localData, bail_statut: localData.bail_signe ? "actif" : "en_preparation", statut_dossier: localData.bail_signe ? "bail_signe" : dossier.statut_dossier });
          onSave({ ...localData, bail_statut: localData.bail_signe ? "actif" : "en_preparation", statut_dossier: localData.bail_signe ? "bail_signe" : dossier.statut_dossier });
        }}>Enregistrer</Button>
      </div>
    </div>
  );
}