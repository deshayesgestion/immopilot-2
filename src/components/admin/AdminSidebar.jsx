import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  Users,
  Settings,
  ExternalLink,
  KeySquare,
  ClipboardList,
  Eye,
  LogOut,
  ChevronDown,
  TrendingUp,
  UserCheck,
  FileSignature,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";

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
  {
    label: "Vente",
    icon: TrendingUp,
    children: [
      { label: "Biens", path: "/admin/vente/biens", icon: Home },
      { label: "Acquéreurs", path: "/admin/vente/acquereurs", icon: UserCheck },
      { label: "Transactions", path: "/admin/vente/transactions", icon: FileSignature },
      { label: "Clôtures", path: "/admin/vente/cloture", icon: CheckSquare },
    ],
  },
  {
    label: "Paramètres",
    icon: Settings,
    children: [
      { label: "Utilisateurs & rôles", path: "/admin/equipe", icon: Users },
      { label: "Agence", path: "/admin/parametres", icon: Settings },
    ],
  },
];

export default function AdminSidebar({ agency, collapsed, onToggle }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({ Location: true, "Paramètres": false });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className={`${collapsed ? "w-14" : "w-52"} h-screen bg-white border-r border-border/50 flex flex-col py-4 transition-all duration-200`}>
      {/* Brand + toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-4"} mb-5`}>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{agency?.name || "ImmoPilot"}</p>
            <p className="text-[11px] text-muted-foreground">Back-office</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors flex-shrink-0"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const isGroupActive = item.children.some((c) => location.pathname === c.path);
            const Icon = item.icon;
            const isOpen = openGroups[item.label];

            if (collapsed) {
              return (
                <div key={item.label} className="space-y-0.5">
                  {item.children.map((child) => {
                    const CIcon = child.icon;
                    const isActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        title={child.label}
                        className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                          isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <CIcon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                    isGroupActive ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </button>
                {isOpen && (
                  <div className="ml-3 border-l border-border/40 pl-2.5 space-y-0.5 mt-0.5">
                    {item.children.map((child) => {
                      const CIcon = child.icon;
                      const isActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                            isActive
                              ? "bg-secondary text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          }`}
                        >
                          <CIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                collapsed ? "justify-center" : ""
              } ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground/70"}`} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 pt-3 border-t border-border/50">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir le site public
          </Link>
        </div>
      )}
    </div>
  );
}