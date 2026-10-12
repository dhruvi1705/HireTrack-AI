import axios from "axios";
import { API_BASE_URL } from "./api";

const authService = {
  async login(email, password) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });

    const { access_token, token_type } = response.data;

    localStorage.setItem("hiretrack_token", access_token);

    localStorage.setItem("hiretrack_token_type", token_type);

    return response.data;
  },

  async register(fullName, email, password) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      full_name: fullName,
      email,
      password,
    });

    return response.data;
  },

  async signup(fullName, email, password) {
    return this.register(fullName, email, password);
  },

  logout() {
    localStorage.removeItem("hiretrack_token");
    localStorage.removeItem("hiretrack_token_type");
  },

  getToken() {
    return localStorage.getItem("hiretrack_token");
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem("hiretrack_token"));
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  handleUnauthorized() {
    this.logout();

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  },
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/api/auth/login") &&
      !error.config?.url?.includes("/api/auth/register") &&
      !error.config?.url?.includes("/api/auth/signup")
    ) {
      authService.handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default authService;
