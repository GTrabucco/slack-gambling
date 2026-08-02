import apiClient from "./apiClient";

const jobService = {
  runTuesdayJob: async () => {
    return apiClient.post("/api/tuesday-job");
  },

  runRefreshJob: async () => {
    return apiClient.post("/api/refresh-job");
  },

  runSundayReminderJob: async () => {
    return apiClient.post("/api/sunday-reminder-job");
  },
};

export default jobService;
