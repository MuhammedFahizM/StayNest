import api from "./api";

export const getUserProfile = async () => {
  const res = await api.get("/accounts/user/profile/");
  return res.data;
};

export const updateUserProfile = async (data) => {
  const res = await api.patch("/accounts/user/profile/", data);
  return res.data;
};
