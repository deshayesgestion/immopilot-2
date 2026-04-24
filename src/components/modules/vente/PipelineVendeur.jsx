import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Home, FileText, Loader2, ChevronRight, Sparkles, CheckCircle2,
  X, Euro, User, Phone, Mail, MapPin, Building, ExternalLink,
  Download, Send, BadgeCheck, PenTool
} from "lucide-react";
import SignaturePanel from "@/components/signature/SignaturePanel";

const STATUT_MANDAT = {
  en_attente: { label: "En attente signature", cls: "bg-amber-100 text-amber-700" },
  signe:      { label: "Signé",                cls: "bg-green-100 text-green-700" },
  refuse:     { label: "Refusé",               cls: "bg-red-100 text-red-700" },
};

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";
const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function CreateVendeurModal({ biens, contacts, onClose, onCreated }) {
  const [form, setForm] = useState({
    contact_id: "", vendeur_nom: "", vendeur_email: "", vendeur_telephone: "",
    bien_id: "", prix_demande: "", type_mandat: "exclusif",
    date_debut_mandat: new Date().toISOString().slice(0, 10),
    duree_mandat_mois: 3, commission_taux: 5, notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleContactChange = id => {
    const c = contacts.find(x => x.id === id);
    set("contact_id", id);
    if (c) { set("vendeur_nom", c.nom || ""); set("vendeur_email", c.email || ""); set("vendeur_telephone", c.telephone || ""); }
  };

  const handleBienChange = id => {
    const b = biens.find(x => x.id === id);
    set("bien_id", id);
    if (b && b.prix) set("prix_demande", b.prix);
  };

  const estimerIA = async () => {
    const bien = biens.find(b => b.id === form.bien_id);
    if (!bien) return;
    setEstimating(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert immobilier France. Estime ce bien :
Adresse : ${bien.adresse || "—"}, Surface : ${bien.surface || "?"}m², Pièces : ${bien.nb_pieces || "?"}, DPE : ${bien.dpe || "—"}, Meublé : ${bien.meuble ? "Oui" : "Non"}
Prix demandé : ${form.prix_demande || "non défini"} €
Retourne JSON : { prix_min: number, prix_max: number, prix_recommande: number, analyse_marche: string, points_forts: string[], points_faibles: string[], delai_vente_estime: string }`,
      response_json_schema: { type: "object", properties: {
        prix_min: { type: "number" }, prix_max: { type: "number" }, prix_recommande: { type: "number" },
        analyse_marche: { type: "string" }, points_forts: { type: "array", items: { type: "string" } },
        points_faibles: { type: "array", items: { type: "string" } }, delai_vente_estime: { type: "string" }
      }}
    });
    setEstimation(r);
    if (r?.prix_recommande) set("prix_demande", r.prix_recommande);
    setEstimating(false);
  };

  const save = async () => {
    if (!form.vendeur_nom || !form.bien_id) return;
    setSaving(true);
    const d = new Date(form.date_debut_mandat);
    d.setMonth(d.getMonth() + Number(form.duree_mandat_mois || 3));
    const date_fin_mandat = d.toISOString().slice(0, 10);
    const mandat = await base44.entities.MandatVente.create({
      ...form,
      prix_demande: Number(form.prix_demande) || 0,
      commission_taux: Number(form.commission_taux) || 5,
      duree_mandat_mois: Number(form.duree_mandat_mois) || 3,
      date_fin_mandat,
      statut_mandat: "en_attente",
      statut: "actif",
      estimation_ia: estimation,
      historique: [{ date: new Date().toISOString(), action: "Dossier vendeur créé", auteur: "Agent" }],
    });
    if (form.bien_id) {
      await base44.entities.Bien.update(form.bien_id, { statut: "en_cours" });
    }
    onCreated(mandat);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div><h2 className="text-base font-bold">Nouveau dossier vendeur</h2><p className="text-xs text-muted-foreground mt-0.5">Mandat + estimation IA</p></div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {contacts.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact existant (optionnel)</label>
              <select value={form.contact_id} onChange={e => handleContactChange(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="">— Nouveau vendeur —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.nom}{c.email ? ` — ${c.email}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Nom vendeur *</label><Input value={form.vendeur_nom} onChange={e => set("vendeur_nom", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Email</label><Input type="email" value={form.vendeur_email} onChange={e => set("vendeur_email", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Téléphone</label><Input value={form.vendeur_telephone} onChange={e => set("vendeur_telephone", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bien à vendre *</label>
            <select value={form.bien_id} onChange={e => handleBienChange(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="">— Sélectionner un bien —</option>
              {biens.map(b => <option key={b.id} value={b.id}>{b.titre} — {b.adresse || "sans adresse"}</option>)}
            </select>
          </div>
          {form.bien_id && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-violet-800 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Estimation IA marché</p>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-violet-300 text-violet-700" onClick={estimerIA} disabled={estimating}>
                  {estimating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {estimating ? "Analyse…" : "Estimer"}
                </Button>
              </div>
              {estimation && (
                <div className="space-y-2">
                  <div className="flex gap-2 text-center">
                    {[["Min", estimation.prix_min], ["Recommandé", estimation.prix_recommande], ["Max", estimation.prix_max]].map(([l, v]) => (
                      <div key={l} className="flex-1 bg-white rounded-lg p-2">
                        <p className="text-[9px] text-muted-foreground">{l}</p>
                        <p className="text-xs font-bold text-violet-700">{v?.toLocaleString("fr-FR")} €</p>
                      </div>
                    ))}
                  </div>
                  {estimation.analyse_marche && <p className="text-[10px] text-violet-700 italic">{estimation.analyse_marche}</p>}
                  {estimation.delai_vente_estime && <p className="text-[10px] text-violet-600">⏱ Délai : {estimation.delai_vente_estime}</p>}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Prix demandé (€)</label><Input type="number" value={form.prix_demande} onChange={e => set("prix_demande", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Commission (%)</label><Input type="number" value={form.commission_taux} onChange={e => set("commission_taux", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type mandat</label>
              <select value={form.type_mandat} onChange={e => set("type_mandat", e.target.value)} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="exclusif">Exclusif</option><option value="simple">Simple</option><option value="semi_exclusif">Semi-exclusif</option>
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Durée (mois)</label><Input type="number" value={form.duree_mandat_mois} onChange={e => set("duree_mandat_mois", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Date début mandat</label><Input type="date" value={form.date_debut_mandat} onChange={e => set("date_debut_mandat", e.target.value)} className="h-9 rounded-xl text-sm" /></div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2" onClick={save} disabled={saving || !form.vendeur_nom || !form.bien_id}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
          </Button>
        </div>
      </div>
    </div>
  );
}

function VendeurDetail({ mandat: initial, biens, onClose, onUpdate }) {
  const [mandat, setMandat] = useState(initial);
  const [tab, setTab] = useState("infos");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [agency, setAgency] = useState(null);

  useEffect(() => { base44.entities.Agency.list().then(l => l[0] && setAgency(l[0])); }, []);

  const bien = biens.find(b => b.id === mandat.bien_id);

  const signerMandat = async () => {
    const upd = { statut_mandat: "signe", date_signature_mandat: new Date().toISOString().slice(0, 10) };
    const hist = [...(mandat.historique || []), { date: new Date().toISOString(), action: "Mandat signé", auteur: "Agent" }];
    await base44.entities.MandatVente.update(mandat.id, { ...upd, historique: hist });
    const updated = { ...mandat, ...upd, historique: hist };
    setMandat(updated); onUpdate(updated);
  };

  const publierBien = async () => {
    if (!mandat.bien_id) return;
    await base44.entities.Bien.update(mandat.bien_id, { is_published_internal: true, statut: "en_cours" });
    const hist = [...(mandat.historique || []), { date: new Date().toISOString(), action: "Bien publié sur la landing page", auteur: "Agent" }];
    await base44.entities.MandatVente.update(mandat.id, { historique: hist });
    const updated = { ...mandat, historique: hist };
    setMandat(updated); onUpdate(updated);
    alert("✓ Bien publié !");
  };

  const genererMandatPDF = async () => {
    setGenerating(true);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 20, CW = W - 2 * M;
    const hexToRgb = hex => { const h = (hex || "#4F46E5").replace("#", ""); return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) }; };
    const C = hexToRgb(agency?.primary_color);
    let y = 0;
    doc.setFillColor(C.r,C.g,C.b); doc.rect(0,0,W,40,"F");
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(15);
    doc.text(agency?.name || "Agence", M, 14);
    doc.setFontSize(12); doc.text("MANDAT DE VENTE", W-M, 14, { align:"right" });
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    doc.text(`Type : ${(mandat.type_mandat||"exclusif").toUpperCase()} — ${fmt(new Date().toISOString())}`, W-M, 24, { align:"right" });
    y = 52;
    const section = (t) => { doc.setFillColor(C.r,C.g,C.b); doc.rect(M-2,y-4,CW+4,8,"F"); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.text(t,M,y+1); doc.setTextColor(30,30,30); y+=11; };
    const row = (l,v) => { doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80); doc.text(l,M+2,y); doc.setTextColor(20,20,20); doc.setFont("helvetica","bold"); doc.text(String(v||"—"),M+90,y); y+=6.5; };
    section("MANDANT (VENDEUR)");
    row("Nom :", mandat.vendeur_nom); row("Email :", mandat.vendeur_email||"—"); row("Téléphone :", mandat.vendeur_telephone||"—"); y+=4;
    section("BIEN IMMOBILIER");
    row("Désignation :", bien?.titre||"—"); row("Adresse :", bien?.adresse||"—"); row("Surface :", bien?.surface ? bien.surface+"m²" : "—"); y+=4;
    section("CONDITIONS");
    row("Prix de vente :", fmtEur(mandat.prix_demande));
    row("Honoraires :", `${mandat.commission_taux||5}% — ${fmtEur(mandat.prix_demande*(mandat.commission_taux/100))}`);
    row("Type mandat :", mandat.type_mandat); row("Durée :", `${mandat.duree_mandat_mois||3} mois`);
    row("Début :", fmt(mandat.date_debut_mandat)); row("Fin :", fmt(mandat.date_fin_mandat)); y+=12;
    const sw=80,sh=35,sx1=M,sx2=W-M-sw;
    [[sx1,"LE MANDANT",mandat.vendeur_nom],[sx2,"L'AGENCE",agency?.name]].forEach(([x,t,n])=>{
      doc.setDrawColor(C.r,C.g,C.b); doc.setLineWidth(0.3); doc.rect(x,y,sw,sh);
      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(C.r,C.g,C.b);
      doc.text(t,x+3,y+8); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
      doc.text(n||"—",x+3,y+16); doc.text("Signature :",x+3,y+26);
    });
    doc.setTextColor(150,150,150); doc.setFontSize(7);
    doc.text(`${agency?.name||""} — Mandat de vente`, M, 290); doc.text(fmt(new Date().toISOString()), W-M, 290, {align:"right"});
    const blob = doc.output("blob");
    const fileName = `mandat-${(mandat.vendeur_nom||"vendeur").replace(/\s+/g,"-")}-${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    const file = new File([blob], fileName, { type:"application/pdf" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const hist = [...(mandat.historique||[]), { date: new Date().toISOString(), action: "Mandat PDF généré et archivé", auteur: "Agent" }];
    await base44.entities.MandatVente.update(mandat.id, { mandat_url: file_url, historique: hist });
    const updated = { ...mandat, mandat_url: file_url, historique: hist };
    setMandat(updated); onUpdate(updated);
    setGenerating(false);
  };

  const envoyerMandat = async () => {
    if (!mandat.vendeur_email) return;
    setSending(true);
    const body = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<div style="background:${agency?.primary_color||"#4F46E5"};padding:24px 28px"><h1 style="margin:0;font-size:18px;color:#fff">${agency?.name||"Agence"}</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Votre mandat de vente</p></div>
<div style="padding:24px 28px"><p style="color:#1e293b;font-size:14px">Bonjour <strong>${mandat.vendeur_nom}</strong>,</p>
<p style="color:#475569;font-size:14px;line-height:1.7">Votre mandat de vente ${mandat.type_mandat} pour <strong>${bien?.titre||""}</strong> est prêt.</p>
<p style="color:#0f172a;font-size:18px;font-weight:700;margin:16px 0">Prix : ${fmtEur(mandat.prix_demande)}</p>
${mandat.mandat_url ? `<div style="text-align:center;margin:20px 0"><a href="${mandat.mandat_url}" style="background:${agency?.primary_color||"#4F46E5"};color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600">📄 Accéder au mandat</a></div>` : ""}
<p style="color:#475569;font-size:13px">Cordialement,<br><strong>${agency?.name||"L'agence"}</strong></p></div></div>`;
    await base44.integrations.Core.SendEmail({ to: mandat.vendeur_email, subject: `Votre mandat de vente — ${bien?.titre||""}`, body });
    const hist = [...(mandat.historique||[]), { date: new Date().toISOString(), action: `Mandat envoyé à ${mandat.vendeur_email}`, auteur: "Agent" }];
    await base44.entities.MandatVente.update(mandat.id, { historique: hist });
    setMandat(p => ({ ...p, historique: hist }));
    setSending(false);
    alert("✓ Email envoyé !");
  };

  const TABS_DETAIL = ["infos","estimation","mandat","historique"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">{mandat.vendeur_nom||"—"}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_MANDAT[mandat.statut_mandat]?.cls||"bg-secondary text-muted-foreground"}`}>{STATUT_MANDAT[mandat.statut_mandat]?.label||"—"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{bien?.titre||"—"} · {fmtEur(mandat.prix_demande)} · {(mandat.type_mandat||"simple").toUpperCase()}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto flex-shrink-0">
          {TABS_DETAIL.map(t => <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize ${tab===t?"bg-primary text-white":"text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>{t}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab==="infos" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{icon:User,l:"Vendeur",v:mandat.vendeur_nom},{icon:Mail,l:"Email",v:mandat.vendeur_email},{icon:Phone,l:"Tél.",v:mandat.vendeur_telephone},{icon:Building,l:"Bien",v:bien?.titre},{icon:MapPin,l:"Adresse",v:bien?.adresse},{icon:Euro,l:"Prix",v:fmtEur(mandat.prix_demande)}].map(({icon:Icon,l,v})=>(
                  <div key={l} className="bg-secondary/20 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{l}</p>
                    <p className="text-xs font-medium mt-0.5">{v||"—"}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {mandat.statut_mandat!=="signe" && <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-green-500 hover:bg-green-600" onClick={signerMandat}><BadgeCheck className="w-3 h-3" /> Marquer signé</Button>}
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1" onClick={publierBien}><ExternalLink className="w-3 h-3" /> Publier sur le site</Button>
              </div>
            </div>
          )}
          {tab==="estimation" && (
            <div className="space-y-3">
              {mandat.estimation_ia ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[["Min",mandat.estimation_ia.prix_min],["Recommandé",mandat.estimation_ia.prix_recommande],["Max",mandat.estimation_ia.prix_max]].map(([l,v])=>(
                      <div key={l} className="bg-violet-50 rounded-xl p-3"><p className="text-[10px] text-violet-600">{l}</p><p className="text-sm font-bold text-violet-800">{v?.toLocaleString("fr-FR")} €</p></div>
                    ))}
                  </div>
                  {mandat.estimation_ia.analyse_marche && <div className="bg-secondary/20 rounded-xl p-3"><p className="text-xs text-muted-foreground italic">{mandat.estimation_ia.analyse_marche}</p></div>}
                  {mandat.estimation_ia.delai_vente_estime && <p className="text-xs text-muted-foreground">⏱ Délai : <strong>{mandat.estimation_ia.delai_vente_estime}</strong></p>}
                  {mandat.estimation_ia.points_forts?.map((p,i)=><p key={i} className="text-xs text-green-600">✓ {p}</p>)}
                  {mandat.estimation_ia.points_faibles?.map((p,i)=><p key={i} className="text-xs text-red-500">— {p}</p>)}
                </>
              ) : <p className="text-sm text-muted-foreground">Aucune estimation IA. Créez un nouveau dossier pour lancer l'estimation.</p>}
            </div>
          )}
          {tab==="mandat" && (
            <div className="space-y-4">
              {mandat.statut_mandat==="signe" && <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><p className="text-sm font-semibold text-green-800">Mandat signé ✓</p></div>}
              {/* Signature électronique */}
              {mandat.mandat_url && (
                <div className="bg-white border border-border/50 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2"><PenTool className="w-4 h-4 text-primary" /> Signature électronique</p>
                  <SignaturePanel
                    compact
                    documentType="mandat_vente"
                    documentTitre={`Mandat — ${mandat.vendeur_nom || ""} — ${bien?.titre || ""}`}
                    documentUrl={mandat.mandat_url}
                    sourceId={mandat.id}
                    sourceEntity="MandatVente"
                  />
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" className="h-9 text-xs rounded-full gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={genererMandatPDF} disabled={generating}>
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} {generating?"Génération…":"Générer PDF mandat"}
                </Button>
                {mandat.vendeur_email && <Button size="sm" className="h-9 text-xs rounded-full gap-1.5" onClick={envoyerMandat} disabled={sending}>
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {sending?"Envoi…":"Envoyer par email"}
                </Button>}
                {mandat.mandat_url && <a href={mandat.mandat_url} target="_blank" rel="noopener noreferrer" className="h-9 text-xs rounded-full px-3 border border-border/50 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><FileText className="w-3.5 h-3.5" /> Voir PDF</a>}
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 text-xs space-y-1.5">
                {[["Vendeur",mandat.vendeur_nom],["Bien",bien?.titre],["Prix",fmtEur(mandat.prix_demande)],["Commission",`${mandat.commission_taux}%`],["Type",mandat.type_mandat],["Durée",`${mandat.duree_mandat_mois} mois`],["Début",fmt(mandat.date_debut_mandat)],["Fin",fmt(mandat.date_fin_mandat)]].map(([l,v])=>(
                  <div key={l} className="flex gap-2"><span className="text-muted-foreground w-24 flex-shrink-0">{l} :</span><span className="font-medium">{v||"—"}</span></div>
                ))}
              </div>
            </div>
          )}
          {tab==="historique" && (
            <div className="space-y-2">
              {(mandat.historique||[]).length===0 ? <p className="text-sm text-muted-foreground">Aucun historique</p>
                : [...(mandat.historique||[])].reverse().map((h,i)=>(
                  <div key={i} className="flex items-start gap-3 bg-secondary/20 rounded-xl px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div><p className="text-xs font-medium">{h.action}</p><p className="text-[10px] text-muted-foreground">{h.auteur} · {fmt(h.date)}</p></div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PipelineVendeur({ biens, contacts }) {
  const [mandats, setMandats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.MandatVente.list("-created_date", 100).then(m => { setMandats(m); setLoading(false); });
  }, []);

  const update = upd => { setMandats(p => p.map(m => m.id === upd.id ? upd : m)); if (selected?.id === upd.id) setSelected(upd); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Mandats actifs", value: mandats.filter(m => m.statut==="actif").length },
          { label: "Signés", value: mandats.filter(m => m.statut_mandat==="signe").length },
          { label: "En attente", value: mandats.filter(m => m.statut_mandat==="en_attente").length },
          { label: "CA potentiel", value: mandats.reduce((s,m) => s+(m.prix_demande||0),0).toLocaleString("fr-FR")+" €" },
        ].map(s => <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-3"><p className="text-lg font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>)}
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{mandats.length} dossier{mandats.length>1?"s":""} vendeur</p>
        <Button className="rounded-full gap-1.5 h-9 text-sm" onClick={() => setShowNew(true)}><Plus className="w-3.5 h-3.5" /> Nouveau mandat</Button>
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : mandats.length===0
          ? <div className="bg-white rounded-2xl border border-border/50 p-12 text-center"><Home className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Aucun mandat vendeur</p><Button className="mt-4 rounded-full gap-2 h-9 text-sm" onClick={() => setShowNew(true)}><Plus className="w-3.5 h-3.5" /> Créer le premier mandat</Button></div>
          : <div className="space-y-2">{mandats.map(m => {
              const bien = biens.find(b => b.id === m.bien_id);
              const statut = STATUT_MANDAT[m.statut_mandat]||STATUT_MANDAT.en_attente;
              return (
                <div key={m.id} onClick={() => setSelected(m)} className="bg-white rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Home className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{m.vendeur_nom||"—"}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statut.cls}`}>{statut.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.type_mandat==="exclusif"?"bg-purple-100 text-purple-700":"bg-blue-100 text-blue-700"}`}>{m.type_mandat||"simple"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{bien?.titre||"—"} · <span className="font-medium text-foreground">{fmtEur(m.prix_demande)}</span></p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                </div>
              );
            })}</div>
      }
      {showNew && <CreateVendeurModal biens={biens} contacts={contacts} onClose={() => setShowNew(false)} onCreated={m => { setMandats(p => [m,...p]); setSelected(m); setShowNew(false); }} />}
      {selected && <VendeurDetail mandat={selected} biens={biens} onClose={() => setSelected(null)} onUpdate={update} />}
    </div>
  );
}