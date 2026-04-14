import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Sparkles, CheckCircle2, X, AlertTriangle } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const NIVEAU_LABELS = { 1: "Rappel amiable", 2: "Relance ferme", 3: "Mise en demeure" };
const NIVEAU_COLORS = { 1: "bg-amber-100 text-amber-700", 2: "bg-orange-100 text-orange-700", 3: "bg-red-100 text-red-700" };
const STATUT_COLORS = { planifiee: "bg-blue-100 text-blue-700", envoyee: "bg-green-100 text-green-700", ignoree: "bg-gray-100 text-gray-500", resolue: "bg-green-100 text-green-700" };
const STATUT_LABELS = { planifiee: "Planifiée", envoyee: "Envoyée", ignoree: "Ignorée", resolue: "Résolue" };

export default function TabRelances() {
  const [relances, setRelances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiContents, setAiContents] = useState({});

  const load = async () => {
    setLoading(true);
    const [r, t] = await Promise.all([
      base44.entities.Relance.list("-created_date", 100),
      base44.entities.Transaction.filter({ statut: "en_retard" }, "-date_echeance", 100),
    ]);
    setRelances(r); setTransactions(t); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const genererRelancesAuto = async () => {
    setGenerating(true);
    for (const tx of transactions) {
      const existing = relances.filter(r => r.transaction_id === tx.id);
      const maxNiveau = existing.length > 0 ? Math.max(...existing.map(r => r.niveau || 1)) : 0;
      const newNiveau = Math.min(maxNiveau + 1, 3);
      const joursRetard = tx.date_echeance ? Math.floor((new Date() - new Date(tx.date_echeance)) / 86400000) : 0;
      if (joursRetard < 1) continue;
      const alreadySent = existing.some(r => r.niveau === newNiveau && r.statut === "envoyee");
      if (alreadySent) continue;

      const contenu = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un email de relance pour impayé immobilier.
Destinataire: ${tx.tiers_nom}
Bien: ${tx.bien_titre || "—"}
Montant dû: ${fmt(tx.montant)}
Jours de retard: ${joursRetard}
Niveau de relance: ${newNiveau} (${NIVEAU_LABELS[newNiveau]})
Ton: ${newNiveau === 1 ? "courtois et rappel simple" : newNiveau === 2 ? "ferme mais professionnel" : "formel, mise en demeure légale"}
Rédige uniquement le corps de l'email (sans objet ni signature), 3-4 phrases maximum.`
      });

      await base44.entities.Relance.create({
        transaction_id: tx.id,
        tiers_nom: tx.tiers_nom,
        tiers_email: tx.tiers_email,
        bien_titre: tx.bien_titre,
        montant: tx.montant,
        niveau: newNiveau,
        statut: "planifiee",
        contenu,
        auto: true,
      });
    }
    setGenerating(false);
    load();
  };

  const envoyerRelance = async (r) => {
    if (!r.tiers_email) {
      alert("❌ Email du destinataire manquant.");
      return;
    }
    try {
      await base44.integrations.Core.SendEmail({
        to: r.tiers_email,
        subject: `${NIVEAU_LABELS[r.niveau]} — Loyer impayé (${fmt(r.montant)})`,
        body: `Bonjour ${r.tiers_nom},\n\n${r.contenu}\n\nCordialement,\nL'agence immobilière`,
      });
      await base44.entities.Relance.update(r.id, { statut: "envoyee", date_envoi: new Date().toISOString() });
      alert(`✓ Relance envoyée avec succès à ${r.tiers_email}`);
      load();
    } catch (e) {
      console.error("Erreur envoi relance:", e);
      alert(`⚠ Erreur : ${e.message || "Email non envoyé (destinataire non enregistré dans l'app)"}`);
    }
  };

  const resoudre = async (r) => {
    await base44.entities.Relance.update(r.id, { statut: "resolue" });
    if (r.transaction_id) await base44.entities.Transaction.update(r.transaction_id, { statut: "paye", date_paiement: new Date().toISOString().substring(0, 10) });
    load();
  };

  const genererContenuIA = async (r) => {
    const contenu = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un email de relance pour impayé.
Destinataire: ${r.tiers_nom}, Bien: ${r.bien_titre}, Montant: ${fmt(r.montant)}, Niveau: ${r.niveau} (${NIVEAU_LABELS[r.niveau]}).
Corps de l'email uniquement, 3-4 phrases.`
    });
    await base44.entities.Relance.update(r.id, { contenu });
    setAiContents(p => ({ ...p, [r.id]: contenu }));
    load();
  };

  const pending = relances.filter(r => r.statut === "planifiee");
  const sent = relances.filter(r => r.statut === "envoyee");
  const resolved = relances.filter(r => r.statut === "resolue");

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats + CTA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-2xl font-bold text-red-500">{transactions.length}</p>
          <p className="text-xs text-muted-foreground">Impayés détectés</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-muted-foreground">Relances à envoyer</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-2xl font-bold text-blue-600">{sent.length}</p>
          <p className="text-xs text-muted-foreground">Relances envoyées</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-2xl font-bold text-green-600">{resolved.length}</p>
          <p className="text-xs text-muted-foreground">Résolues</p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{transactions.length} impayé{transactions.length > 1 ? "s" : ""} en retard</p>
              <p className="text-xs text-amber-700">Générer automatiquement les relances adaptées par IA</p>
            </div>
          </div>
          <Button className="rounded-full gap-2 flex-shrink-0 bg-amber-600 hover:bg-amber-700" onClick={genererRelancesAuto} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Générer relances IA
          </Button>
        </div>
      )}

      {/* Liste relances */}
      {relances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-16">
          <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium">Aucune relance</p>
          <p className="text-xs text-muted-foreground mt-1">Les relances apparaîtront ici automatiquement dès des impayés détectés.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {relances.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{r.tiers_nom}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${NIVEAU_COLORS[r.niveau]}`}>{NIVEAU_LABELS[r.niveau]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.bien_titre} · {fmt(r.montant)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.statut === "planifiee" && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={() => genererContenuIA(r)}>
                        <Sparkles className="w-3 h-3" /> IA
                      </Button>
                      <Button size="sm" className="h-7 text-xs rounded-full gap-1" onClick={() => envoyerRelance(r)}>
                        <Bell className="w-3 h-3" /> Envoyer
                      </Button>
                    </>
                  )}
                  {r.statut !== "resolue" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 text-green-600 border-green-200" onClick={() => resoudre(r)}>
                      <CheckCircle2 className="w-3 h-3" /> Résolu
                    </Button>
                  )}
                </div>
              </div>
              {(r.contenu || aiContents[r.id]) && (
                <div className="bg-secondary/30 rounded-xl p-3 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {aiContents[r.id] || r.contenu}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}