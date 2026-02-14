import apiClient from "./apiClient";

const jobService = {
  runTuesdayJob: async (season, week, weekType) => {
    return apiClient.post("/api/tuesday-job", { season, week, weekType });
  },

  runFridayJob: async (season, week, weekType) => {
    return apiClient.post("/api/friday-job", { season, week, weekType });
  },

  runSundayReminderJob: async () => {
    return apiClient.post("/api/sunday-reminder-job");
  },
};

export default jobService;
