import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserBookings } from "../services/bookingService";
import toast from "react-hot-toast";
import { getCurrentLedger } from "../services/paymentService";

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookingCount, setBookingCount] = useState(0);
  const [activeBooking, setActiveBooking] = useState(null);
  const [currentLedger, setCurrentLedger] = useState(null);

  useEffect(() => {
    getUserBookings()
      .then((data) => {
        const active = data.filter((b) => b.status === "ACTIVE");
        setBookingCount(active.length);
        if (active.length > 0) setActiveBooking(active[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeBooking) return;
    getCurrentLedger(activeBooking.id).then(setCurrentLedger).catch(() => {});
  }, [activeBooking]);

  const handlePaymentsClick = async () => {
    try {
      const bookings = await getUserBookings();
      const priorityBooking =
        bookings.find((b) => b.status === "ACTIVE") ||
        bookings.find((b) => b.status === "VACATED");
      if (!priorityBooking) { toast.error("No payment history found"); return; }
      navigate(`/user/payments/${priorityBooking.id}`);
    } catch {
      toast.error("Unable to open payments");
    }
  };

  const ledgerBadge = () => {
    if (!currentLedger || currentLedger.action === "WAIT") return null;
    const map = {
      NONE:     { label: "All payments done",   bg: "rgba(16,185,129,0.1)", color: "#059669", border: "#bbf7d0", icon: "bi-check-circle-fill" },
      PAY_RENT: { label: `Rent due ₹${currentLedger.rent_amount ?? "—"}`, bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", icon: "bi-exclamation-circle" },
      PAY_FOOD: { label: `Food due ₹${currentLedger.food_amount ?? "—"}`, bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", icon: "bi-exclamation-circle" },
      PAY_BOTH: { label: "Rent + Food due",      bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: "bi-exclamation-triangle-fill" },
    };
    const s = map[currentLedger.action];
    if (!s) return null;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        fontSize: "var(--sn-fs-xs)", fontWeight: 700,
        padding: "4px 12px", borderRadius: "var(--sn-radius-pill)",
      }}>
        <i className={`bi ${s.icon}`} style={{ fontSize: 11 }}></i>
        {s.label}
      </span>
    );
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
        style={{
          background: "var(--sn-surface)",
          borderRadius: "var(--sn-radius-sm)",
          border: "1px solid var(--sn-border)",
          padding: "22px 24px",
          boxShadow: "var(--sn-shadow-sm)",
          transition: "all var(--sn-speed) var(--sn-ease)",
          cursor: onClick ? "pointer" : "default",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );

  const IconBox = ({ icon }) => (
    <div style={{
      width: 44, height: 44, borderRadius: "var(--sn-radius-xs)",
      background: "var(--sn-primary-soft)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 14,
    }}>
      <i className={`bi ${icon}`} style={{ color: "var(--sn-primary)", fontSize: 20 }}></i>
    </div>
  );

  const CardLabel = ({ children }) => (
    <div style={{ fontSize: "var(--sn-fs-xs)", color: "var(--sn-text-soft)", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {children}
    </div>
  );

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
            Dashboard
          </p>
          <h2 style={{
            fontWeight: 800, color: "var(--sn-text)",
            marginBottom: 6, fontSize: "var(--sn-fs-2xl)",
            letterSpacing: "-0.3px",
          }}>
            Welcome back, {user?.full_name?.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "var(--sn-text-soft)", fontSize: "var(--sn-fs-sm)", margin: 0 }}>
            Here's what's happening with your stays today.
          </p>
        </div>

        <div className="row g-3">

          {/* Active Stays */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.06} onClick={() => navigate("/user/stays")}>
              <IconBox icon="bi-house" />
              <CardLabel>Active Stays</CardLabel>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--sn-text)", lineHeight: 1, marginBottom: 4 }}>
                {bookingCount}
              </div>
              <div style={{ color: "var(--sn-text-muted)", fontSize: "var(--sn-fs-xs)" }}>
                {bookingCount === 1 ? "Active stay" : "Active stays"}
                <i className="bi bi-arrow-right" style={{ marginLeft: 6, color: "var(--sn-primary)" }}></i>
              </div>
            </CardWrap>
          </div>

          {/* Payments */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.12} onClick={handlePaymentsClick}>
              <IconBox icon="bi-credit-card" />
              <CardLabel>Payments</CardLabel>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--sn-text)", lineHeight: 1, marginBottom: 4 }}>₹</div>
              <div style={{ color: "var(--sn-text-muted)", fontSize: "var(--sn-fs-xs)" }}>
                Rent, food & deposit
                <i className="bi bi-arrow-right" style={{ marginLeft: 6, color: "var(--sn-primary)" }}></i>
              </div>
            </CardWrap>
          </div>

          {/* Current Stay */}
          <div className="col-12 col-md-6 col-lg-4">
            <CardWrap delay={0.18} onClick={activeBooking ? () => navigate(`/browse-stays/${activeBooking.property}`) : () => navigate("/browse-stays")}>
              <IconBox icon="bi-geo-alt" />
              <CardLabel>Current Stay</CardLabel>
              {!activeBooking ? (
                <>
                  <div style={{ fontSize: "var(--sn-fs-sm)", fontWeight: 600, color: "var(--sn-text)", marginBottom: 4 }}>
                    No active stay
                  </div>
                  <div style={{ color: "var(--sn-primary)", fontSize: "var(--sn-fs-xs)", fontWeight: 600 }}>
                    Browse Stays <i className="bi bi-arrow-right"></i>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "var(--sn-fs-sm)", fontWeight: 700, color: "var(--sn-text)", marginBottom: 10, lineHeight: 1.3 }}>
                    {activeBooking.property_name}
                  </div>
                  {ledgerBadge()}
                </>
              )}
            </CardWrap>
          </div>

        </div>
      </div>
    </div>
  );
}