import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2, RefreshCw, Loader2, Plus, CheckCircle2, AlertTriangle,
  HelpCircle, Minus, X, Upload, Sparkles, Banknote, Eye, EyeOff
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const MATCH_CONFIG = {
  assigne: { label: "Assigné", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  suggestion: { label: "Suggestion", icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-50" },
  non_assigne: { label: "Non assigné", icon: Minus, color: "text-gray-500", bg: "bg-gray-100" },
  ignore: { label: "Ignoré", icon: X, color: "text-gray-400", bg: "bg-gray-50" },
};

// ── Formulaire ajout compte ─────────────────────────────────────────────────
function AddCompteModal({ onClose, onSave }) {
  const [form, setForm] = useState({ nom: "", banque: "", iban: "", bic: "", solde: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.CompteBancaire.create({ ...form, solde: Number(form.solde) || 0 });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-base font-bold">Ajouter un compte bancaire</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom du compte *</label>
            <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Compte courant principal" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Banque *</label>
            <Input value={form.banque} onChange={e => setForm(p => ({ ...p, banque: e.target.value }))} placeholder="BNP Paribas, Crédit Agricole..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">IBAN</label>
              <Input value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} placeholder="FR76..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">BIC</label>
              <Input value={form.bic} onChange={e => setForm(p => ({ ...p, bic: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Solde initial (€)</label>
            <Input type="number" value={form.solde} onChange={e => setForm(p => ({ ...p, solde: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-border/50 justify-end">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full" onClick={handleSave} disabled={saving || !form.nom || !form.banque}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajouter"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Import CSV/manuel de transactions ───────────────────────────────────────
function ImportModal({ comptes, onClose, onDone }) {
  const [compteId, setCompteId] = useState(comptes[0]?.id || "");
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    setImporting(true);
    // Parser format CSV simple: date;libelle;montant
    const lines = rawText.trim().split("\n").filter(Boolean);
    const transactions = lines.map(l => {
      const parts = l.split(";");
      return { date: parts[0]?.trim(), libelle: parts[1]?.trim(), montant: parseFloat(parts[2]?.trim().replace(",", ".")) || 0 };
    }).filter(t => t.date && t.libelle);

    const res = await base44.functions.invoke("syncBancaire", { mode: "import", compte_id: compteId, transactions_input: transactions });
    // Lancer le matching
    await base44.functions.invoke("syncBancaire", { mode: "match" });
    setResult(res.data);
    setImporting(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-base font-bold flex items-center gap-2"><Upload className="w-4 h-4" /> Importer des transactions</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compte bancaire</label>
            <select value={compteId} onChange={e => setCompteId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {comptes.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.banque}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Transactions (format: <code className="bg-secondary px-1 rounded text-xs">date;libellé;montant</code> — une par ligne)
            </label>
            <textarea
              className="w-full border border-input rounded-xl p-3 text-xs font-mono h-40 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={"2026-04-05;VIR DUPONT JEAN LOYER AVRIL;850.00\n2026-04-06;VIR MARTIN PAUL REF VENTE;5200.00"}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Le matching IA sera lancé automatiquement après l'import.</p>
          </div>
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
              ✅ Matching terminé — {result.matched} assignés, {result.suggestions} suggestions, {result.unmatched} non matchés
            </div>
          )}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-border/50 justify-end">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Fermer</Button>
          <Button className="rounded-full gap-2" onClick={handleImport} disabled={importing || !rawText.trim()}>
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Importer & Matcher
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
export default function TabBanque() {
  const [comptes, setComptes] = useState([]);
  const [txBancaires, setTxBancaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddCompte, setShowAddCompte] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filterMatch, setFilterMatch] = useState("all");
  const [showIban, setShowIban] = useState({});
  const [assigning, setAssigning] = useState(null);
  const [txComptables, setTxComptables] = useState([]);
  const [syncingAPI, setSyncingAPI] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, t, tc] = await Promise.all([
      base44.entities.CompteBancaire.list("-created_date", 20),
      base44.entities.TransactionBancaire.list("-date", 100),
      base44.entities.Transaction.filter({ statut: "en_attente" }, "-date_echeance", 50),
    ]);
    setComptes(c);
    setTxBancaires(t);
    setTxComptables(tc);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const lancerMatching = async () => {
    setSyncing(true);
    await base44.functions.invoke("syncBancaire", { mode: "match" });
    setSyncing(false);
    load();
  };

  const lancerSyncAPI = async () => {
    setSyncingAPI(true);
    await base44.functions.invoke("syncBancaireAPI", { mode: "full" });
    setSyncingAPI(false);
    load();
  };

  const lancerReconciliation = async () => {
    setReconciling(true);
    await base44.functions.invoke("syncBancaireAPI", { mode: "reconcile" });
    setReconciling(false);
    load();
  };

  const validerSuggestion = async (txB) => {
    if (!txB.match_suggestion?.transaction_id) return;
    setAssigning(txB.id);
    await base44.entities.TransactionBancaire.update(txB.id, { statut_matching: "assigne", transaction_id: txB.match_suggestion.transaction_id, match_score: txB.match_suggestion.score });
    await base44.entities.Transaction.update(txB.match_suggestion.transaction_id, { statut: "paye", date_paiement: txB.date });
    setAssigning(null);
    load();
  };

  const assignerManuellement = async (txBId, txCId) => {
    setAssigning(txBId);
    await base44.entities.TransactionBancaire.update(txBId, { statut_matching: "assigne", transaction_id: txCId, match_score: 100 });
    await base44.entities.Transaction.update(txCId, { statut: "paye", date_paiement: new Date().toISOString().substring(0, 10) });
    setAssigning(null);
    load();
  };

  const ignorer = async (txBId) => {
    await base44.entities.TransactionBancaire.update(txBId, { statut_matching: "ignore" });
    load();
  };

  const filtered = txBancaires.filter(t => filterMatch === "all" || t.statut_matching === filterMatch);
  const stats = {
    total: txBancaires.length,
    assigne: txBancaires.filter(t => t.statut_matching === "assigne").length,
    suggestion: txBancaires.filter(t => t.statut_matching === "suggestion").length,
    non_assigne: txBancaires.filter(t => t.statut_matching === "non_assigne").length,
    anomalies: txBancaires.filter(t => t.anomalie).length,
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {showAddCompte && <AddCompteModal onClose={() => setShowAddCompte(false)} onSave={load} />}
      {showImport && <ImportModal comptes={comptes} onClose={() => setShowImport(false)} onDone={load} />}

      {/* Comptes bancaires */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Comptes bancaires</h2>
          <Button size="sm" className="rounded-full h-8 text-xs gap-1" onClick={() => setShowAddCompte(true)}>
            <Plus className="w-3 h-3" /> Ajouter un compte
          </Button>
        </div>

        {comptes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-border p-10 text-center">
            <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Aucun compte bancaire</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Ajoutez vos comptes pour commencer la synchronisation</p>
            <Button size="sm" className="rounded-full gap-1.5 text-xs" onClick={() => setShowAddCompte(true)}>
              <Plus className="w-3 h-3" /> Ajouter un compte
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comptes.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{c.nom}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        c.statut_connexion === 'connecte' ? 'bg-green-100 text-green-700' :
                        c.statut_connexion === 'erreur' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {c.statut_connexion === 'connecte' ? '✓ Connecté' : c.statut_connexion === 'erreur' ? '✗ Erreur' : '⚠ Expiration proche'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.banque}</p>
                    {c.erreur_connexion && <p className="text-xs text-red-600 mt-0.5">{c.erreur_connexion}</p>}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold">{fmt(c.solde)}</p>
                  <p className="text-xs text-muted-foreground">Solde actuel</p>
                </div>
                {c.iban && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-muted-foreground flex-1 truncate">
                      {showIban[c.id] ? c.iban : c.iban.substring(0, 8) + "••••••••••••••••"}
                    </p>
                    <button onClick={() => setShowIban(p => ({ ...p, [c.id]: !p[c.id] }))}
                      className="text-muted-foreground/50 hover:text-muted-foreground">
                      {showIban[c.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                {c.derniere_sync && (
                  <p className="text-[11px] text-muted-foreground/60">Sync: {fmtDate(c.derniere_sync)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-full h-9 text-xs gap-1.5" onClick={() => setShowImport(true)}>
          <Upload className="w-3.5 h-3.5" /> Import manuel
        </Button>
        <Button size="sm" className="rounded-full h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={lancerSyncAPI} disabled={syncingAPI}>
          {syncingAPI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Sync API + Anomalies
        </Button>
        <Button size="sm" className="rounded-full h-9 text-xs gap-1.5" onClick={lancerMatching} disabled={syncing}>
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Matching IA
        </Button>
        <Button size="sm" variant="outline" className="rounded-full h-9 text-xs gap-1.5" onClick={lancerReconciliation} disabled={reconciling}>
          {reconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Réconciliation"}  
        </Button>
      </div>

      {/* Stats matching */}
      {txBancaires.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Assignés", value: stats.assigne, color: "text-green-600" },
            { label: "Suggestions", value: stats.suggestion, color: "text-amber-600" },
            { label: "Non matchés", value: stats.non_assigne, color: "text-gray-500" },
            { label: "Anomalies", value: stats.anomalies, color: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-border/50 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      {txBancaires.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: "all", label: "Toutes" },
            { id: "non_assigne", label: "Non assignées" },
            { id: "suggestion", label: "Suggestions" },
            { id: "assigne", label: "Assignées" },
            { id: "ignore", label: "Ignorées" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterMatch(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterMatch === f.id ? "bg-primary text-white" : "bg-white border border-border/50 text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Transactions bancaires */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center">
          <Banknote className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune transaction bancaire</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Importez vos relevés bancaires pour commencer</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map(tx => {
              const conf = MATCH_CONFIG[tx.statut_matching] || MATCH_CONFIG.non_assigne;
              const Icon = conf.icon;
              return (
                <div key={tx.id} className={`px-5 py-4 ${tx.anomalie ? "bg-red-50/40" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl ${conf.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{tx.libelle}</p>
                        {tx.anomalie && (
                          <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Anomalie
                          </span>
                        )}
                        {tx.categorie_ia && tx.statut_matching === "non_assigne" && (
                          <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tx.categorie_ia}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(tx.date)} · {tx.beneficiaire || tx.compte_nom}
                      </p>
                      {tx.anomalie_detail && <p className="text-xs text-red-600 mt-0.5">{tx.anomalie_detail}</p>}

                      {/* Suggestion de matching */}
                      {tx.statut_matching === "suggestion" && tx.match_suggestion && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-amber-800">
                              Suggestion : {tx.match_suggestion.tiers_nom} — {tx.match_suggestion.bien_titre}
                            </p>
                            <p className="text-xs text-amber-600">
                              Attendu {fmt(tx.match_suggestion.montant)} · Confiance {tx.match_suggestion.score}%
                            </p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button size="sm" className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700"
                              onClick={() => validerSuggestion(tx)} disabled={assigning === tx.id}>
                              {assigning === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Valider"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full"
                              onClick={() => ignorer(tx.id)}>Ignorer</Button>
                          </div>
                        </div>
                      )}

                      {/* Assignation manuelle */}
                      {tx.statut_matching === "non_assigne" && txComptables.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            className="flex-1 h-7 text-xs rounded-lg border border-input bg-white px-2"
                            defaultValue=""
                            onChange={e => e.target.value && assignerManuellement(tx.id, e.target.value)}
                          >
                            <option value="">Assigner manuellement...</option>
                            {txComptables.map(tc => (
                              <option key={tc.id} value={tc.id}>
                                {tc.tiers_nom} — {fmt(tc.montant)} — {tc.bien_titre}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full text-muted-foreground"
                            onClick={() => ignorer(tx.id)}>Ignorer</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-bold ${tx.montant >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.montant >= 0 ? "+" : ""}{fmt(tx.montant)}
                      </p>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>
                        {conf.label}
                      </span>
                      {tx.match_score > 0 && tx.statut_matching === "assigne" && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{tx.match_score}% confiance</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}