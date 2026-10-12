import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

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
