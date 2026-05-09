import api from "./api";

// ── Owner setup ──
export const activateOwnerPayments = () =>
  api.post("/owner/payments/activate/").then((r) => r.data);

export const getOwnerPaymentStatus = () =>
  api.get("/owner/payments/status/").then((r) => r.data);

export const setOwnerRentDueDay = (day) =>
  api.post("/owner/payments/set-due-day/", { rent_due_day: day }).then((r) => r.data);

// ── Online orders ──
export const createPaymentOrder = (bookingId) =>
  api.post("/payments/create-order/", { booking_id: bookingId }).then((r) => r.data);

export const createRentPaymentOrder = (bookingId, ledgerId) =>
  api
    .post("/payments/create-rent-order/", {
      booking_id: bookingId,
      ledger_id: ledgerId,
    })
    .then((r) => r.data);

export const createFoodPaymentOrder = (bookingId, ledgerId) =>
  api
    .post("/payments/create-food-order/", {
      booking_id: bookingId,
      ledger_id: ledgerId,
    })
    .then((r) => r.data);

// ── Ledger ──
export const getUserLedger = (bookingId) =>
  api.get(`/payments/user-ledger/?booking_id=${bookingId}`).then((r) => r.data);

export const getOwnerLedger = (propertyId = null, bookingId = null) => {
  const params = new URLSearchParams();
  if (propertyId) params.append("property_id", propertyId);
  if (bookingId) params.append("booking_id", bookingId);
  return api.get(`/payments/owner-ledger/?${params.toString()}`).then((r) => r.data);
};

// ── Offline ──
export const markOfflinePayment = (ledgerId, paymentType, amount, note = "") =>
  api
    .post("/payments/mark-offline/", {
      ledger_id: ledgerId,
      payment_type: paymentType,
      amount,
      note,
    })
    .then((r) => r.data);

export const confirmOfflinePayment = (ledgerId, paymentType) =>
  api
    .post("/payments/confirm-offline/", {
      ledger_id: ledgerId,
      payment_type: paymentType,
    })
    .then((r) => r.data);

// ── Food subscription ──
export const requestFoodSubscription = (bookingId, action, start_from = null) =>
  api.post("/food/subscribe/", {
    booking_id: bookingId,
    action,
    ...(start_from && { start_from }),  // ✅ only send if exists
  }).then((r) => r.data);

export const respondToFoodRequest = (foodRequestId, action) =>
  api
    .post("/food/owner-respond/", { food_request_id: foodRequestId, action })
    .then((r) => r.data);

export const getOwnerFoodRequests = () =>
  api.get("/food/owner-requests/").then((r) => r.data);

// ── Deposit ──

// Online: user pays deposit via Razorpay anytime after booking confirmed/active
export const createDepositPaymentOrder = (bookingId) =>
  api.post("/deposit/pay-online/", { booking_id: bookingId }).then((r) => r.data);

// Offline: either side marks deposit as paid via cash
export const markDepositOffline = (bookingId, amount, note = "") =>
  api
    .post("/deposit/mark-offline/", { booking_id: bookingId, amount, note })
    .then((r) => r.data);

// Other side confirms the offline cash deposit
export const confirmDepositPaid = (bookingId) =>
  api.post("/deposit/confirm-paid/", { booking_id: bookingId }).then((r) => r.data);

// Vacate — owner marks return
export const ownerMarkDepositReturned = (bookingId, returnedAmount, note = "") =>
  api
    .post("/deposit/owner-mark-returned/", {
      booking_id: bookingId,
      returned_amount: returnedAmount,
      note,
    })
    .then((r) => r.data);

// Vacate — user confirms return
export const userConfirmDepositReturned = (bookingId) =>
  api.post("/deposit/user-confirm-returned/", { booking_id: bookingId }).then((r) => r.data);

export const ownerConfirmDepositPaid = (bookingId) =>
  api.post("/deposit/owner-confirm-paid/", { booking_id: bookingId }).then((r) => r.data);

export const getOwnerTenantList = (propertyId = null) => {
  const params = new URLSearchParams();
  if (propertyId) params.append("property_id", propertyId);
  return api.get(`/payments/owner-tenant-list/?${params.toString()}`).then((r) => r.data);
};

export const getOwnerTenantLedger = (bookingId) =>
  api.get(`/payments/owner-tenant-ledger/?booking_id=${bookingId}`).then((r) => r.data);

export const getOwnerDepositList = (propertyId = null) => {
  const params = new URLSearchParams();
  if (propertyId) params.append("property_id", propertyId);
  return api.get(`/deposit/owner-list/?${params.toString()}`).then((r) => r.data);
};

// ── Notifications ──
export const getNotifications = () =>
  api.get("/notifications/").then((r) => r.data);

export const markAllNotificationsRead = () =>
  api.patch("/notifications/").then((r) => r.data);

export const markNotificationRead = (id) =>
  api.post(`/notifications/${id}/read/`).then((r) => r.data);

export const getCurrentLedger = (bookingId) =>
  api.get(`/payments/current-ledger/?booking_id=${bookingId}`)
     .then((r) => r.data);

export const getUserUpcoming = (bookingId) =>
  api.get(`/payments/user-upcoming/?booking_id=${bookingId}`).then((r) => r.data);

export const getOwnerUpcoming = (propertyId = null) => {
  const params = new URLSearchParams();
  if (propertyId) params.append("property_id", propertyId);
  return api.get(`/payments/owner-upcoming/?${params.toString()}`).then((r) => r.data);
};


// ── Offline Register Book ──
export const getOfflineRegister = (propertyId = null, month = null) => {
  const params = new URLSearchParams();
  if (propertyId) params.append("property_id", propertyId);
  if (month) params.append("month", month);
  return api.get(`/register/list/?${params.toString()}`).then((r) => r.data);
};

export const updateOfflineRegister = (entryId, action, extra = {}) =>
  api.post("/register/update/", {
    entry_id: entryId,
    action,
    ...extra,
  }).then((r) => r.data);

export const getOfflineRegisterHistory = (slotId) =>
  api.get(`/register/history/?slot_id=${slotId}`).then((r) => r.data);