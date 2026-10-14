import apiClient from "./apiClient";

// Injury score = sum over every injured depth-chart player of
//   positionWeight[position][rank] * statusFactor[status]
// Defaults below are used for any value an admin hasn't overridden.
const BASE_POSITION_WEIGHT = {
    QB: 10,
    RB: 2, HB: 2, FB: 1,
    WR: 3,
    TE: 2,
    LT: 5, C: 5, RT: 4, LG: 4, RG: 4,
    DE: 3, DT: 3, NT: 2.5, DL: 3,
    OLB: 2.5, ILB: 2.5, MLB: 2.5, LB: 2.5,
    CB: 3, S: 2, SS: 2, FS: 2, DB: 2,
    PK: 1, K: 1, P: 0.5, LS: 0.25, KR: 0.25, PR: 0.25,
};

// Backups count for a fraction of the starter weight by default.
const DEFAULT_RANK_FRACTION = { 1: 1, 2: 0.25, 3: 0.1 };

// Ranks shown/editable per position. The depth chart feed only returns a third
// string for WR.
const ranksFor = (position) => (position === "WR" ? [1, 2, 3] : [1, 2]);

const round = (n) => Math.round(n * 1000) / 1000;

export const DEFAULT_INJURY_SCORE_SETTINGS = {
    // Points for an injured player at [position][depth chart rank] at full severity.
    positionWeight: Object.fromEntries(
        Object.entries(BASE_POSITION_WEIGHT).map(([pos, w]) => [
            pos,
            Object.fromEntries(ranksFor(pos).map((r) => [r, round(w * DEFAULT_RANK_FRACTION[r])])),
        ])
    ),
    // Rough likelihood the player misses the game.
    statusFactor: {
        IR: 1, Out: 1, PUP: 1, NFI: 1, Suspended: 1,
        Doubtful: 0.75,
        Questionable: 0.4,
        Probable: 0.05,
    },
};

// Weight for a position/rank with no configured value (unknown position, or a rank
// beyond what's listed).
export const fallbackWeight = (rank) => 1 * (DEFAULT_RANK_FRACTION[rank] ?? 0.1);

const mergeWithDefaults = (saved) => {
    const defaults = DEFAULT_INJURY_SCORE_SETTINGS;
    const positionWeight = {};
    for (const [pos, ranks] of Object.entries(defaults.positionWeight)) {
        const savedRanks = saved?.positionWeight?.[pos];
        positionWeight[pos] = { ...ranks, ...(savedRanks && typeof savedRanks === "object" ? savedRanks : {}) };
    }
    return {
        positionWeight,
        statusFactor: { ...defaults.statusFactor, ...(saved?.statusFactor || {}) },
    };
};

const settingsCache = new Map();

const injuryScoreService = {
    getSettings: async (username) => {
        if (settingsCache.has(username)) return settingsCache.get(username);
        try {
            const res = await apiClient.get("/api/injury-score-settings", { params: { username } });
            const merged = mergeWithDefaults(res.data);
            settingsCache.set(username, merged);
            return merged;
        } catch {
            return mergeWithDefaults(null);
        }
    },

    invalidateCache: (username) => { settingsCache.delete(username); },

    updateSettings: (username, settings) =>
        apiClient.put("/api/injury-score-settings", { username, ...settings }),
};

export default injuryScoreService;
