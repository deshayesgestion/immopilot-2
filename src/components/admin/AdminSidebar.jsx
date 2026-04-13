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
  BookOpen,
  ChevronRight,
  FileText,
  ClipboardList,
  Eye,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  {
    label: "Location",
    icon: KeySquare,
    children: [
      { label: "Biens", path: "/admin/location", icon: Home },
      { label: "Attribution", path: "/admin/attribution", icon: ClipboardList },
      { label: "Suivi", path: "/admin/suivi", icon: Eye },
      { label: "Sortie", path: "/admin/sortie", icon: LogOut },
    ],
  },

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
          if (item.children) {
            const isGroupActive = item.children.some((c) => location.pathname === c.path);
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide mt-2 ${
                  isGroupActive ? "text-primary" : "text-muted-foreground/60"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
                <div className="ml-3 border-l border-border/40 pl-3 space-y-0.5">
                  {item.children.map((child) => {
                    const CIcon = child.icon;
                    const isActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <CIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
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