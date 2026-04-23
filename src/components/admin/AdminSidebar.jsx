import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, FolderOpen, Calculator,
  Settings, Users, Bot, Bell, Upload, Shield,
  MessageSquare, ListTodo, CalendarDays, ExternalLink,
  ChevronDown, TrendingUp, KeySquare, Mail, Zap, BarChart3,
} from "lucide-react";
import { useState } from "react";

/**
 * Sidebar simplifiée — 6 sections claires
 *
 *  Dashboard
 *  Agenda / Tâches
 *  ── OPÉRATIONS ──
 *  Biens
 *  Dossiers
 *  Comptabilité
 *  Communications
 *  ── IA ──
 *  Accueil IA (Tickets · Relances · Emails · Rounded)
 *  ── ADMINISTRATION ──
 *  Utilisateurs
 *  Paramètres agence
 *  Import · Sécurité
 */

const NAV = [
  // ── Core ──
  { label: "Dashboard",      path: "/admin",            icon: LayoutDashboard },
  { label: "Agenda",         path: "/admin/agenda",     icon: CalendarDays },
  { label: "Tâches",         path: "/admin/taches",     icon: ListTodo },

  // ── Opérations ──
  { type: "section", label: "Opérations" },
  { label: "Biens",          path: "/admin/modules/biens",        icon: Building2 },
  {
    label: "Dossiers",
    icon: FolderOpen,
    children: [
      { label: "Tous les dossiers", path: "/admin/dossiers",              icon: FolderOpen },
      { label: "Location",          path: "/admin/modules/location",      icon: KeySquare },
      { label: "Vente",             path: "/admin/modules/vente",         icon: TrendingUp },
    ],
  },
  { label: "Comptabilité",   path: "/admin/modules/comptabilite", icon: Calculator },
  { label: "Communications", path: "/admin/communications",       icon: MessageSquare },

  // ── IA ──
  { type: "section", label: "Intelligence IA" },
  { label: "Accueil IA",    path: "/admin/parametres/accueil-ia", icon: Bot },
  { label: "Emails IA",     path: "/admin/parametres/emails",     icon: Mail },
  { label: "BI & Prédictions", path: "/admin/bi",                 icon: BarChart3 },

  // ── Admin ──
  { type: "section", label: "Administration" },
  {
    label: "Paramètres",
    icon: Settings,
    children: [
      { label: "Agence",           path: "/admin/parametres",   icon: Settings },
      { label: "Utilisateurs",     path: "/admin/utilisateurs", icon: Users },
      { label: "Import données",   path: "/admin/import",       icon: Upload },
      { label: "Sécurité & Logs",  path: "/admin/securite",     icon: Shield },
    ],
  },
];

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

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
        {NAV.map((item, i) => {
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
        <div className="px-3 pt-3 border-t border-border/50">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            Voir le site public
          </Link>
        </div>
      )}
    </div>
  );
}