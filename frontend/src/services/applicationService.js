import axios from "axios";
import authService from "./authService";

const API_BASE_URL = "http://127.0.0.1:8000";

const applicationService = {
  async getApplications() {
    const token = authService.getToken();

    const response = await axios.get(`${API_BASE_URL}/api/applications/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  async createApplication(applicationData) {
    const token = authService.getToken();

    const response = await axios.post(
      `${API_BASE_URL}/api/applications/`,
      applicationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  async updateApplication(applicationId, applicationData) {
    const token = authService.getToken();

    const response = await axios.put(
      `${API_BASE_URL}/api/applications/${applicationId}`,
      applicationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  async deleteApplication(applicationId) {
    const token = authService.getToken();

    const response = await axios.delete(
      `${API_BASE_URL}/api/applications/${applicationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },
};

export default applicationService;
