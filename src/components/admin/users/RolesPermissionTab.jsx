import { INTERNAL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS } from "@/lib/roles";
import { Shield, Users, FileText, Settings, Lock, MessageSquare } from "lucide-react";

/**
 * RolesPermissionTab — Affiche la matrice des rôles et permissions
 */
export default function RolesPermissionTab() {
  const permissions = {
    location: { label: "Gestion location", icon: Users },
    vente: { label: "Gestion vente", icon: MessageSquare },
    comptabilite: { label: "Comptabilité", icon: FileText },
    parametres: { label: "Paramètres", icon: Settings },
    ia: { label: "Fonctionnalités IA", icon: Shield },
  };

  const permissionLevels = {
    none: { label: "—", bg: "bg-gray-50", text: "text-gray-500" },
    read: { label: "Lecture", bg: "bg-blue-50", text: "text-blue-700" },
    write: { label: "Écriture", bg: "bg-green-50", text: "text-green-700" },
    full: { label: "Admin", bg: "bg-purple-50", text: "text-purple-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold mb-4">Rôles et permissions</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Chaque rôle dispose de permissions spécifiques pour accéder et gérer les modules.
        </p>
      </div>

      {/* Cartes des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTERNAL_ROLES.map(role => (
          <div key={role} className={`rounded-2xl border border-border/50 p-5 space-y-3 ${ROLE_COLORS[role]?.includes("bg-") ? ROLE_COLORS[role].split(" ")[0] : "bg-white"}/5`}>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <h4 className={`font-semibold ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</h4>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role] || "Rôle personnalisé"}</p>
              </div>
            </div>

            {/* Permissions simplifiées */}
            <div className="text-xs space-y-1.5 pt-2 border-t border-border/20">
              {Object.entries(permissions).map(([perm, { label }]) => (
                <div key={perm} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground/70">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Légende des niveaux */}
      <div className="bg-secondary/30 rounded-2xl border border-border/50 p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Niveaux de permission
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(permissionLevels).map(([level, { label, bg, text }]) => (
            <div key={level} className={`rounded-lg p-3 ${bg}`}>
              <p className={`text-xs font-semibold ${text}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-xs leading-relaxed text-blue-900">
          <strong>Lecture (Read):</strong> Consultation uniquement |
          <strong className="ml-2">Écriture (Write):</strong> Créer, modifier |
          <strong className="ml-2">Admin (Full):</strong> Écriture + Suppression
        </p>
      </div>
    </div>
  );
}