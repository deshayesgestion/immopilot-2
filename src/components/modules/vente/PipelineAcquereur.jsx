import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Users, Loader2, ChevronRight, Sparkles, CheckCircle2,
  X, Star, Euro, User, Phone, Mail, Home, Calendar, FileText,
  TrendingUp, Target, Download, Send, Zap, BadgeCheck
} from "lucide-react";

const ETAPE_CFG = {
  lead:      { label: "Lead",       cls: "bg-slate-100 text-slate-600",   emoji: "📥" },
  qualifie:  { label: "Qualifié",   cls: "bg-blue-100 text-blue-700",     emoji: "✅" },
  visite:    { label: "Visite",     cls: "bg-indigo-100 text-indigo-700", emoji: "🏠" },
  offre:     { label: "Offre",      cls: "bg-purple-100 text-purple-700", emoji: "📋" },
  compromis: { label: "Compromis",  cls: "bg-amber-100 text-amber-700",   emoji: "📝" },
  acte:      { label: "Acte final", cls: "bg-green-100 text-green-700",   emoji: "🔑" },
  perdu:     { label: "Perdu",      cls: "bg-red-100 text-red-600",       emoji: "❌" },
};

const ETAPES_ORDER = ["lead","qualifie","visite","offre","compromis","acte"];
const fmtEur = n => (n||0).toLocaleString("fr-FR")+" €";
const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function CreateAcquereurModal({ contacts, onClose, onCreated }) {
  const [form, setForm] = useState({
    contact_id:"", nom:"", email:"", telephone:"",
    budget_min:"", budget_max:"", surface_min:"", nb_pieces_min:"",
    localisation:"", type_bien:"appartement", source:"site_web",
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleContactChange = id => {
    const c = contacts.find(x => x.id===id);
    set("contact_id",id);
    if(c){set("nom",c.nom||"");set("email",c.email||"");set("telephone",c.telephone||"");}
  };

  const save = async () => {
    if(!form.nom) return;
    setSaving(true);
    const acq = await base44.entities.Acquereur.create({
      ...form,
      budget_min: Number(form.budget_min)||0,
      budget_max: Number(form.budget_max)||0,
      surface_min: Number(form.surface_min)||0,
      nb_pieces_min: Number(form.nb_pieces_min)||0,
      etape:"lead", statut:"actif",
      historique:[{date:new Date().toISOString(),action:"Acquéreur créé",auteur:"Agent"}],
    });
    // Scoring IA si budget renseigné
    if(acq.budget_max > 0){
      const r = await base44.integrations.Core.InvokeLLM({
        prompt:`Expert immobilier. Score acquéreur : ${form.nom}, Budget ${form.budget_min||0}-${form.budget_max}€, Surface min ${form.surface_min||0}m², Localisation ${form.localisation||"N/A"}, Source ${form.source}, Type ${form.type_bien}.
Retourne JSON : { score: number (0-100), probabilite_achat: number (0-100), profil: string, recommandation: string, alertes: string[] }`,
        response_json_schema:{type:"object",properties:{score:{type:"number"},probabilite_achat:{type:"number"},profil:{type:"string"},recommandation:{type:"string"},alertes:{type:"array",items:{type:"string"}}}}
      });
      if(r?.score!==undefined){
        await base44.entities.Acquereur.update(acq.id,{scoring_ia:r.score,scoring_detail:r});
        acq.scoring_ia=r.score; acq.scoring_detail=r;
      }
    }
    onCreated(acq); setSaving(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div><h2 className="text-base font-bold">Nouvel acquéreur</h2><p className="text-xs text-muted-foreground mt-0.5">Qualification + scoring IA auto</p></div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          {contacts.length>0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact existant</label>
              <select value={form.contact_id} onChange={e=>handleContactChange(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="">— Nouveau prospect —</option>
                {contacts.map(c=><option key={c.id} value={c.id}>{c.nom}{c.email?` — ${c.email}`:""}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Nom *</label><Input value={form.nom} onChange={e=>set("nom",e.target.value)} className="h-9 rounded-xl text-sm" autoFocus /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Email</label><Input type="email" value={form.email} onChange={e=>set("email",e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Téléphone</label><Input value={form.telephone} onChange={e=>set("telephone",e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Budget min (€)</label><Input type="number" value={form.budget_min} onChange={e=>set("budget_min",e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Budget max (€)</label><Input type="number" value={form.budget_max} onChange={e=>set("budget_max",e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Surface min (m²)</label><Input type="number" value={form.surface_min} onChange={e=>set("surface_min",e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Pièces min</label><Input type="number" value={form.nb_pieces_min} onChange={e=>set("nb_pieces_min",e.target.value)} className="h-9 rounded-xl text-sm" /></div>
            <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Localisation souhaitée</label><Input value={form.localisation} onChange={e=>set("localisation",e.target.value)} placeholder="Quartier, ville…" className="h-9 rounded-xl text-sm" /></div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type de bien</label>
              <select value={form.type_bien} onChange={e=>set("type_bien",e.target.value)} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="appartement">Appartement</option><option value="maison">Maison</option>
                <option value="terrain">Terrain</option><option value="local_commercial">Local commercial</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Source</label>
              <select value={form.source} onChange={e=>set("source",e.target.value)} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="site_web">Site web</option><option value="estimation">Estimation</option>
                <option value="recommandation">Recommandation</option><option value="portail">Portail</option><option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2" onClick={save} disabled={saving||!form.nom}>
            {saving?<Loader2 className="w-4 h-4 animate-spin" />:<Plus className="w-4 h-4" />} Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}

function AcquereurDetail({ acquereur: init, biens, onClose, onUpdate }) {
  const [acq, setAcq] = useState(init);
  const [tab, setTab] = useState("profil");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(acq.matching_biens||null);
  const [agency, setAgency] = useState(null);
  const [offreForm, setOffreForm] = useState({bien_id:"",montant:"",conditions:""});
  const [creatingOffre, setCreatingOffre] = useState(false);
  const [genPDF, setGenPDF] = useState(false);

  useEffect(() => { base44.entities.Agency.list().then(l=>l[0]&&setAgency(l[0])); }, []);

  const advanceEtape = async (etape) => {
    const hist = [...(acq.historique||[]),{date:new Date().toISOString(),action:`Étape → ${etape}`,auteur:"Agent"}];
    await base44.entities.Acquereur.update(acq.id,{etape,historique:hist});
    const updated = {...acq,etape,historique:hist};
    setAcq(updated); onUpdate(updated);
  };

  const lancerMatching = async () => {
    setMatching(true);
    const biensDispos = biens.filter(b=>b.statut==="disponible"||b.statut==="en_cours");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt:`Expert immobilier. Matching acquéreur → biens disponibles.
Acquéreur : ${acq.nom}, Budget ${acq.budget_min||0}-${acq.budget_max||0}€, Surface min ${acq.surface_min||0}m², Localisation ${acq.localisation||"N/A"}, Type ${acq.type_bien||"N/A"}
Biens : ${JSON.stringify(biensDispos.map(b=>({id:b.id,titre:b.titre,prix:b.prix,surface:b.surface,adresse:b.adresse})))}
Retourne JSON : { biens_compatibles: [{bien_id:string,bien_titre:string,score_compatibilite:number,raison:string,points_forts:string[]}], prediction_closing: number, analyse: string }`,
      response_json_schema:{type:"object",properties:{biens_compatibles:{type:"array",items:{type:"object"}},prediction_closing:{type:"number"},analyse:{type:"string"}}}
    });
    setMatchResult(r);
    await base44.entities.Acquereur.update(acq.id,{matching_biens:r});
    const updated={...acq,matching_biens:r};
    setAcq(updated); onUpdate(updated);
    setMatching(false);
  };

  const creerVisite = async (bien_id) => {
    const bien = biens.find(b=>b.id===bien_id);
    const user = await base44.auth.me();
    const dateDef = new Date(Date.now()+86400000);
    await base44.entities.Evenement.create({
      titre:`Visite — ${acq.nom} · ${bien?.titre||""}`,
      type:"visite", module:"vente",
      date_debut:dateDef.toISOString().slice(0,16),
      date_fin:new Date(dateDef.getTime()+3600000).toISOString().slice(0,16),
      lieu:bien?.adresse||"",
      contact_nom:acq.nom, contact_email:acq.email||"",
      bien_titre:bien?.titre||"", bien_id,
      statut:"planifie",
      agent_email:user?.email||"",
    });
    await advanceEtape("visite");
    alert(`✓ Visite planifiée pour ${bien?.titre}`);
  };

  const creerOffre = async () => {
    if(!offreForm.bien_id||!offreForm.montant) return;
    setCreatingOffre(true);
    const bien = biens.find(b=>b.id===offreForm.bien_id);
    const offres = [...(acq.offres||[]),{
      id:Date.now(), bien_id:offreForm.bien_id, bien_titre:bien?.titre,
      montant:Number(offreForm.montant), conditions:offreForm.conditions,
      date:new Date().toISOString(), statut:"soumise",
    }];
    const hist = [...(acq.historique||[]),{date:new Date().toISOString(),action:`Offre ${fmtEur(Number(offreForm.montant))} pour ${bien?.titre}`,auteur:"Agent"}];
    await base44.entities.Acquereur.update(acq.id,{etape:"offre",offres,historique:hist});
    const updated={...acq,etape:"offre",offres,historique:hist};
    setAcq(updated); onUpdate(updated);
    setOffreForm({bien_id:"",montant:"",conditions:""});
    setCreatingOffre(false);
  };

  const genererCompromisPDF = async (offre) => {
    setGenPDF(true);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({unit:"mm",format:"a4"});
    const W=210,M=20,CW=W-2*M;
    const hexToRgb = hex=>{const h=(hex||"#4F46E5").replace("#","");return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};};
    const C=hexToRgb(agency?.primary_color);
    let y=0;
    doc.setFillColor(C.r,C.g,C.b); doc.rect(0,0,W,40,"F");
    doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(15);
    doc.text(agency?.name||"Agence",M,14);
    doc.setFontSize(12); doc.text("COMPROMIS DE VENTE",W-M,14,{align:"right"});
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    doc.text(`Généré le ${fmt(new Date().toISOString())}`,W-M,24,{align:"right"});
    y=52;
    const section=t=>{doc.setFillColor(C.r,C.g,C.b);doc.rect(M-2,y-4,CW+4,8,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text(t,M,y+1);doc.setTextColor(30,30,30);y+=11;};
    const row=(l,v)=>{doc.setFontSize(9);doc.setFont("helvetica","normal");doc.setTextColor(80,80,80);doc.text(l,M+2,y);doc.setTextColor(20,20,20);doc.setFont("helvetica","bold");doc.text(String(v||"—"),M+90,y);y+=6.5;};
    section("ACQUÉREUR"); row("Nom :",acq.nom); row("Email :",acq.email||"—"); row("Téléphone :",acq.telephone||"—"); y+=4;
    const bien=biens.find(b=>b.id===offre.bien_id);
    section("BIEN VENDU"); row("Désignation :",bien?.titre||"—"); row("Adresse :",bien?.adresse||"—"); y+=4;
    section("CONDITIONS"); row("Prix d'achat :",fmtEur(offre.montant));
    if(offre.conditions) row("Conditions :",offre.conditions); y+=12;
    const sw=80,sh=35,sx1=M,sx2=W-M-sw;
    [[sx1,"L'ACQUÉREUR",acq.nom],[sx2,"LE VENDEUR / L'AGENCE",agency?.name]].forEach(([x,t,n])=>{
      doc.setDrawColor(C.r,C.g,C.b);doc.setLineWidth(0.3);doc.rect(x,y,sw,sh);
      doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(C.r,C.g,C.b);
      doc.text(t,x+3,y+8);doc.setFont("helvetica","normal");doc.setTextColor(80,80,80);
      doc.text(n||"—",x+3,y+16);doc.text("Signature :",x+3,y+26);
    });
    doc.setTextColor(150,150,150);doc.setFontSize(7);
    doc.text(`${agency?.name||""} — Compromis de vente`,M,290);doc.text(fmt(new Date().toISOString()),W-M,290,{align:"right"});
    const blob=doc.output("blob");
    const fileName=`compromis-${(acq.nom||"acquereur").replace(/\s+/g,"-")}-${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    const file=new File([blob],fileName,{type:"application/pdf"});
    const {file_url}=await base44.integrations.Core.UploadFile({file});
    if(acq.email){
      const emailBody=`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<div style="background:${agency?.primary_color||"#4F46E5"};padding:22px 28px"><h1 style="margin:0;font-size:18px;color:#fff">${agency?.name||""}</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Compromis de vente</p></div>
<div style="padding:24px 28px"><p style="color:#1e293b;font-size:14px">Bonjour <strong>${acq.nom}</strong>,</p>
<p style="color:#475569;font-size:14px;line-height:1.7">Votre compromis pour <strong>${bien?.titre||""}</strong> est disponible.</p>
<p style="color:#0f172a;font-size:16px;font-weight:700;margin:14px 0">Prix : ${fmtEur(offre.montant)}</p>
${file_url?`<div style="text-align:center;margin:18px 0"><a href="${file_url}" style="background:${agency?.primary_color||"#4F46E5"};color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600">📄 Voir le compromis</a></div>`:""}
<p style="color:#475569;font-size:13px">Cordialement,<br><strong>${agency?.name||""}</strong></p></div></div>`;
      await base44.integrations.Core.SendEmail({to:acq.email,subject:`Compromis de vente — ${bien?.titre||""}`,body:emailBody});
    }
    const hist=[...(acq.historique||[]),{date:new Date().toISOString(),action:`Compromis généré — ${bien?.titre}`,auteur:"Agent"}];
    await base44.entities.Acquereur.update(acq.id,{etape:"compromis",compromis_url:file_url,historique:hist});
    const updated={...acq,etape:"compromis",compromis_url:file_url,historique:hist};
    setAcq(updated); onUpdate(updated);
    setGenPDF(false);
  };

  const cloturerVente = async () => {
    const hist=[...(acq.historique||[]),{date:new Date().toISOString(),action:"Vente clôturée — Acte final",auteur:"Agent"}];
    await base44.entities.Acquereur.update(acq.id,{etape:"acte",statut:"clos",historique:hist});
    const updated={...acq,etape:"acte",statut:"clos",historique:hist};
    setAcq(updated); onUpdate(updated);
    alert("🎉 Vente clôturée !");
  };

  const TABS_DETAIL=[{id:"profil",label:"Profil & IA"},{id:"matching",label:"Matching"},{id:"offres",label:"Offres"},{id:"historique",label:"Historique"}];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold">{acq.nom}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ETAPE_CFG[acq.etape]?.cls||"bg-secondary"}`}>{ETAPE_CFG[acq.etape]?.emoji} {ETAPE_CFG[acq.etape]?.label}</span>
              {acq.scoring_ia>0 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${acq.scoring_ia>=70?"bg-green-100 text-green-700":acq.scoring_ia>=50?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}><Star className="w-2.5 h-2.5 inline" /> {acq.scoring_ia}/100</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Budget {fmtEur(acq.budget_min)} – {fmtEur(acq.budget_max)} · {acq.localisation||"—"}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        {/* Pipeline étapes */}
        <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto flex-shrink-0">
          {ETAPES_ORDER.map((e,i)=>{
            const cfg=ETAPE_CFG[e];
            const idx=ETAPES_ORDER.indexOf(acq.etape);
            return (
              <div key={e} className="flex items-center gap-1 flex-shrink-0">
                <button onClick={()=>advanceEtape(e)}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${acq.etape===e?"bg-primary text-white":i<idx?"bg-secondary text-muted-foreground":"border border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {cfg.emoji} {cfg.label}
                </button>
                {i<ETAPES_ORDER.length-1&&<span className="text-border text-xs">→</span>}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto flex-shrink-0">
          {TABS_DETAIL.map(t=><button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${tab===t.id?"bg-primary text-white":"text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>{t.label}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab==="profil" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{icon:User,l:"Nom",v:acq.nom},{icon:Mail,l:"Email",v:acq.email},{icon:Phone,l:"Téléphone",v:acq.telephone},{icon:Euro,l:"Budget min",v:fmtEur(acq.budget_min)},{icon:Euro,l:"Budget max",v:fmtEur(acq.budget_max)},{icon:Home,l:"Surface min",v:acq.surface_min?acq.surface_min+"m²":"—"},{icon:Target,l:"Localisation",v:acq.localisation},{icon:Home,l:"Type bien",v:acq.type_bien}].map(({icon:Icon,l,v})=>(
                  <div key={l} className="bg-secondary/20 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{l}</p>
                    <p className="text-xs font-medium mt-0.5">{v||"—"}</p>
                  </div>
                ))}
              </div>
              {acq.scoring_detail && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Scoring IA</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${acq.scoring_ia>=70?"text-green-600":acq.scoring_ia>=50?"text-amber-600":"text-red-600"}`}>{acq.scoring_ia}<span className="text-sm font-normal">/100</span></span>
                    <div className="flex-1 bg-white rounded-full h-2"><div className={`h-2 rounded-full ${acq.scoring_ia>=70?"bg-green-500":acq.scoring_ia>=50?"bg-amber-500":"bg-red-500"}`} style={{width:`${acq.scoring_ia}%`}} /></div>
                  </div>
                  {acq.scoring_detail.probabilite_achat!==undefined && <p className="text-xs text-amber-700">Probabilité d'achat : <strong>{acq.scoring_detail.probabilite_achat}%</strong></p>}
                  {acq.scoring_detail.profil && <p className="text-xs text-amber-700 italic">{acq.scoring_detail.profil}</p>}
                  {acq.scoring_detail.alertes?.length>0 && <div>{acq.scoring_detail.alertes.map((a,i)=><p key={i} className="text-[10px] text-red-600">⚠ {a}</p>)}</div>}
                </div>
              )}
              {acq.etape==="compromis" && <Button className="w-full rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={cloturerVente}><BadgeCheck className="w-4 h-4" /> Valider l'acte final — Clôturer</Button>}
            </div>
          )}
          {tab==="matching" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-violet-600" /> Matching IA</p>
                <Button size="sm" className="h-8 text-xs rounded-full gap-1.5 bg-violet-600 hover:bg-violet-700" onClick={lancerMatching} disabled={matching}>
                  {matching?<Loader2 className="w-3 h-3 animate-spin" />:<Sparkles className="w-3 h-3" />} {matching?"Analyse…":"Lancer"}
                </Button>
              </div>
              {matchResult?.prediction_closing!==undefined && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-violet-800">Probabilité de closing : <span className="text-lg font-black">{matchResult.prediction_closing}%</span></p>
                  {matchResult.analyse && <p className="text-[10px] text-violet-700 italic mt-1">{matchResult.analyse}</p>}
                </div>
              )}
              {matchResult?.biens_compatibles?.length>0
                ? <div className="space-y-2">{matchResult.biens_compatibles.map((m,i)=>{
                    const bien=biens.find(b=>b.id===m.bien_id);
                    return (
                      <div key={i} className="bg-white border border-border/50 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{m.bien_titre||bien?.titre||"—"}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.score_compatibilite>=70?"bg-green-100 text-green-700":m.score_compatibilite>=50?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>{m.score_compatibilite}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.raison}</p>
                            {m.points_forts?.length>0 && <div className="flex gap-1 flex-wrap mt-1">{m.points_forts.map((p,j)=><span key={j} className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">✓ {p}</span>)}</div>}
                          </div>
                          <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 flex-shrink-0" onClick={()=>creerVisite(m.bien_id)}><Calendar className="w-3 h-3" /> Visite</Button>
                        </div>
                      </div>
                    );
                  })}</div>
                : <p className="text-sm text-muted-foreground text-center py-6">Lancez le matching pour voir les biens compatibles</p>
              }
            </div>
          )}
          {tab==="offres" && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-purple-800 flex items-center gap-2"><FileText className="w-4 h-4" /> Créer une offre d'achat</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Bien concerné</label>
                    <select value={offreForm.bien_id} onChange={e=>setOffreForm(p=>({...p,bien_id:e.target.value}))} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                      <option value="">— Sélectionner —</option>
                      {biens.map(b=><option key={b.id} value={b.id}>{b.titre}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label><Input type="number" value={offreForm.montant} onChange={e=>setOffreForm(p=>({...p,montant:e.target.value}))} className="h-9 rounded-xl text-sm" /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Conditions</label><Input value={offreForm.conditions} onChange={e=>setOffreForm(p=>({...p,conditions:e.target.value}))} placeholder="Prêt bancaire…" className="h-9 rounded-xl text-sm" /></div>
                </div>
                <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs bg-purple-600 hover:bg-purple-700" onClick={creerOffre} disabled={creatingOffre||!offreForm.bien_id||!offreForm.montant}>
                  {creatingOffre?<Loader2 className="w-3 h-3 animate-spin" />:<Plus className="w-3 h-3" />} Soumettre l'offre
                </Button>
              </div>
              {(acq.offres||[]).length===0
                ? <p className="text-sm text-muted-foreground text-center py-4">Aucune offre soumise</p>
                : (acq.offres||[]).map((o,i)=>(
                  <div key={i} className="bg-white border border-border/50 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{o.bien_titre||"—"}</p>
                        <p className="text-base font-bold text-purple-700 mt-0.5">{fmtEur(o.montant)}</p>
                        {o.conditions && <p className="text-xs text-muted-foreground mt-0.5">{o.conditions}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{fmt(o.date)}</p>
                      </div>
                      <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 bg-amber-600 hover:bg-amber-700 flex-shrink-0" onClick={()=>genererCompromisPDF(o)} disabled={genPDF}>
                        {genPDF?<Loader2 className="w-3 h-3 animate-spin" />:<Download className="w-3 h-3" />} Compromis PDF
                      </Button>
                    </div>
                  </div>
                ))
              }
              {acq.compromis_url && <a href={acq.compromis_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline"><FileText className="w-3.5 h-3.5" /> Voir le compromis archivé</a>}
            </div>
          )}
          {tab==="historique" && (
            <div className="space-y-2">
              {(acq.historique||[]).length===0 ? <p className="text-sm text-muted-foreground">Aucun historique</p>
                : [...(acq.historique||[])].reverse().map((h,i)=>(
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

export default function PipelineAcquereur({ biens, contacts }) {
  const [acquereurs, setAcquereurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterEtape, setFilterEtape] = useState("all");

  useEffect(() => {
    base44.entities.Acquereur.list("-created_date", 200).then(a => { setAcquereurs(a); setLoading(false); });
  }, []);

  const update = upd => { setAcquereurs(p => p.map(a => a.id===upd.id?upd:a)); if(selected?.id===upd.id) setSelected(upd); };
  const filtered = filterEtape==="all" ? acquereurs : acquereurs.filter(a=>a.etape===filterEtape);
  const totalPotentiel = acquereurs.reduce((s,a)=>s+(a.budget_max||0),0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ETAPES_ORDER.map(e=>{
          const cfg=ETAPE_CFG[e];
          const count=acquereurs.filter(a=>a.etape===e).length;
          return (
            <button key={e} onClick={()=>setFilterEtape(filterEtape===e?"all":e)}
              className={`text-center p-3 rounded-2xl border transition-all ${filterEtape===e?"border-primary bg-primary/5 ring-1 ring-primary/20":"bg-white border-border/40 hover:border-primary/30"}`}>
              <span className="text-xl block mb-1">{cfg.emoji}</span>
              <span className="text-lg font-bold block">{count}</span>
              <span className="text-[9px] text-muted-foreground leading-tight block">{cfg.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{filtered.length} acquéreur{filtered.length>1?"s":""}</p>
          {totalPotentiel>0&&<p className="text-xs text-green-600">Potentiel : {fmtEur(totalPotentiel)}</p>}
        </div>
        <Button className="rounded-full gap-1.5 h-9 text-sm" onClick={()=>setShowNew(true)}><Plus className="w-3.5 h-3.5" /> Nouvel acquéreur</Button>
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : filtered.length===0
          ? <div className="bg-white rounded-2xl border border-border/50 p-12 text-center"><Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Aucun acquéreur</p><Button className="mt-4 rounded-full gap-2 h-9 text-sm" onClick={()=>setShowNew(true)}><Plus className="w-3.5 h-3.5" /> Ajouter</Button></div>
          : <div className="space-y-2">{filtered.map(a=>{
              const cfg=ETAPE_CFG[a.etape]||ETAPE_CFG.lead;
              return (
                <div key={a.id} onClick={()=>setSelected(a)} className="bg-white rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.scoring_ia>=70?"bg-green-50":a.scoring_ia>=50?"bg-amber-50":"bg-secondary"}`}>
                      {a.scoring_ia>0?<span className="text-xs font-black">{a.scoring_ia}</span>:<span className="text-lg">{cfg.emoji}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{a.nom}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.emoji} {cfg.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Budget {fmtEur(a.budget_min)} – {fmtEur(a.budget_max)} · {a.localisation||"—"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                </div>
              );
            })}</div>
      }
      {showNew && <CreateAcquereurModal contacts={contacts} onClose={()=>setShowNew(false)} onCreated={a=>{setAcquereurs(p=>[a,...p]);setSelected(a);setShowNew(false);}} />}
      {selected && <AcquereurDetail acquereur={selected} biens={biens} onClose={()=>setSelected(null)} onUpdate={update} />}
    </div>
  );
}