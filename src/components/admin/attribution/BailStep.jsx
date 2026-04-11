import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Loader2, FileText, Mail, CheckCircle2,
  Download, Edit3, Eye, EyeOff, Send
} from "lucide-react";

export default function BailStep({ dossier, onUpdate }) {
  const [bail, setBail] = useState(dossier.contrat_bail || null);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedBail, setEditedBail] = useState("");
  const [sending, setSending] = useState(false);
  const [signing, setSigning] = useState(false);
  const [emailSent, setEmailSent] = useState(!!dossier.bail_email_sent);
  const [signed, setSigned] = useState(!!dossier.bail_signe);

  const locataire = dossier.locataire_selectionne;
  const isReady = !!locataire;

  const generateBail = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un bail de location résidentiel professionnel et complet en français.

Informations du bien:
- Titre: ${dossier.property_title || "N/A"}
- Adresse: ${dossier.property_address || "N/A"}
- Loyer: ${dossier.loyer || 0}€/mois
- Charges: ${dossier.charges || 0}€/mois
- Dépôt de garantie: ${dossier.depot_garantie || 0}€
- Propriétaire/Bailleur: ${dossier.owner_name || "Le Bailleur"}

Informations du locataire:
- Nom: ${locataire?.nom || "N/A"}
- Email: ${locataire?.email || "N/A"}

Date d'entrée: à compléter
Durée: bail à usage d'habitation principale - 1 an renouvelable

Génère un bail complet avec:
1. Désignation des parties
2. Désignation du logement
3. Durée du bail
4. Loyer et charges
5. Dépôt de garantie
6. Obligations du bailleur
7. Obligations du locataire
8. Résiliation
9. Clauses particulières
10. Signatures

Format professionnel, juridiquement cohérent avec la loi française (loi Alur). Utilise des tirets et sections claires. Ne mets pas de balises markdown, uniquement du texte structuré.`,
    });
    const newBail = result;
    setBail(newBail);
    setEditing(false);
    await base44.entities.DossierLocatif.update(dossier.id, { contrat_bail: newBail });
    setGenerating(false);
  };

  const saveBailEdits = async () => {
    await base44.entities.DossierLocatif.update(dossier.id, { contrat_bail: editedBail });
    setBail(editedBail);
    setEditing(false);
  };

  const sendByEmail = async () => {
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: locataire?.email,
      subject: "Votre bail de location — Signature requise",
      body: `Bonjour ${locataire?.nom},\n\nVeuillez trouver ci-joint votre bail de location pour le bien : ${dossier.property_title}.\n\nMerci de nous confirmer votre accord par retour d'email, ou de contacter votre agent pour procéder à la signature.\n\n--- BAIL ---\n\n${bail}\n\n---\n\nCordialement,\n${dossier.agent_name || "L'agence"}`,
    });
    await base44.entities.DossierLocatif.update(dossier.id, { bail_email_sent: true });
    setEmailSent(true);
    setSending(false);
  };

  const markSigned = async () => {
    setSigning(true);
    const stepsCompleted = [...(dossier.steps_completed || [])];
    if (!stepsCompleted.includes(3)) stepsCompleted.push(3);
    await base44.entities.DossierLocatif.update(dossier.id, {
      bail_signe: true,
      steps_completed: stepsCompleted,
      current_step: Math.max(dossier.current_step || 1, 4),
    });
    setSigned(true);
    setSigning(false);
    onUpdate();
  };

  const downloadBail = () => {
    const blob = new Blob([bail], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bail-${dossier.reference || "location"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isReady) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Génération du bail</p>
        <div className="border-2 border-dashed border-amber-200 bg-amber-50/40 rounded-2xl py-10 text-center">
          <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-700">Aucun locataire sélectionné</p>
          <p className="text-xs text-amber-600/70 mt-0.5">Validez un candidat à l'étape "Validation" pour générer le bail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Génération du bail</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Locataire : <span className="font-medium">{locataire.nom}</span> · {locataire.email}
          </p>
        </div>
        {signed && (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bail signé
          </span>
        )}
      </div>

      {/* Generate */}
      {!bail ? (
        <div className="border-2 border-dashed border-border/40 rounded-2xl py-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-4">Aucun bail généré</p>
          <Button className="rounded-full gap-2 h-9 text-sm" onClick={generateBail} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Générer le bail avec l'IA
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Document preview / edit */}
          {editing ? (
            <div className="space-y-2">
              <Textarea
                className="text-xs font-mono rounded-xl resize-none min-h-[400px] bg-secondary/20"
                value={editedBail}
                onChange={(e) => setEditedBail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setEditing(false)}>Annuler</Button>
                <Button size="sm" className="rounded-full h-8 text-xs" onClick={saveBailEdits}>Enregistrer</Button>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/20 border border-border/40 rounded-2xl p-5 max-h-[380px] overflow-y-auto">
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{bail}</pre>
            </div>
          )}

          {/* Actions */}
          {!editing && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm" variant="outline"
                className="rounded-full gap-1.5 text-xs h-8"
                onClick={() => { setEditing(true); setEditedBail(bail); }}
              >
                <Edit3 className="w-3.5 h-3.5" /> Modifier
              </Button>
              <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={downloadBail}>
                <Download className="w-3.5 h-3.5" /> Télécharger
              </Button>
              <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={generateBail} disabled={generating}>
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                Régénérer
              </Button>
            </div>
          )}

          {/* Send for signature */}
          {!editing && (
            <div className="border border-border/50 rounded-2xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Signature électronique</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Envoyez le bail à <strong>{locataire.email}</strong> pour signature
                  </p>
                </div>
                {emailSent && (
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full">Email envoyé ✓</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={emailSent ? "outline" : "default"}
                  className="rounded-full gap-1.5 text-xs h-9"
                  onClick={sendByEmail}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {emailSent ? "Renvoyer le bail" : "Envoyer pour signature"}
                </Button>

                {!signed && (
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 text-xs h-9 bg-green-600 hover:bg-green-700"
                    onClick={markSigned}
                    disabled={signing}
                  >
                    {signing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Marquer comme signé
                  </Button>
                )}
              </div>

              {signed && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 font-medium">Bail signé · Étape suivante débloquée</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}