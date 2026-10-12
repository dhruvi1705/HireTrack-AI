import axios from "axios";
import authService from "./authService";
import { API_BASE_URL } from "./api";

const aiService = {
  async analyzeResume(input) {
    const token = authService.getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (input instanceof File) {
      const formData = new FormData();
      formData.append("file", input);
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/resume-analyzer`,
        formData,
        { headers }
      );
      return response.data;
    }

    if (typeof input === "object" && input !== null && input.file) {
      const formData = new FormData();
      formData.append("file", input.file);
      if (input.resume_text) {
        formData.append("resume_text", input.resume_text);
      }
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/resume-analyzer`,
        formData,
        { headers }
      );
      return response.data;
    }

    const text = typeof input === "string" ? input : input?.resume_text || "";
    const response = await axios.post(
      `${API_BASE_URL}/api/ai/resume-analyzer`,
      { resume_text: text },
      { headers }
    );
    return response.data;
  },

  async matchJob(payload) {
    const token = authService.getToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/ai/job-match`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async generateInterviewQuestions(payload) {
    const token = authService.getToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/ai/interview-questions`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async generateCoverLetter(payload) {
    const token = authService.getToken();
    const response = await axios.post(
      `${API_BASE_URL}/api/ai/cover-letter`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getStatus() {
    const token = authService.getToken();
    const response = await axios.get(
      `${API_BASE_URL}/api/ai/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};

export default aiService;
