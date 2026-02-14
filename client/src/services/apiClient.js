import axios from "axios";

export const apiBaseUrl = process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

export default apiClient;
