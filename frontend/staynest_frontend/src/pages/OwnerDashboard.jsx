import { useEffect, useState, useContext } from "react";
import { ownerDashboard } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { getOwnerProperties } from "../services/propertyService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getOwnerProfile } from "../services/ownerService";
import { activateOwnerPayments, getOwnerPaymentStatus, getOwnerTenantList } from "../services/paymentService";
import { getOwnerBookings } from "../services/bookingService";

export default function OwnerDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [propertyCount, setPropertyCount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [tenantStats, setTenantStats] = useState({ active: 0, vacated: 0 });
  const [pendingBookings, setPendingBookings] = useState(0);

  useEffect(() => { getOwnerProfile().then(setOwnerProfile); }, []);

  useEffect(() => {
    getOwnerPaymentStatus()
      .then(setPaymentStatus)
      .catch(() => {})
      .finally(() => setPaymentLoading(false));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ownerDashboard();
        setStatus(data.status);
        setMessage(data.message);
        const props = await getOwnerProperties();
        setPropertyCount(props.length);
      } catch (err) {
        setErrorMsg(err.response?.status === 401 ? "Unauthorized. Please login again." : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    getOwnerTenantList()
      .then((d) => setTenantStats({ active: d.active?.length || 0, vacated: d.vacated?.length || 0 }))
      .catch(() => {});
    getOwnerBookings()
      .then((d) => setPendingBookings(d.filter((b) => b.status === "PENDING").length))
      .catch(() => {});
  }, []);

  const handleActivatePayments = async () => {
    try {
      if (!isProfileComplete(ownerProfile)) {
        toast.error("Complete your profile before activating payments");
        navigate("/owner/profile/edit");
        return;
      }
      const res = await activateOwnerPayments();
      if (res.onboarding_url) {
        window.open(res.onboarding_url, "_blank");
        setTimeout(async () => {
          try { setPaymentStatus(await getOwnerPaymentStatus()); } catch {}
        }, 2000);
      } else if (res.status === "under_review") {
        toast.success("Account under review by Razorpay. You'll be notified once approved.");
        setPaymentStatus(await getOwnerPaymentStatus());
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Unable to activate payments");
    }
  };

  const isProfileComplete = (p) =>
    !!(p?.phone && p?.address && p?.city && p?.state && p?.postal_code &&
       p?.bank_account_number && p?.bank_ifsc_code && p?.bank_beneficiary_name);

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--sn-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }} className="sn-fade">
        <div className="spinner-border sn-pulse" style={{ color: "var(--sn-primary)", width: 36, height: 36 }}></div>
        <p style={{ color: "var(--sn-text-soft)", marginTop: 12, fontSize: "var(--sn-fs-sm)" }}>Loading dashboard...</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (errorMsg) return (
    <div style={{ minHeight: "100vh", background: "var(--sn-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="sn-reveal" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--sn-radius-sm)", padding: "24px 32px", color: "#dc2626" }}>
        {errorMsg}
      </div>
    </div>
  );

  /* ── Pending approval ── */
  if (status === "pending_admin_approval") return (
    <div style={{ minHeight: "100vh", background: "var(--sn-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="sn-reveal" style={{
        background: "var(--sn-surface)", borderRadius: "var(--sn-radius-md)",
        padding: "48px 56px", border: "1px solid var(--sn-border)",
        boxShadow: "var(--sn-shadow-md)", maxWidth: 440, textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#fff7ed", margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
        }}>⏳</div>
        <h5 style={{ fontWeight: 700, color: "var(--sn-text)", marginBottom: 8 }}>Account Under Review</h5>
        <p style={{ color: "var(--sn-text-soft)", fontSize: "var(--sn-fs-sm)", margin: 0, lineHeight: 1.7 }}>{message}</p>
      </div>
    </div>
  );

  /* ── Helpers ── */
  const cardBase = {
    background: "var(--sn-surface)",
    borderRadius: "var(--sn-radius-sm)",
    border: "1px solid var(--sn-border)",
    padding: "22px 24px",
    boxShadow: "var(--sn-shadow-sm)",
    transition: "all var(--sn-speed) var(--sn-ease)",
    height: "100%",
  };

  const CardWrap = ({ children, onClick, delay = 0 }) => (
    <div
      className="sn-reveal"
      style={{ animationDelay: `${delay}s`, height: "100%" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.querySelector(".card-inner").style.transform = "translateY(-4px)";
          e.currentTarget.querySelector(".card-inner").style.boxShadow = "var(--sn-shadow-md)";
          e.currentTarget.querySelector(".card-inner").style.borderColor = "var(--sn-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.querySelector(".card-inner").style.transform = "translateY(0)";
          e.currentTarget.querySelector(".card-inner").style.boxShadow = "var(--sn-shadow-sm)";
          e.currentTarget.querySelector(".card-inner").style.borderColor = "var(--sn-border)";
        }
      }}
    >
      <div
        className="card-inner"
        style={{ ...cardBase, cursor: onClick ? "pointer" : "default" }}
      >
        {children}
      </div>
    </div>
  );

  const IconBox = ({ icon, color = "var(--sn-primary)", bg = "var(--sn-primary-soft)" }) => (
    <div style={{
      width: 44, height: 44, borderRadius: "var(--sn-radius-xs)",
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 14, flexShrink: 0,
    }}>
      <i className={`bi ${icon}`} style={{ color, fontSize: 20 }}></i>
    </div>
  );

  const CardLabel = ({ children }) => (
    <div style={{ fontSize: "var(--sn-fs-xs)", color: "var(--sn-text-soft)", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {children}
    </div>
  );

  /* ── Main ── */
  return (
    <div className="sn-page-enter" style={{ background: "var(--sn-bg)", minHeight: "100vh", paddingTop: 32 }}>
      <div className="container py-4">

        {/* Header */}
        <div className="sn-reveal" style={{ marginBottom: 32 }}>
          <p style={{
            color: "var(--sn-primary)", fontWeight: 700,
            fontSize: "var(--sn-fs-xs)", marginBottom: 6,
            letterSpacing: "1px", textTransform: "uppercase",
          }}>
            Owner Dashboard
          </p>
          <h2 style={{
            fontWeight: 800, color: "var(--sn-text)",
            marginBottom: 6, fontSize: "var(--sn-fs-2xl)",
            letterSpacing: "-0.3px",
          }}>
            Welcome back, {user?.full_name?.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "var(--sn-text-soft)", fontSize: "var(--sn-fs-sm)", margin: 0 }}>
            Manage your properties, bookings and payments.
          </p>
        </div>

        {/* Cards grid */}
        <div className="row g-3">

          {/* Account Status */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.06}>
              <IconBox icon="bi-patch-check" />
              <CardLabel>Account Status</CardLabel>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(16,185,129,0.1)", color: "#059669",
                fontSize: "var(--sn-fs-xs)", fontWeight: 700,
                padding: "4px 12px", borderRadius: "var(--sn-radius-pill)",
                border: "1px solid #bbf7d0",
              }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: 11 }}></i> Approved
              </span>
            </CardWrap>
          </div>

          {/* Payment Setup */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.12}>
              <IconBox icon="bi-bank" />
              <CardLabel>Payment Setup</CardLabel>
              {paymentLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--sn-text-soft)", fontSize: "var(--sn-fs-sm)" }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: "var(--sn-primary)", width: 14, height: 14, borderWidth: 2 }}></div>
                  Checking...
                </div>
              ) : paymentStatus?.payments_enabled ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(16,185,129,0.1)", color: "#059669",
                  fontSize: "var(--sn-fs-xs)", fontWeight: 700,
                  padding: "4px 12px", borderRadius: "var(--sn-radius-pill)",
                  border: "1px solid #bbf7d0",
                }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: 11 }}></i> Active
                </span>
              ) : paymentStatus?.account_id ? (
                <div>
                  <span style={{
                    display: "inline-block",
                    background: "#fff7ed", color: "#c2410c",
                    fontSize: "var(--sn-fs-xs)", fontWeight: 700,
                    padding: "4px 12px", borderRadius: "var(--sn-radius-pill)",
                    marginBottom: 10, border: "1px solid #fed7aa",
                  }}>
                    KYC Pending
                  </span>
                  <br />
                  <button
                    onClick={handleActivatePayments}
                    style={{
                      border: "1px solid var(--sn-primary)", color: "var(--sn-primary)",
                      background: "transparent",
                      fontSize: "var(--sn-fs-xs)", fontWeight: 600,
                      borderRadius: "var(--sn-radius-xs)", padding: "5px 14px",
                      cursor: "pointer", transition: "all var(--sn-speed-fast)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sn-primary-soft)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Resume KYC
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ color: "var(--sn-text-soft)", fontSize: "var(--sn-fs-xs)", marginBottom: 10, lineHeight: 1.5 }}>
                    Enable payments to receive rent from tenants.
                  </div>
                  <button
                    onClick={handleActivatePayments}
                    style={{
                      background: "var(--sn-primary)", color: "#fff",
                      border: "none", borderRadius: "var(--sn-radius-xs)",
                      fontSize: "var(--sn-fs-xs)", fontWeight: 600,
                      padding: "6px 16px", cursor: "pointer",
                      transition: "all var(--sn-speed-fast)",
                      boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sn-primary-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sn-primary)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    Set up payments
                  </button>
                </div>
              )}
            </CardWrap>
          </div>

          {/* Live Stats */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.18}>
              <IconBox icon="bi-bar-chart-line" />
              <CardLabel>Live Stats</CardLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--sn-fs-sm)", color: "var(--sn-text-soft)" }}>Active Tenants</span>
                  <span style={{
                    fontWeight: 700, fontSize: "var(--sn-fs-sm)",
                    color: "#059669",
                    background: "rgba(16,185,129,0.08)",
                    padding: "2px 10px", borderRadius: "var(--sn-radius-pill)",
                  }}>{tenantStats.active}</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: pendingBookings > 0 ? "pointer" : "default" }}
                  onClick={() => pendingBookings > 0 && navigate("/owner/bookings")}
                >
                  <span style={{ fontSize: "var(--sn-fs-sm)", color: "var(--sn-text-soft)" }}>Pending Bookings</span>
                  <span style={{
                    fontWeight: 700, fontSize: "var(--sn-fs-sm)",
                    color: pendingBookings > 0 ? "#c2410c" : "var(--sn-text-soft)",
                    background: pendingBookings > 0 ? "#fff7ed" : "var(--sn-surface-soft)",
                    padding: "2px 10px", borderRadius: "var(--sn-radius-pill)",
                  }}>
                    {pendingBookings}
                    {pendingBookings > 0 && <i className="bi bi-arrow-right" style={{ marginLeft: 4, fontSize: 10 }}></i>}
                  </span>
                </div>
              </div>
            </CardWrap>
          </div>

          {/* Properties */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.24} onClick={() => navigate("/owner/properties")}>
              <IconBox icon="bi-building" />
              <CardLabel>Properties</CardLabel>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--sn-text)", lineHeight: 1, marginBottom: 4 }}>
                {propertyCount}
              </div>
              <div style={{ color: "var(--sn-text-muted)", fontSize: "var(--sn-fs-xs)" }}>
                {propertyCount === 1 ? "Property" : "Properties"} listed
                <i className="bi bi-arrow-right" style={{ marginLeft: 6, color: "var(--sn-primary)" }}></i>
              </div>
            </CardWrap>
          </div>

          {/* Booking Requests */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.30} onClick={() => navigate("/owner/bookings")}>
              <IconBox icon="bi-calendar2-check" />
              <CardLabel>Booking Requests</CardLabel>
              <div style={{ fontSize: "var(--sn-fs-sm)", color: "var(--sn-text)", fontWeight: 500, marginBottom: 4 }}>
                Review and respond to requests
              </div>
              {pendingBookings > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "#fef3c7", color: "#92400e",
                  fontSize: "var(--sn-fs-xs)", fontWeight: 700,
                  padding: "3px 10px", borderRadius: "var(--sn-radius-pill)",
                  border: "1px solid #fde68a",
                }}>
                  <i className="bi bi-clock" style={{ fontSize: 10 }}></i>
                  {pendingBookings} pending
                </span>
              )}
            </CardWrap>
          </div>

          {/* Payments */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.36} onClick={() => navigate("/owner/payments")}>
              <IconBox icon="bi-credit-card" />
              <CardLabel>Payments</CardLabel>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--sn-text)", lineHeight: 1, marginBottom: 4 }}>₹</div>
              <div style={{ color: "var(--sn-text-muted)", fontSize: "var(--sn-fs-xs)" }}>
                Rent ledger & history
                <i className="bi bi-arrow-right" style={{ marginLeft: 6, color: "var(--sn-primary)" }}></i>
              </div>
            </CardWrap>
          </div>

        </div>
      </div>
    </div>
  );
}