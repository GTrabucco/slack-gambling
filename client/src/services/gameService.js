import apiClient from "./apiClient";

const gameService = {
  getGames: async () => {
    return apiClient.get("/api/games");
  },

  getLiveScores: async () => {
    return apiClient.get("/api/live-scores");
  },

  getLineMovements: async (gameId) => {
    return apiClient.get("/api/line-movements", { params: gameId ? { gameId } : {} });
  },

  getGamesHistory: async () => {
    return apiClient.get("/api/games-history");
  },

  getGame: async (gameId) => {
    return apiClient.get("/api/get-game", { params: { gameId }, timeout: 5000 });
  },

  createGame: async (game) => {
    return apiClient.post("/api/games", game);
  },

  updateGame: async (id, game) => {
    return apiClient.put(`/api/games/${id}`, game);
  },

  setGotw: async (id) => {
    return apiClient.put(`/api/games/${id}/gotw`);
  },

  deleteGame: async (id) => {
    return apiClient.delete(`/api/games/${id}`);
  },
};

export default gameService;
