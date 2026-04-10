import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  FolderOpen,
  Users,
  Brain,
  MessageSquare,
  Settings,
  ExternalLink,
  KeySquare,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },

  { label: "Gestion Location", path: "/admin/location", icon: KeySquare },
  { label: "Dossiers", path: "/admin/dossiers", icon: FolderOpen },
  { label: "Agents & Clients", path: "/admin/equipe", icon: Users },
  { label: "Estimation IA", path: "/admin/ia", icon: Brain },
  { label: "CRM", path: "/admin/crm", icon: MessageSquare },
  { label: "Paramètres", path: "/admin/parametres", icon: Settings },
];

export default function AdminSidebar({ agency }) {
  const location = useLocation();

  return (
    <div className="w-60 h-screen bg-white border-r border-border/50 flex flex-col py-5 px-3">
      {/* Brand */}
      <div className="px-3 mb-6">
        <p className="text-sm font-bold tracking-tight text-foreground truncate">
          {agency?.name || "ImmoPilot"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Back-office</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground/70"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-4 border-t border-border/50">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir le site public
        </Link>
      </div>
    </div>
  );
}