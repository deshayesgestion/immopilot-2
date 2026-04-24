import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PenTool, Plus, Send, RefreshCw, CheckCircle2, Clock, X,
  AlertTriangle, Loader2, ExternalLink, FileText, Trash2, Bell
} from "lucide-react";

const STATUT_CFG = {
  en_preparation: { label: "En préparation", cls: "bg-slate-100 text-slate-600" },
  envoye:         { label: "Envoyé",          cls: "bg-blue-100 text-blue-700" },
  partiellement_signe: { label: "En cours",   cls: "bg-amber-100 text-amber-700" },
  signe:          { label: "Signé ✓",         cls: "bg-green-100 text-green-700" },
  refuse:         { label: "Refusé",           cls: "bg-red-100 text-red-700" },
  expire:         { label: "Expiré",           cls: "bg-slate-100 text-slate-500" },
};

const SIG_STATUT = {
  en_attente: { icon: Clock,         cls: "text-amber-500" },
  envoye:     { icon: Send,          cls: "text-blue-500" },
  signe:      { icon: CheckCircle2,  cls: "text-green-600" },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

// ── Composant de création d'une demande ─────────────────────────────────────
function NouvelleSignatureModal({ documentType, documentTitre, documentUrl, sourceId, sourceEntity, onClose, onCreated }) {
  const [signataires, setSignataires] = useState([{ nom: "", email: "", role: "locataire" }]);
  const [expiration, setExpiration] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const addSig = () => setSignataires(p => [...p, { nom: "", email: "", role: "signataire" }]);
  const removeSig = i => setSignataires(p => p.filter((_, j) => j !== i));
  const setSig = (i, k, v) => setSignataires(p => p.map((s, j) => j === i ? { ...s, [k]: v } : s));

  const create = async () => {
    if (signataires.some(s => !s.nom || !s.email)) return;
    setSaving(true);
    const res = await base44.functions.invoke("signatureManager", {
      action: "create",
      document_type: documentType,
      document_titre: documentTitre,
      document_url: documentUrl || null,
      source_id: sourceId || null,
      source_entity: sourceEntity || null,
      signataires_input: signataires,
      date_expiration: expiration,
    });
    onCreated(res.data.request);
    setSaving(false);
    onClose();
  };

  const ROLES = ["locataire", "proprietaire", "vendeur", "acquereur", "agence", "garant", "signataire"];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <p className="text-sm font-bold flex items-center gap-2"><PenTool className="w-4 h-4 text-primary" /> Demande de signature</p>
            <p className="text-xs text-muted-foreground mt-0.5">{documentTitre}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Signataires */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Signataires</p>
            {signataires.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Input value={s.nom} onChange={e => setSig(i, "nom", e.target.value)} placeholder="Nom *" className="h-9 rounded-xl text-sm" />
                </div>
                <div className="col-span-4">
                  <Input type="email" value={s.email} onChange={e => setSig(i, "email", e.target.value)} placeholder="Email *" className="h-9 rounded-xl text-sm" />
                </div>
                <div className="col-span-3">
                  <select value={s.role} onChange={e => setSig(i, "role", e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-white px-2 text-xs">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button className="col-span-1 flex justify-center" onClick={() => removeSig(i)} disabled={signataires.length === 1}>
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full gap-1" onClick={addSig}>
              <Plus className="w-3 h-3" /> Ajouter signataire
            </Button>
          </div>

          {/* Expiration */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date d'expiration</label>
            <Input type="date" value={expiration} onChange={e => setExpiration(e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>

          {/* Info eIDAS */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-[11px] text-blue-700">
            🔒 Signature électronique conforme eIDAS · Preuve horodatée · Archivage automatique
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full text-xs h-9" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full text-xs h-9 gap-1.5" onClick={create}
            disabled={saving || signataires.some(s => !s.nom || !s.email)}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenTool className="w-3 h-3" />}
            Créer la demande
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
export default function SignaturePanel({ documentType, documentTitre, documentUrl, sourceId, sourceEntity, compact = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState(null);
  const [relancing, setRelancing] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [sourceId]);

  const loadRequests = async () => {
    setLoading(true);
    const all = await base44.entities.SignatureRequest.list("-created_date", 50);
    const filtered = sourceId ? all.filter(r => r.source_id === sourceId) : all.filter(r => r.document_type === documentType);
    setRequests(filtered);
    setLoading(false);
  };

  const envoyer = async (req) => {
    setSending(req.id);
    await base44.functions.invoke("signatureManager", { action: "send", request_id: req.id });
    await loadRequests();
    setSending(null);
  };

  const relancer = async (req) => {
    setRelancing(req.id);
    await base44.functions.invoke("signatureManager", { action: "relance", request_id: req.id });
    await loadRequests();
    setRelancing(null);
  };

  const nbEnAttente = requests.filter(r => r.statut === "envoye" || r.statut === "partiellement_signe").length;
  const dernierSigne = requests.find(r => r.statut === "signe");

  if (compact) {
    // Vue compacte pour intégration dans TabBail / TabMandat
    return (
      <div className="space-y-3">
        {/* Statut rapide */}
        {dernierSigne ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-green-800">Document signé ✓</p>
              <p className="text-[11px] text-green-700">Le {fmtDate(dernierSigne.date_signature_complete)} · {dernierSigne.signataires?.length} signataire(s)</p>
            </div>
            {dernierSigne.document_signe_url && (
              <a href={dernierSigne.document_signe_url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline flex-shrink-0">Voir</a>
            )}
          </div>
        ) : nbEnAttente > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-800">{nbEnAttente} signature(s) en attente</p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1.5 border-primary/30 text-primary" onClick={() => setShowNew(true)}>
            <PenTool className="w-3 h-3" /> Demander signature
          </Button>
          {nbEnAttente > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1.5" onClick={() => relancer(requests.find(r => r.statut === "envoye" || r.statut === "partiellement_signe"))} disabled={!!relancing}>
              {relancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />} Relancer
            </Button>
          )}
        </div>

        {showNew && (
          <NouvelleSignatureModal
            documentType={documentType} documentTitre={documentTitre}
            documentUrl={documentUrl} sourceId={sourceId} sourceEntity={sourceEntity}
            onClose={() => setShowNew(false)}
            onCreated={req => { setRequests(p => [req, ...p]); envoyer(req); }}
          />
        )}
      </div>
    );
  }

  // ── Vue complète ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Signatures électroniques</p>
          {nbEnAttente > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{nbEnAttente} en attente</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={loadRequests} disabled={loading}>
            <RefreshCw className="w-3 h-3" /> Actualiser
          </Button>
          <Button size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="w-3 h-3" /> Nouvelle demande
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-10 text-center">
          <PenTool className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune demande de signature</p>
          <Button className="mt-3 rounded-full gap-2 h-8 text-xs" onClick={() => setShowNew(true)}>
            <Plus className="w-3 h-3" /> Créer une demande
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cfg = STATUT_CFG[req.statut] || STATUT_CFG.en_preparation;
            const nbSignes = req.signataires?.filter(s => s.statut === "signe").length || 0;
            const nbTotal = req.signataires?.length || 0;
            const pct = nbTotal > 0 ? Math.round((nbSignes / nbTotal) * 100) : 0;

            return (
              <div key={req.id} className="bg-white rounded-2xl border border-border/50 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug">{req.document_titre}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{req.document_type?.replace(/_/g," ")} · Expire {fmtDate(req.date_expiration)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                </div>

                {/* Progression */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">{nbSignes}/{nbTotal} signataires</span>
                    <span className="font-semibold text-primary">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Signataires */}
                <div className="flex flex-wrap gap-2">
                  {req.signataires?.map((s, i) => {
                    const scfg = SIG_STATUT[s.statut] || SIG_STATUT.en_attente;
                    const Icon = scfg.icon;
                    return (
                      <div key={i} className="flex items-center gap-1.5 bg-secondary/30 rounded-lg px-2 py-1">
                        <Icon className={`w-3 h-3 flex-shrink-0 ${scfg.cls}`} />
                        <span className="text-[10px] font-medium">{s.nom}</span>
                        <span className="text-[9px] text-muted-foreground capitalize">({s.role})</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-1">
                  {req.statut === "en_preparation" && (
                    <Button size="sm" className="h-7 text-[10px] rounded-full gap-1 px-3" onClick={() => envoyer(req)} disabled={sending === req.id}>
                      {sending === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Envoyer les liens
                    </Button>
                  )}
                  {(req.statut === "envoye" || req.statut === "partiellement_signe") && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full gap-1 px-3" onClick={() => relancer(req)} disabled={relancing === req.id}>
                        {relancing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                        Relancer
                      </Button>
                      {req.relances_count > 0 && (
                        <span className="text-[10px] text-muted-foreground self-center">{req.relances_count} relance(s)</span>
                      )}
                    </>
                  )}
                  {req.statut === "signe" && req.preuve_certificat && (
                    <div className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 rounded-lg px-2 py-1">
                      <CheckCircle2 className="w-3 h-3" /> Preuve horodatée · {fmtDate(req.date_signature_complete)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <NouvelleSignatureModal
          documentType={documentType} documentTitre={documentTitre}
          documentUrl={documentUrl} sourceId={sourceId} sourceEntity={sourceEntity}
          onClose={() => setShowNew(false)}
          onCreated={req => { setRequests(p => [req, ...p]); envoyer(req); }}
        />
      )}
    </div>
  );
}