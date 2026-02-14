import apiClient from "./apiClient";

const authService = {
  setCookie: async (token) => {
    return apiClient.post("/api/set-cookie", { token }, { withCredentials: true });
  },
};

export default authService;
