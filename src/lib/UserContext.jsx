/**
 * UserContext — fournit l'utilisateur courant et son rôle à tout l'admin.
 * Utilise le AuthContext existant + charge le user via base44.auth.me()
 * Usage : const { user, role, can, canIA, isAdmin } = useUser();
 */
import { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { can as _can, canIA as _canIA, getPermission } from "@/lib/roles";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const role = user?.role || "agent";

  const can = (module, action) => _can(user, module, action);
  const canIA = (feature) => _canIA(user, feature);
  const perm = (module) => getPermission(user, module);

  // admin = rôle "admin" OU "directeur" (legacy) OU base44 admin
  const isAdmin = role === "admin" || role === "directeur";
  const isInternalRole = ["admin", "directeur", "responsable_location", "responsable_vente", "agent", "gestionnaire", "comptable", "responsable"].includes(role);

  return (
    <UserContext.Provider value={{ user, role, loading, can, canIA, perm, isAdmin, isInternalRole }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}