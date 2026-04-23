import { AlertTriangle, Home, FolderOpen, Users, XCircle, Clock, Loader2, Zap, Brain } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "—";

const ALERTE_STYLES = {
  critique: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  important: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
};

function AlerteCard({ type, icon: Icon, titre, items, niveau, emptyMsg }) {
  const s = ALERTE_STYLES[niveau] || ALERTE_STYLES.info;
  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
        <p className={`text-sm font-semibold ${s.text}`}>{titre}</p>
        <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">✓ {emptyMsg}</p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 5).map((item, i) => (
            <div key={i} className={`flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border ${s.border}`}>
              <Icon className={`w-3 h-3 flex-shrink-0 ${s.text}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.label}</p>
                {item.detail && <p className="text-[10px] text-muted-foreground">{item.detail}</p>}
              </div>
              {item.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>{item.badge}</span>}
            </div>
          ))}
          {items.length > 5 && <p className="text-[11px] text-muted-foreground text-center pt-1">+{items.length - 5} autres</p>}
        </div>
      )}
    </div>
  );
}

export default function BIAlertes({ data }) {
  const { biens, dossiers, leads, paiements, tickets, contacts } = data;
  const [aiAlertes, setAiAlertes] = useState(null);
  const [loading, setLoading] = useState(false);

  const now = Date.now();
  const daysSince = (d) => d ? Math.floor((now - new Date(d)) / 86400000) : 999;

  // ── Biens stagnants (disponibles depuis > 60 jours) ──
  const biensStagnants = biens
    .filter(b => b.statut === "disponible" && daysSince(b.created_date) > 60)
    .map(b => ({ label: b.titre, detail: `${daysSince(b.created_date)}j sans activité · ${fmt(b.prix)}`, badge: `${daysSince(b.created_date)}j` }));

  // ── Dossiers bloqués (en_cours, pas mis à jour depuis 30j) ──
  const dossiersBloqués = dossiers
    .filter(d => ["en_cours", "nouveau"].includes(d.statut) && daysSince(d.updated_date) > 30)
    .map(d => ({ label: d.titre, detail: `Inactif depuis ${daysSince(d.updated_date)}j · ${d.type}`, badge: `${d.statut}` }));

  // ── Clients inactifs (aucun contact depuis 45 jours) ──
  const clientsInactifs = contacts
    .filter(c => daysSince(c.updated_date) > 45)
    .map(c => ({ label: c.nom, detail: `${daysSince(c.updated_date)}j sans interaction · ${c.type || "contact"}`, badge: c.type }))
    .slice(0, 20);

  // ── Opportunités perdues (leads qualifiés non convertis depuis 60j) ──
  const opportunitésPerdues = leads
    .filter(l => (l.statut === "qualifie" || l.statut === "contacte") && daysSince(l.updated_date) > 60)
    .map(l => ({ label: l.source || "Lead", detail: `Lead qualifié · inactif depuis ${daysSince(l.updated_date)}j`, badge: l.statut }));

  // ── Paiements en retard critique (> 30 jours) ──
  const paiementsRetardCritique = paiements
    .filter(p => p.statut === "en_retard" && daysSince(p.date_echeance) > 30)
    .map(p => ({ label: `${p.type} — ${fmt(p.montant)}`, detail: `Retard de ${daysSince(p.date_echeance)}j`, badge: `${daysSince(p.date_echeance)}j` }));

  // ── Tickets urgents non résolus ──
  const ticketsUrgents = tickets
    .filter(t => t.priorite === "urgent" && t.statut !== "resolu")
    .map(t => ({ label: t.appelant_nom || "Ticket urgent", detail: t.resume_ia || t.description, badge: t.statut }));

  const totalAlertes = biensStagnants.length + dossiersBloqués.length + paiementsRetardCritique.length + ticketsUrgents.length;

  const analyzeAI = async () => {
    if (loading) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `IA Rounded — analyse d'alertes immobilier.

ALERTES DÉTECTÉES :
- Biens stagnants (>60j): ${biensStagnants.length}
- Dossiers bloqués (>30j sans activité): ${dossiersBloqués.length}
- Clients inactifs (>45j): ${clientsInactifs.length}
- Opportunités perdues (leads >60j): ${opportunitésPerdues.length}
- Paiements en retard critique (>30j): ${paiementsRetardCritique.length}
- Tickets urgents non résolus: ${ticketsUrgents.length}

Pour chaque catégorie critique, génère 1 action immédiate recommandée et une estimation de l'impact.
Format JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          synthese: { type: "string" },
          actions_prioritaires: {
            type: "array",
            items: { type: "object", properties: { categorie: { type: "string" }, action: { type: "string" }, impact: { type: "string" }, urgence: { type: "string" } } }
          }
        }
      }
    });
    setAiAlertes(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className={`rounded-2xl border p-4 flex items-center gap-4 ${totalAlertes > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${totalAlertes > 0 ? "text-red-600" : "text-green-600"}`} />
        <div>
          <p className={`text-sm font-bold ${totalAlertes > 0 ? "text-red-800" : "text-green-800"}`}>
            {totalAlertes > 0 ? `${totalAlertes} alerte(s) critique(s) détectée(s)` : "Aucune alerte critique détectée"}
          </p>
          <p className={`text-xs ${totalAlertes > 0 ? "text-red-600" : "text-green-600"}`}>Analyse automatique de votre portefeuille</p>
        </div>
      </div>

      {/* IA Actions sur alertes */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">IA Rounded — Plan d'action sur alertes</p>
          </div>
          <Button size="sm" variant={aiAlertes ? "outline" : "default"} className="rounded-full h-7 text-xs gap-1.5" onClick={analyzeAI} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiAlertes ? "Réanalyser" : "Générer plan d'action"}
          </Button>
        </div>

        {!aiAlertes && !loading && <p className="text-xs text-muted-foreground text-center py-4">Cliquez pour que l'IA génère un plan d'action sur toutes les alertes</p>}
        {loading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>}
        {aiAlertes && !loading && (
          <div className="space-y-3">
            {aiAlertes.synthese && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-xs text-foreground">{aiAlertes.synthese}</div>
            )}
            <div className="space-y-2">
              {(aiAlertes.actions_prioritaires || []).map((a, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 ${a.urgence === "critique" ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/30"}`}>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${a.urgence === "critique" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{a.categorie}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{a.action}</p>
                    <p className="text-[11px] text-muted-foreground">Impact : {a.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grille d'alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AlerteCard
          icon={Home} titre="Biens stagnants" items={biensStagnants} niveau="important"
          emptyMsg="Tous vos biens ont une activité récente"
        />
        <AlerteCard
          icon={FolderOpen} titre="Dossiers bloqués" items={dossiersBloqués} niveau="important"
          emptyMsg="Tous vos dossiers avancent normalement"
        />
        <AlerteCard
          icon={Users} titre="Clients inactifs" items={clientsInactifs} niveau="info"
          emptyMsg="Tous vos clients ont été contactés récemment"
        />
        <AlerteCard
          icon={XCircle} titre="Opportunités perdues" items={opportunitésPerdues} niveau="critique"
          emptyMsg="Aucune opportunité perdue détectée"
        />
        <AlerteCard
          icon={AlertTriangle} titre="Paiements en retard critique (>30j)" items={paiementsRetardCritique} niveau="critique"
          emptyMsg="Aucun retard critique"
        />
        <AlerteCard
          icon={Clock} titre="Tickets urgents non résolus" items={ticketsUrgents} niveau="critique"
          emptyMsg="Tous les tickets urgents sont résolus"
        />
      </div>
    </div>
  );
}