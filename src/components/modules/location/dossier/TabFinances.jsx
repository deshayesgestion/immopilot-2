import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Euro, CheckCircle2, Clock, AlertTriangle, Loader2, Plus,
  Sparkles, Download, Send, FileText, RefreshCw, TrendingUp, XCircle
} from "lucide-react";
import { genererQuittancePDF, getMoisLabel } from "@/lib/quittancePDF";

const STATUT_CFG = {
  en_attente:       { label: "En attente",        cls: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock },
  paye:             { label: "Payé",               cls: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  en_retard:        { label: "En retard",          cls: "bg-orange-100 text-orange-700 border-orange-200",icon: AlertTriangle },
  impaye:           { label: "Impayé",             cls: "bg-red-100 text-red-800 border-red-300",         icon: XCircle },
  partiel:          { label: "Partiel",            cls: "bg-purple-100 text-purple-700 border-purple-200",icon: Clock },
};

const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtEur = n => (n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

const daysBetween = (d1, d2 = new Date()) => {
  const diff = new Date(d2) - new Date(d1);
  return Math.floor(diff / 86400000);
};

export default function TabFinances({ dossier }) {
  const [quittances, setQuittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState(null);
  const [generatingMois, setGeneratingMois] = useState(false);
  const [relancing, setRelancing] = useState(null);
  const [sendingQuittance, setSendingQuittance] = useState(null);
  const [pdfing, setPdfing] = useState(null);
  const [marking, setMarking] = useState(null);

  const load = async () => {
    setLoading(true);
    const [q, agList] = await Promise.all([
      base44.entities.Quittance.filter({ dossier_locatif_id: dossier.id }, "-created_date", 50),
      base44.entities.Agency.list(),
    ]);
    setQuittances(q);
    if (agList[0]) setAgency(agList[0]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dossier.id]);

  // ── STATS FINANCIÈRES ──────────────────────────────────────────
  const totalPaye = quittances.filter(q => q.statut === "paye").reduce((s,q) => s + (q.montant_total||0), 0);
  const totalDu = quittances.filter(q => q.statut !== "paye").reduce((s,q) => s + (q.montant_total||0), 0);
  const totalAttendu = quittances.reduce((s,q) => s + (q.montant_total||0), 0);
  const impayesCount = quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye").length;
  const nbMoisActifs = quittances.length;

  // ── GÉNÉRER LOYER MOIS COURANT ─────────────────────────────────
  const genererMoisCourant = async () => {
    const bailActif = dossier.statut_dossier === "bail_signe" || dossier.statut_dossier === "en_cours";
    if (!bailActif) return;
    setGeneratingMois(true);
    const now = new Date();
    const mois = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const exists = quittances.find(q => q.mois === mois);
    if (!exists) {
      const total = (dossier.loyer_mensuel||0) + (dossier.charges_mensuelle||0);
      const echeance = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().slice(0,10);
      const q = await base44.entities.Quittance.create({
        dossier_locatif_id: dossier.id,
        contact_id: dossier.contact_id,
        bien_id: dossier.bien_id,
        locataire_nom: dossier.locataire_nom,
        bien_titre: dossier.bien_titre,
        bien_adresse: dossier.bien_adresse,
        mois, mois_label: getMoisLabel(mois),
        montant_loyer: dossier.loyer_mensuel||0,
        montant_charges: dossier.charges_mensuelle||0,
        montant_total: total,
        statut: "en_attente",
        date_echeance: echeance,
      });
      setQuittances(p => [q, ...p]);
    }
    setGeneratingMois(false);
  };

  // ── MARQUER PAYÉ + GÉNÉRER QUITTANCE ──────────────────────────
  const marquerPaye = async (q) => {
    setMarking(q.id);
    const updData = {
      statut: "paye",
      date_paiement: new Date().toISOString().slice(0,10),
    };
    await base44.entities.Quittance.update(q.id, updData);
    setQuittances(p => p.map(x => x.id === q.id ? { ...x, ...updData } : x));
    setMarking(null);
  };

  const marquerRetard = async (q) => {
    await base44.entities.Quittance.update(q.id, { statut: "en_retard" });
    setQuittances(p => p.map(x => x.id === q.id ? { ...x, statut: "en_retard" } : x));
  };

  // ── GÉNÉRER + TÉLÉCHARGER PDF QUITTANCE ───────────────────────
  const genererPDF = async (q) => {
    setPdfing(q.id);
    const qFull = { ...q };
    const doc = genererQuittancePDF(qFull, agency);
    const fileName = `quittance-${q.locataire_nom?.replace(/\s+/g,"-") || "locataire"}-${q.mois || "mois"}.pdf`;
    doc.save(fileName);
    // Archiver l'URL
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Quittance.update(q.id, { pdf_url: file_url, email_envoye: false });
    setQuittances(p => p.map(x => x.id === q.id ? { ...x, pdf_url: file_url } : x));
    setPdfing(null);
  };

  // ── ENVOYER QUITTANCE EMAIL ────────────────────────────────────
  const envoyerQuittance = async (q) => {
    if (!dossier.locataire_email) return;
    setSendingQuittance(q.id);

    const doc = genererQuittancePDF(q, agency);
    const blob = doc.output("blob");
    const file = new File([blob], `quittance-${q.mois}.pdf`, { type: "application/pdf" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:${agency?.primary_color||"#4F46E5"};padding:26px 30px">
    <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700">${agency?.name||"Agence"}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Quittance de loyer — ${getMoisLabel(q.mois)}</p>
  </div>
  <div style="padding:28px 30px">
    <p style="color:#1e293b;font-size:15px;margin:0 0 12px">Bonjour <strong>${q.locataire_nom||""}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">Veuillez trouver ci-joint votre quittance de loyer pour <strong>${getMoisLabel(q.mois)}</strong>.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:22px">
      <table style="width:100%;font-size:14px">
        <tr><td style="padding:5px 0;color:#64748b;width:50%">Logement</td><td style="color:#1e293b;font-weight:600">${q.bien_titre||"—"}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">Période</td><td style="color:#1e293b;font-weight:600">${getMoisLabel(q.mois)}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">Loyer</td><td style="color:#1e293b">${fmtEur(q.montant_loyer)}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">Charges</td><td style="color:#1e293b">${fmtEur(q.montant_charges)}</td></tr>
        <tr style="border-top:2px solid #e2e8f0"><td style="padding:8px 0 0;color:#0f172a;font-weight:700;font-size:16px">TOTAL</td><td style="padding:8px 0 0;color:#0f172a;font-weight:700;font-size:16px">${fmtEur(q.montant_total)}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:0 0 22px"><a href="${file_url}" style="background:${agency?.primary_color||"#4F46E5"};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">📄 Télécharger ma quittance PDF</a></div>
    <p style="color:#475569;font-size:13px;line-height:1.7">Cordialement,<br><strong>${agency?.name||"L'agence"}</strong></p>
  </div>
  <div style="background:#f1f5f9;padding:14px 30px;text-align:center">
    <p style="margin:0;color:#94a3b8;font-size:11px">${agency?.address||""} • ${agency?.phone||""} • ${agency?.email||""}</p>
  </div>
</div>`;

    await base44.integrations.Core.SendEmail({
      to: dossier.locataire_email,
      subject: `Quittance de loyer — ${getMoisLabel(q.mois)} — ${dossier.bien_titre||""}`,
      body: emailBody
    });
    await base44.entities.Quittance.update(q.id, { pdf_url: file_url, email_envoye: true });
    setQuittances(p => p.map(x => x.id === q.id ? { ...x, pdf_url: file_url, email_envoye: true } : x));
    setSendingQuittance(null);
  };

  // ── RELANCE IA ────────────────────────────────────────────────
  const relanceIA = async (q, tonalite = "courtois") => {
    setRelancing(q.id);
    const jours = q.date_echeance ? daysBetween(q.date_echeance) : 0;
    const niveauRelance = (q.relance_count||0) + 1;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert gestion locative. Rédige un message de relance pour impayé de loyer.
Locataire : ${q.locataire_nom}, Bien : ${q.bien_titre}
Mois : ${getMoisLabel(q.mois)}, Montant : ${q.montant_total}€
Retard : ${jours} jour(s) — Relance n°${niveauRelance}
Tonalité : ${tonalite}

Retourne JSON: {
  sujet_email: string (max 80 chars),
  message_email: string (html court, max 300 chars, personnalisé),
  message_sms: string (max 160 chars, sans html),
  tonalite_appliquee: string
}`,
      response_json_schema: { type: "object", properties: {
        sujet_email: { type: "string" },
        message_email: { type: "string" },
        message_sms: { type: "string" },
        tonalite_appliquee: { type: "string" }
      }}
    });

    if (result?.message_email && dossier.locataire_email) {
      const emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #fca5a5;border-radius:12px;overflow:hidden">
  <div style="background:#dc2626;padding:22px 28px">
    <h1 style="margin:0;font-size:18px;color:#fff">${agency?.name||"Agence"}</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Rappel de paiement — ${getMoisLabel(q.mois)}</p>
  </div>
  <div style="padding:24px 28px">
    <p style="color:#1e293b;font-size:14px">${result.message_email}</p>
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px;margin:16px 0">
      <p style="margin:0;color:#7f1d1d;font-weight:600">Montant dû : ${fmtEur(q.montant_total)} — ${getMoisLabel(q.mois)}</p>
      ${jours > 0 ? `<p style="margin:4px 0 0;color:#991b1b;font-size:13px">Retard : ${jours} jour(s)</p>` : ""}
    </div>
    <p style="color:#475569;font-size:13px">Cordialement,<br><strong>${agency?.name||"L'agence"}</strong></p>
  </div>
</div>`;

      await base44.integrations.Core.SendEmail({
        to: dossier.locataire_email,
        subject: result.sujet_email,
        body: emailBody
      });

      const newStatut = niveauRelance >= 3 ? "impaye" : "en_retard";
      await base44.entities.Quittance.update(q.id, {
        statut: newStatut,
        relance_count: niveauRelance,
        relance_date: new Date().toISOString(),
      });
      setQuittances(p => p.map(x => x.id === q.id ? { ...x, statut: newStatut, relance_count: niveauRelance } : x));
    }
    setRelancing(null);
  };

  // ──────────────────────────────────────────────────────────────
  const bailActif = dossier.statut_dossier === "bail_signe" || dossier.statut_dossier === "en_cours";

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">

      {/* ── ALERTE BAIL INACTIF ──────────────────────────────── */}
      {!bailActif && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Bail non actif</p>
            <p className="text-xs text-amber-700 mt-0.5">La génération de loyers est possible uniquement si le bail est signé ou le dossier en cours.</p>
          </div>
        </div>
      )}

      {/* ── TABLEAU DE BORD FINANCIER ────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total encaissé",  value: fmtEur(totalPaye),    color: "text-green-600",  bg: "bg-green-50",  Icon: TrendingUp },
          { label: "Total dû",        value: fmtEur(totalDu),      color: "text-red-600",    bg: "bg-red-50",    Icon: Euro },
          { label: "Mensualités",     value: nbMoisActifs,          color: "text-blue-600",   bg: "bg-blue-50",   Icon: FileText },
          { label: "Impayés",         value: impayesCount,          color: "text-orange-600", bg: "bg-orange-50", Icon: AlertTriangle },
        ].map(s => {
          const Icon = s.Icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${s.bg}`}><Icon className={`w-3.5 h-3.5 ${s.color}`} /></div>
              </div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Barre de progression paiements */}
      {totalAttendu > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Taux d'encaissement</span>
            <span className="font-bold text-green-600">{Math.round((totalPaye / totalAttendu) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min((totalPaye / totalAttendu) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>{fmtEur(totalPaye)} encaissé</span>
            <span>{fmtEur(totalAttendu)} attendu</span>
          </div>
        </div>
      )}

      {/* ── ACTIONS RAPIDES ──────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <p className="text-sm font-semibold">Historique des paiements</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1" onClick={load}>
            <RefreshCw className="w-3 h-3" />
          </Button>
          {bailActif && (
            <Button size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={genererMoisCourant} disabled={generatingMois}>
              {generatingMois ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Générer loyer du mois
            </Button>
          )}
        </div>
      </div>

      {/* ── LISTE QUITTANCES ─────────────────────────────────── */}
      {quittances.length === 0 ? (
        <div className="text-center py-10 bg-secondary/20 rounded-2xl">
          <Euro className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune mensualité générée</p>
          {bailActif && <p className="text-xs text-muted-foreground/60 mt-1">Cliquez sur "Générer loyer du mois" pour commencer</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {quittances.map(q => {
            const cfg = STATUT_CFG[q.statut] || STATUT_CFG.en_attente;
            const Icon = cfg.icon;
            const joursRetard = (q.statut === "en_retard" || q.statut === "impaye") && q.date_echeance ? daysBetween(q.date_echeance) : 0;
            return (
              <div key={q.id} className={`bg-white rounded-2xl border transition-all ${
                q.statut === "impaye" ? "border-red-300 shadow-sm" : q.statut === "en_retard" ? "border-orange-200" : "border-border/50"
              }`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.cls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{getMoisLabel(q.mois)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${cfg.cls}`}>{cfg.label}</span>
                      {q.email_envoye && <span className="text-[10px] text-green-600">✓ Email envoyé</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-foreground">{fmtEur(q.montant_total)}</span>
                      {q.montant_charges > 0 && ` (loyer ${fmtEur(q.montant_loyer)} + charges ${fmtEur(q.montant_charges)})`}
                    </p>
                    {q.statut === "paye" && q.date_paiement && (
                      <p className="text-[10px] text-green-600 mt-0.5">Payé le {fmt(q.date_paiement)}</p>
                    )}
                    {joursRetard > 0 && (
                      <p className="text-[10px] text-red-600 mt-0.5 font-medium">
                        ⚠ {joursRetard} jour{joursRetard > 1 ? "s" : ""} de retard · Relance {q.relance_count||0}×
                      </p>
                    )}
                    {q.statut === "en_attente" && q.date_echeance && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Échéance : {fmt(q.date_echeance)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {q.statut === "en_attente" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full gap-1 border-green-300 text-green-700"
                          onClick={() => marquerPaye(q)} disabled={marking === q.id}>
                          {marking === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Payé
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full gap-1 border-orange-300 text-orange-700"
                          onClick={() => marquerRetard(q)}>
                          <AlertTriangle className="w-3 h-3" /> Retard
                        </Button>
                      </>
                    )}
                    {q.statut === "paye" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full gap-1 border-indigo-300 text-indigo-700"
                          onClick={() => genererPDF(q)} disabled={pdfing === q.id}>
                          {pdfing === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                        </Button>
                        {dossier.locataire_email && (
                          <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => envoyerQuittance(q)} disabled={sendingQuittance === q.id}>
                            {sendingQuittance === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Envoyer
                          </Button>
                        )}
                      </>
                    )}
                    {(q.statut === "en_retard" || q.statut === "impaye") && (
                      <RelanceMenu q={q} relancing={relancing} onRelance={relanceIA} />
                    )}
                    {q.pdf_url && (
                      <a href={q.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="h-7 text-[10px] rounded-full gap-1 border border-border/50 px-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                        <FileText className="w-3 h-3" /> Voir PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sous-composant menu relance ─────────────────────────────────
function RelanceMenu({ q, relancing, onRelance }) {
  const [open, setOpen] = useState(false);
  const TONALITES = [
    { id: "courtois", label: "🤝 Douce", cls: "text-blue-700" },
    { id: "ferme",    label: "⚡ Ferme",  cls: "text-orange-700" },
    { id: "urgent",   label: "🚨 Urgente", cls: "text-red-700" },
  ];
  return (
    <div className="relative">
      <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 bg-red-500 hover:bg-red-600"
        onClick={() => setOpen(o => !o)} disabled={relancing === q.id}>
        {relancing === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Relancer
      </Button>
      {open && (
        <div className="absolute right-0 top-8 bg-white border border-border/50 rounded-xl shadow-lg z-10 py-1 min-w-28" onClick={() => setOpen(false)}>
          {TONALITES.map(t => (
            <button key={t.id} onClick={() => onRelance(q, t.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 transition-colors ${t.cls}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}