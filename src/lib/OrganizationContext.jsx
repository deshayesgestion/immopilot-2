import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const [organizationConfig, setOrganizationConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrganizationConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('getOrganizationConfig', {});
      setOrganizationConfig(response.data);
    } catch (err) {
      console.error('Erreur chargement config organisation:', err);
      setError(err.message || 'Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizationConfig();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organizationConfig, loading, error, reload: loadOrganizationConfig }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}