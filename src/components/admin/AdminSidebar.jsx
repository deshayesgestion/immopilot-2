import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, FolderOpen, Calculator,
  Settings, Users, Bot, Upload, Shield,
  MessageSquare, ListTodo, CalendarDays, ExternalLink,
  ChevronDown, TrendingUp, KeySquare, Mail, BarChart3, Cpu, PenTool,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/UserContext";
import RoleBadge from "./RoleBadge";
import { base44 } from "@/api/base44Client";

// NAV definition avec required permissions (module + action minimum)
// Si pas de `requires`, toujours visible pour les rôles internes
const NAV_DEF = [
  { label: "Dashboard",      path: "/admin",            icon: LayoutDashboard },
  { label: "Agenda",         path: "/admin/agenda",     icon: CalendarDays,   requires: { module: "agenda" } },
  { label: "Tâches",         path: "/admin/taches",     icon: ListTodo,       requires: { module: "taches" } },

  { type: "section", label: "Opérations" },
  { label: "Biens",          path: "/admin/modules/biens",        icon: Building2,    requires: { module: "biens" } },
  {
    label: "Dossiers",
    icon: FolderOpen,
    children: [
      { label: "Tous les dossiers", path: "/admin/dossiers",           icon: FolderOpen,  requires: { module: "location" } },
      { label: "Location",          path: "/admin/modules/location",   icon: KeySquare,   requires: { module: "location" } },
      { label: "Vente",             path: "/admin/modules/vente",      icon: TrendingUp,  requires: { module: "vente" } },
    ],
  },
  { label: "Comptabilité",    path: "/admin/modules/comptabilite", icon: Calculator,   requires: { module: "comptabilite" } },
  { label: "Communications",  path: "/admin/communications",       icon: MessageSquare, requires: { module: "communications" } },
  { label: "Signatures",      path: "/admin/signatures",           icon: PenTool,      requires: { module: "signatures" } },

  { type: "section", label: "Intelligence IA" },
  { label: "Accueil IA",       path: "/admin/parametres/accueil-ia", icon: Bot,      requires: { module: "ia" } },
  { label: "Emails IA",        path: "/admin/parametres/emails",     icon: Mail,     requires: { module: "ia" } },
  { label: "BI & Prédictions", path: "/admin/bi",                    icon: BarChart3,requires: { module: "bi" } },
  { label: "Agents IA",        path: "/admin/agents",                icon: Cpu,      requires: { module: "agents" } },

  { type: "section", label: "Administration" },
  {
    label: "Paramètres",
    icon: Settings,
    requires: { module: "parametres" },
    children: [
      { label: "Agence",          path: "/admin/parametres",   icon: Settings,  requires: { module: "parametres" } },
      { label: "Utilisateurs",    path: "/admin/utilisateurs", icon: Users,     requires: { module: "utilisateurs" } },
      { label: "Import données",  path: "/admin/import",       icon: Upload,    requires: { module: "parametres" } },
      { label: "Sécurité & Logs", path: "/admin/securite",     icon: Shield,    requires: { module: "parametres" } },
    ],
  },
];

function useNavFiltered() {
  const { can, isAdmin } = useUser();

  const isVisible = (item) => {
    if (!item.requires) return true;
    if (isAdmin) return true;
    return can(item.requires.module, item.requires.action || "voir");
  };

  const filtered = [];
  for (const item of NAV_DEF) {
    if (item.type === "section") { filtered.push(item); continue; }
    if (item.children) {
      const visibleChildren = item.children.filter(isVisible);
      if (visibleChildren.length === 0) continue;
      // Only show group if at least parent OR children are visible
      if (!item.requires || isVisible(item)) {
        filtered.push({ ...item, children: visibleChildren });
      } else if (visibleChildren.length > 0) {
        filtered.push({ ...item, children: visibleChildren });
      }
      continue;
    }
    if (isVisible(item)) filtered.push(item);
  }
  // Clean trailing section headers
  return filtered.filter((item, i, arr) => {
    if (item.type !== "section") return true;
    const next = arr[i + 1];
    return next && next.type !== "section";
  });
}

function NavLink({ item, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== "/admin" && location.pathname.startsWith(item.path));
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
        collapsed ? "justify-center" : ""
      } ${isActive
        ? "bg-primary/10 text-primary font-semibold"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70"}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function NavGroup({ item, collapsed }) {
  const location = useLocation();
  const isGroupActive = item.children.some(c => location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(isGroupActive);
  const Icon = item.icon;

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {item.children.map(child => {
          const CIcon = child.icon;
          const isActive = location.pathname === child.path;
          return (
            <Link key={child.path} to={child.path} title={child.label}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50"
              }`}>
              <CIcon className="w-4 h-4" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
          isGroupActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        }`}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="ml-3 border-l border-border/40 pl-2.5 space-y-0.5 mt-0.5 mb-1">
          {item.children.map(child => {
            const CIcon = child.icon;
            const isActive = location.pathname === child.path ||
              (child.path !== "/admin/dossiers" && location.pathname.startsWith(child.path));
            return (
              <Link key={child.path} to={child.path}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}>
                <CIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar({ agency, collapsed, onToggle }) {
  const nav = useNavFiltered();
  const { user } = useUser();

  return (
    <div className={`${collapsed ? "w-14" : "w-52"} h-screen bg-white border-r border-border/50 flex flex-col py-4 transition-all duration-200`}>
      {/* Brand */}
      <div className={`flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-4"} mb-5`}>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{agency?.name || "ImmoPilot"}</p>
            <p className="text-[11px] text-muted-foreground">Back-office</p>
          </div>
        )}
        <button onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors flex-shrink-0">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </div>

      {/* User role badge */}
      {!collapsed && user && (
        <div className="px-2 mb-4">
          <RoleBadge />
        </div>
      )}

      {/* Nav filtré par rôle */}
      <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
        {nav.map((item, i) => {
          if (item.type === "section") {
            if (collapsed) return null;
            return (
              <p key={i} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2.5 pt-4 pb-1 select-none">
                {item.label}
              </p>
            );
          }
          if (item.children) return <NavGroup key={item.label} item={item} collapsed={collapsed} />;
          return <NavLink key={item.path} item={item} collapsed={collapsed} />;
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 pt-3 border-t border-border/50 space-y-1">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1">
            <ExternalLink className="w-3.5 h-3.5" />
            Voir le site public
          </Link>
          <button onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-red-500 transition-colors py-1 w-full text-left">
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}