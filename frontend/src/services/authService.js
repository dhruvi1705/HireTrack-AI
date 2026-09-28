import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

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

  handleUnauthorized() {
    this.logout();

    window.location.href = "/login";
  },
};

export default authService;
