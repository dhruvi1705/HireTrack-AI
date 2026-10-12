import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/api/interviews`;

const getAuthHeaders = () => {
  const token = authService.getToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getInterviews = async () => {
  const response = await axios.get(`${API_URL}/`, getAuthHeaders());

  return response.data;
};

const getInterview = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());

  return response.data;
};

const createInterview = async (interviewData) => {
  const response = await axios.post(
    `${API_URL}/`,
    interviewData,
    getAuthHeaders(),
  );

  return response.data;
};

const updateInterview = async (id, interviewData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    interviewData,
    getAuthHeaders(),
  );

  return response.data;
};

const deleteInterview = async (id) => {
  await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
};

const interviewService = {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
};

export default interviewService;
