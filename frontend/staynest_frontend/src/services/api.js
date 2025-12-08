import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const publicUrls = ["/accounts/login/", "/accounts/register/"];

  if (!publicUrls.some((url) => config.url.includes(url))) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handles expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired AND we haven't retried yet
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "token_not_valid" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        // Refresh token request
        const res = await axios.post(
          "http://127.0.0.1:8000/api/accounts/token/refresh/",
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;

        // Save new token
        localStorage.setItem("access_token", newAccessToken);

        // Attach new token to header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh also failed → logout
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
