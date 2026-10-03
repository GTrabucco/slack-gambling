import apiClient from "./apiClient";

// Donation-amount thresholds that unlock admin/beta features for non-admin
// donors (odds-shift text alerts, public betting consensus). Cached the same
// way as donorTierService since this rarely changes and is read on every
// account-settings load and every game-list render.
let cachedSettings = null;
let pendingFetch = null;

const featureAccessService = {
    getSettings: async () => {
        if (cachedSettings) return cachedSettings;
        if (!pendingFetch) {
            pendingFetch = apiClient.get("/api/feature-access-settings")
                .then((res) => {
                    cachedSettings = res.data || { oddsAlertThreshold: null, publicBettingThreshold: null };
                    return cachedSettings;
                })
                .finally(() => { pendingFetch = null; });
        }
        return pendingFetch;
    },

    invalidateCache: () => { cachedSettings = null; },

    updateSettings: (settings) => apiClient.put("/api/feature-access-settings", settings),
};

export default featureAccessService;
