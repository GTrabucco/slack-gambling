import apiClient from "./apiClient";

// Simple module-level cache so every DonorBadge instance rendered on a page
// (standings, leaderboard, GOTW reveal) doesn't each trigger its own request —
// tiers change rarely and only via the admin screen, which calls invalidateCache().
let cachedTiers = null;
let pendingFetch = null;

const donorTierService = {
    getTiers: async () => {
        if (cachedTiers) return cachedTiers;
        if (!pendingFetch) {
            pendingFetch = apiClient.get("/api/donor-tiers")
                .then((res) => {
                    cachedTiers = res.data || [];
                    return cachedTiers;
                })
                .finally(() => { pendingFetch = null; });
        }
        return pendingFetch;
    },

    invalidateCache: () => { cachedTiers = null; },

    createTier: (tier) => apiClient.post("/api/donor-tiers", tier),
    updateTier: (id, tier) => apiClient.put(`/api/donor-tiers/${id}`, tier),
    deleteTier: (id) => apiClient.delete(`/api/donor-tiers/${id}`),
};

export default donorTierService;
