import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, CheckCircle2, Globe, Archive, Mail, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function genererPDFSortie(dossier) {
  const doc = new jsPDF();
  const totalRetenues = (dossier.retenues || []).reduce((s, r) => s + Number(r.montant || 0), 0);
  const restitution = Math.max(0, (dossier.depot_garantie || 0) - totalRetenues);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DOSSIER DE SORTIE", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Référence : ${dossier.reference || "—"}`, 20, 35);
  doc.text(`Généré le : ${new Date().toLocaleDateString("fr-FR")}`, 20, 42);

  let y = 55;

  // Bien & locataire
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. INFORMATIONS GÉNÉRALES", 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Bien : ${dossier.property_title || "—"}`, 20, y); y += 6;
  doc.text(`Adresse : ${dossier.property_address || "—"}`, 20, y); y += 6;
  doc.text(`Locataire : ${dossier.locataire?.nom || "—"}`, 20, y); y += 6;
  doc.text(`Email : ${dossier.locataire?.email || "—"}`, 20, y); y += 6;
  doc.text(`Date d'entrée : ${fmtDate(dossier.date_entree)}`, 20, y); y += 6;
  doc.text(`Date de sortie : ${fmtDate(dossier.date_sortie_effective)}`, 20, y); y += 6;
  doc.text(`Agent : ${dossier.agent_name || dossier.agent_email || "—"}`, 20, y); y += 12;

  // Financier
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. FINANCES", 20, y); y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Loyer mensuel : ${fmt(dossier.loyer)}`, 20, y); y += 6;
  doc.text(`Charges : ${fmt(dossier.charges)}`, 20, y); y += 6;
  doc.text(`Caution versée : ${fmt(dossier.depot_garantie)}`, 20, y); y += 6;

  if (dossier.retenues?.length > 0) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Retenues sur caution :", 20, y); y += 6;
    doc.setFont("helvetica", "normal");
    dossier.retenues.forEach((r) => {
      doc.text(`  - ${r.motif} : ${fmt(r.montant)}${r.justification ? ` (${r.justification})` : ""}`, 20, y); y += 6;
    });
  }

  doc.setFont("helvetica", "bold");
  doc.text(`Montant restitué : ${fmt(restitution)}`, 20, y); y += 12;

  // EDL sortie résumé
  if (dossier.edl_sortie?.checklist?.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("3. ÉTAT DES LIEUX DE SORTIE", 20, y); y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Réalisé le : ${fmtDate(dossier.edl_sortie.date)} — Signé par : ${dossier.edl_sortie.signataire || "—"}`, 20, y); y += 8;
    dossier.edl_sortie.checklist.forEach((cat) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(cat.label, 20, y); y += 5;
      doc.setFont("helvetica", "normal");
      cat.items.forEach((item) => {
        if (item.etat) {
          doc.text(`  ${item.label} : ${item.etat}${item.commentaire ? ` — ${item.commentaire}` : ""}`, 20, y); y += 5;
        }
      });
      y += 2;
    });
  }

  // Historique
  if (dossier.historique?.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("4. HISTORIQUE", 20, y); y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    dossier.historique.forEach((h) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${fmtDate(h.date)} — ${h.content}`, 20, y); y += 5;
    });
  }

  doc.save(`dossier-sortie-${dossier.reference || dossier.id}.pdf`);
}

export default function Step5Cloture({ dossier, onUpdate, onPrev }) {
  const isCloture = dossier.statut === "cloture";
  const [confirming, setConfirming] = useState(false);
  const [cloturing, setCloturing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailText, setEmailText] = useState("");

  const totalRetenues = (dossier.retenues || []).reduce((s, r) => s + Number(r.montant || 0), 0);
  const restitution = Math.max(0, (dossier.depot_garantie || 0) - totalRetenues);

  const cloturerDossier = async () => {
    setCloturing(true);
    // Mettre le bien en disponible sur le site
    if (dossier.property_id) {
      await base44.entities.Property.update(dossier.property_id, {
        status: "disponible",
        publish_site: true,
        available_date: null,
      });
    }
    await base44.entities.DossierSortie.update(dossier.id, {
      statut: "cloture",
      date_sortie_effective: dossier.date_sortie_effective || new Date().toISOString(),
      historique: [
        ...(dossier.historique || []),
        { id: Date.now(), content: "Dossier de sortie clôturé. Le bien a été remis en disponible sur le site.", date: new Date().toISOString() },
      ],
    });
    setCloturing(false);
    setConfirming(false);
    onUpdate();
  };

  const genererEmailFinal = async () => {
    setGeneratingEmail(true);
    const text = await base44.integrations.Core.InvokeLLM({
      prompt: `Rédige un email de clôture de dossier locatif à l'attention de ${dossier.locataire?.nom}, locataire du bien "${dossier.property_title}".

Résumé du dossier :
- Date d'entrée : ${fmtDate(dossier.date_entree)}
- Date de sortie : ${fmtDate(dossier.date_sortie_effective)}
- Caution initiale : ${fmt(dossier.depot_garantie)}
- Retenues : ${fmt(totalRetenues)}${dossier.retenues?.length > 0 ? "\n" + dossier.retenues.map(r => `  • ${r.motif}: ${fmt(r.montant)}`).join("\n") : ""}
- Montant restitué : ${fmt(restitution)}

Ton de l'email : professionnel, courtois, bienveillant. Mentionner le délai de restitution et remercier le locataire pour la période de location.`,
    });
    setEmailText(text);
    setGeneratingEmail(false);
  };

  const envoyerEmailFinal = async () => {
    if (!dossier.locataire?.email || !emailText) return;
    setSendingEmail(true);
    await base44.integrations.Core.SendEmail({
      to: dossier.locataire.email,
      subject: `Clôture de votre dossier locatif — ${dossier.property_title}`,
      body: emailText,
    });
    await base44.entities.DossierSortie.update(dossier.id, {
      historique: [
        ...(dossier.historique || []),
        { id: Date.now(), content: "Email de clôture envoyé au locataire.", date: new Date().toISOString() },
      ],
    });
    setSendingEmail(false);
    setEmailSent(true);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Récap complet */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold">Récapitulatif du dossier</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Locataire", value: dossier.locataire?.nom || "—" },
            { label: "Date de sortie", value: fmtDate(dossier.date_sortie_effective) },
            { label: "Caution", value: fmt(dossier.depot_garantie) },
            { label: "À restituer", value: fmt(restitution), color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-secondary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-sm font-semibold ${color || ""}`}>{value}</p>
            </div>
          ))}
        </div>

        {dossier.retenues?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Retenues</p>
            <div className="space-y-1.5">
              {dossier.retenues.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs">{r.motif}</p>
                  <p className="text-xs font-bold text-red-600">- {fmt(r.montant)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold">Actions</p>

        {/* PDF */}
        <button
          onClick={() => genererPDFSortie(dossier)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/50 hover:bg-secondary/30 transition-colors text-left"
        >
          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Générer le PDF complet</p>
            <p className="text-xs text-muted-foreground">Dossier de sortie avec EDL, retenues et historique</p>
          </div>
        </button>

        {/* Email final */}
        <div className="border border-border/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-medium">Email final au locataire</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1" onClick={genererEmailFinal} disabled={generatingEmail}>
              {generatingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Générer
            </Button>
          </div>
          {emailText && (
            <>
              <div className="bg-secondary/10 rounded-xl p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed">{emailText}</pre>
              </div>
              <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={envoyerEmailFinal} disabled={sendingEmail || emailSent}>
                {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : emailSent ? <CheckCircle2 className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                {emailSent ? "Email envoyé ✓" : "Envoyer au locataire"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Clôture */}
      {!isCloture ? (
        <div className={`rounded-2xl border p-5 space-y-4 ${confirming ? "bg-amber-50 border-amber-200" : "bg-white border-border/50 shadow-sm"}`}>
          {confirming ? (
            <>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Confirmer la clôture du dossier ?</p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1">
                    <li>✓ Le dossier sera archivé définitivement</li>
                    <li>✓ Le bien sera remis à "Disponible" sur le site vitrine</li>
                    <li>✓ Le statut "Occupé" sera supprimé</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full h-9 text-sm" onClick={() => setConfirming(false)}>Annuler</Button>
                <Button className="rounded-full h-9 text-sm gap-2 bg-gray-800 hover:bg-gray-900" onClick={cloturerDossier} disabled={cloturing}>
                  {cloturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  Clôturer définitivement
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Clôturer le dossier de sortie</p>
                <p className="text-xs text-muted-foreground mt-0.5">Archive le dossier et remet le bien en location</p>
              </div>
              <Button className="rounded-full gap-2 bg-green-600 hover:bg-green-700" onClick={() => setConfirming(true)}>
                <Globe className="w-4 h-4" /> Clôturer & remettre en location
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Dossier clôturé</p>
            <p className="text-xs text-green-700 mt-0.5">Le bien a été remis en disponible sur le site vitrine.</p>
          </div>
        </div>
      )}

      {/* Historique */}
      {(dossier.historique?.length > 0) && (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold">Historique du dossier</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...dossier.historique].reverse().map((h, i) => (
              <div key={i} className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">{new Date(h.date).toLocaleString("fr-FR")}</p>
                <p className="text-xs mt-0.5">{h.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full gap-2" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
      </div>
    </div>
  );
}