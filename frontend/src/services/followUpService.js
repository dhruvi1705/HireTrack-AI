import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/api/follow-ups`;

const getAuthHeaders = () => {
  const token = authService.getToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getFollowUps = async (params = {}) => {
  const config = getAuthHeaders();
  if (params && Object.keys(params).length > 0) {
    config.params = params;
  }
  const response = await axios.get(`${API_URL}/`, config);

  return response.data;
};

const getFollowUp = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());

  return response.data;
};

const createFollowUp = async (data) => {
  const response = await axios.post(`${API_URL}/`, data, getAuthHeaders());

  return response.data;
};

const updateFollowUp = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());

  return response.data;
};

const deleteFollowUp = async (id) => {
  await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
};

const followUpService = {
  getFollowUps,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
};

export default followUpService;
