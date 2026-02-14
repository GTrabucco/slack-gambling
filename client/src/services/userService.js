import apiClient from "./apiClient";

const userService = {
    getAllUsers: async () => {
        try {
            const response = await apiClient.get("/api/get-users");
            return response;
        } catch (error) {
            throw new Error("Error fetching users");
        }
    },

    getByUsername: async (username) => {
        try {
            const response = await apiClient.get("/api/userdetails", {
                params: { username }
            });

            return response;
        } catch (error) {
            throw new Error("Error fetching user by username");
        }
    },

    updateUserDetails: async (userDetails) => {
        try {
            const response = await apiClient.post("/api/update-userdetails", userDetails);
            return response;
        } catch (error) {
            throw new Error("Error updating user details");
        }
    },

    markHasPaid: async (username) => {
        return apiClient.post("/api/has-paid", { username });
    },
}

export default userService;
