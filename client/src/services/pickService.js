import apiClient from "./apiClient";

const USE_DUMMY_DATA = true; // set to false to use real backend

const pickService = {
    getPickHistory: async (username, season) => {
        const params = {};

        if (username !== "All" && username != null) {
            params.username = username;
        }

        if (season != null) {
            params.season = season;
        }

        return apiClient.get("/api/get-pick-history", { params });
    },

    getWeeklyPicks: async (username) => {
        if (USE_DUMMY_DATA) return { data: [] };
        const params = {};

        if (username != null) {
            params.username = username;
        }

        return apiClient.get("/api/get-weekly-picks", { params });
    },

    submitPick: async (pick) => {
        if (USE_DUMMY_DATA) return { data: { success: true } };
        return apiClient.post("/api/submit-picks", pick);
    },

    removePick: async (pick) => {
        if (USE_DUMMY_DATA) return { data: { success: true } };
        return apiClient.post("/api/remove-pick", pick);
    },

    updatePickHistory: async (id, result) => {
        return apiClient.post("/api/update-pick-history", { id, result });
    },
}

export default pickService;
