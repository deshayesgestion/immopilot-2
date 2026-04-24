import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { PenTool, CheckCircle2, Clock, Send, AlertTriangle, RefreshCw, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignaturePanel from "@/components/signature/SignaturePanel";

const STATUT_CFG = {
  en_preparation: { label: "En préparation", cls: "bg-slate-100 text-slate-600" },
  envoye:         { label: "Envoyé",          cls: "bg-blue-100 text-blue-700" },
  partiellement_signe: { label: "En cours",   cls: "bg-amber-100 text-amber-700" },
  signe:          { label: "Signé ✓",         cls: "bg-green-100 text-green-700" },
  refuse:         { label: "Refusé",           cls: "bg-red-100 text-red-700" },
  expire:         { label: "Expiré",           cls: "bg-slate-100 text-slate-500" },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function SignaturesDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [relancing, setRelancing] = useState(null);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.SignatureRequest.list("-created_date", 100);
    setRequests(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? requests : requests.filter(r => r.statut === filter);

  const stats = {
    total: requests.length,
    en_attente: requests.filter(r => r.statut === "envoye" || r.statut === "partiellement_signe").length,
    signes: requests.filter(r => r.statut === "signe").length,
    expires: requests.filter(r => r.statut === "expire").length,
  };

  const tauxSignature = stats.total > 0 ? Math.round((stats.signes / stats.total) * 100) : 0;

  const relancer = async (req) => {
    setRelancing(req.id);
    await base44.functions.invoke("signatureManager", { action: "relance", request_id: req.id });
    await load();
    setRelancing(null);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <PenTool className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Signatures Électroniques</h1>
          <p className="text-sm text-muted-foreground">Baux · Mandats · Compromis · EDL — Conforme eIDAS</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto h-8 text-xs rounded-full gap-1.5" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total demandes",   value: stats.total,          icon: PenTool,      bg: "bg-primary/5",  color: "text-primary",   border: "border-primary/10" },
          { label: "En attente",       value: stats.en_attente,     icon: Clock,        bg: "bg-amber-50",   color: "text-amber-600", border: "border-amber-100", alert: stats.en_attente > 0 },
          { label: "Signés",           value: stats.signes,         icon: CheckCircle2, bg: "bg-green-50",   color: "text-green-600", border: "border-green-100" },
          { label: "Taux signature",   value: tauxSignature + "%",  icon: Send,         bg: "bg-blue-50",    color: "text-blue-600",  border: "border-blue-100" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className={`bg-white rounded-2xl border ${k.border} p-4 relative`}>
              <div className={`inline-flex p-1.5 rounded-lg ${k.bg} mb-2`}><Icon className={`w-3.5 h-3.5 ${k.color}`} /></div>
              {k.alert && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Barre progression globale */}
      <div className="bg-white rounded-2xl border border-border/50 p-4">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="font-semibold">Taux de signature global</span>
          <span className="text-primary font-bold">{tauxSignature}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${tauxSignature}%` }} />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-1 flex-wrap">
        {[
          { id: "all", label: "Toutes" },
          { id: "envoye", label: "⏳ En attente" },
          { id: "partiellement_signe", label: "🔄 En cours" },
          { id: "signe", label: "✅ Signées" },
          { id: "en_preparation", label: "📋 Préparation" },
          { id: "expire", label: "⚠ Expirées" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f.id ? "bg-primary text-white" : "bg-white border border-border/50 text-muted-foreground hover:text-foreground"}`}>
            {f.label}
            <span className="ml-1 text-[9px]">({f.id === "all" ? requests.length : requests.filter(r => r.statut === f.id).length})</span>
          </button>
        ))}
      </div>

      {/* Liste demandes */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 py-12 text-center">
          <PenTool className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune demande de signature</p>
          <p className="text-xs text-muted-foreground mt-1">Les demandes sont créées depuis les dossiers de location et de vente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(req => {
            const cfg = STATUT_CFG[req.statut] || STATUT_CFG.en_preparation;
            const nbSignes = req.signataires?.filter(s => s.statut === "signe").length || 0;
            const nbTotal = req.signataires?.length || 0;
            const pct = nbTotal > 0 ? Math.round((nbSignes / nbTotal) * 100) : 0;

            return (
              <div key={req.id} className="bg-white rounded-2xl border border-border/50 px-4 py-3.5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PenTool className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{req.document_titre}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{req.document_type?.replace(/_/g," ")}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground">
                      <span>{nbSignes}/{nbTotal} signé(s)</span>
                      <span>Expire {fmtDate(req.date_expiration)}</span>
                      {req.relances_count > 0 && <span>{req.relances_count} relance(s)</span>}
                    </div>
                    <div className="mt-1.5 h-1 bg-secondary rounded-full w-32">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {(req.statut === "envoye" || req.statut === "partiellement_signe") && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full gap-1 px-2" onClick={() => relancer(req)} disabled={relancing === req.id}>
                        {relancing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />} Relancer
                      </Button>
                    )}
                    {req.statut === "signe" && req.preuve_certificat && (
                      <span className="text-[10px] text-green-700 bg-green-50 rounded-lg px-2 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {fmtDate(req.date_signature_complete)}
                      </span>
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