import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

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

  async getCompany(companyId) {
    const token = authService.getToken();

    const response = await axios.get(
      `${API_BASE_URL}/api/companies/${companyId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

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

  async updateCompany(companyId, companyData) {
    const token = authService.getToken();

    const response = await axios.put(
      `${API_BASE_URL}/api/companies/${companyId}`,
      companyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  async deleteCompany(companyId) {
    const token = authService.getToken();

    const response = await axios.delete(
      `${API_BASE_URL}/api/companies/${companyId}`,
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
