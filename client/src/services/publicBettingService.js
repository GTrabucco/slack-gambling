import apiClient from "./apiClient";

// Public betting consensus is scraped server-side (which already caches
// aggressively in Mongo for 6h), but we still cache per-date on the client
// so every game container on the page shares one request instead of each
// firing its own — the admin-only game list can render a dozen of these.
const cachedByDate = new Map();
const pendingByDate = new Map();

const publicBettingService = {
    getConsensus: async (date) => {
        if (cachedByDate.has(date)) return cachedByDate.get(date);
        if (!pendingByDate.has(date)) {
            const promise = apiClient.get("/api/public-betting", { params: { date } })
                .then((res) => {
                    const data = res.data || [];
                    cachedByDate.set(date, data);
                    return data;
                })
                .catch(() => [])
                .finally(() => { pendingByDate.delete(date); });
            pendingByDate.set(date, promise);
        }
        return pendingByDate.get(date);
    },
};

export default publicBettingService;
