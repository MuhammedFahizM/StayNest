import api from "./api";

export const createBooking = (data) =>
  api.post("/user/bookings/", data).then((r) => r.data);

export const getUserBookings = () =>
  api.get("/user/bookings/").then((r) => r.data);

export const cancelBooking = (id) =>
  api.post(`/user/bookings/${id}/cancel/`);

export const getOwnerBookings = (
  propertyId = null,
  search = "",
  status = ""
) => {

  let params = new URLSearchParams();

if (propertyId) params.append("property", propertyId);
if (search) params.append("search", search);
if (status) params.append("status", status);

return api.get(`/owner/bookings/?${params.toString()}`)
  .then((r) => r.data);

  
};


export const approveBooking = (id) =>
  api.post(`/owner/bookings/${id}/approve/`).then(r => r.data);;

export const rejectBooking = (id) =>
  api.post(`/owner/bookings/${id}/reject/`).then(r => r.data);;

export const createTenantSlot = (data) =>
  api.post("/owner/slots/", data);

export const inviteTenant = (id) =>
  api.post(`/owner/slots/${id}/invite/`);

export const acceptInvitation = (token) =>
  api.post("/tenant/accept-invite/", { token });

export const getTenantSlots = (propertyId, search = "") => {
  let params = new URLSearchParams();
  params.append("property", propertyId);
  if (search) params.append("search", search);

  return api
    .get(`/owner/slots/?${params.toString()}`)
    .then((r) => r.data);
};


     export const requestVacate = (id) =>
  api.post(`/user/bookings/${id}/request_vacate/`);

export const approveVacate = (id) =>
  api.post(`/owner/bookings/${id}/approve_vacate/`);

export const deleteSlot = (id) =>
  api.delete(`/owner/slots/${id}/`);