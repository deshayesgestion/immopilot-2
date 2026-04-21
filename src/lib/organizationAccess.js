/**
 * Vérifie si un module est actif pour l'organisation.
 * @param {object} organizationConfig - La config chargée depuis OrganizationContext
 * @param {"vente"|"location"|"compta"} moduleName
 * @returns {boolean}
 */
export function canAccessModule(organizationConfig, moduleName) {
  return organizationConfig?.modulesActifs?.[moduleName] === true;
}

/**
 * Vérifie si une fonctionnalité est activée pour l'organisation.
 * @param {object} organizationConfig - La config chargée depuis OrganizationContext
 * @param {"ia"|"automation"} featureName
 * @returns {boolean}
 */
export function canUseFeature(organizationConfig, featureName) {
  return organizationConfig?.features?.[featureName] === true;
}