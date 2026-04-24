import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  X, User, Home, FileText, Calendar, MessageSquare, Download,
  Send, Loader2, CheckCircle2, Euro, Eye, Handshake, BadgeCheck,
  Phone, Mail, ArrowRight, Star, Plus, Users
} from "lucide-react";

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const OFFRE_STATUS = {
  en_attente:    { label: "En attente",    cls: "bg-amber-100 text-amber-700" },
  acceptee:      { label: "Acceptée",      cls: "bg-green-100 text-green-700" },
  refusee:       { label: "Refusée",       cls: "bg-red-100 text-red-700" },
  en_negociation:{ label: "Négociation",   cls: "bg-blue-100 text-blue-700" },
};

const TABS = [
  { id: "resume",    label: "Résumé",      emoji: "📋" },
  { id: "acquereurs",label: "Acquéreurs",  emoji: "👥" },
  { id: "offres",    label: "Offres",      emoji: "🤝" },
  { id: "visites",   label: "Visites",     emoji: "🏠" },
  { id: "historique",label: "Historique",  emoji: "📅" },
];

export default function VenteDossierUnifie({ mandat: init, bien, acquereurs, onClose, onUpdate }) {
  const [mandat, setMandat] = useState(init);
  const [tab, setTab] = useState("resume");
  const [visites, setVisites] = useState([]);
  const [agency, setAgency] = useState(null);
  const [sending, setSending] = useState(false);
  const [offreForm, setOffreForm] = useState({ montant: "", acquereur_nom: "", statut: "en_attente", conditions: "" });
  const [ajoutVisite, setAjoutVisite] = useState(false);
  const [visiteForm, setVisiteForm] = useState({ date_debut: "", contact_nom: "", notes: "" });
  const [savingVisite, setSavingVisite] = useState(false);

  useEffect(() => {
    base44.entities.Evenement.filter({ bien_id: init.bien_id, type: "visite" }).then(setVisites);
    base44.entities.Agency.list().then(l => l[0] && setAgency(l[0]));
  }, [init.bien_id]);

  const acqCompatibles = acquereurs.filter(a =>
    a.budget_max >= (mandat.prix_demande || 0) * 0.85 &&
    a.etape !== "perdu" && a.etape !== "acte"
  );

  const update = async (patch) => {
    const hist = [...(mandat.historique || []), { date: new Date().toISOString(), action: patch._action || "Mise à jour", auteur: "Agent" }];
    delete patch._action;
    await base44.entities.MandatVente.update(mandat.id, { ...patch, historique: hist });
    const updated = { ...mandat, ...patch, historique: hist };
    setMandat(updated);
    onUpdate?.(updated);
  };

  const envoyerEmail = async () => {
    if (!mandat.vendeur_email) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: mandat.vendeur_email,
      subject: `Suivi de votre vente — ${bien?.titre || ""}`,
      body: `<p>Bonjour ${mandat.vendeur_nom},</p><p>Voici un point de situation sur votre bien en vente : <strong>${bien?.titre || ""}</strong>.</p><p>Votre dossier est actuellement en phase : <strong>${mandat.kanban_etape || mandat.statut_mandat}</strong>.</p><p>Nous restons disponibles pour toute question.</p><p>Cordialement,<br>${agency?.name || "L'agence"}</p>`,
    });
    await update({ _action: `Email de suivi envoyé à ${mandat.vendeur_email}` });
    setSending(false);
  };

  const ajouterOffre = async () => {
    if (!offreForm.montant) return;
    const offres = [...(mandat.offres || []), {
      id: Date.now(),
      acquereur_nom: offreForm.acquereur_nom,
      montant: Number(offreForm.montant),
      statut: "en_attente",
      conditions: offreForm.conditions,
      date: new Date().toISOString(),
    }];
    await update({ offres, kanban_etape: "offre", _action: `Offre enregistrée : ${fmtEur(Number(offreForm.montant))} par ${offreForm.acquereur_nom}` });
    setOffreForm({ montant: "", acquereur_nom: "", statut: "en_attente", conditions: "" });
  };

  const changerStatutOffre = async (idx, statut) => {
    const offres = (mandat.offres || []).map((o, i) => i === idx ? { ...o, statut } : o);
    const newEtape = statut === "acceptee" ? "negociation" : mandat.kanban_etape;
    await update({ offres, kanban_etape: newEtape, _action: `Offre ${statut}` });
  };

  const planifierVisite = async () => {
    if (!visiteForm.date_debut) return;
    setSavingVisite(true);
    const ev = await base44.entities.Evenement.create({
      titre: `Visite — ${bien?.titre || mandat.vendeur_nom}`,
      type: "visite", module: "vente",
      date_debut: visiteForm.date_debut,
      date_fin: new Date(new Date(visiteForm.date_debut).getTime() + 3600000).toISOString().slice(0, 16),
      lieu: bien?.adresse || "",
      contact_nom: visiteForm.contact_nom,
      bien_titre: bien?.titre || "", bien_id: mandat.bien_id,
      notes: visiteForm.notes, statut: "planifie",
    });
    setVisites(p => [ev, ...p]);
    await update({ kanban_etape: "visites", _action: `Visite planifiée le ${fmtDate(visiteForm.date_debut)} — ${visiteForm.contact_nom}` });
    setVisiteForm({ date_debut: "", contact_nom: "", notes: "" });
    setAjoutVisite(false);
    setSavingVisite(false);
  };

  const scoreColor = s => s >= 70 ? "text-green-600" : s >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold truncate">{bien?.titre || mandat.vendeur_nom}</h2>
              {mandat.prix_demande > 0 && <span className="text-sm font-black text-primary">{fmtEur(mandat.prix_demande)}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">👤 {mandat.vendeur_nom} · {mandat.type_mandat || "simple"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={envoyerEmail} disabled={!mandat.vendeur_email || sending}
              className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Envoyer email">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-blue-600" />}
            </button>
            {mandat.vendeur_telephone && (
              <a href={`tel:${mandat.vendeur_telephone}`}
                className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors" title="Appeler">
                <Phone className="w-3.5 h-3.5 text-green-600" />
              </a>
            )}
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 py-2 border-b overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                tab === t.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Résumé ── */}
          {tab === "resume" && (
            <div className="space-y-4">
              {bien?.photo_principale && (
                <img src={bien.photo_principale} alt={bien.titre} className="w-full h-40 object-cover rounded-xl" />
              )}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "Vendeur", v: mandat.vendeur_nom },
                  { l: "Email",   v: mandat.vendeur_email },
                  { l: "Tél.",    v: mandat.vendeur_telephone },
                  { l: "Prix",    v: fmtEur(mandat.prix_demande) },
                  { l: "Commission", v: `${mandat.commission_taux || 5}%` },
                  { l: "Durée",   v: `${mandat.duree_mandat_mois || 3} mois` },
                  { l: "Début",   v: fmtDate(mandat.date_debut_mandat) },
                  { l: "Fin",     v: fmtDate(mandat.date_fin_mandat) },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-secondary/20 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">{l}</p>
                    <p className="text-xs font-medium mt-0.5">{v || "—"}</p>
                  </div>
                ))}
              </div>
              {/* Statut mandat */}
              <div className="flex gap-2 flex-wrap">
                {mandat.statut_mandat !== "signe" && (
                  <Button size="sm" className="h-8 text-xs rounded-full gap-1.5 bg-green-500 hover:bg-green-600" onClick={() => update({ statut_mandat: "signe", _action: "Mandat signé" })}>
                    <BadgeCheck className="w-3 h-3" /> Mandat signé
                  </Button>
                )}
                {["vendu"].includes(mandat.kanban_etape) && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Vente finalisée
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Acquéreurs compatibles ── */}
          {tab === "acquereurs" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{acqCompatibles.length} acquéreur(s) compatible(s) avec ce bien</p>
              {acqCompatibles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun acquéreur compatible dans le pipeline</p>
                </div>
              ) : acqCompatibles.map(a => (
                <div key={a.id} className="bg-white border border-border/50 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{a.nom}</p>
                        {a.scoring_ia > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.scoring_ia >= 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            <Star className="w-2.5 h-2.5 inline" /> {a.scoring_ia}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Budget {fmtEur(a.budget_min)} – {fmtEur(a.budget_max)}</p>
                      {a.email && <p className="text-xs text-muted-foreground">{a.email}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      {a.telephone && <a href={`tel:${a.telephone}`} className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-green-600" /></a>}
                      {a.email && <a href={`mailto:${a.email}`} className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-blue-600" /></a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Offres ── */}
          {tab === "offres" && (
            <div className="space-y-4">
              {/* Formulaire offre rapide */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-purple-800 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5" /> Enregistrer une offre</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Acquéreur</label>
                    <input value={offreForm.acquereur_nom} onChange={e => setOffreForm(p => ({ ...p, acquereur_nom: e.target.value }))}
                      placeholder="Nom de l'acquéreur" className="w-full h-8 text-xs border border-input rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label>
                    <input type="number" value={offreForm.montant} onChange={e => setOffreForm(p => ({ ...p, montant: e.target.value }))}
                      placeholder="Ex: 250000" className="w-full h-8 text-xs border border-input rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Conditions</label>
                    <input value={offreForm.conditions} onChange={e => setOffreForm(p => ({ ...p, conditions: e.target.value }))}
                      placeholder="Prêt, comptant…" className="w-full h-8 text-xs border border-input rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                </div>
                <Button size="sm" className="rounded-full gap-1.5 h-7 text-xs bg-purple-600 hover:bg-purple-700" onClick={ajouterOffre} disabled={!offreForm.montant}>
                  <Plus className="w-3 h-3" /> Enregistrer
                </Button>
              </div>

              {/* Liste offres */}
              {(mandat.offres || []).length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">Aucune offre enregistrée</p>
                : (mandat.offres || []).map((o, i) => (
                  <div key={i} className="bg-white border border-border/50 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{o.acquereur_nom || "Acquéreur inconnu"}</p>
                        <p className="text-base font-black text-purple-700 mt-0.5">{fmtEur(o.montant)}</p>
                        {o.conditions && <p className="text-xs text-muted-foreground mt-0.5">{o.conditions}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(o.date)}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${OFFRE_STATUS[o.statut]?.cls || "bg-secondary"}`}>
                          {OFFRE_STATUS[o.statut]?.label || o.statut}
                        </span>
                        {o.statut === "en_attente" && (
                          <div className="flex gap-1 mt-1">
                            <button onClick={() => changerStatutOffre(i, "acceptee")} className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 font-medium">✓ Accepter</button>
                            <button onClick={() => changerStatutOffre(i, "en_negociation")} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium">↔ Négo.</button>
                            <button onClick={() => changerStatutOffre(i, "refusee")} className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 font-medium">✗ Refuser</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── Visites ── */}
          {tab === "visites" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{visites.length} visite(s)</p>
                <Button size="sm" className="h-7 text-xs rounded-full gap-1.5" onClick={() => setAjoutVisite(p => !p)}>
                  <Plus className="w-3 h-3" /> Planifier
                </Button>
              </div>
              {ajoutVisite && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Acquéreur / Visiteur</label>
                    <input value={visiteForm.contact_nom} onChange={e => setVisiteForm(p => ({ ...p, contact_nom: e.target.value }))}
                      placeholder="Nom du visiteur" className="w-full h-8 text-xs border border-input rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date & heure</label>
                    <input type="datetime-local" value={visiteForm.date_debut} onChange={e => setVisiteForm(p => ({ ...p, date_debut: e.target.value }))}
                      className="w-full h-8 text-xs border border-input rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <Button size="sm" className="rounded-full gap-1.5 h-7 text-xs" onClick={planifierVisite} disabled={savingVisite || !visiteForm.date_debut}>
                    {savingVisite ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />} Confirmer
                  </Button>
                </div>
              )}
              {visites.length === 0
                ? <div className="text-center py-6"><Eye className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Aucune visite planifiée</p></div>
                : visites.map(v => (
                  <div key={v.id} className="bg-white border border-border/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{v.contact_nom || "Visiteur inconnu"}</p>
                        <p className="text-[10px] text-muted-foreground">{v.date_debut ? new Date(v.date_debut).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—"}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${v.statut === "realise" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {v.statut}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── Historique ── */}
          {tab === "historique" && (
            <div className="space-y-2">
              {(mandat.historique || []).length === 0
                ? <p className="text-sm text-muted-foreground">Aucun historique</p>
                : [...(mandat.historique || [])].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-3 bg-secondary/20 rounded-xl px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{h.action}</p>
                      <p className="text-[10px] text-muted-foreground">{h.auteur} · {fmtDate(h.date)}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}