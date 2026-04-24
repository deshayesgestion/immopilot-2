/**
 * LocationTempsReel — Dashboard actionnel Location
 * Tableau de bord avec actions directes, alertes et pipeline visuel
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertCircle, CheckCircle2, Clock, ChevronRight,
  TrendingUp, Home, Users, Euro, Star, FileText, Calendar, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DossierDetail from "./workflow/DossierDetail";

const STATUT_CFG = {
  ouvert:          { label: "Ouvert",          emoji: "📂", color: "bg-slate-100 text-slate-700" },
  en_selection:    { label: "En sélection",    emoji: "👥", color: "bg-blue-100 text-blue-700" },
  candidat_valide: { label: "Candidat validé", emoji: "✅", color: "bg-indigo-100 text-indigo-700" },
  bail_signe:      { label: "Bail signé",      emoji: "📝", color: "bg-purple-100 text-purple-700" },
  en_cours:        { label: "En cours",        emoji: "🏡", color: "bg-emerald-100 text-emerald-700" },
  termine:         { label: "Terminé",         emoji: "🏁", color: "bg-gray-100 text-gray-600" },
};

const fmt = n => (n || 0).toLocaleString("fr-FR") + " €";
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

export default function LocationTempsReel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDossier, setSelectedDossier] = useState(null);

  const load = async () => {
    setLoading(true);
    const [dossiers, quittances, rdvs] = await Promise.all([
      base44.entities.DossierLocatif.list("-updated_date", 100),
      base44.entities.Quittance.list("-created_date", 200),
      base44.entities.Evenement.filter({ module: "location" }),
    ]);
    setData({ dossiers, quittances, rdvs });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateDossier = (updated) => {
    setData(prev => ({
      ...prev,
      dossiers: prev.dossiers.map(d => d.id === updated.id ? updated : d),
    }));
    if (selectedDossier?.id === updated.id) setSelectedDossier(updated);
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  const { dossiers, quittances, rdvs } = data;

  // KPIs
  const actifs = dossiers.filter(d => d.statut_dossier === "en_cours" || d.statut_dossier === "bail_signe");
  const impayees = quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye");
  const encaisse = quittances.filter(q => q.statut === "paye").reduce((s, q) => s + (q.montant_total || 0), 0);
  const rdvsProchains = rdvs.filter(r => r.statut === "planifie" && new Date(r.date_debut) > new Date())
    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut)).slice(0, 3);
  const dossiersUrgents = dossiers.filter(d => {
    if (d.statut_dossier === "en_cours" || d.statut_dossier === "bail_signe") return false;
    const age = (Date.now() - new Date(d.updated_date || d.created_date)) / 86400000;
    return age > 7;
  }).slice(0, 5);
  const dossiersActifs = dossiers.filter(d => ["en_cours", "bail_signe", "en_selection", "candidat_valide"].includes(d.statut_dossier)).slice(0, 8);

  return (
    <div className="space-y-4">
      {/* KPIs en ligne */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: "🏡", label: "Dossiers actifs", value: actifs.length, color: "text-emerald-600", bg: "bg-emerald-50", action: null },
          { icon: "💶", label: "Encaissé (mois)", value: fmt(encaisse), color: "text-green-600", bg: "bg-green-50" },
          { icon: "⚠️", label: "Impayés", value: impayees.length, color: impayees.length > 0 ? "text-red-600" : "text-muted-foreground", bg: impayees.length > 0 ? "bg-red-50" : "bg-secondary/30" },
          { icon: "📅", label: "RDV à venir", value: rdvsProchains.length, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border/50 p-4">
            <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center text-lg mb-2`}>{k.icon}</div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── DOSSIERS ACTIFS (colonne large) ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <p className="text-sm font-semibold">Dossiers en cours</p>
            <span className="text-xs text-muted-foreground">{dossiersActifs.length} dossier{dossiersActifs.length > 1 ? "s" : ""}</span>
          </div>
          {dossiersActifs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Aucun dossier actif</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {dossiersActifs.map(d => {
                const statut = STATUT_CFG[d.statut_dossier || "ouvert"] || STATUT_CFG.ouvert;
                return (
                  <button key={d.id} onClick={() => setSelectedDossier(d)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors text-left group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">{d.locataire_nom || "Sans nom"}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statut.color}`}>
                          {statut.emoji} {statut.label}
                        </span>
                        {d.scoring_ia > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                            d.scoring_ia >= 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            <Star className="w-2.5 h-2.5" /> {d.scoring_ia}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        {d.bien_titre && <span className="flex items-center gap-1 truncate"><Home className="w-3 h-3 flex-shrink-0" />{d.bien_titre}</span>}
                        {d.loyer_mensuel > 0 && <span className="flex items-center gap-1 flex-shrink-0"><Euro className="w-3 h-3" />{d.loyer_mensuel?.toLocaleString("fr-FR")} €/mois</span>}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE ── */}
        <div className="space-y-4">
          {/* RDV à venir */}
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold">Prochains RDV</p>
            </div>
            {rdvsProchains.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun RDV planifié</p>
            ) : (
              <div className="divide-y divide-border/20">
                {rdvsProchains.map(r => (
                  <div key={r.id} className="px-4 py-2.5">
                    <p className="text-xs font-semibold truncate">{r.titre}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(r.date_debut)} · {r.contact_nom || "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertes urgentes */}
          {(dossiersUrgents.length > 0 || impayees.length > 0) && (
            <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-700">Alertes</p>
              </div>
              <div className="divide-y divide-border/20">
                {impayees.slice(0, 3).map(q => (
                  <div key={q.id} className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-base">💸</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-red-700 truncate">{q.locataire_nom || "Locataire"}</p>
                      <p className="text-[11px] text-muted-foreground">{fmt(q.montant_total)} · {q.mois_label || q.mois}</p>
                    </div>
                  </div>
                ))}
                {dossiersUrgents.slice(0, 2).map(d => (
                  <button key={d.id} onClick={() => setSelectedDossier(d)}
                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-secondary/20 text-left">
                    <span className="text-base">⏱️</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{d.locataire_nom}</p>
                      <p className="text-[11px] text-muted-foreground">Inactif depuis +7j → relancer</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline mini */}
          <div className="bg-white rounded-2xl border border-border/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pipeline</p>
            <div className="space-y-2">
              {Object.entries(STATUT_CFG).map(([key, cfg]) => {
                const count = dossiers.filter(d => (d.statut_dossier || "ouvert") === key).length;
                if (count === 0) return null;
                const pct = Math.round((count / Math.max(dossiers.length, 1)) * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 text-muted-foreground truncate">{cfg.emoji} {cfg.label}</span>
                    <div className="flex-1 bg-secondary/30 rounded-full h-1.5">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedDossier && (
        <DossierDetail
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
          onUpdate={updateDossier}
        />
      )}
    </div>
  );
}