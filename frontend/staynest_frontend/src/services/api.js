// import axios from "axios";

// // Request interceptor — attach access token
// const api = axios.create({
//   baseURL: "http://127.0.0.1:8000/api/",  // IMPORTANT FIX
// });

// // Request interceptor — attach access token
// api.interceptors.request.use((config) => {
//   const publicUrls = [
//     "/accounts/login/",
//     "/accounts/register/",
//     "/accounts/forgot-password/",
//     "/accounts/reset-password/",
//     "/accounts/verify-email/",
//   ];

//   if (!publicUrls.some((url) => config.url.endsWith(url))) {
//     const token = localStorage.getItem("access_token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// });


// // Response interceptor — handles expired tokens
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // If token expired AND we haven't retried yet
//     if (
//       error.response?.status === 401 &&
//       // error.response?.data?.code === "token_not_valid" &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;

//       const refreshToken = localStorage.getItem("refresh_token");
//       if (!refreshToken) {
//         return Promise.reject(error);
//       }

//       try {
//         // Refresh token request
//         const res = await axios.post(
//           "http://127.0.0.1:8000/api/accounts/token/refresh/",
//           { refresh: refreshToken }
//         );

//         const newAccessToken = res.data.access;

//         // Save new token
//         localStorage.setItem("access_token", newAccessToken);

//         // Attach new token to header and retry original request
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//         return api(originalRequest);
//       } catch (refreshError) {
//         // Refresh also failed → logout
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("refresh_token");
//         localStorage.removeItem("user");
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from "axios";
import toast from "react-hot-toast";


/* ===========================
   Axios instance
=========================== */

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

/* ===========================
   Request interceptor
=========================== */

api.interceptors.request.use((config) => {
  const publicUrls = [
    "/accounts/login/",
    "/accounts/register/",
    "/accounts/forgot-password/",
    "/accounts/reset-password/",
    "/accounts/verify-email/",
  ];

  if (!publicUrls.some((url) => config.url.endsWith(url))) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/* ===========================
   Auto logout + refresh logic
=========================== */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");

  toast.error("Session expired. Please login again.");

  // small delay so toast is visible before redirect
  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
};


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        logoutUser();
        return Promise.reject(error);
      }

      // If refresh already in progress, queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/accounts/token/refresh/",
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;

        localStorage.setItem("access_token", newAccessToken);
        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logoutUser();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;


