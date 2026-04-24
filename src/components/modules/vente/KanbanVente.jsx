import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Phone, Mail, Plus, FileText, Handshake, Eye, ChevronRight,
  Loader2, Sparkles, AlertTriangle, TrendingDown, RefreshCw,
  Calendar, ArrowRight, X, Send, Home, Users
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Étapes pipeline Kanban ──
const COLUMNS = [
  { id: "estimation",       label: "Estimation",          color: "bg-slate-100 text-slate-700",    dot: "bg-slate-400",    emoji: "📊" },
  { id: "mandat_signe",     label: "Mandat signé",         color: "bg-blue-100 text-blue-700",      dot: "bg-blue-500",     emoji: "✅" },
  { id: "commercialisation",label: "En commercialisation", color: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-500",   emoji: "📢" },
  { id: "visites",          label: "Visites en cours",     color: "bg-violet-100 text-violet-700",  dot: "bg-violet-500",   emoji: "🏠" },
  { id: "offre",            label: "Offre reçue",          color: "bg-amber-100 text-amber-700",    dot: "bg-amber-500",    emoji: "📋" },
  { id: "negociation",      label: "Négociation",          color: "bg-orange-100 text-orange-700",  dot: "bg-orange-500",   emoji: "🤝" },
  { id: "compromis",        label: "Compromis signé",      color: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500",  emoji: "📝" },
  { id: "vendu",            label: "Vendu",                color: "bg-green-100 text-green-700",    dot: "bg-green-500",    emoji: "🔑" },
];

// Map statuts MandatVente → colonne Kanban
function getColumnFromMandat(mandat) {
  if (mandat.statut_mandat === "en_attente") return "estimation";
  if (mandat.statut_mandat === "signe" && !mandat.bien_publie) return "mandat_signe";
  if (mandat.kanban_etape) return mandat.kanban_etape;
  if (mandat.statut_mandat === "signe") return "commercialisation";
  return "estimation";
}

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

// ── Quick Action Modal ──
function QuickActionModal({ mandat, bien, action, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");

  const handle = async () => {
    setLoading(true);
    if (action === "email" && mandat.vendeur_email) {
      await base44.integrations.Core.SendEmail({
        to: mandat.vendeur_email,
        subject: `Suivi de votre bien — ${bien?.titre || ""}`,
        body: `<p>Bonjour ${mandat.vendeur_nom},</p><p>${value || "Message de suivi de votre dossier de vente."}</p><p>Cordialement,<br>L'agence</p>`,
      });
    }
    if (action === "visite") {
      await base44.entities.Evenement.create({
        titre: `Visite — ${bien?.titre || mandat.vendeur_nom}`,
        type: "visite", module: "vente",
        date_debut: value || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        date_fin: value2 || new Date(Date.now() + 90000000).toISOString().slice(0, 16),
        lieu: bien?.adresse || "",
        bien_titre: bien?.titre || "",
        bien_id: mandat.bien_id,
        statut: "planifie",
      });
      const hist = [...(mandat.historique || []), { date: new Date().toISOString(), action: "Visite planifiée", auteur: "Agent" }];
      await base44.entities.MandatVente.update(mandat.id, { kanban_etape: "visites", historique: hist });
    }
    if (action === "offre") {
      const hist = [...(mandat.historique || []), { date: new Date().toISOString(), action: `Offre reçue : ${value} €`, auteur: "Agent" }];
      await base44.entities.MandatVente.update(mandat.id, { kanban_etape: "offre", historique: hist });
    }
    setLoading(false);
    onDone();
    onClose();
  };

  const TITLES = { email: "📧 Envoyer un email", visite: "📅 Planifier une visite", offre: "🤝 Enregistrer une offre" };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">{TITLES[action]}</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground">{bien?.titre || mandat.vendeur_nom}</p>
        {action === "email" && (
          <textarea value={value} onChange={e => setValue(e.target.value)}
            placeholder="Message pour le vendeur…"
            className="w-full h-24 text-sm border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        )}
        {action === "visite" && (
          <div className="space-y-2">
            <div><label className="text-xs text-muted-foreground mb-1 block">Date & heure début</label>
              <Input type="datetime-local" value={value} onChange={e => setValue(e.target.value)} className="h-9 rounded-xl text-sm" />
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Date & heure fin</label>
              <Input type="datetime-local" value={value2} onChange={e => setValue2(e.target.value)} className="h-9 rounded-xl text-sm" />
            </div>
          </div>
        )}
        {action === "offre" && (
          <div><label className="text-xs text-muted-foreground mb-1 block">Montant de l'offre (€)</label>
            <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: 250000" className="h-9 rounded-xl text-sm" />
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full text-xs h-8" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full text-xs h-8 gap-1.5" onClick={handle} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Valider
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Carte Kanban ──
function KanbanCard({ mandat, bien, acquereurs, onMove, onQuickAction, onClick }) {
  const nbAcquereurs = acquereurs.filter(a =>
    a.budget_max >= (mandat.prix_demande || 0) * 0.9 &&
    a.etape !== "perdu" && a.etape !== "acte"
  ).length;

  const jours = mandat.date_debut_mandat
    ? Math.floor((Date.now() - new Date(mandat.date_debut_mandat)) / 86400000) : null;

  return (
    <div
      className="bg-white rounded-xl border border-border/50 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Photo bien */}
      {bien?.photo_principale && (
        <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-secondary/20">
          <img src={bien.photo_principale} alt={bien.titre} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Titre + prix */}
      <div className="mb-2">
        <p className="text-xs font-bold leading-tight line-clamp-1">{bien?.titre || mandat.vendeur_nom}</p>
        {mandat.prix_demande > 0 && (
          <p className="text-sm font-black text-primary mt-0.5">{fmtEur(mandat.prix_demande)}</p>
        )}
        {bien?.adresse && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{bien.adresse}</p>}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${mandat.type_mandat === "exclusif" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
          {mandat.type_mandat || "simple"}
        </span>
        {nbAcquereurs > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
            👥 {nbAcquereurs} acq.
          </span>
        )}
        {jours !== null && jours > 60 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
            ⚠ {jours}j
          </span>
        )}
      </div>

      {/* Vendeur */}
      <p className="text-[10px] text-muted-foreground mb-2">👤 {mandat.vendeur_nom}</p>

      {/* Actions rapides — 1 clic */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button title="Planifier visite" onClick={() => onQuickAction(mandat, bien, "visite")}
          className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-secondary hover:bg-primary hover:text-white text-muted-foreground transition-all text-[10px] font-medium">
          <Eye className="w-3 h-3" /> Visite
        </button>
        <button title="Envoyer email" onClick={() => onQuickAction(mandat, bien, "email")}
          className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-secondary hover:bg-blue-500 hover:text-white text-muted-foreground transition-all text-[10px] font-medium">
          <Mail className="w-3 h-3" /> Email
        </button>
        <button title="Offre reçue" onClick={() => onQuickAction(mandat, bien, "offre")}
          className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-secondary hover:bg-amber-500 hover:text-white text-muted-foreground transition-all text-[10px] font-medium">
          <Handshake className="w-3 h-3" /> Offre
        </button>
      </div>

      {/* Boutons avance étape */}
      <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
        {COLUMNS.slice(COLUMNS.findIndex(c => c.id === mandat._kanban_col) + 1, COLUMNS.findIndex(c => c.id === mandat._kanban_col) + 2).map(next => (
          <button key={next.id} onClick={() => onMove(mandat, next.id)}
            className="flex-1 flex items-center justify-center gap-1 h-6 rounded-lg border border-border/60 text-[9px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-all">
            <ArrowRight className="w-2.5 h-2.5" /> {next.emoji} {next.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Colonne Kanban ──
function KanbanColumn({ col, mandats, biens, acquereurs, onMove, onQuickAction, onCardClick }) {
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));
  const total = mandats.reduce((s, m) => s + (m.prix_demande || 0), 0);

  return (
    <div className="flex-shrink-0 w-64 flex flex-col">
      {/* En-tête colonne */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${col.dot}`} />
          <span className="text-xs font-bold">{col.emoji} {col.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {mandats.length > 0 && (
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full font-semibold text-muted-foreground">
              {mandats.length}
            </span>
          )}
        </div>
      </div>
      {total > 0 && (
        <p className="text-[10px] text-muted-foreground px-1 mb-2">{fmtEur(total)}</p>
      )}

      {/* Cartes */}
      <div className="flex-1 space-y-2 min-h-[120px] bg-secondary/20 rounded-xl p-2">
        {mandats.length === 0 && (
          <div className="text-center py-6">
            <p className="text-[10px] text-muted-foreground/50">Aucun dossier</p>
          </div>
        )}
        {mandats.map(m => (
          <KanbanCard
            key={m.id}
            mandat={m}
            bien={bienMap[m.bien_id]}
            acquereurs={acquereurs}
            onMove={onMove}
            onQuickAction={onQuickAction}
            onClick={() => onCardClick(m)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Alertes IA Super Agent ──
function AlertesIA({ mandats, biens, acquereurs }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const analyser = async () => {
    setLoading(true);
    const biensLents = mandats.filter(m => {
      const j = m.date_debut_mandat ? Math.floor((Date.now() - new Date(m.date_debut_mandat)) / 86400000) : 0;
      return j > 60 && !["vendu", "compromis"].includes(m.kanban_etape);
    });
    const sansSVisites = mandats.filter(m =>
      ["commercialisation", "mandat_signe"].includes(m.kanban_etape || getColumnFromMandat(m))
    );
    const leadsChauds = acquereurs.filter(a => a.scoring_ia >= 70 && a.etape !== "acte" && a.etape !== "perdu");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Super Agent IA — Module Vente. Analyse et génère des actions concrètes.

Mandats actifs : ${mandats.length}
Biens en vente +60j sans avancement : ${biensLents.map(m => bienMap[m.bien_id]?.titre || m.vendeur_nom).join(", ") || "aucun"}
Biens en commercialisation sans visite récente : ${sansSVisites.length}
Acquéreurs chauds (score ≥70) non convertis : ${leadsChauds.length}

Génère 3-4 alertes/recommandations ultra courtes et actionnables.
Format JSON: { alertes: [{ type: "danger|warning|opportunity", titre: string, action: string, urgence: "haute|normale" }] }`,
      response_json_schema: {
        type: "object",
        properties: {
          alertes: { type: "array", items: { type: "object" } }
        }
      }
    });

    setInsights(res?.alertes || []);
    setShown(true);
    setLoading(false);
  };

  const STYLES = {
    danger:      "bg-red-50 border-red-200 text-red-800",
    warning:     "bg-amber-50 border-amber-200 text-amber-800",
    opportunity: "bg-green-50 border-green-200 text-green-800",
  };
  const ICONS = { danger: "🔴", warning: "🟡", opportunity: "🟢" };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold">🤖 Super Agent IA — Alertes vente</p>
        </div>
        <Button size="sm" variant={shown ? "outline" : "default"} className="h-7 text-xs rounded-full gap-1.5" onClick={analyser} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : shown ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {loading ? "Analyse…" : shown ? "Actualiser" : "Analyser"}
        </Button>
      </div>
      {!shown && !loading && (
        <p className="text-xs text-muted-foreground">Cliquez "Analyser" pour détecter les opportunités manquées et les biens à relancer.</p>
      )}
      {loading && <p className="text-xs text-muted-foreground animate-pulse">Super Agent analyse votre pipeline…</p>}
      {shown && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2.5 text-xs ${STYLES[ins.type] || STYLES.warning}`}>
              <p className="font-bold mb-0.5">{ICONS[ins.type]} {ins.titre}</p>
              <p className="text-[11px] opacity-80">{ins.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant principal KanbanVente ──
export default function KanbanVente({ mandats: initMandats, biens, contacts, acquereurs, onMandatUpdate, onSelectMandat }) {
  const [mandats, setMandats] = useState(initMandats || []);
  const [quickAction, setQuickAction] = useState(null); // { mandat, bien, action }
  const [moving, setMoving] = useState(null);

  useEffect(() => { setMandats(initMandats || []); }, [initMandats]);

  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  // Enrichir mandats avec colonne kanban calculée
  const enriched = mandats.map(m => ({
    ...m,
    _kanban_col: m.kanban_etape || getColumnFromMandat(m),
  }));

  const moveMandat = async (mandat, newCol) => {
    setMoving(mandat.id);
    const hist = [...(mandat.historique || []), {
      date: new Date().toISOString(),
      action: `Pipeline → ${COLUMNS.find(c => c.id === newCol)?.label || newCol}`,
      auteur: "Agent"
    }];
    await base44.entities.MandatVente.update(mandat.id, { kanban_etape: newCol, historique: hist });
    const updated = mandats.map(m => m.id === mandat.id ? { ...m, kanban_etape: newCol, _kanban_col: newCol, historique: hist } : m);
    setMandats(updated);
    onMandatUpdate?.(updated);
    setMoving(null);
  };

  const handleQuickDone = () => {
    // Rafraichit légèrement
    base44.entities.MandatVente.list("-created_date", 100).then(m => {
      setMandats(m);
      onMandatUpdate?.(m);
    });
  };

  return (
    <div className="space-y-4">
      {/* Alertes IA */}
      <AlertesIA mandats={enriched} biens={biens} acquereurs={acquereurs} />

      {/* Kanban horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map(col => {
            const colMandats = enriched.filter(m => m._kanban_col === col.id);
            return (
              <KanbanColumn
                key={col.id}
                col={col}
                mandats={colMandats}
                biens={biens}
                acquereurs={acquereurs}
                onMove={moveMandat}
                onQuickAction={(mandat, bien, action) => setQuickAction({ mandat, bien, action })}
                onCardClick={onSelectMandat}
              />
            );
          })}
        </div>
      </div>

      {/* Modal action rapide */}
      {quickAction && (
        <QuickActionModal
          mandat={quickAction.mandat}
          bien={quickAction.bien}
          action={quickAction.action}
          onClose={() => setQuickAction(null)}
          onDone={handleQuickDone}
        />
      )}
    </div>
  );
}