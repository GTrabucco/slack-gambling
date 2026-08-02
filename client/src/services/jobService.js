import apiClient from "./apiClient";

const jobService = {
  runTuesdayJob: async (season, week, weekType) => {
    return apiClient.post("/api/tuesday-job", { season, week, weekType });
  },

  runFridayJob: async (season, week, weekType) => {
    return apiClient.post("/api/friday-job", { season, week, weekType });
  },

  runRefreshJob: async () => {
    return apiClient.post("/api/refresh-job");
  },

  runSundayReminderJob: async () => {
    return apiClient.post("/api/sunday-reminder-job");
  },
};

export default jobService;
