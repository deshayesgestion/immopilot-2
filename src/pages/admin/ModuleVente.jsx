import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, Home, Users, FileSignature, BarChart2, Loader2,
  Euro, Target, Zap, AlertCircle
} from "lucide-react";
import BiensList from "@/components/shared/BiensList";
import PipelineVendeur from "@/components/modules/vente/PipelineVendeur";
import PipelineAcquereur from "@/components/modules/vente/PipelineAcquereur";

const TABS = [
  { id: "vendeur",     label: "Pipeline Vendeur",   icon: Home,          desc: "Mandats · Estimation IA · Documents" },
  { id: "acquereur",   label: "Pipeline Acquéreur",  icon: Users,         desc: "Qualification · Matching · Offres · Compromis" },
  { id: "biens",       label: "Biens à vendre",      icon: FileSignature, desc: "Catalogue · Publication" },
  { id: "transactions",label: "Transactions",        icon: BarChart2,     desc: "Ventes clôturées · CA" },
];

const TX_COLORS = {
  en_cours: "bg-blue-100 text-blue-700",
  signe:    "bg-green-100 text-green-700",
  cloture:  "bg-slate-100 text-slate-600",
  annule:   "bg-red-100 text-red-600",
};

function TransactionsList({ transactions, contactMap, bienMap }) {
  if (!transactions.length)
    return (
      <div className="bg-white rounded-2xl border border-border/50 py-16 text-center">
        <BarChart2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Aucune transaction clôturée</p>
      </div>
    );
  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            {["Bien", "Acheteur", "Vendeur", "Prix", "Commission", "Statut"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3 font-medium">{bienMap[t.bien_id]?.titre || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.acheteur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.vendeur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 font-semibold">{t.prix ? t.prix.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.commission ? t.commission.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${TX_COLORS[t.statut] || "bg-secondary text-muted-foreground"}`}>
                  {t.statut || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModuleVente() {
  const [tab, setTab] = useState("vendeur");
  const [biens, setBiens] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [mandats, setMandats] = useState([]);
  const [acquereurs, setAcquereurs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [b, c, t, m, a] = await Promise.all([
        base44.entities.Bien.filter({ type: "vente" }),
        base44.entities.Contact.list("-created_date", 300),
        base44.entities.Transaction.filter({ type: "vente" }),
        base44.entities.MandatVente.list("-created_date", 100),
        base44.entities.Acquereur.list("-created_date", 200),
      ]);
      setBiens(b);
      setContacts(c);
      setTransactions(t);
      setMandats(m);
      setAcquereurs(a);
      setLoading(false);
    };
    load();
  }, []);

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const caTotal = transactions.filter(t => t.statut === "cloture").reduce((s, t) => s + (t.prix || 0), 0);
  const commissionsTotal = transactions.filter(t => t.statut === "cloture").reduce((s, t) => s + (t.commission || 0), 0);

  const stats = [
    { label: "Mandats actifs",    value: mandats.filter(m => m.statut === "actif").length,         color: "text-blue-600",    bg: "bg-blue-50",    icon: Home },
    { label: "Acquéreurs",        value: acquereurs.filter(a => a.statut === "actif").length,       color: "text-green-600",   bg: "bg-green-50",   icon: Users },
    { label: "Biens disponibles", value: biens.filter(b => b.statut === "disponible").length,       color: "text-indigo-600",  bg: "bg-indigo-50",  icon: Target },
    { label: "CA clôturé",        value: caTotal.toLocaleString("fr-FR") + " €",                   color: "text-amber-600",   bg: "bg-amber-50",   icon: Euro },
  ];

  // Alertes intelligentes
  const biensBloqués = biens.filter(b => {
    const mandat = mandats.find(m => m.bien_id === b.id);
    if (!mandat) return false;
    const debut = mandat.date_debut_mandat ? new Date(mandat.date_debut_mandat) : null;
    if (!debut) return false;
    const jours = Math.floor((new Date() - debut) / 86400000);
    return jours > 60 && b.statut !== "vendu";
  });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Module Vente</h1>
          <p className="text-sm text-muted-foreground">
            Mandats · Estimation IA · Pipeline acquéreur · Offres · Compromis · Closing
          </p>
        </div>
      </div>

      {/* Alertes IA */}
      {biensBloqués.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">⚠ {biensBloqués.length} bien{biensBloqués.length > 1 ? "s" : ""} en vente depuis + de 60 jours</p>
            <p className="text-xs text-amber-700 mt-0.5">{biensBloqués.map(b => b.titre).join(" · ")} — Envisagez une révision de prix.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className={`inline-flex p-1.5 rounded-lg ${s.bg} mb-2`}>
                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Navigation tabs */}
      <div className="bg-white rounded-2xl border border-border/50 p-1.5 flex flex-wrap gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "vendeur" && (
            <PipelineVendeur
              biens={biens}
              contacts={contacts}
            />
          )}
          {tab === "acquereur" && (
            <PipelineAcquereur
              biens={biens}
              contacts={contacts}
            />
          )}
          {tab === "biens" && (
            <BiensList
              biens={biens}
              typeModule="vente"
              onBiensChange={setBiens}
            />
          )}
          {tab === "transactions" && (
            <TransactionsList
              transactions={transactions}
              contactMap={contactMap}
              bienMap={bienMap}
            />
          )}
        </>
      )}
    </div>
  );
}