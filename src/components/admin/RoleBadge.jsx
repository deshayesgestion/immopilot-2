import { useUser } from "@/lib/UserContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import { Crown, Home, TrendingUp, Calculator, User } from "lucide-react";

const ROLE_ICONS = {
  admin:                Crown,
  directeur:            Crown,
  responsable_location: Home,
  responsable_vente:    TrendingUp,
  comptable:            Calculator,
  agent:                User,
  gestionnaire:         Home,
  responsable:          Crown,
};

export default function RoleBadge({ compact = false }) {
  const { user, role } = useUser();
  if (!user) return null;

  const label = ROLE_LABELS[role] || role;
  const colorCls = ROLE_COLORS[role] || "bg-slate-100 text-slate-600";
  const Icon = ROLE_ICONS[role] || User;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorCls}`}>
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-border/50">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorCls}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">{user.full_name || user.email}</p>
        <p className={`text-[10px] font-medium ${colorCls.split(" ")[1]}`}>{label}</p>
      </div>
    </div>
  );
}