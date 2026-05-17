import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOwnerBookings,
  approveBooking,
  rejectBooking,
  approveVacate,
} from "../services/bookingService";
import { ownerMarkDepositReturned } from "../services/paymentService";
import api from "../services/api";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_CONFIG = {
  PENDING: { label: "Pending", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", icon: "bi-hourglass-split" },
  APPROVED_AWAITING_PAYMENT: { label: "Awaiting Payment", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "bi-credit-card" },
  CONFIRMED: { label: "Confirmed", bg: "#ecfdf5", color: "#059669", border: "#bbf7d0", icon: "bi-patch-check" },
  ACTIVE: { label: "Active", bg: "#ecfdf5", color: "#059669", border: "#bbf7d0", icon: "bi-house-check" },
  VACATED: { label: "Vacated", bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", icon: "bi-box-arrow-right" },
  CANCELLED: { label: "Cancelled", bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: "bi-x-circle" },
  REJECTED: { label: "Rejected", bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: "bi-slash-circle" },
};

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED_AWAITING_PAYMENT", label: "Awaiting Payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ACTIVE", label: "Active" },
  { value: "VACATED", label: "Vacated" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OwnerPropertyBookingPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [property, setProperty] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [vacateTarget, setVacateTarget] = useState(null);
  const [depositTarget, setDepositTarget] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  // Polling refs
  const pollRef = useRef(null);
  const appliedSearchRef = useRef("");
  const appliedStatusRef = useRef("");

  // Keep refs in sync
  useEffect(() => { appliedSearchRef.current = appliedSearch; }, [appliedSearch]);
  useEffect(() => { appliedStatusRef.current = appliedStatus; }, [appliedStatus]);

  useEffect(() => { loadData(); }, [propertyId, appliedSearch, appliedStatus]);

  // Polling — 45s silent refresh
  useEffect(() => {
    const silentPoll = async () => {
      if (document.hidden) return;
      try {
        const [propertyRes, bookingRes] = await Promise.all([
          api.get(`/owner/properties/${propertyId}/`),
          getOwnerBookings(propertyId, appliedSearchRef.current, appliedStatusRef.current),
        ]);
        setProperty(propertyRes.data);
        setBookings(bookingRes || []);
      } catch { /* silent */ }
    };

    pollRef.current = setInterval(silentPoll, 45000);
    const handleVisibility = () => { if (!document.hidden) silentPoll(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [propertyId]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setPageLoading(true);
      const [propertyRes, bookingRes] = await Promise.all([
        api.get(`/owner/properties/${propertyId}/`),
        getOwnerBookings(propertyId, appliedSearch, appliedStatus),
      ]);
      setProperty(propertyRes.data);
      setBookings(bookingRes || []);
    } catch {
      if (!silent) toast.error("Unable to load bookings");
    } finally {
      if (!silent) setPageLoading(false);
    }
  };

  const handleSearch = () => { setAppliedSearch(searchInput); setAppliedStatus(statusInput); };
  const handleClear = () => { setSearchInput(""); setStatusInput(""); setAppliedSearch(""); setAppliedStatus(""); };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  // Optimistic approve
  const handleApprove = async () => {
    const id = approveTarget;
    setApproveTarget(null);
    setActionLoading(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "APPROVED_AWAITING_PAYMENT" } : b));
    try {
      await approveBooking(id);
      toast.success("Booking approved");
      loadData(true);
    } catch {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "PENDING" } : b));
      toast.error("Cannot approve booking");
    } finally { setActionLoading(null); }
  };

  // Optimistic reject
  const handleReject = async () => {
    const id = rejectTarget;
    setRejectTarget(null);
    setActionLoading(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b));
    try {
      await rejectBooking(id);
      toast.success("Booking rejected");
      loadData(true);
    } catch {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "PENDING" } : b));
      toast.error("Cannot reject booking");
    } finally { setActionLoading(null); }
  };

  // Optimistic vacate
  const handleVacate = async () => {
    const id = vacateTarget;
    setVacateTarget(null);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "VACATED" } : b));
    try {
      await approveVacate(id);
      toast.success("Vacate approved");
      loadData(true);
    } catch {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "ACTIVE", user_vacate_requested: true } : b));
      toast.error("Cannot approve vacate");
    }
  };

  const handleDeposit = async () => {
    const id = depositTarget;
    setDepositTarget(null);
    try {
      await ownerMarkDepositReturned(id, depositAmount || undefined);
      toast.success("Deposit marked returned");
      setDepositAmount("");
      loadData(true);
    } catch { toast.error("Cannot mark deposit returned"); }
  };

  const btn = (variant = "outline") => {
    const map = {
      green: { bg: "#10b981", color: "#fff", border: "#10b981" },
      red: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
      blue: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      outline: { bg: "#fff", color: "#374151", border: "#e2e8f0" },
    }[variant];
    return { padding: "9px 14px", border: `1px solid ${map.border}`, borderRadius: 12, background: map.bg, color: map.color, fontSize: ".84rem", fontWeight: 600, cursor: "pointer", transition: "all .2s ease" };
  };

  if (pageLoading) {
    return (
      <div style={page} className="sn-page-enter">
        <div className="container py-5 text-center" style={{ paddingTop: 120 }}>
          <div className="spinner-border text-success mb-3" />
          <p style={muted}>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={page} className="sn-page-enter">
      <div className="container py-4">

        {/* Back */}
        <button onClick={() => navigate("/owner/bookings")} style={backBtn}>
          <i className="bi bi-arrow-left" /> Back to Properties
        </button>

        {/* Header */}
        <div style={hero} className="sn-reveal">
          <div>
            <div style={tag}>BOOKING MANAGEMENT</div>
            <h2 style={heroTitle}>{property?.property_name || "Property"}</h2>
            <p style={heroText}>
              <i className="bi bi-geo-alt me-1" />
              {[property?.city, property?.state].filter(Boolean).join(", ")}
            </p>
          </div>
          {pendingCount > 0 && (
            <span style={pendingPill}>
              <i className="bi bi-hourglass-split me-1" />{pendingCount} Pending
            </span>
          )}
        </div>

        {/* Filters */}
        <div style={filterCard} className="sn-reveal sn-delay-1">
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search tenant name..."
              style={input}
            />
          </div>
          <select value={statusInput} onChange={(e) => setStatusInput(e.target.value)} style={select}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={handleSearch} style={primaryBtn}>Search</button>
          {(appliedSearch || appliedStatus) && (
            <button onClick={handleClear} style={secondaryBtn}>Clear</button>
          )}
        </div>

        {/* Empty */}
        {bookings.length === 0 && (
          <div style={emptyCard} className="sn-reveal sn-delay-2">
            <i className="bi bi-calendar-x" style={{ fontSize: 40, color: "#cbd5e1", marginBottom: 12 }} />
            <h6 style={{ fontWeight: 800, color: "#0f172a" }}>No bookings found</h6>
            <p style={muted}>Try changing search or filters.</p>
          </div>
        )}

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bookings.map((b, i) => {
            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.CANCELLED;
            return (
              <div
                key={b.id}
                className={`sn-reveal sn-delay-${i + 1 > 5 ? 5 : i + 1}`}
                style={bookingCard}
              >
                <div style={topRow}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={avatar}>{b.user_name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{b.user_name}</div>
                      <div style={mutedSmall}>
                        <i className="bi bi-people me-1" />{b.sharing_label}
                      </div>
                    </div>
                  </div>
                  <span style={{ ...pill, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    <i className={`bi ${sc.icon} me-1`} />{sc.label}
                  </span>
                </div>

                <div style={actionWrap}>
                  {["PENDING", "APPROVED_AWAITING_PAYMENT", "CONFIRMED", "ACTIVE"].includes(b.status) && (
                    <button
                      style={btn()}
                      onClick={async () => {
                        try {
                          await api.get(`/accounts/public/user/${b.user}/`);
                          navigate(`/owner/view-user/${b.user}`);
                        } catch { toast.error("Profile access not allowed"); }
                      }}
                    >
                      <i className="bi bi-person me-1" />View Profile
                    </button>
                  )}

                  {b.status === "PENDING" && (
                    <>
                      <button style={btn("green")} disabled={actionLoading === b.id} onClick={() => setApproveTarget(b.id)}>
                        <i className="bi bi-check-circle me-1" />Approve
                      </button>
                      <button style={btn("red")} disabled={actionLoading === b.id} onClick={() => setRejectTarget(b.id)}>
                        <i className="bi bi-x-circle me-1" />Reject
                      </button>
                    </>
                  )}

                  {b.status === "ACTIVE" && b.user_vacate_requested && (
                    <button style={btn("red")} onClick={() => setVacateTarget(b.id)}>
                      <i className="bi bi-door-open me-1" />Approve Vacate
                    </button>
                  )}

                  {b.status === "VACATED" && b.deposit_status && !["RETURN_MARKED", "RETURNED", "PARTIAL_RETURNED"].includes(b.deposit_status) && (
                    <button style={btn("green")} onClick={() => { setDepositTarget(b.id); setDepositAmount(""); }}>
                      <i className="bi bi-cash me-1" />Mark Deposit Returned
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm modals */}
      <ConfirmModal
        open={!!approveTarget}
        title="Approve Booking"
        message="Approve this booking request?"
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />
      <ConfirmModal
        open={!!rejectTarget}
        title="Reject Booking"
        message="Reject this booking request?"
        confirmLabel="Reject"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
      <ConfirmModal
        open={!!vacateTarget}
        title="Approve Vacate"
        message="This action will vacate the tenant."
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleVacate}
        onCancel={() => setVacateTarget(null)}
      />

      {/* Deposit modal */}
      {depositTarget && (
        <>
          <div onClick={() => setDepositTarget(null)} style={overlay} />
          <div style={modalWrap}>
            <div style={modalCard} className="sn-page-enter">
              <div style={{ fontSize: 34, textAlign: "center", marginBottom: 12 }}>💰</div>
              <h5 style={{ textAlign: "center", fontWeight: 800 }}>Mark Deposit Returned</h5>
              <p style={{ ...muted, textAlign: "center", marginBottom: 18 }}>Leave blank for full return.</p>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount ₹"
                style={{ ...input, marginBottom: 14 }}
              />
              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={handleDeposit} style={primaryBtn}>Confirm</button>
                <button onClick={() => setDepositTarget(null)} style={secondaryBtn}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* styles */
const page = { minHeight: "100vh", background: "linear-gradient(180deg,#f8fafc,#ffffff)" };
const hero = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 24, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, boxShadow: "0 10px 24px rgba(15,23,42,.05)" };
const heroTitle = { margin: "4px 0", fontWeight: 800, color: "#0f172a" };
const heroText = { margin: 0, color: "#64748b" };
const tag = { color: "#10b981", fontWeight: 800, fontSize: ".74rem", letterSpacing: ".08em" };
const backBtn = { border: "none", background: "transparent", color: "#64748b", padding: 0, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 };
const filterCard = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap" };
const input = { width: "100%", height: 44, border: "1px solid #e2e8f0", borderRadius: 12, padding: "0 14px 0 38px", background: "#f8fafc" };
const select = { height: 44, minWidth: 180, border: "1px solid #e2e8f0", borderRadius: 12, padding: "0 12px", background: "#f8fafc" };
const primaryBtn = { height: 44, border: "none", borderRadius: 12, padding: "0 16px", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 700 };
const secondaryBtn = { height: 44, border: "1px solid #e2e8f0", borderRadius: 12, padding: "0 16px", background: "#fff", color: "#374151" };
const bookingCard = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 20, boxShadow: "0 10px 22px rgba(15,23,42,.04)" };
const topRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 };
const avatar = { width: 42, height: 42, borderRadius: "50%", background: "rgba(16,185,129,.08)", color: "#10b981", display: "grid", placeItems: "center", fontWeight: 800 };
const muted = { color: "#64748b", margin: 0 };
const mutedSmall = { color: "#64748b", fontSize: ".84rem" };
const actionWrap = { display: "flex", gap: 8, flexWrap: "wrap" };
const pill = { padding: "5px 12px", borderRadius: 999, fontSize: ".75rem", fontWeight: 700 };
const pendingPill = { padding: "6px 12px", borderRadius: 999, background: "#fff7ed", color: "#c2410c", fontWeight: 700, fontSize: ".78rem" };
const emptyCard = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 46, textAlign: "center", marginBottom: 18 };
const overlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)", zIndex: 1050 };
const modalWrap = { position: "fixed", inset: 0, zIndex: 1051, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const modalCard = { width: "100%", maxWidth: 380, background: "#fff", borderRadius: 18, padding: 26, boxShadow: "0 24px 64px rgba(0,0,0,.18)" };