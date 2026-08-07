import apiClient from "./apiClient";

const jobService = {
  runTuesdayJob: async (params) => {
    return apiClient.post("/api/tuesday-job", params);
  },

  runRefreshJob: async () => {
    return apiClient.post("/api/refresh-job");
  },

  runSundayReminderJob: async () => {
    return apiClient.post("/api/sunday-reminder-job");
  },

  runProcessLivePicks: async () => {
    return apiClient.post("/api/process-live-picks");
  },
};

export default jobService;
