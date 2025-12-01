import api from "./api";

// Owner Register
export const ownerRegister = async (data) => {
  const response = await api.post("/accounts/register/owner/", data);
  return response.data;
};

// Login (works for owner & user)
export const login = async (data) => {
  const response = await api.post("/accounts/login/", data);
  return response.data;
};

// Check Owner Dashboard
export const ownerDashboard = async () => {
  const response = await api.get("/accounts/owner/dashboard/");
  return response.data;
};
