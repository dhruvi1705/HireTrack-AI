import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/interviews";

const getAuthHeaders = () => {
  const token = localStorage.getItem("hiretrack_token");

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
