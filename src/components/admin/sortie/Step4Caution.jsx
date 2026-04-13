import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Euro, Mail, Sparkles } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function Step4Caution({ dossier, onUpdate, onNext, onPrev }) {
  const isCautionDone = dossier.statut === "restitution_caution" || dossier.statut === "cloture";

  const [retenues, setRetenues] = useState(dossier.retenues || []);
  const [addingRetenue, setAddingRetenue] = useState(false);
  const [newRetenue, setNewRetenue] = useState({ motif: "", montant: "", justification: "" });
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailText, setEmailText] = useState("");

  const totalRetenues = retenues.reduce((s, r) => s + Number(r.montant || 0), 0);
  const restitution = Math.max(0, (dossier.depot_garantie || 0) - totalRetenues);
  const restitutionPartielle = totalRetenues > 0 && restitution > 0;
  const restitutionAucune = restitution === 0 && totalRetenues > 0;

  const addRetenue = () => {
    if (!newRetenue.motif || !newRetenue.montant) return;
    setRetenues([...retenues, { id: Date.now(), ...newRetenue, montant: Number(newRetenue.montant) }]);
    setNewRetenue({ motif: "", montant: "", justification: "" });
    setAddingRetenue(false);
  };

  const removeRetenue = (id) => setRetenues(retenues.filter(r => r.id !== id));

  const validerCaution = async () => {
    setSaving(true);
    await base44.entities.DossierSortie.update(dossier.id, {
      retenues,
      restitution_montant: restitution,
      statut: "restitution_caution",
      historique: [
        ...(dossier.historique || []),
        { id: Date.now(), content: `Caution calculée : restitution de ${fmt(restitution)} (retenues : ${fmt(totalRetenues)}).`, date: new Date().toISOString() },
      ],
    });
    setSaving(false);
    onUpdate();
    onNext();
  };

  const saveRetenues = async () => {
    setSaving(true);
    await base44.entities.DossierSortie.update(dossier.id, { retenues, restitution_montant: restitution });
    setSaving(false);
    onUpdate();
  };

  const genererEmail = async () => {
    setGeneratingEmail(true);
    const text = await base44.integrations.Core.InvokeLLM({
      prompt: `Rédige un email professionnel et courtois à destination du locataire ${dossier.locataire?.nom} pour l'informer du calcul de restitution de sa caution.

Bien : ${dossier.property_title}
Caution versée : ${fmt(dossier.depot_garantie)}
${retenues.length > 0 ? `Retenues :\n${retenues.map(r => `- ${r.motif} : ${fmt(r.montant)}${r.justification ? ` (${r.justification})` : ""}`).join("\n")}` : "Aucune retenue"}
Montant restitué : ${fmt(restitution)}
${restitutionAucune ? "La caution ne sera pas restituée en raison des dégradations constatées." : ""}

L'email doit être professionnel, expliquer les retenues éventuelles avec les justifications, et indiquer le délai légal de restitution (1 mois si pas de retenues, 2 mois sinon).`,
    });
    setEmailText(text);
    setGeneratingEmail(false);
  };

  const envoyerEmail = async () => {
    if (!dossier.locataire?.email || !emailText) return;
    setSendingEmail(true);
    await base44.integrations.Core.SendEmail({
      to: dossier.locataire.email,
      subject: `Restitution de votre caution — ${dossier.property_title}`,
      body: emailText,
    });
    await base44.entities.DossierSortie.update(dossier.id, {
      historique: [
        ...(dossier.historique || []),
        { id: Date.now(), content: "Email de restitution de caution envoyé au locataire.", date: new Date().toISOString() },
      ],
    });
    setSendingEmail(false);
    setEmailSent(true);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Résumé caution */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Euro className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-lg font-bold">{fmt(dossier.depot_garantie)}</p>
          <p className="text-xs text-muted-foreground">Caution versée</p>
        </div>
        <div className={`border rounded-xl p-4 ${totalRetenues > 0 ? "bg-red-50 border-red-100" : "bg-white border-border/50"}`}>
          <Trash2 className={`w-4 h-4 mb-2 ${totalRetenues > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          <p className={`text-lg font-bold ${totalRetenues > 0 ? "text-red-600" : ""}`}>- {fmt(totalRetenues)}</p>
          <p className="text-xs text-muted-foreground">Retenues</p>
        </div>
        <div className={`border rounded-xl p-4 ${restitutionAucune ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <CheckCircle2 className={`w-4 h-4 mb-2 ${restitutionAucune ? "text-red-500" : "text-green-600"}`} />
          <p className={`text-lg font-bold ${restitutionAucune ? "text-red-600" : "text-green-700"}`}>{fmt(restitution)}</p>
          <p className="text-xs text-muted-foreground">À restituer</p>
        </div>
      </div>

      {/* Retenues */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Retenues sur caution</p>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={() => setAddingRetenue(true)}>
            <Plus className="w-3 h-3" /> Ajouter
          </Button>
        </div>

        {addingRetenue && (
          <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-secondary/10">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Motif *</label>
                <Input value={newRetenue.motif} onChange={(e) => setNewRetenue({ ...newRetenue, motif: e.target.value })} className="h-8 text-sm" placeholder="ex: Dégradation salle de bain" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Montant (€) *</label>
                <Input type="number" value={newRetenue.montant} onChange={(e) => setNewRetenue({ ...newRetenue, montant: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Justification (obligatoire)</label>
              <Input value={newRetenue.justification} onChange={(e) => setNewRetenue({ ...newRetenue, justification: e.target.value })} className="h-8 text-sm" placeholder="Devis, facture, photos EDL..." />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAddingRetenue(false)}>Annuler</Button>
              <Button size="sm" className="rounded-full h-8 text-xs" onClick={addRetenue} disabled={!newRetenue.motif || !newRetenue.montant}>Ajouter</Button>
            </div>
          </div>
        )}

        {retenues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune retenue — restitution intégrale</p>
        ) : (
          <div className="space-y-2">
            {retenues.map((r) => (
              <div key={r.id} className="flex items-start justify-between px-4 py-3 bg-red-50 border border-red-100 rounded-xl gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.motif}</p>
                  {r.justification && <p className="text-xs text-muted-foreground mt-0.5">{r.justification}</p>}
                </div>
                <p className="text-sm font-bold text-red-600 flex-shrink-0">- {fmt(r.montant)}</p>
                <button onClick={() => removeRetenue(r.id)} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Récap légal */}
        <div className="bg-secondary/20 rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground">
            ⏱ Délai légal de restitution :
            {totalRetenues === 0
              ? " 1 mois après remise des clés"
              : " 2 mois après remise des clés (retenues justifiées)"}
          </p>
        </div>
      </div>

      {/* Email locataire */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Email de restitution
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={genererEmail} disabled={generatingEmail}>
            {generatingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Générer avec l'IA
          </Button>
          {emailText && (
            <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={envoyerEmail} disabled={sendingEmail || emailSent}>
              {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : emailSent ? <CheckCircle2 className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
              {emailSent ? "Email envoyé" : `Envoyer à ${dossier.locataire?.email}`}
            </Button>
          )}
        </div>
        {emailText && (
          <div className="bg-secondary/10 border border-border/50 rounded-xl p-4">
            <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed">{emailText}</pre>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full gap-2" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
        <div className="flex gap-2">
          {isCautionDone ? (
            <Button className="rounded-full gap-2" onClick={onNext}>
              Clôture <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="rounded-full gap-2 bg-green-600 hover:bg-green-700" onClick={validerCaution} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Valider la caution
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}