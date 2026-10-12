import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

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

  async getJob(jobId) {
    const token = authService.getToken();

    const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}`, {
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

  async updateJob(jobId, jobData) {
    const token = authService.getToken();

    const response = await axios.put(
      `${API_BASE_URL}/api/jobs/${jobId}`,
      jobData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  async deleteJob(jobId) {
    const token = authService.getToken();

    const response = await axios.delete(`${API_BASE_URL}/api/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};

export default jobService;
