import axios from "axios";
import authService from "./authService";

const API_BASE_URL = "http://127.0.0.1:8000";

const jobService = {
  async getJobs() {
    const token = authService.getToken();

    const response = await axios.get(`${API_BASE_URL}/api/jobs/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  async createJob(jobData) {
    const token = authService.getToken();

    const response = await axios.post(`${API_BASE_URL}/api/jobs/`, jobData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};

export default jobService;
