import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { KeySquare, Home, Users, Euro, Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import BiensList from "@/components/shared/BiensList";
import ModuleLocationLocataires from "@/components/modules/location/ModuleLocationLocataires";
import ModuleLocationPaiements from "@/components/modules/location/ModuleLocationPaiements";

const TABS = [
  { id: "biens", label: "Biens", icon: Home },
  { id: "locataires", label: "Locataires", icon: Users },
  { id: "paiements", label: "Loyers", icon: Euro },
];

export default function ModuleLocation() {
  const [tab, setTab] = useState("biens");
  const [biens, setBiens] = useState([]);
  const [locataires, setLocataires] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [contacts, setContacts] = useState([]); // tous les contacts (pour contactMap)
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [b, p, allContacts] = await Promise.all([
        base44.entities.Bien.filter({ type: "location" }),
        base44.entities.Paiement.filter({ type: "loyer" }),
        base44.entities.Contact.list("-created_date", 500),
      ]);
      setBiens(b);
      setPaiements(p);
      // Locataires = contacts avec type "locataire", sinon tous les contacts liés à des paiements
      const locatairesList = allContacts.filter(c => c.type === "locataire");
      setLocataires(locatairesList.length > 0 ? locatairesList : allContacts);
      setContacts(allContacts);
      setLoading(false);
    };
    load();
  }, []);

  // contactMap couvre TOUS les contacts pour résoudre les noms dans les paiements
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  const loyersEnRetard = paiements.filter(p => p.statut === "en_retard");
  const loyersPayes = paiements.filter(p => p.statut === "paye");
  const totalEncaisse = loyersPayes.reduce((s, p) => s + (p.montant || 0), 0);

  const stats = [
    { label: "Biens en location", value: biens.length, icon: Home, color: "text-blue-600" },
    { label: "Locataires", value: locataires.length, icon: Users, color: "text-green-600" },
    { label: "Encaissé", value: totalEncaisse.toLocaleString("fr-FR") + " €", icon: Euro, color: "text-emerald-600" },
    { label: "Retards", value: loyersEnRetard.length, icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-xl">
          <KeySquare className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Module Location</h1>
          <p className="text-sm text-muted-foreground">Biens, locataires et paiements de loyers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
              {t.id === "paiements" && loyersEnRetard.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {loyersEnRetard.length}
                </span>
              )}
              {t.id === "biens" && biens.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {biens.length}
                </span>
              )}
              {t.id === "locataires" && locataires.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {locataires.length}
                </span>
              )}
            </button>
          );
        })}
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8 h-9 w-48 rounded-xl border-0 bg-secondary/50 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {tab === "biens" && <BiensList biens={biens} typeModule="location" onBiensChange={setBiens} search={search} />}
          {tab === "locataires" && <ModuleLocationLocataires locataires={locataires} biens={biens} search={search} />}
          {tab === "paiements" && <ModuleLocationPaiements paiements={paiements} contactMap={contactMap} bienMap={bienMap} search={search} />}
        </>
      )}
    </div>
  );
}