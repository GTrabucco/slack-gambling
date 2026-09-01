import apiClient from "./apiClient";

const cronJobService = {
  getCronJobs: async () => {
    return apiClient.get("/api/cron-jobs");
  },

  setCronJobEnabled: async (jobKey, enabled) => {
    return apiClient.put(`/api/cron-jobs/${jobKey}`, { enabled });
  },
};

export default cronJobService;
