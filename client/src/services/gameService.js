import apiClient from "./apiClient";

const DUMMY_GAMES = [
  { _id: "dummy1", gameId: "dummy1", home_team: "Kansas City Chiefs", away_team: "Buffalo Bills", home_spread: "-3.5", away_spread: "3.5", over: "51.5", under: "51.5", commence_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
  { _id: "dummy2", gameId: "dummy2", home_team: "San Francisco 49ers", away_team: "Dallas Cowboys", home_spread: "-6.5", away_spread: "6.5", over: "47.5", under: "47.5", commence_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString() },
  { _id: "dummy3", gameId: "dummy3", home_team: "Philadelphia Eagles", away_team: "New York Giants", home_spread: "-7", away_spread: "7", over: "44", under: "44", commence_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
  { _id: "dummy4", gameId: "dummy4", home_team: "Miami Dolphins", away_team: "New England Patriots", home_spread: "-4", away_spread: "4", over: "48.5", under: "48.5", commence_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString() },
  { _id: "dummy5", gameId: "dummy5", home_team: "Los Angeles Rams", away_team: "Seattle Seahawks", home_spread: "-5.5", away_spread: "5.5", over: "45", under: "45", commence_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
];

const USE_DUMMY_DATA = true; // set to false to use real backend

const gameService = {
  getGames: async () => {
    if (USE_DUMMY_DATA) return { data: DUMMY_GAMES };
    return apiClient.get("/api/games");
  },

  getGamesHistory: async () => {
    return apiClient.get("/api/games-history");
  },

  getGame: async (gameId) => {
    return apiClient.get("/api/get-game", { params: { gameId }, timeout: 5000 });
  },

  getWeatherDescription: async (details) => {
    return apiClient.get("/api/get-weather-description", { params: { details }, timeout: 5000 });
  },
};

export default gameService;
