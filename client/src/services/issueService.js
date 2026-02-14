import apiClient from "./apiClient";

const issueService = {
  reportIssue: async (issueData) => {
    return apiClient.post("/api/report-issue", issueData);
  },

  getReports: async () => {
    return apiClient.get("/api/get-reports");
  },

  closeReport: async (id) => {
    return apiClient.post("/api/close-report", { id });
  },
};

export default issueService;
