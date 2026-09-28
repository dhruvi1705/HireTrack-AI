import axios from "axios";
import authService from "./authService";

const API_BASE_URL = "http://127.0.0.1:8000";

const dashboardService = {
  async getSummary() {
    const token = authService.getToken();

    if (!token) {
      authService.handleUnauthorized();
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        authService.handleUnauthorized();
        return;
      }

      throw error;
    }
  },
};

export default dashboardService;
