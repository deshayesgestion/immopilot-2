import { Shield, Users } from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from "@/lib/roles";

const MODULES_SHORT = ["location", "vente", "comptabilite", "equipe", "ia", "parametres"];
const MOD_ICONS = {
  location: "🏠", vente: "📈", comptabilite: "💰", equipe: "👥", ia: "🤖", parametres: "⚙️"
};

export default function RoleCard({ role, count }) {
  const perms = ROLE_PERMISSIONS[role];
  const accessCount = Object.values(perms).filter(p => p.voir).length;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{ROLE_LABELS[role]}</p>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {count} utilisateur{count > 1 ? "s" : ""}
        </div>
      </div>

      {/* Module access grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MODULES_SHORT.map(mod => {
          const p = perms[mod];
          const hasView = p?.voir;
          const actions = ["creer", "modifier", "supprimer"].filter(a => p?.[a]).length;
          return (
            <div key={mod} className={`rounded-lg px-2.5 py-1.5 text-xs ${
              hasView ? "bg-primary/5 text-primary" : "bg-secondary/30 text-muted-foreground/50 line-through"
            }`}>
              <span className="mr-1">{MOD_ICONS[mod]}</span>
              {mod.charAt(0).toUpperCase() + mod.slice(0, 4)}
              {hasView && actions > 0 && (
                <span className="ml-1 opacity-60">+{actions}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}