import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAgency } from "../../hooks/useAgency";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function AdminLayout() {
  const { agency } = useAgency();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F9F9FB]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
        <AdminSidebar agency={agency} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <AdminSidebar agency={agency} collapsed={false} onToggle={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border/50 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{agency?.name || "ImmoPilot"} — Back-office</span>
        </div>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}