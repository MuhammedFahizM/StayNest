import {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react";
import {
  getUserBookings,
  cancelBooking,
  requestVacate,
} from "../services/bookingService";
import {
  createPaymentOrder,
  createRentPaymentOrder,
  requestFoodSubscription,
  userConfirmDepositReturned,
} from "../services/paymentService";
import { openRealCheckout } from "../services/RazorpayCheckout";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const POLL_INTERVAL = 30000; // 30 seconds

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "#f8fafc",
    color: "#64748b",
    border: "#e2e8f0",
    icon: "bi-hourglass-split",
  },
  APPROVED_AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
    icon: "bi-credit-card",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
    icon: "bi-patch-check",
  },
  ACTIVE: {
    label: "Active",
    bg: "#ecfdf5",
    color: "#059669",
    border: "#bbf7d0",
    icon: "bi-house-check",
  },
  VACATED: {
    label: "Vacated",
    bg: "#f8fafc",
    color: "#64748b",
    border: "#e2e8f0",
    icon: "bi-box-arrow-right",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
    icon: "bi-x-circle",
  },
  REJECTED: {
    label: "Rejected",
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
    icon: "bi-slash-circle",
  },
};

export default function UserStays() {
  const [bookings, setBookings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(null);
  const [foodLoading, setFoodLoading] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Confirm modals
  const [cancelTarget, setCancelTarget] = useState(null);
  const [vacateTarget, setVacateTarget] = useState(null);
  const [foodOptOutTarget, setFoodOptOutTarget] = useState(null);
  const [depositReturnTarget, setDepositReturnTarget] = useState(null);
  const [foodTimingTarget, setFoodTimingTarget] = useState(null);

  // Refs for polling control
  const pollRef = useRef(null);
  const razorpayOpenRef = useRef(false); // pause polling while Razorpay is open

  // ── Fetch (silent = no spinner, used for polling) ──
  const fetchBookings = useCallback(async (silent = false) => {
    try {
      const data = await getUserBookings();
      setBookings(data || []);
    } catch {
      if (!silent) toast.error("Unable to load stays");
    } finally {
      if (!silent) setPageLoading(false);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    fetchBookings(false);
  }, [fetchBookings]);

  // ── Polling: every 30s, silent, skips if Razorpay open ──
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (!razorpayOpenRef.current && !document.hidden) {
        fetchBookings(true);
      }
    }, POLL_INTERVAL);

    // Refresh when tab becomes visible again (user switches back)
    const handleVisibility = () => {
      if (!document.hidden && !razorpayOpenRef.current) {
        fetchBookings(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchBookings]);

  // ── Optimistic update helper ──
  const updateBooking = (id, patch) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  // ── Handlers with optimistic UI ──

  const handleCancel = async () => {
    const id = cancelTarget;
    setCancelTarget(null);

    // Optimistic
    updateBooking(id, { status: "CANCELLED" });

    try {
      await cancelBooking(id);
      toast.success("Booking cancelled");
    } catch {
      // Revert
      fetchBookings(true);
      toast.error("Cannot cancel booking");
    }
  };

  const handleVacate = async () => {
    const id = vacateTarget;
    setVacateTarget(null);

    // Optimistic
    updateBooking(id, { user_vacate_requested: true });

    try {
      await requestVacate(id);
      toast.success("Vacate request sent");
    } catch (err) {
      // Revert
      updateBooking(id, { user_vacate_requested: false });
      toast.error(err?.response?.data?.error || "Unable to request vacate");
    }
  };

  const handleAdvancePay = async (booking) => {
    if (payLoading === booking.id) return;
    setPayLoading(booking.id);
    razorpayOpenRef.current = true;

    try {
      const order = await createPaymentOrder(booking.id);
      openRealCheckout(
        order,
        () => {
          razorpayOpenRef.current = false;
          toast.success("Payment initiated");
          // Server-side status will update — poll will catch it
          setTimeout(() => fetchBookings(true), 2000);
        },
        user
      );
    } catch {
      razorpayOpenRef.current = false;
      toast.error("Unable to start payment");
    } finally {
      setPayLoading(null);
    }
  };

  const handleBalancePay = async (booking) => {
    razorpayOpenRef.current = true;
    try {
      const order = await createRentPaymentOrder(booking.id, null);
      openRealCheckout(
        order,
        () => {
          razorpayOpenRef.current = false;
          toast.success("Payment successful");
          setTimeout(() => fetchBookings(true), 2000);
        },
        user
      );
    } catch {
      razorpayOpenRef.current = false;
      toast.error("Payment failed");
    }
  };

  const handleFoodIn = async (startFrom) => {
    const id = foodTimingTarget;
    setFoodTimingTarget(null);

    // Optimistic: show pending state immediately
    updateBooking(id, { food_request_pending: true });

    try {
      await requestFoodSubscription(id, "opt_in", startFrom);
      toast.success("Food request sent — waiting for owner");
    } catch (err) {
      // Revert
      updateBooking(id, { food_request_pending: false });
      toast.error(err?.response?.data?.error || "Unable to request food");
    }
  };

  const handleFoodOut = async () => {
    const id = foodOptOutTarget;
    setFoodOptOutTarget(null);
    setFoodLoading(id);

    // Optimistic: show pending, hide cancel button
    const booking = bookings.find((b) => b.id === id);
    updateBooking(id, { food_request_pending: true });

    try {
      await requestFoodSubscription(id, "opt_out");
      toast.success("Food cancellation requested");
      // Full refresh to get accurate food_opted_in state
      fetchBookings(true);
    } catch (err) {
      // Revert
      updateBooking(id, {
        food_request_pending: booking?.food_request_pending ?? false,
      });
      toast.error(err?.response?.data?.error || "Unable to cancel food");
    } finally {
      setFoodLoading(null);
    }
  };

  const handleDepositConfirm = async () => {
    const id = depositReturnTarget;
    setDepositReturnTarget(null);

    // Optimistic: hide confirm button
    updateBooking(id, { deposit_status: "RETURNED" });

    try {
      await userConfirmDepositReturned(id);
      toast.success("Deposit confirmed");
    } catch (err) {
      // Revert
      updateBooking(id, { deposit_status: "RETURN_MARKED" });
      toast.error(err?.response?.data?.error || "Unable to confirm");
    }
  };

  // ── Countdown renderer ──
  const renderCountdown = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    return `${h}h ${m}m remaining`;
  };

  // ── Button style helper ──
  const btn = (variant = "outline") => {
    const map = {
      green:   { bg: "#10b981", color: "#fff",     border: "#10b981" },
      red:     { bg: "#fef2f2", color: "#dc2626",  border: "#fecaca" },
      amber:   { bg: "#fff7ed", color: "#c2410c",  border: "#fed7aa" },
      blue:    { bg: "#eff6ff", color: "#1d4ed8",  border: "#bfdbfe" },
      outline: { bg: "#fff",    color: "#374151",  border: "#e2e8f0" },
    }[variant];

    return {
      padding: "9px 14px",
      border: `1px solid ${map.border}`,
      borderRadius: 12,
      background: map.bg,
      color: map.color,
      fontSize: ".84rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all .2s ease",
      whiteSpace: "nowrap",
    };
  };

  // ── Loading state ──
  if (pageLoading) {
    return (
      <div style={page} className="sn-page-enter">
        <div className="container py-5 text-center" style={{ paddingTop: 120 }}>
          <div className="spinner-border text-success mb-3" />
          <p style={muted}>Loading stays...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={page} className="sn-page-enter">
      <div className="container py-4">

        {/* Header */}
        <div style={hero} className="sn-reveal">
          <div>
            <div style={tag}>YOUR ACCOUNT</div>
            <h2 style={heroTitle}>Your Stays</h2>
            <p style={heroText}>Manage bookings, payments and stay requests.</p>
          </div>
          <button onClick={() => navigate("/tenant/accept-invite")} style={secondaryBtn}>
            <i className="bi bi-ticket-perforated me-2" />
            Accept Invitation
          </button>
        </div>

        {/* Empty */}
        {bookings.length === 0 && (
          <div style={emptyCard} className="sn-reveal sn-delay-1">
            <i className="bi bi-house-door" style={{ fontSize: 38, color: "#cbd5e1", marginBottom: 12 }} />
            <h6 style={{ fontWeight: 800, color: "#0f172a" }}>No stays yet</h6>
            <p style={muted}>Browse verified properties and request your first booking.</p>
            <button onClick={() => navigate("/browse-stays")} style={primaryBtn}>
              <i className="bi bi-search me-2" />Browse Stays
            </button>
          </div>
        )}

        {/* Booking Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bookings.map((b, i) => {
            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.CANCELLED;

            return (
              <div
                key={b.id}
                className={`sn-reveal sn-delay-${i + 1 > 5 ? 5 : i + 1}`}
                style={stayCard}
              >
                {/* Top row */}
                <div style={topRow}>
                  <div>
                    <h6 style={stayTitle}>
                      <i className="bi bi-building me-2" style={{ color: "#10b981" }} />
                      {b.property_name}
                    </h6>
                    <div style={mutedSmall}>
                      <i className="bi bi-people me-1" />
                      {b.sharing_label}
                    </div>
                  </div>

                  <span style={{ ...pill, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    <i className={`bi ${sc.icon} me-1`} />
                    {sc.label}
                  </span>
                </div>

                {/* Info */}
                <div style={infoWrap}>
                  {b.status === "APPROVED_AWAITING_PAYMENT" && (
                    <>
                      <div style={mutedSmall}>
                        <i className="bi bi-cash-stack me-1" />
                        Advance:
                        <strong style={{ color: "#0f172a", marginLeft: 4 }}>₹{b.advance_amount}</strong>
                      </div>
                      {b.payment_deadline && (
                        <div style={{ ...mutedSmall, color: "#c2410c" }}>
                          <i className="bi bi-clock me-1" />
                          {renderCountdown(b.payment_deadline)}
                        </div>
                      )}
                    </>
                  )}

                  {b.status === "ACTIVE" && b.user_vacate_requested && (
                    <span style={subtlePill}>
                      <i className="bi bi-hourglass-split me-1" />
                      Vacate request pending
                    </span>
                  )}

                  {b.status === "ACTIVE" && b.food_request_pending && (
                    <span style={{ ...subtlePill, color: "#c2410c", borderColor: "#fed7aa", background: "#fff7ed" }}>
                      <i className="bi bi-egg-fried me-1" />
                      Food request pending owner approval
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={actionWrap}>
                  {["PENDING", "APPROVED_AWAITING_PAYMENT", "CONFIRMED", "ACTIVE"].includes(b.status) && (
                    <button style={btn()} onClick={() => navigate(`/user/view-owner/${b.owner_id}`)}>
                      <i className="bi bi-person me-1" />View Owner
                    </button>
                  )}

                  {b.status === "PENDING" && (
                    <button style={btn("red")} onClick={() => setCancelTarget(b.id)}>
                      <i className="bi bi-x-circle me-1" />Cancel Booking
                    </button>
                  )}

                  {b.status === "APPROVED_AWAITING_PAYMENT" && (
                    <button
                      style={btn("green")}
                      disabled={payLoading === b.id}
                      onClick={() => handleAdvancePay(b)}
                    >
                      {payLoading === b.id ? "Processing..." : (
                        <><i className="bi bi-credit-card me-1" />Pay Advance ₹{b.advance_amount}</>
                      )}
                    </button>
                  )}

                  {b.status === "CONFIRMED" && (
                    <button style={btn("blue")} onClick={() => handleBalancePay(b)}>
                      <i className="bi bi-wallet2 me-1" />Pay Remaining Rent
                    </button>
                  )}

                  {b.status === "ACTIVE" && (
                    <>
                      <button style={btn("green")} onClick={() => navigate(`/user/payments/${b.id}`)}>
                        <i className="bi bi-wallet2 me-1" />Manage Payments
                      </button>

                      {!b.user_vacate_requested && (
                        <button style={btn("red")} onClick={() => setVacateTarget(b.id)}>
                          <i className="bi bi-door-open me-1" />Request Vacate
                        </button>
                      )}

                      {/* Food opt-in: only if no pending request */}
                      {b.food_provided && !b.food_opted_in && !b.food_request_pending && (
                        <button style={btn("amber")} onClick={() => setFoodTimingTarget(b.id)}>
                          <i className="bi bi-egg-fried me-1" />Request Food
                        </button>
                      )}

                      {/* Food opt-out: only if opted in and no pending cancel */}
                      {b.food_opted_in && !b.food_request_pending && (
                        <button
                          style={btn()}
                          disabled={foodLoading === b.id}
                          onClick={() => setFoodOptOutTarget(b.id)}
                        >
                          <i className="bi bi-x-circle me-1" />
                          {foodLoading === b.id ? "Cancelling..." : "Cancel Food"}
                        </button>
                      )}
                    </>
                  )}

                  {b.status === "VACATED" && (
                    <>
                      <button style={btn()} onClick={() => navigate(`/user/payments/${b.id}`)}>
                        <i className="bi bi-receipt me-1" />Payment History
                      </button>

                      {b.deposit_status === "RETURN_MARKED" && (
                        <button style={btn("green")} onClick={() => setDepositReturnTarget(b.id)}>
                          <i className="bi bi-check-circle me-1" />Confirm Deposit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking request?"
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Booking"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmModal
        open={!!vacateTarget}
        title="Request Vacate"
        message="Send vacate request to owner?"
        confirmLabel="Send Request"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleVacate}
        onCancel={() => setVacateTarget(null)}
      />

      <ConfirmModal
        open={!!foodOptOutTarget}
        title="Cancel Food Subscription"
        message="Food will stop from next billing cycle."
        confirmLabel="Cancel Food"
        cancelLabel="Keep Food"
        variant="warning"
        onConfirm={handleFoodOut}
        onCancel={() => setFoodOptOutTarget(null)}
      />

      <ConfirmModal
        open={!!depositReturnTarget}
        title="Confirm Deposit Returned"
        message="Confirm you received the deposit back from the owner."
        confirmLabel="Confirmed"
        cancelLabel="Not Yet"
        variant="primary"
        onConfirm={handleDepositConfirm}
        onCancel={() => setDepositReturnTarget(null)}
      />

      {/* Food timing modal */}
      {foodTimingTarget && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9998,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setFoodTimingTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 20,
              padding: 28, maxWidth: 380, width: "calc(100% - 32px)",
              boxShadow: "0 24px 60px rgba(15,23,42,.18)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>🍽️</div>
            <h5 style={{ fontWeight: 800, marginBottom: 8 }}>Request Food Subscription</h5>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 24 }}>
              When would you like food to start?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => handleFoodIn("current")}
                style={{ padding: "12px", borderRadius: 12, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                This Month
              </button>
              <button
                onClick={() => handleFoodIn("next")}
                style={{ padding: "12px", borderRadius: 12, background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0", fontWeight: 700, cursor: "pointer" }}
              >
                Next Month
              </button>
              <button
                onClick={() => setFoodTimingTarget(null)}
                style={{ padding: "10px", borderRadius: 12, background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#f8fafc,#ffffff)",
};

const hero = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 24,
  marginBottom: 20,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
  boxShadow: "0 10px 24px rgba(15,23,42,.05)",
};

const heroTitle = { margin: "4px 0", fontWeight: 800, color: "#0f172a" };
const heroText  = { margin: 0, color: "#64748b" };
const tag       = { color: "#10b981", fontWeight: 800, fontSize: ".74rem", letterSpacing: ".08em" };
const muted     = { color: "#64748b", margin: 0 };
const mutedSmall = { color: "#64748b", fontSize: ".84rem" };

const stayCard = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 10px 22px rgba(15,23,42,.04)",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const stayTitle  = { margin: 0, fontWeight: 800, color: "#0f172a" };
const infoWrap   = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 };
const actionWrap = { display: "flex", flexWrap: "wrap", gap: 8 };

const pill = {
  padding: "5px 12px",
  borderRadius: 999,
  fontSize: ".75rem",
  fontWeight: 700,
};

const subtlePill = {
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: ".76rem",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#64748b",
};

const emptyCard = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 48,
  textAlign: "center",
  marginBottom: 18,
};

const primaryBtn = {
  height: 44,
  border: "none",
  borderRadius: 12,
  padding: "0 16px",
  background: "linear-gradient(135deg,#10b981,#059669)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  height: 44,
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "0 16px",
  background: "#fff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
};