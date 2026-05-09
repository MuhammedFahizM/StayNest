import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserLedger, getCurrentLedger, createRentPaymentOrder,
  createFoodPaymentOrder, markOfflinePayment, confirmOfflinePayment,
  createDepositPaymentOrder, markDepositOffline, confirmDepositPaid,
  userConfirmDepositReturned, getUserUpcoming,
} from "../services/paymentService";
import { openRealCheckout } from "../services/RazorpayCheckout";
import toast from "react-hot-toast";
import { getUserBookings } from "../services/bookingService";
import { AuthContext } from "../context/AuthContext";

const POLL_INTERVAL = 45000; // 45 seconds

const STATUS_COLORS = {
  PENDING:      { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  PAID_ONLINE:  { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0" },
  PAID_OFFLINE: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0" },
  OVERDUE:      { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  NA:           { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
};

const STATUS_LABELS = {
  PENDING: "Pending", PAID_ONLINE: "Paid Online",
  PAID_OFFLINE: "Paid (Cash)", OVERDUE: "Overdue", NA: "N/A",
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.NA;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionBtn({ label, onClick, disabled, variant = "default" }) {
  const variants = {
    green:   { bg: "#10b981", color: "#fff",    border: "#10b981", hover: "#059669" },
    amber:   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", hover: "#ffedd5" },
    default: { bg: "#f8fafc", color: "#374151", border: "#e2e8f0", hover: "#f1f5f9" },
    outline: { bg: "#fff",    color: "#374151", border: "#e2e8f0", hover: "#f8fafc" },
  };
  const v = variants[variant] || variants.default;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "6px 12px", border: `1px solid ${v.border}`, borderRadius: 7,
      background: disabled ? "#f8fafc" : v.bg, color: disabled ? "#9ca3af" : v.color,
      fontSize: "0.78rem", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.15s ease", whiteSpace: "nowrap",
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = v.bg; }}
    >
      {label}
    </button>
  );
}

function SectionCard({ children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th style={{
      background: "#f8fafc", color: "#6b7280", fontSize: "0.72rem", fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.4px",
      padding: "10px 14px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

function TableCell({ children, style }) {
  return (
    <td style={{
      padding: "10px 14px", fontSize: "0.85rem", color: "#374151",
      borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", ...style,
    }}>
      {children}
    </td>
  );
}

export default function UserPaymentsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLedger, setCurrentLedger] = useState(null);
  const [upcomingPayment, setUpcomingPayment] = useState(null);
  const [depositInfo, setDepositInfo] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [offlineLoading, setOfflineLoading] = useState(null);

  // Refs for polling control
  const pollRef = useRef(null);
  const razorpayOpenRef = useRef(false);
  const accessGrantedRef = useRef(false); // don't re-check access on every poll

  // ── Granular fetch helpers (called individually for optimistic updates) ──
  const fetchLedger = useCallback(async () => {
    try {
      const data = await getUserLedger(bookingId);
      setEntries(data);
    } catch { /* silent on poll */ }
  }, [bookingId]);

  const fetchCurrentLedger = useCallback(async () => {
    try { const data = await getCurrentLedger(bookingId); setCurrentLedger(data); } catch { }
  }, [bookingId]);

  const fetchUpcoming = useCallback(async () => {
    try { const data = await getUserUpcoming(bookingId); setUpcomingPayment(data); } catch { }
  }, [bookingId]);

  const fetchDeposit = useCallback(async () => {
    try {
      const bookings = await getUserBookings();
      const booking = bookings.find(b => String(b.id) === String(bookingId));
      if (booking) { setDepositInfo(booking); setBookingStatus(booking.status); }
    } catch { }
  }, [bookingId]);

  // ── Silent full refresh (used by polling) ──
  const silentRefresh = useCallback(async () => {
    await Promise.all([
      fetchLedger(),
      fetchCurrentLedger(),
      fetchDeposit(),
      fetchUpcoming(),
    ]);
  }, [fetchLedger, fetchCurrentLedger, fetchDeposit, fetchUpcoming]);

  // ── Access check (once only) ──
  const checkAccess = useCallback(async () => {
    try {
      const bookings = await getUserBookings();
      const booking = bookings.find(b => String(b.id) === String(bookingId));
      if (!booking) { toast.error("Booking not found"); navigate("/user/stays"); return false; }
      if (!["ACTIVE", "CONFIRMED", "VACATED"].includes(booking.status)) {
        toast.error("No payment history for this booking"); navigate("/user/stays"); return false;
      }
      return true;
    } catch { toast.error("Access check failed"); navigate("/user/stays"); return false; }
  }, [bookingId, navigate]);

  // ── Initial load ──
  useEffect(() => {
    const init = async () => {
      const allowed = await checkAccess();
      if (!allowed) return;
      accessGrantedRef.current = true;
      await Promise.all([fetchLedger(), fetchCurrentLedger(), fetchDeposit(), fetchUpcoming()]);
      setLoading(false);
    };
    init();
  }, [bookingId]);

  // ── Polling: every 45s, silent ──
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (accessGrantedRef.current && !razorpayOpenRef.current && !document.hidden) {
        silentRefresh();
      }
    }, POLL_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden && accessGrantedRef.current && !razorpayOpenRef.current) {
        silentRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [silentRefresh]);

  // ── Optimistic helpers ──

  // Update a single ledger entry in state
  const updateEntry = (entryId, patch) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...patch } : e));
  };

  // ── Payment handlers ──

  const handlePayRent = async (entry) => {
    razorpayOpenRef.current = true;
    try {
      const order = await createRentPaymentOrder(bookingId, entry.id);
      openRealCheckout(order, () => {
        razorpayOpenRef.current = false;
        toast.success("Rent payment initiated");
        // Webhook will update server — poll will catch it
        setTimeout(silentRefresh, 2000);
      }, user);
    } catch (err) {
      razorpayOpenRef.current = false;
      toast.error(err?.response?.data?.error || "Payment failed");
    }
  };

  const handlePayFood = async (entry) => {
    razorpayOpenRef.current = true;
    try {
      const order = await createFoodPaymentOrder(bookingId, entry.id);
      openRealCheckout(order, () => {
        razorpayOpenRef.current = false;
        toast.success("Food payment initiated");
        setTimeout(silentRefresh, 2000);
      }, user);
    } catch (err) {
      razorpayOpenRef.current = false;
      toast.error(err?.response?.data?.error || "Payment failed");
    }
  };

  // Mark rent as cash paid — optimistic: show "waiting for owner" immediately
  const handleMarkOfflineRent = async (entry) => {
    if (offlineLoading === `RENT-${entry.id}`) return;
    setOfflineLoading(`RENT-${entry.id}`);

    // Optimistic: flip confirmed_by_user flag so "waiting for owner" shows immediately
    updateEntry(entry.id, { rent_offline_confirmed_by_user: true });

    try {
      await markOfflinePayment(entry.id, "RENT", entry.rent_amount);
      toast.success("Marked as cash paid. Waiting for owner to confirm.");
      // Refresh to get accurate state from server
      fetchLedger();
      fetchCurrentLedger();
    } catch (err) {
      // Revert
      updateEntry(entry.id, { rent_offline_confirmed_by_user: false });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setOfflineLoading(null);
    }
  };

  // Mark food as cash paid — optimistic
  const handleMarkOfflineFood = async (entry) => {
    if (offlineLoading === `FOOD-${entry.id}`) return;
    setOfflineLoading(`FOOD-${entry.id}`);

    updateEntry(entry.id, { food_offline_confirmed_by_user: true });

    try {
      await markOfflinePayment(entry.id, "FOOD", entry.food_amount);
      toast.success("Food marked as cash paid. Waiting for owner to confirm.");
      fetchLedger();
      fetchCurrentLedger();
    } catch (err) {
      updateEntry(entry.id, { food_offline_confirmed_by_user: false });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setOfflineLoading(null);
    }
  };

  // Confirm owner's cash mark for rent — optimistic: flip status to PAID_OFFLINE
  const handleConfirmOfflineRent = async (entry) => {
    if (offlineLoading === `CONFIRM-RENT-${entry.id}`) return;
    setOfflineLoading(`CONFIRM-RENT-${entry.id}`);

    // Optimistic
    updateEntry(entry.id, {
      rent_status: "PAID_OFFLINE",
      rent_offline_confirmed_by_user: true,
      rent_paid_at: new Date().toISOString(),
      overall_status: entry.food_status === "NA" || entry.food_status === "PAID_ONLINE" || entry.food_status === "PAID_OFFLINE" ? "PAID" : "PARTIAL",
    });

    try {
      await confirmOfflinePayment(entry.id, "RENT");
      toast.success("Cash rent payment confirmed");
      fetchLedger();
      fetchCurrentLedger();
    } catch (err) {
      // Revert
      updateEntry(entry.id, {
        rent_status: entry.rent_status,
        rent_offline_confirmed_by_user: false,
        rent_paid_at: entry.rent_paid_at,
        overall_status: entry.overall_status,
      });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setOfflineLoading(null);
    }
  };

  // Confirm owner's cash mark for food — optimistic
  const handleConfirmOfflineFood = async (entry) => {
    if (offlineLoading === `CONFIRM-FOOD-${entry.id}`) return;
    setOfflineLoading(`CONFIRM-FOOD-${entry.id}`);

    // Optimistic
    updateEntry(entry.id, {
      food_status: "PAID_OFFLINE",
      food_offline_confirmed_by_user: true,
      food_paid_at: new Date().toISOString(),
      overall_status: entry.rent_status === "PAID_ONLINE" || entry.rent_status === "PAID_OFFLINE" ? "PAID" : "PARTIAL",
    });

    try {
      await confirmOfflinePayment(entry.id, "FOOD");
      toast.success("Cash food payment confirmed");
      fetchLedger();
      fetchCurrentLedger();
    } catch (err) {
      updateEntry(entry.id, {
        food_status: entry.food_status,
        food_offline_confirmed_by_user: false,
        food_paid_at: entry.food_paid_at,
        overall_status: entry.overall_status,
      });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setOfflineLoading(null);
    }
  };

  // Deposit — optimistic helpers
  const updateDeposit = (patch) => {
    setDepositInfo(prev => prev ? { ...prev, ...patch } : prev);
  };

  const handleDepositPayOnline = async () => {
    razorpayOpenRef.current = true;
    setDepositLoading(true);
    try {
      const order = await createDepositPaymentOrder(bookingId);
      openRealCheckout(order, () => {
        razorpayOpenRef.current = false;
        toast.success("Deposit paid successfully");
        setTimeout(fetchDeposit, 2000);
      }, user);
    } catch (err) {
      razorpayOpenRef.current = false;
      toast.error(err?.response?.data?.error || "Payment failed");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositMarkCash = async () => {
    setDepositLoading(true);

    // Optimistic: show "you marked — awaiting owner"
    updateDeposit({
      deposit_status: "PENDING_CONFIRMATION",
      deposit_marked_by_user: true,
      deposit_marked_by_owner: false,
    });

    try {
      await markDepositOffline(bookingId);
      toast.success("Marked as cash paid. Waiting for owner to confirm.");
      fetchDeposit();
    } catch (err) {
      // Revert
      updateDeposit({
        deposit_status: "PENDING_RECEIPT",
        deposit_marked_by_user: false,
      });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositConfirmOwnerMark = async () => {
    setDepositLoading(true);

    // Optimistic: flip to HELD_BY_OWNER
    updateDeposit({
      deposit_status: "HELD_BY_OWNER",
      deposit_marked_by_user: true,
    });

    try {
      await confirmDepositPaid(bookingId);
      toast.success("Deposit confirmed");
      fetchDeposit();
    } catch (err) {
      // Revert
      updateDeposit({
        deposit_status: "PENDING_CONFIRMATION",
        deposit_marked_by_user: false,
      });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositConfirmReturn = async () => {
    setDepositLoading(true);
    const returnedAmount = depositInfo?.deposit_returned_amount || depositInfo?.deposit_amount;
    const isFullReturn = parseFloat(returnedAmount) >= parseFloat(depositInfo?.deposit_amount || 0);

    // Optimistic
    updateDeposit({
      deposit_status: isFullReturn ? "RETURNED" : "PARTIAL_RETURNED",
    });

    try {
      await userConfirmDepositReturned(bookingId);
      toast.success("Deposit return confirmed");
      fetchDeposit();
    } catch (err) {
      // Revert
      updateDeposit({ deposit_status: "RETURN_MARKED" });
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setDepositLoading(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner-border" style={{ color: "#10b981", width: 32, height: 32 }}></div>
          <p style={{ color: "#6b7280", marginTop: 12, fontSize: "0.9rem" }}>Loading payments...</p>
        </div>
      </div>
    );
  }

  const propertyName = entries[0]?.property_name;
  const sharingLabel = entries[0]?.sharing_label;

  return (
    <div className="sn-page-enter" style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: 80 }}>
      <div className="container py-4">

        {/* Back */}
        <button onClick={() => navigate("/user/stays")}
          style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: "0.875rem", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#10b981"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
        >
          <i className="bi bi-arrow-left"></i> Back to Your Stays
        </button>

        {/* Header */}
        <div className="sn-reveal" style={{ marginBottom: 24 }}>
          <p style={{ color: "#10b981", fontWeight: 600, fontSize: "0.8rem", marginBottom: 2, letterSpacing: "0.5px" }}>PAYMENTS</p>
          <h2 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Payment History</h2>
          {propertyName && (
            <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
              {propertyName} · {sharingLabel}
            </p>
          )}
        </div>

        {/* ── Current Month Status ── */}
        {currentLedger && currentLedger.month && bookingStatus !== "VACATED" && (
          <div className="sn-reveal sn-delay-1">
            <SectionCard style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    Current Month
                  </div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{currentLedger.month}</div>
                </div>

                {currentLedger.action === "NONE" && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, color: "#059669", fontSize: "0.875rem", fontWeight: 500 }}>
                    <i className="bi bi-check-circle-fill"></i> All payments done
                  </div>
                )}
                {currentLedger.action === "PAY_RENT" && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 14px", color: "#c2410c", fontSize: "0.875rem", fontWeight: 500 }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>Rent pending
                  </div>
                )}
                {currentLedger.action === "PAY_FOOD" && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 14px", color: "#c2410c", fontSize: "0.875rem", fontWeight: 500 }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>Food pending
                  </div>
                )}
                {currentLedger.action === "PAY_BOTH" && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 14px", color: "#dc2626", fontSize: "0.875rem", fontWeight: 500 }}>
                    <i className="bi bi-exclamation-circle me-2"></i>Rent + Food pending
                  </div>
                )}
              </div>

              {currentLedger.food_status === "NA" && depositInfo?.food_opted_in && depositInfo?.food_opt_in_date && (() => {
                const startMonth = new Date(depositInfo.food_opt_in_date);
                const now = new Date();
                if (startMonth > new Date(now.getFullYear(), now.getMonth(), 1)) {
                  return (
                    <div style={{ marginTop: 10, fontSize: "0.82rem", color: "#6b7280" }}>
                      🍽️ Food starts from <strong>{startMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>
                    </div>
                  );
                }
                return null;
              })()}
              {depositInfo?.food_request_pending && !depositInfo?.food_opted_in && (
                <div style={{ marginTop: 10, fontSize: "0.82rem", color: "#6b7280" }}>
                  🍽️ Food request sent — awaiting owner approval
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ── Upcoming Month ── */}
        {upcomingPayment && bookingStatus === "ACTIVE" && (
          <div className="sn-reveal sn-delay-2">
            <SectionCard style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Upcoming</div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{upcomingPayment.month_label}</div>
                </div>
                <span style={{ fontSize: "0.72rem", background: "#f8fafc", color: "#6b7280", padding: "3px 10px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
                  {upcomingPayment.source === "ledger" ? "Ledger Ready" : "Estimated"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Rent</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>₹{upcomingPayment.rent_amount}</span>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      due {new Date(upcomingPayment.rent_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <StatusBadge status={upcomingPayment.rent_status === "UPCOMING" ? "NA" : upcomingPayment.rent_status} />
                  </div>
                </div>
                {upcomingPayment.food_amount && upcomingPayment.food_status !== "NA" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Food</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>₹{upcomingPayment.food_amount}</span>
                      <StatusBadge status={upcomingPayment.food_status === "UPCOMING" ? "NA" : upcomingPayment.food_status} />
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>Total</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#10b981" }}>₹{upcomingPayment.total}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Deposit Section ── */}
        {depositInfo?.deposit_amount && (
          <div className="sn-reveal sn-delay-3">
            <SectionCard style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    <i className="bi bi-shield me-1" style={{ color: "#10b981" }}></i>Security Deposit
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>₹{depositInfo.deposit_amount}</div>
                  <div style={{ marginTop: 6 }}>
                    {depositInfo.deposit_status === "PENDING_RECEIPT" && <StatusBadge status="PENDING" />}
                    {depositInfo.deposit_status === "PENDING_CONFIRMATION" && depositInfo.deposit_marked_by_user && !depositInfo.deposit_marked_by_owner && (
                      <span style={{ fontSize: "0.72rem", color: "#6b7280", background: "#f8fafc", padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
                        You marked — awaiting owner
                      </span>
                    )}
                    {depositInfo.deposit_status === "PENDING_CONFIRMATION" && depositInfo.deposit_marked_by_owner && !depositInfo.deposit_marked_by_user && (
                      <span style={{ fontSize: "0.72rem", color: "#c2410c", background: "#fff7ed", padding: "2px 8px", borderRadius: 20, border: "1px solid #fed7aa" }}>
                        Owner marked — confirm below
                      </span>
                    )}
                    {depositInfo.deposit_status === "HELD_BY_OWNER" && <StatusBadge status="PAID_ONLINE" />}
                    {depositInfo.deposit_status === "RETURN_MARKED" && (
                      <span style={{ fontSize: "0.72rem", color: "#c2410c", background: "#fff7ed", padding: "2px 8px", borderRadius: 20, border: "1px solid #fed7aa" }}>
                        Owner marked ₹{depositInfo.deposit_returned_amount || depositInfo.deposit_amount} returned — confirm below
                      </span>
                    )}
                    {depositInfo.deposit_status === "RETURNED" && <StatusBadge status="PAID_ONLINE" />}
                    {depositInfo.deposit_status === "PARTIAL_RETURNED" && (
                      <span style={{ fontSize: "0.72rem", color: "#6b7280", background: "#f8fafc", padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
                        Partial Return ✓ ₹{depositInfo.deposit_returned_amount}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {depositInfo.deposit_status === "PENDING_RECEIPT" && (
                    <>
                      <ActionBtn
                        label={depositLoading ? "Processing..." : "Pay Online"}
                        variant="green" disabled={depositLoading}
                        onClick={handleDepositPayOnline}
                      />
                      <ActionBtn
                        label={depositLoading ? "Marking..." : "Mark as Cash Paid"}
                        disabled={depositLoading}
                        onClick={handleDepositMarkCash}
                      />
                    </>
                  )}

                  {depositInfo.deposit_status === "PENDING_CONFIRMATION" && depositInfo.deposit_marked_by_owner && !depositInfo.deposit_marked_by_user && (
                    <ActionBtn
                      label={depositLoading ? "Confirming..." : "Confirm Deposit Paid"}
                      variant="green" disabled={depositLoading}
                      onClick={handleDepositConfirmOwnerMark}
                    />
                  )}

                  {depositInfo.deposit_status === "HELD_BY_OWNER" && bookingStatus === "VACATED" && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", fontSize: "0.82rem", color: "#059669" }}>
                      <i className="bi bi-shield-check me-2"></i>Deposit held — owner will mark return when ready
                    </div>
                  )}

                  {depositInfo.deposit_status === "RETURN_MARKED" && (
                    <ActionBtn
                      label={depositLoading ? "Confirming..." : `Confirm Return ₹${depositInfo.deposit_returned_amount || depositInfo.deposit_amount}`}
                      variant="green" disabled={depositLoading}
                      onClick={handleDepositConfirmReturn}
                    />
                  )}

                  {depositInfo.deposit_status === "RETURNED" && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", fontSize: "0.82rem", color: "#059669" }}>
                      <i className="bi bi-check-circle-fill me-2"></i>Deposit fully returned ✓
                    </div>
                  )}

                  {depositInfo.deposit_status === "PARTIAL_RETURNED" && (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: "0.82rem", color: "#6b7280" }}>
                      <i className="bi bi-info-circle me-2"></i>Partial return of ₹{depositInfo.deposit_returned_amount} confirmed
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Empty state ── */}
        {entries.length === 0 && (
          <SectionCard style={{ padding: 48, textAlign: "center" }}>
            <i className="bi bi-receipt" style={{ color: "#10b981", fontSize: 36, display: "block", marginBottom: 12 }}></i>
            <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {bookingStatus === "VACATED" ? "No payment records" : "No payments yet"}
            </h6>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
              {bookingStatus === "VACATED"
                ? "This booking was settled outside the platform."
                : "Your ledger will appear here once your first month is complete."}
            </p>
          </SectionCard>
        )}

        {/* ── Ledger Table ── */}
        {entries.length > 0 && (
          <div className="sn-reveal sn-delay-4">
            <SectionCard>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h6 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>Payment History</h6>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Month", "Rent", "Due Date", "Rent Status", "Food", "Food Status", "Actions", "Overall"].map(h => (
                        <TableHeader key={h}>{h}</TableHeader>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <TableCell><span style={{ fontWeight: 600, color: "#0f172a" }}>{entry.month_label}</span></TableCell>
                        <TableCell>₹{entry.rent_amount}</TableCell>
                        <TableCell><span style={{ color: "#6b7280", fontSize: "0.8rem" }}>{entry.rent_due_date}</span></TableCell>
                        <TableCell>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <StatusBadge status={entry.rent_status} />
                            {entry.rent_paid_at && (
                              <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                                {new Date(entry.rent_paid_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.food_amount
                            ? `₹${entry.food_amount}`
                            : entry.food_status === "PENDING"
                            ? <span style={{ color: "#c2410c", fontSize: "0.78rem" }}>Pending</span>
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {entry.food_status === "NA" && entry.food_upcoming_month ? (
                            <span style={{ fontSize: "0.72rem", color: "#0891b2", background: "#f0f9ff", padding: "2px 8px", borderRadius: 20, border: "1px solid #bae6fd" }}>
                              Starts {new Date(entry.food_upcoming_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <StatusBadge status={entry.food_status} />
                              {entry.food_paid_at && (
                                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                                  {new Date(entry.food_paid_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {/* Rent online/cash actions */}
                            {bookingStatus === "ACTIVE" && currentLedger?.ledger_id === entry.id &&
                              (currentLedger?.action === "PAY_RENT" || currentLedger?.action === "PAY_BOTH") && (
                                <>
                                  <ActionBtn label="Pay Rent Online" variant="green" onClick={() => handlePayRent(entry)} />
                                  <ActionBtn
                                    label={offlineLoading === `RENT-${entry.id}` ? "Marking..." : "Mark Cash Paid"}
                                    disabled={offlineLoading === `RENT-${entry.id}`}
                                    onClick={() => handleMarkOfflineRent(entry)}
                                  />
                                </>
                              )}

                            {/* User confirms owner's mark */}
                            {bookingStatus === "ACTIVE" && entry.rent_status === "PENDING" &&
                              entry.rent_offline_confirmed_by_owner && !entry.rent_offline_confirmed_by_user && (
                                <ActionBtn
                                  label={offlineLoading === `CONFIRM-RENT-${entry.id}` ? "Confirming..." : "Confirm Cash Received"}
                                  variant="green"
                                  disabled={offlineLoading === `CONFIRM-RENT-${entry.id}`}
                                  onClick={() => handleConfirmOfflineRent(entry)}
                                />
                              )}

                            {/* Waiting messages */}
                            {entry.rent_offline_confirmed_by_owner && !entry.rent_offline_confirmed_by_user && entry.rent_status !== "PAID_OFFLINE" && (
                              <span style={{ fontSize: "0.72rem", color: "#c2410c" }}>Owner marked — confirm above</span>
                            )}
                            {entry.rent_offline_confirmed_by_user && !entry.rent_offline_confirmed_by_owner && entry.rent_status !== "PAID_OFFLINE" && (
                              <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>You marked — waiting for owner</span>
                            )}

                            {/* Food online/cash actions */}
                            {bookingStatus === "ACTIVE" && (
                              (currentLedger?.ledger_id === entry.id &&
                                (currentLedger?.action === "PAY_FOOD" || currentLedger?.action === "PAY_BOTH")) ||
                              (entry.food_status === "PENDING" && !entry.food_is_paid)
                            ) && (
                              <>
                                <ActionBtn label="Pay Food Online" variant="amber" onClick={() => handlePayFood(entry)} />
                                <ActionBtn
                                  label={offlineLoading === `FOOD-${entry.id}` ? "Marking..." : "Mark Food Cash"}
                                  disabled={offlineLoading === `FOOD-${entry.id}`}
                                  onClick={() => handleMarkOfflineFood(entry)}
                                />
                              </>
                            )}

                            {/* User confirms owner's food mark */}
                            {bookingStatus === "ACTIVE" && entry.food_status === "PENDING" &&
                              entry.food_offline_confirmed_by_owner && !entry.food_offline_confirmed_by_user && (
                                <ActionBtn
                                  label={offlineLoading === `CONFIRM-FOOD-${entry.id}` ? "Confirming..." : "Confirm Food Cash"}
                                  variant="green"
                                  disabled={offlineLoading === `CONFIRM-FOOD-${entry.id}`}
                                  onClick={() => handleConfirmOfflineFood(entry)}
                                />
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={
                            entry.overall_status === "PAID" ? "PAID_ONLINE"
                            : entry.overall_status === "PARTIAL" ? "PENDING"
                            : "OVERDUE"
                          } />
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}