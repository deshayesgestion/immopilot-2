import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, Users, Brain, Settings, ChevronRight, Building2, MessageSquare } from "lucide-react";

const nav = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Gestion des biens", path: "/admin/biens", icon: Home },
  { label: "CRM & Leads", path: "/admin/crm", icon: Users },
  { label: "Module IA", path: "/admin/ia", icon: Brain },
  { label: "Paramètres agence", path: "/admin/parametres", icon: Settings },
];

export default function AdminSidebar({ agency }) {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-[#0F0F10] text-white flex flex-col">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{agency?.name || "ImmoPilot"}</p>
            <p className="text-[11px] text-white/40 mt-0.5">Back-office</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <Link to="/" className="text-xs text-white/40 hover:text-white/60 transition-colors">
          ← Voir le site public
        </Link>
      </div>
    </aside>
  );
}