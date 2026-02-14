import apiClient from "./apiClient";

const gameService = {
  getGames: async () => {
    return apiClient.get("/api/games");
  },

  getGame: async (gameId) => {
    return apiClient.get("/api/get-game", { params: { gameId }, timeout: 5000 });
  },

  getWeatherDescription: async (details) => {
    return apiClient.get("/api/get-weather-description", { params: { details }, timeout: 5000 });
  },
};

export default gameService;
