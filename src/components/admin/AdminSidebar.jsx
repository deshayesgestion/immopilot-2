import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  Users,
  Settings,
  ExternalLink,
  KeySquare,
  ChevronDown,
  TrendingUp,
  Calculator,
  ArrowLeftRight,
  Bell,
  Upload,
  Shield,
  MessageSquare,
  ListTodo,
  CalendarDays,
  Building2,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { useOrganization } from "@/lib/OrganizationContext";
import { canAccessModule } from "@/lib/organizationAccess";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Agenda", path: "/admin/agenda", icon: CalendarDays },
  { label: "Tâches", path: "/admin/taches", icon: ListTodo },
  { label: "Communications", path: "/admin/communications", icon: MessageSquare },
  // ── Modules principaux (toujours visibles) ──
  { label: "Biens", path: "/admin/modules/biens", icon: Building2 },
  { label: "Dossiers", path: "/admin/dossiers", icon: FolderOpen },
  { label: "Vente", path: "/admin/modules/vente", icon: TrendingUp },
  { label: "Location", path: "/admin/modules/location", icon: KeySquare },
  { label: "Comptabilité", path: "/admin/modules/comptabilite", icon: Calculator },
  {
    label: "Paramètres",
    icon: Settings,
    children: [
      { label: "Utilisateurs & rôles", path: "/admin/utilisateurs", icon: Users },
      { label: "Agence", path: "/admin/parametres", icon: Settings },
      { label: "Accueil IA", path: "/admin/parametres/accueil-ia", icon: Bell },
      { label: "Emails IA", path: "/admin/parametres/emails", icon: ArrowLeftRight },
      { label: "Import données", path: "/admin/import", icon: Upload },
      { label: "Sécurité & Logs", path: "/admin/securite", icon: Shield },
    ],
  },
];

export default function AdminSidebar({ agency, collapsed, onToggle }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({ Location: true, "Paramètres": false });
  const { organizationConfig } = useOrganization();

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Tous les items sont visibles (pas de filtre module pour l'instant)
  const visibleItems = navItems;

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
        {visibleItems.map((item) => {
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