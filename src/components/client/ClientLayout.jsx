import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, FileText, CreditCard, AlertTriangle,
  MessageSquare, LogOut, Home, Bell, ChevronDown, Menu, X, TrendingUp, Eye
} from "lucide-react";

const NAV_BY_ROLE = {
  locataire: [
    { label: "Mon espace", path: "/espace/locataire", icon: LayoutDashboard },
    { label: "Documents", path: "/espace/locataire/documents", icon: FileText },
    { label: "Paiements", path: "/espace/locataire/paiements", icon: CreditCard },
    { label: "Incidents", path: "/espace/locataire/incidents", icon: AlertTriangle },
    { label: "Messages", path: "/espace/locataire/messages", icon: MessageSquare },
  ],
  proprietaire: [
    { label: "Mon espace", path: "/espace/proprietaire", icon: LayoutDashboard },
    { label: "Mes biens", path: "/espace/proprietaire/biens", icon: Home },
    { label: "Revenus", path: "/espace/proprietaire/revenus", icon: CreditCard },
    { label: "Documents", path: "/espace/proprietaire/documents", icon: FileText },
    { label: "Messages", path: "/espace/proprietaire/messages", icon: MessageSquare },
  ],
  acquereur: [
    { label: "Mon espace", path: "/espace/acquereur", icon: LayoutDashboard },
    { label: "Ma recherche", path: "/espace/acquereur/recherche", icon: Eye },
    { label: "Visites", path: "/espace/acquereur/visites", icon: Home },
    { label: "Documents", path: "/espace/acquereur/documents", icon: FileText },
    { label: "Messages", path: "/espace/acquereur/messages", icon: MessageSquare },
  ],
};

const ROLE_LABELS = {
  locataire: "Locataire",
  proprietaire: "Propriétaire",
  acquereur: "Acquéreur",
};

const ROLE_COLORS = {
  locataire: "bg-blue-600",
  proprietaire: "bg-emerald-600",
  acquereur: "bg-purple-600",
};

export default function ClientLayout() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const role = user?.role;
  const navItems = NAV_BY_ROLE[role] || [];
  const roleColor = ROLE_COLORS[role] || "bg-primary";

  const handleLogout = () => base44.auth.logout("/");

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-border/50 fixed h-screen z-30">
        <div className={`${roleColor} px-4 py-5`}>
          <p className="text-white font-bold text-sm">ImmoPilot</p>
          <p className="text-white/70 text-xs mt-0.5">{ROLE_LABELS[role] || "Espace client"}</p>
        </div>
        {user && (
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold truncate">{user.full_name || user.email}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-border/50">
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-secondary/50">
            <LogOut className="w-3.5 h-3.5" /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border/50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-semibold text-sm">ImmoPilot — {ROLE_LABELS[role]}</span>
        </div>
        <button onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-56 bg-white h-full flex flex-col">
            <div className={`${roleColor} px-4 py-5 flex items-center justify-between`}>
              <div>
                <p className="text-white font-bold text-sm">ImmoPilot</p>
                <p className="text-white/70 text-xs">{ROLE_LABELS[role]}</p>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="w-4 h-4 text-white" /></button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      isActive ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/50"
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-0 lg:pt-0">
        <div className="lg:hidden h-14" />
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}