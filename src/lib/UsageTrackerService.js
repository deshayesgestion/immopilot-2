/**
 * UsageTrackerService - Enregistre et remonte l'usage vers SaaS Admin
 * 
 * Responsabilités:
 * - Tracker actions utilisateurs
 * - Logger erreurs
 * - Envoyer usage toutes les heures au SaaS admin
 * - Recevoir et appliquer actions du SaaS admin
 */

class UsageTrackerService {
  constructor() {
    this.events = [];
    this.reportInterval = 60 * 60 * 1000; // 1 heure
    this.flushTimer = null;
    this.maxEventsBeforeFlush = 500; // Envoyer avant 1h si > 500 events
  }

  /**
   * Initialiser le service
   */
  initialize() {
    // Envoyer usage toutes les heures
    this.flushTimer = setInterval(() => this.flush(), this.reportInterval);
    
    // Flush automatique si trop d'events
    setInterval(() => {
      if (this.events.length > this.maxEventsBeforeFlush) {
        this.flush();
      }
    }, 10 * 60 * 1000); // Vérifier toutes les 10 min

    console.log('✅ UsageTrackerService initialized');
  }

  /**
   * Tracker une action utilisateur
   */
  track(event) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: event.type || 'action',
      module: event.module || null,
      user_email: event.user_email || null,
      details: event.details || {},
      duration_ms: event.duration_ms || 0,
      success: event.success !== false
    };

    this.events.push(entry);

    // Log localement
    console.log(`[TRACK] ${event.type}@${event.module}`, entry);
  }

  /**
   * Tracker une erreur
   */
  trackError(error) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'error',
      error_type: error.type || error.name || 'unknown_error',
      error_message: error.message || String(error),
      error_code: error.code || null,
      stack: error.stack || null,
      user_email: error.user_email || null,
      module: error.module || null
    };

    this.events.push(entry);

    // Log localement
    console.error('[ERROR TRACKED]', entry);
  }

  /**
   * Tracker utilisation fonctionnalité
   * Ex: trackFeatureUsage('pdf_generation', { template: 'bail', count: 3 })
   */
  trackFeatureUsage(featureName, details = {}) {
    this.track({
      type: 'feature_usage',
      module: details.module || null,
      user_email: details.user_email || null,
      details: {
        feature: featureName,
        ...details
      }
    });
  }

  /**
   * Tracker performance
   * Ex: trackPerformance('api_call', 145, { endpoint: '/dossiers' })
   */
  trackPerformance(name, duration_ms, details = {}) {
    this.track({
      type: 'performance',
      module: details.module || null,
      duration_ms,
      details: {
        metric: name,
        ...details
      }
    });
  }

  /**
   * Envoyer usage au SaaS Admin
   */
  async flush() {
    if (this.events.length === 0) {
      console.log('[USAGE] No events to report');
      return;
    }

    const agencyId = this.#getAgencyId();
    if (!agencyId) {
      console.warn('No agency_id for usage report');
      return;
    }

    const eventsCopy = [...this.events]; // Copie pour envoi
    const periodStart = this.#getPeriodStart();
    const periodEnd = new Date().toISOString();

    try {
      console.log(`[USAGE] Sending ${this.events.length} events...`);

      const response = await fetch('/api/admin/usage/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: agencyId,
          period_start: periodStart,
          period_end: periodEnd,
          events: eventsCopy,
          client_version: '1.0.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Usage report failed: ${response.status}`);
      }

      const result = await response.json();

      // Effacer events après envoi OK
      this.events = [];

      console.log(`✅ Usage report sent (${eventsCopy.length} events)`);

      // Traiter actions reçues du SaaS admin
      if (result.actions?.length > 0) {
        console.log('📋 Admin actions received:', result.actions);
        await this.#processAdminActions(result.actions);
      }
    } catch (error) {
      console.error('Usage report error:', error);
      // Garder events pour retry à la prochaine tentative
      // (limiter taille locale pour éviter overflow)
      if (this.events.length > 1000) {
        console.warn('Events buffer too large, truncating oldest');
        this.events = this.events.slice(-1000);
      }
    }
  }

  /**
   * Traiter actions reçues du SaaS admin
   * Ex: [{ type: 'sync_config' }, { type: 'disable_module', module: 'comptabilite' }]
   */
  async #processAdminActions(actions) {
    // Import dynamique pour éviter circular dependencies
    const { appConfig } = await import('./AppConfigService.js');

    for (const action of actions) {
      try {
        if (action.type === 'sync_config') {
          // Forcer rechargement config
          await appConfig.syncConfig();
        } else if (action.type === 'disable_module') {
          console.log(`⚠️ Module ${action.module} disabled by admin`);
          // UI sera mise à jour via FeatureGate
        } else if (action.type === 'notify') {
          // Afficher notification au user
          console.log('📢 Admin notification:', action.message);
          // TODO: Afficher toast/dialog
        } else {
          console.log('Unknown admin action:', action);
        }
      } catch (error) {
        console.error('Error processing admin action:', error);
      }
    }
  }

  /**
   * Obtenir usage pour période actuelle
   */
  #getCurrentUsage() {
    const periodStart = this.#getPeriodStart();
    const currentPeriodEvents = this.events.filter(
      e => new Date(e.timestamp) >= new Date(periodStart)
    );

    return {
      total_events: currentPeriodEvents.length,
      by_type: this.#groupBy(currentPeriodEvents, 'type'),
      by_module: this.#groupBy(currentPeriodEvents, 'module'),
      errors_count: currentPeriodEvents.filter(e => e.type === 'error').length,
      period_start: periodStart,
      period_end: new Date().toISOString()
    };
  }

  /**
   * Aide: grouper events par clé
   */
  #groupBy(events, key) {
    return events.reduce((acc, event) => {
      const value = event[key] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Obtenir début de période actuelle
   */
  #getPeriodStart() {
    const now = new Date();
    const hour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0,
      0
    );
    return hour.toISOString();
  }

  /**
   * Obtenir agency_id
   */
  #getAgencyId() {
    // TODO: À intégrer avec votre système d'auth
    return localStorage.getItem('agency_id') || null;
  }

  /**
   * Arrêter service
   */
  destroy() {
    // Envoyer events avant d'arrêter
    if (this.events.length > 0) {
      this.flush();
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

// Singleton
export const usageTracker = new UsageTrackerService();