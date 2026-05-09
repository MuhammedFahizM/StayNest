import api from "./api";

export const getOwnerProfile = async () => {
  const res = await api.get("/accounts/owner/profile/");
  return res.data;
};

export const updateOwnerProfile = async (formData) => {
  const res = await api.patch(
    "/accounts/owner/profile/",
    formData,
    // { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

