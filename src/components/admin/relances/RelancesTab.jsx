/**
 * RelancesTab — Suivi des relances automatiques IA
 * Intégré dans AccueilIA (onglet Relances)
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Bell, Loader2, Play, CheckCircle2, X, RefreshCw,
  CreditCard, FolderOpen, Mail, Phone, MessageSquare,
  AlertTriangle, Clock, Zap, Eye, Bot
} from "lucide-react";

const TYPE_CONFIG = {
  paiement_retard:       { label: "Paiement en retard",      icon: CreditCard,  color: "text-red-600 bg-red-50",     dot: "bg-red-500" },
  dossier_inactif:       { label: "Dossier inactif",          icon: FolderOpen,  color: "text-amber-600 bg-amber-50", dot: "bg-amber-500" },
  reponse_client:        { label: "Sans réponse client",      icon: Mail,        color: "text-blue-600 bg-blue-50",   dot: "bg-blue-500" },
  visite_non_confirmee:  { label: "Visite non confirmée",     icon: Phone,       color: "text-purple-600 bg-purple-50", dot: "bg-purple-500" },
};

const CANAL_CONFIG = {
  email:    { label: "Email",    icon: Mail,           color: "bg-blue-100 text-blue-700" },
  sms:      { label: "SMS",      icon: Phone,          color: "bg-green-100 text-green-700" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare,  color: "bg-emerald-100 text-emerald-700" },
};

const STATUT_CONFIG = {
  planifiee: { label: "Planifiée",  color: "bg-gray-100 text-gray-500" },
  envoyee:   { label: "Envoyée",    color: "bg-blue-100 text-blue-700" },
  repondue:  { label: "Répondue",   color: "bg-green-100 text-green-700" },
  ignoree:   { label: "Ignorée",    color: "bg-gray-100 text-gray-400" },
  resolue:   { label: "Résolue",    color: "bg-emerald-100 text-emerald-700" },
};

const NIVEAU_LABELS = { 1: "Rappel doux", 2: "Relance ferme", 3: "Mise en demeure" };
const NIVEAU_COLORS = {
  1: "bg-gray-100 text-gray-600",
  2: "bg-amber-100 text-amber-700",
  3: "bg-red-100 text-red-700",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function DryRunPreview({ relances, onClose, onConfirm, confirming }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Aperçu — {relances.length} relances à créer
          </p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {relances.map((r, i) => {
            const TypeIcon = TYPE_CONFIG[r.type]?.icon || Bell;
            return (
              <div key={i} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_CONFIG[r.type]?.color || "text-gray-500 bg-gray-50"}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{r.contact}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CANAL_CONFIG[r.canal]?.color || "bg-gray-100 text-gray-500"}`}>
                      {CANAL_CONFIG[r.canal]?.label || r.canal}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${NIVEAU_COLORS[r.niveau]}`}>
                      {NIVEAU_LABELS[r.niveau]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.raison}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 p-5 border-t border-border/50">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 h-9 text-sm gap-1.5" onClick={onConfirm} disabled={confirming}>
            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Envoyer {relances.length} relances</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RelanceCard({ relance, onResolve }) {
  const cfg = TYPE_CONFIG[relance.type_relance] || TYPE_CONFIG.paiement_retard;
  const canalCfg = CANAL_CONFIG[relance.canal] || CANAL_CONFIG.email;
  const statutCfg = STATUT_CONFIG[relance.statut] || STATUT_CONFIG.planifiee;
  const Icon = cfg.icon;
  const CanalIcon = canalCfg.icon;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{relance.contact_nom}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statutCfg.color}`}>{statutCfg.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${NIVEAU_COLORS[relance.niveau]}`}>{NIVEAU_LABELS[relance.niveau] || "Rappel"}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
          {relance.raison && <p className="text-xs text-muted-foreground/70 mt-1 italic truncate">{relance.raison}</p>}
        </div>
        {relance.statut !== "resolue" && (
          <button onClick={() => onResolve(relance.id)}
            className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors flex-shrink-0" title="Marquer résolue">
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${canalCfg.color}`}>
          <CanalIcon className="w-2.5 h-2.5" />{canalCfg.label}
        </span>
        {relance.dossier_titre && (
          <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
            <FolderOpen className="w-2.5 h-2.5" />{relance.dossier_titre}
          </span>
        )}
        {relance.bien_titre && (
          <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full truncate max-w-[140px]">{relance.bien_titre}</span>
        )}
        {relance.montant && (
          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">
            {relance.montant.toLocaleString("fr-FR")} €
          </span>
        )}
        {relance.jours_retard && (
          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
            {relance.jours_retard}j retard
          </span>
        )}
        {relance.jours_inactivite && (
          <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
            {relance.jours_inactivite}j inactif
          </span>
        )}
      </div>

      {relance.contenu_ia && (
        <div className="bg-secondary/20 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <Bot className="w-2.5 h-2.5" /> Message IA généré
          </p>
          <p className="text-xs text-foreground/80 line-clamp-3">{relance.contenu_ia}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-2">
        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{fmtDate(relance.date_envoi || relance.created_date)}</span>
        {relance.auto && <span className="flex items-center gap-1 text-primary"><Bot className="w-2.5 h-2.5" /> Automatique</span>}
      </div>
    </div>
  );
}

export default function RelancesTab() {
  const [relances, setRelances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  const load = async () => {
    const res = await base44.entities.Relance.list("-created_date", 200);
    setRelances(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDryRun = async () => {
    setRunning(true);
    const res = await base44.functions.invoke("relanceAutomatique", { dry_run: true });
    setRunning(false);
    if (res.data?.relances?.length > 0) {
      setDryRunResult(res.data.relances);
    } else {
      setDryRunResult([]);
    }
  };

  const handleConfirmSend = async () => {
    setConfirming(true);
    await base44.functions.invoke("relanceAutomatique", { dry_run: false, manual: true });
    setConfirming(false);
    setDryRunResult(null);
    load();
  };

  const handleResolve = async (id) => {
    await base44.entities.Relance.update(id, { statut: "resolue" });
    load();
  };

  const stats = {
    total: relances.length,
    envoyees: relances.filter(r => r.statut === "envoyee").length,
    resolues: relances.filter(r => r.statut === "resolue").length,
    paiement: relances.filter(r => r.type_relance === "paiement_retard" && r.statut !== "resolue").length,
    dossier: relances.filter(r => r.type_relance === "dossier_inactif" && r.statut !== "resolue").length,
    visite: relances.filter(r => r.type_relance === "visite_non_confirmee" && r.statut !== "resolue").length,
    reponse: relances.filter(r => r.type_relance === "reponse_client" && r.statut !== "resolue").length,
  };

  const filtered = relances.filter(r => {
    if (filterType !== "all" && r.type_relance !== filterType) return false;
    if (filterStatut !== "all" && r.statut !== filterStatut) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Boutons d'action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full gap-2 h-9 text-sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button className="rounded-full gap-2 h-9 text-sm bg-amber-500 hover:bg-amber-600" onClick={handleDryRun} disabled={running}>
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            Analyser & prévisualiser
          </Button>
          <Button className="rounded-full gap-2 h-9 text-sm" onClick={handleConfirmSend} disabled={confirming}>
            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Lancer relances
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Automatique chaque nuit à 8h</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Paiements retard",     value: stats.paiement, icon: CreditCard,  color: "text-red-600",    bg: "bg-red-50" },
          { label: "Dossiers inactifs",    value: stats.dossier,  icon: FolderOpen,  color: "text-amber-600",  bg: "bg-amber-50" },
          { label: "Sans réponse",         value: stats.reponse,  icon: Mail,        color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Visites non confirmées", value: stats.visite, icon: Phone,       color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre de progression relances envoyées/résolues */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{stats.envoyees} envoyées · {stats.resolues} résolues</span>
              <span className="font-semibold text-green-600">{Math.round((stats.resolues / stats.total) * 100)}% résolu</span>
            </div>
            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                style={{ width: `${(stats.resolues / stats.total) * 100}%` }} />
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
          <option value="all">Tous types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="h-9 rounded-xl border border-input bg-white px-3 text-sm">
          <option value="all">Tous statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border/50 p-12 text-center">
          <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Aucune relance</p>
          <p className="text-xs text-muted-foreground/70">Cliquez sur "Analyser & prévisualiser" pour détecter les relances nécessaires</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(r => (
            <RelanceCard key={r.id} relance={r} onResolve={handleResolve} />
          ))}
        </div>
      )}

      {/* Dry run preview modal */}
      {dryRunResult !== null && (
        <DryRunPreview
          relances={dryRunResult}
          onClose={() => setDryRunResult(null)}
          onConfirm={handleConfirmSend}
          confirming={confirming}
        />
      )}
    </div>
  );
}