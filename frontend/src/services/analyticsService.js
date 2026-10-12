import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

const analyticsService = {
  async getSummary() {
    const token = authService.getToken();

    const response = await axios.get(`${API_BASE_URL}/api/analytics/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};

export default analyticsService;
