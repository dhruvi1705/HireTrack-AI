import axios from "axios";
import authService from "./authService";

const API_BASE_URL = "http://127.0.0.1:8000";

const companyService = {
  async getCompanies() {
    const token = authService.getToken();

    const response = await axios.get(`${API_BASE_URL}/api/companies/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  async createCompany(companyData) {
    const token = authService.getToken();

    const response = await axios.post(
      `${API_BASE_URL}/api/companies/`,
      companyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },
};

export default companyService;
