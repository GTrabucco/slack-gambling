import apiClient from "./apiClient";

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
        const params = {};

        if (username != null) {
            params.username = username;
        }

        return apiClient.get("/api/get-weekly-picks", { params });
    },

    submitPick: async (pick) => {
        return apiClient.post("/api/submit-picks", pick);
    },

    removePick: async (pick) => {
        return apiClient.post("/api/remove-pick", pick);
    },

    adminDeletePick: async (id) => {
        return apiClient.delete(`/api/picks/${id}`);
    },

    adminCreatePick: async (pick) => {
        return apiClient.post("/api/admin/picks", pick);
    },

    updatePickHistory: async (id, result) => {
        return apiClient.post("/api/update-pick-history", { id, result });
    },
}

export default pickService;
