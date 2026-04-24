/**
 * AppConfigService - Synchronise la configuration du SaaS Admin
 * 
 * Responsabilités:
 * - Récupérer config au démarrage
 * - Polling toutes les 5 min pour mises à jour
 * - Appliquer restrictions (modules, features, quotas)
 * - Cacher/afficher UI selon config
 */

class AppConfigService {
  constructor() {
    this.config = null;
    this.lastSync = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.syncTimer = null;
    this.listeners = []; // Pour notifier changements config
  }

  /**
   * Initialiser: charger config + démarrer polling
   */
  async initialize() {
    try {
      // Charger config au démarrage
      await this.syncConfig();
      
      // Démarrer polling périodique
      this.syncTimer = setInterval(() => this.syncConfig(), this.syncInterval);
      
      console.log('✅ AppConfigService initialized');
    } catch (error) {
      console.error('❌ AppConfigService init failed:', error);
      // Fallback: utiliser cache localStorage ou config par défaut
      this.#loadCachedConfig();
    }
  }

  /**
   * Synchroniser config avec SaaS Admin
   */
  async syncConfig() {
    try {
      const agencyId = this.#getAgencyId();
      if (!agencyId) {
        console.warn('No agency_id available for config sync');
        return;
      }

      const response = await fetch('/api/client/config/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: agencyId,
          client_version: '1.0.0',
          last_sync: this.lastSync
        })
      });

      if (!response.ok) {
        throw new Error(`Config sync failed: ${response.status}`);
      }

      const data = await response.json();
      const oldConfig = this.config;
      this.config = data.configuration;
      this.lastSync = new Date();

      // Sauvegarder en cache localStorage
      this.#cacheConfig();

      // Notifier les listeners si config changée
      if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
        this.notifyListeners('config_changed', this.config);
      }

      console.log('✅ Config synced at', this.lastSync);
    } catch (error) {
      console.error('Config sync error:', error);
      // Continuer avec config en cache
    }
  }

  /**
   * Vérifier si un module est activé
   */
  isModuleEnabled(moduleName) {
    const module = this.config?.modules?.[moduleName];
    return module?.enabled ?? false;
  }

  /**
   * Obtenir la limite d'un module
   * Ex: getModuleLimit('location', 'max_dossiers') -> 100
   */
  getModuleLimit(moduleName, limitKey) {
    return this.config?.modules?.[moduleName]?.[limitKey] ?? null;
  }

  /**
   * Vérifier si une feature est activée
   * Ex: isFeatureEnabled('ia_scoring') -> true/false
   */
  isFeatureEnabled(featureName) {
    return this.config?.features?.[featureName] ?? false;
  }

  /**
   * Obtenir limite globale
   * Ex: getGlobalLimit('daily_api_calls') -> 10000
   */
  getGlobalLimit(limitKey) {
    return this.config?.limits?.[limitKey] ?? null;
  }

  /**
   * Obtenir info plan de facturation
   */
  getPricingInfo() {
    return this.config?.pricing || {};
  }

  /**
   * Obtenir config complète
   */
  getConfig() {
    return this.config;
  }

  /**
   * Ajouter listener pour changements config
   */
  onConfigChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notifier listeners de changements
   */
  notifyListeners(event, data) {
    this.listeners.forEach(cb => {
      try {
        cb(event, data);
      } catch (error) {
        console.error('Config listener error:', error);
      }
    });
  }

  /**
   * Sauvegarder config en cache localStorage
   */
  #cacheConfig() {
    try {
      localStorage.setItem(
        'app_config_cache',
        JSON.stringify({
          config: this.config,
          timestamp: this.lastSync
        })
      );
    } catch (error) {
      console.warn('Failed to cache config:', error);
    }
  }

  /**
   * Charger config depuis cache localStorage
   */
  #loadCachedConfig() {
    try {
      const cached = localStorage.getItem('app_config_cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.config = data.config;
        this.lastSync = new Date(data.timestamp);
        console.log('✅ Config loaded from cache');
      }
    } catch (error) {
      console.warn('Failed to load cached config:', error);
    }
  }

  /**
   * Obtenir agency_id (depuis localStorage ou context)
   */
  #getAgencyId() {
    // TODO: À intégrer avec votre système d'auth
    return localStorage.getItem('agency_id') || null;
  }

  /**
   * Arrêter service
   */
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.listeners = [];
  }
}

// Singleton
export const appConfig = new AppConfigService();