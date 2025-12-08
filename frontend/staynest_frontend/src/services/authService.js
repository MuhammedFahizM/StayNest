import api from "./api";

// Combined Register (for user + owner)
export const register = async (formData) => {
  const response = await api.post("/accounts/register/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

// Login (works for both roles)
export const login = async (data) => {
  const response = await api.post("/accounts/login/", data);
  return response.data;
};

// Owner Dashboard (protected)
export const ownerDashboard = async () => {
  const response = await api.get("/accounts/owner/dashboard/");
  return response.data;
};
