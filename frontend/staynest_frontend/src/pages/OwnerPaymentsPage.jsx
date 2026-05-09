import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  getOwnerLedger,
  markOfflinePayment,
  confirmOfflinePayment,
  markDepositOffline,
  ownerConfirmDepositPaid,
  ownerMarkDepositReturned,
  getOwnerFoodRequests,
  respondToFoodRequest,
  setOwnerRentDueDay,
  getOwnerDepositList,
  getOwnerTenantList,
  getOwnerTenantLedger,
  getOfflineRegister,
  updateOfflineRegister,
  getOfflineRegisterHistory,
  getOwnerUpcoming,
} from "../services/paymentService";
import {
  getTenantSlots,
  createTenantSlot,
  inviteTenant,
  deleteSlot,
} from "../services/bookingService";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

// ── Status helpers ──
const STATUS_COLORS = {
  PENDING: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  PAID_ONLINE: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0" },
  PAID_OFFLINE: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0" },
  PAID_CASH: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0" },
  OVERDUE: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  NA: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  WAIVED: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  UPCOMING: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
};

const STATUS_LABELS = {
  PENDING: "Pending", PAID_ONLINE: "Paid Online", PAID_OFFLINE: "Paid (Cash)",
  PAID_CASH: "Paid (Cash)", OVERDUE: "Overdue", NA: "N/A", WAIVED: "Waived",
  UPCOMING: "Upcoming",
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.NA;
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: "0.72rem", fontWeight: 600,
      padding: "2px 8px", borderRadius: 20,
      whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionBtn({ label, onClick, disabled, variant = "default", small = true }) {
  const variants = {
    green: { bg: "#10b981", color: "#fff", border: "#10b981", hover: "#059669" },
    red: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", hover: "#fee2e2" },
    amber: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", hover: "#ffedd5" },
    default: { bg: "#f8fafc", color: "#374151", border: "#e2e8f0", hover: "#f1f5f9" },
    outline: { bg: "#fff", color: "#374151", border: "#e2e8f0", hover: "#f8fafc" },
  };
  const v = variants[variant] || variants.default;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 10px" : "8px 14px",
        border: `1px solid ${v.border}`,
        borderRadius: 7,
        background: disabled ? "#f8fafc" : v.bg,
        color: disabled ? "#9ca3af" : v.color,
        fontSize: "0.76rem",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
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
    <div style={{
      background: "#fff", borderRadius: 12,
      border: "1px solid #e2e8f0",
      overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th style={{
      background: "#f8fafc", color: "#6b7280",
      fontSize: "0.75rem", fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.4px",
      padding: "10px 14px", borderBottom: "1px solid #e2e8f0",
      whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

function TableCell({ children, style }) {
  return (
    <td style={{
      padding: "10px 14px",
      fontSize: "0.85rem",
      color: "#374151",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
      ...style,
    }}>
      {children}
    </td>
  );
}

export default function OwnerPaymentsPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [foodRequests, setFoodRequests] = useState([]);
  const [dueDayInput, setDueDayInput] = useState(5);
  const [activeTab, setActiveTab] = useState("tenants");
  const [tenantSubTab, setTenantSubTab] = useState("all");
  const [offlineSubTab, setOfflineSubTab] = useState("register");
  const [tenantList, setTenantList] = useState({ active: [], vacated: [] });
  const [upcomingData, setUpcomingData] = useState(null);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [tenantDetail, setTenantDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthLedger, setMonthLedger] = useState([]);
  const [monthLoaded, setMonthLoaded] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [depositLoading, setDepositLoading] = useState(null);
  const [offlineLoading, setOfflineLoading] = useState(null);
  const [registerEntries, setRegisterEntries] = useState([]);
  const [registerMonth, setRegisterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [registerLoading, setRegisterLoading] = useState(null);
  const [selectedSlotHistory, setSelectedSlotHistory] = useState(null);
  const [slotHistory, setSlotHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotProperty, setSlotProperty] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [sharingId, setSharingId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [slotSearch, setSlotSearch] = useState("");
  const [slotPropertyDetail, setSlotPropertyDetail] = useState(null);

  // ConfirmModal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null });
  // Deposit return inline input
  const [returnInputOpen, setReturnInputOpen] = useState(null);
  const [returnAmount, setReturnAmount] = useState("");
  // Register deposit amount inline input
  const [depositAmountInput, setDepositAmountInput] = useState({});

  // ── Fetch functions (unchanged logic) ──
  const fetchProperties = async () => {
    try { const res = await api.get("/owner/properties/"); setProperties(res.data); }
    catch { toast.error("Unable to load properties"); }
  };

  const fetchTenantList = async (propertyId) => {
    try { const data = await getOwnerTenantList(propertyId || null); setTenantList(data); }
    catch { toast.error("Unable to load tenants"); }
  };

  const fetchUpcoming = async (propertyId) => {
    setUpcomingLoading(true);
    try { const data = await getOwnerUpcoming(propertyId || null); setUpcomingData(data); }
    catch { toast.error("Unable to load upcoming payments"); }
    finally { setUpcomingLoading(false); }
  };

  const fetchTenantDetail = async (bookingId) => {
    setDetailLoading(true);
    try { const data = await getOwnerTenantLedger(bookingId); setTenantDetail(data); }
    catch { toast.error("Unable to load tenant details"); }
    finally { setDetailLoading(false); }
  };

  const fetchMonthLedger = async (propertyId, month) => {
    try {
      const data = await getOwnerLedger(propertyId || null);
      const filtered = data.filter((e) => e.month.startsWith(month));
      filtered.sort((a, b) => {
        if (a.booking_status === "VACATED" && b.booking_status !== "VACATED") return 1;
        if (b.booking_status === "VACATED" && a.booking_status !== "VACATED") return -1;
        if (a.rent_status === "PENDING" && b.rent_status !== "PENDING") return -1;
        if (b.rent_status === "PENDING" && a.rent_status !== "PENDING") return 1;
        return 0;
      });
      setMonthLedger(filtered); setMonthLoaded(true);
    } catch { toast.error("Unable to load ledger"); }
  };

  const fetchFoodRequests = async () => {
    try { const data = await getOwnerFoodRequests(); setFoodRequests(data); }
    catch { toast.error("Unable to load food requests"); }
  };

  const fetchDeposits = async (propertyId) => {
    try { const data = await getOwnerDepositList(propertyId || null); setDeposits(data); }
    catch { toast.error("Unable to load deposits"); }
  };

  const fetchRegister = async (propertyId, month) => {
    try { const data = await getOfflineRegister(propertyId || null, month || null); setRegisterEntries(data); }
    catch { toast.error("Unable to load register"); }
  };

  const fetchSlotHistory = async (slotId) => {
    setHistoryLoading(true);
    try { const data = await getOfflineRegisterHistory(slotId); setSlotHistory(data); }
    catch { toast.error("Unable to load history"); }
    finally { setHistoryLoading(false); }
  };

  const fetchSlots = async (propertyId, search = "") => {
    if (!propertyId) { setSlots([]); return; }
    try { const data = await getTenantSlots(propertyId, search); setSlots(data); }
    catch { toast.error("Unable to load slots"); }
  };

  const fetchSlotPropertyDetail = async (propertyId) => {
    if (!propertyId) { setSlotPropertyDetail(null); return; }
    try { const res = await api.get(`/owner/properties/${propertyId}/`); setSlotPropertyDetail(res.data); }
    catch { toast.error("Unable to load property details"); }
  };

  // ── Effects ──
  useEffect(() => { fetchProperties(); fetchFoodRequests(); }, []);

  useEffect(() => {
    fetchTenantList(selectedProperty);
    fetchDeposits(selectedProperty);
    fetchRegister(selectedProperty, registerMonth);
    fetchUpcoming(selectedProperty);
    setSelectedBookingId(null); setTenantDetail(null);
    setMonthLoaded(false); setMonthLedger([]);
  }, [selectedProperty]);

  useEffect(() => { fetchRegister(selectedProperty, registerMonth); }, [registerMonth]);
  useEffect(() => { fetchSlots(slotProperty, slotSearch); fetchSlotPropertyDetail(slotProperty); }, [slotProperty]);

  // ── Handlers (unchanged logic) ──
  const handleMarkOffline = async (entry, type) => {
    const key = `${type}-${entry.id}`;
    if (offlineLoading === key) return;
    setOfflineLoading(key);
    const amount = type === "RENT" ? entry.rent_amount : entry.food_amount;
    try {
      await markOfflinePayment(entry.id, type, amount);
      toast.success(`Marked ${type.toLowerCase()} as cash received`);
      if (selectedBookingId) fetchTenantDetail(selectedBookingId);
      if (tenantSubTab === "month" && monthLoaded) fetchMonthLedger(selectedProperty, selectedMonth);
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setOfflineLoading(null); }
  };

  const handleConfirmOffline = async (entry, type) => {
    const key = `CONFIRM-${type}-${entry.id}`;
    if (offlineLoading === key) return;
    setOfflineLoading(key);
    try {
      await confirmOfflinePayment(entry.id, type);
      toast.success("Confirmed");
      if (selectedBookingId) fetchTenantDetail(selectedBookingId);
      if (tenantSubTab === "month" && monthLoaded) fetchMonthLedger(selectedProperty, selectedMonth);
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setOfflineLoading(null); }
  };

  const handleFoodResponse = async (reqId, action) => {
    try {
      await respondToFoodRequest(reqId, action);
      toast.success(action === "accept" ? "Food request accepted" : "Food request rejected");
      fetchFoodRequests();
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleSetDueDay = async () => {
    if (!dueDayInput || dueDayInput < 1 || dueDayInput > 28) { toast.error("Enter a day between 1 and 28"); return; }
    try { await setOwnerRentDueDay(dueDayInput); toast.success(`Rent due day set to ${dueDayInput}`); }
    catch (err) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleRegisterAction = async (entryId, action, extra = {}) => {
    const key = `${action}-${entryId}`;
    if (registerLoading === key) return;
    setRegisterLoading(key);
    try {
      const updated = await updateOfflineRegister(entryId, action, extra);
      setRegisterEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (selectedSlotHistory === updated.slot_id) fetchSlotHistory(updated.slot_id);
      toast.success("Updated");
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setRegisterLoading(null); }
  };

  // ── Tab config ──
  const TABS = [
    { key: "tenants", label: "Tenants", icon: "bi-people" },
    { key: "offline", label: "Offline Slots", icon: "bi-journal-text" },
    { key: "deposits", label: "Deposits", icon: "bi-shield" },
    { key: "food", label: "Food", icon: "bi-egg-fried", badge: foodRequests.length },
    { key: "settings", label: "Settings", icon: "bi-gear" },
  ];

  // ── Ledger table renderer ──
  const renderLedgerTable = (entries, showActions = true) => (
    <SectionCard style={{ marginTop: 16 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TableHeader>Month</TableHeader>
              <TableHeader>Rent</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader>Rent Status</TableHeader>
              <TableHeader>Food</TableHeader>
              <TableHeader>Food Status</TableHeader>
              {showActions && <TableHeader>Actions</TableHeader>}
              <TableHeader>Overall</TableHeader>
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
                      <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                        {new Date(entry.rent_paid_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{entry.food_amount ? `₹${entry.food_amount}` : "—"}</TableCell>
                <TableCell>
                  {entry.food_status === "NA" && entry.food_upcoming_month ? (
                    <span style={{ fontSize: "0.72rem", color: "#0891b2", background: "#f0f9ff", padding: "2px 8px", borderRadius: 20, border: "1px solid #bae6fd" }}>
                      Starts {new Date(entry.food_upcoming_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <StatusBadge status={entry.food_status} />
                      {entry.food_paid_at && (
                        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                          {new Date(entry.food_paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {entry.rent_status === "PENDING" && !entry.rent_offline_confirmed_by_owner && (
                        <ActionBtn label={offlineLoading === `RENT-${entry.id}` ? "Marking..." : "Mark Rent Cash"} disabled={offlineLoading === `RENT-${entry.id}`} onClick={() => handleMarkOffline(entry, "RENT")} />
                      )}
                      {entry.rent_offline_confirmed_by_user && !entry.rent_offline_confirmed_by_owner && entry.rent_status !== "PAID_OFFLINE" && (
                        <ActionBtn label={offlineLoading === `CONFIRM-RENT-${entry.id}` ? "Confirming..." : "Confirm Tenant Cash"} variant="green" disabled={offlineLoading === `CONFIRM-RENT-${entry.id}`} onClick={() => handleConfirmOffline(entry, "RENT")} />
                      )}
                      {entry.rent_offline_confirmed_by_owner && !entry.rent_offline_confirmed_by_user && entry.rent_status !== "PAID_OFFLINE" && (
                        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Waiting for tenant</span>
                      )}
                      {entry.food_status === "PENDING" && !entry.food_offline_confirmed_by_owner && (
                        <ActionBtn label={offlineLoading === `FOOD-${entry.id}` ? "Marking..." : "Mark Food Cash"} disabled={offlineLoading === `FOOD-${entry.id}`} onClick={() => handleMarkOffline(entry, "FOOD")} />
                      )}
                      {entry.food_offline_confirmed_by_user && !entry.food_offline_confirmed_by_owner && entry.food_status !== "PAID_OFFLINE" && (
                        <ActionBtn label={offlineLoading === `CONFIRM-FOOD-${entry.id}` ? "Confirming..." : "Confirm Food Cash"} variant="green" disabled={offlineLoading === `CONFIRM-FOOD-${entry.id}`} onClick={() => handleConfirmOffline(entry, "FOOD")} />
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <StatusBadge status={entry.overall_status === "PAID" ? "PAID_ONLINE" : entry.overall_status === "PARTIAL" ? "PENDING" : "OVERDUE"} />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );

  // ── Deposit card renderer ──
  const renderDepositCard = (dep, bookingId) => {
    if (!dep || !dep.deposit_amount) return null;
    return (
      <SectionCard style={{ marginTop: 16, padding: 20 }}>
        <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 16, fontSize: "0.9rem" }}>
          <i className="bi bi-shield me-2" style={{ color: "#10b981" }}></i>Security Deposit
        </h6>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>₹{dep.deposit_amount}</div>
            <div style={{ marginTop: 6 }}>
              {dep.deposit_status === "PENDING_RECEIPT" && <StatusBadge status="PENDING" />}
              {dep.deposit_status === "PENDING_CONFIRMATION" && dep.marked_by_user && !dep.marked_by_owner && (
                <span style={{ fontSize: "0.72rem", color: "#0891b2", background: "#f0f9ff", padding: "2px 8px", borderRadius: 20, border: "1px solid #bae6fd" }}>Tenant marked cash</span>
              )}
              {dep.deposit_status === "PENDING_CONFIRMATION" && dep.marked_by_owner && !dep.marked_by_user && (
                <span style={{ fontSize: "0.72rem", color: "#6b7280", background: "#f8fafc", padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>You marked — awaiting tenant</span>
              )}
              {dep.deposit_status === "HELD_BY_OWNER" && <StatusBadge status="PAID_ONLINE" />}
              {dep.deposit_status === "RETURN_MARKED" && <StatusBadge status="PENDING" />}
              {dep.deposit_status === "RETURNED" && <StatusBadge status="PAID_ONLINE" />}
              {dep.deposit_status === "PARTIAL_RETURNED" && (
                <span style={{ fontSize: "0.72rem", color: "#6b7280", background: "#f8fafc", padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>Partial ₹{dep.returned_amount}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dep.deposit_status === "PENDING_RECEIPT" && (
              <ActionBtn label={depositLoading === bookingId ? "Marking..." : "Mark Cash Received"} disabled={depositLoading === bookingId}
                onClick={async () => {
                  setDepositLoading(bookingId);
                  try { await markDepositOffline(bookingId, dep.deposit_amount); toast.success("Marked. Tenant will confirm."); fetchTenantDetail(bookingId); fetchDeposits(selectedProperty); }
                  catch (err) { toast.error(err.response?.data?.error || "Failed"); }
                  finally { setDepositLoading(null); }
                }}
              />
            )}
            {dep.deposit_status === "PENDING_CONFIRMATION" && dep.marked_by_user && !dep.marked_by_owner && (
              <ActionBtn label={depositLoading === bookingId ? "Confirming..." : "Confirm Tenant's Cash"} variant="green" disabled={depositLoading === bookingId}
                onClick={async () => {
                  setDepositLoading(bookingId);
                  try { await ownerConfirmDepositPaid(bookingId); toast.success("Deposit confirmed"); fetchTenantDetail(bookingId); fetchDeposits(selectedProperty); }
                  catch (err) { toast.error(err.response?.data?.error || "Failed"); }
                  finally { setDepositLoading(null); }
                }}
              />
            )}
            {dep.deposit_status === "HELD_BY_OWNER" && tenantDetail?.booking_status === "VACATED" && (
              <>
                {returnInputOpen !== bookingId ? (
                  <ActionBtn label="Mark Deposit Returned" onClick={() => { setReturnInputOpen(bookingId); setReturnAmount(dep.deposit_amount); }} />
                ) : (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="number"
                      value={returnAmount}
                      onChange={(e) => setReturnAmount(e.target.value)}
                      placeholder="Amount"
                      style={{ width: 90, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.82rem" }}
                    />
                    <ActionBtn label="Confirm" variant="green" disabled={depositLoading === bookingId}
                      onClick={async () => {
                        setDepositLoading(bookingId);
                        try { await ownerMarkDepositReturned(bookingId, returnAmount || undefined); toast.success("Return marked."); setReturnInputOpen(null); fetchTenantDetail(bookingId); fetchDeposits(selectedProperty); }
                        catch (err) { toast.error(err.response?.data?.error || "Failed"); }
                        finally { setDepositLoading(null); }
                      }}
                    />
                    <ActionBtn label="Cancel" onClick={() => setReturnInputOpen(null)} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SectionCard>
    );
  };

  // ── Tenant card renderer ──
  const renderTenantCard = (tenant, isVacated = false) => {
    const isSelected = selectedBookingId === tenant.booking_id;
    return (
      <div
        key={tenant.booking_id}
        onClick={() => { setSelectedBookingId(tenant.booking_id); fetchTenantDetail(tenant.booking_id); }}
        style={{
          background: isSelected ? "#f0fdf4" : "#fff",
          border: `1px solid ${isSelected ? "#10b981" : "#e2e8f0"}`,
          borderRadius: 10,
          padding: "14px 16px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          marginBottom: 8,
        }}
        onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.background = "#fafffe"; } }}
        onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{tenant.user_name}</div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 2 }}>{tenant.property_name} · {tenant.sharing_label}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {tenant.deposit_status === "PENDING_RECEIPT" && <StatusBadge status="PENDING" />}
            {tenant.deposit_status === "PENDING_CONFIRMATION" && (
              <span style={{ fontSize: "0.7rem", color: "#0891b2", background: "#f0f9ff", padding: "2px 8px", borderRadius: 20, border: "1px solid #bae6fd" }}>Deposit ⟳</span>
            )}
            {tenant.deposit_status === "HELD_BY_OWNER" && (
              <span style={{ fontSize: "0.7rem", color: "#059669", background: "#f0fdf4", padding: "2px 8px", borderRadius: 20, border: "1px solid #bbf7d0" }}>Deposit ✓</span>
            )}
            <span style={{
              fontSize: "0.7rem", fontWeight: 600,
              padding: "2px 8px", borderRadius: 20,
              background: isVacated ? "#f8fafc" : "#f0fdf4",
              color: isVacated ? "#64748b" : "#059669",
              border: `1px solid ${isVacated ? "#e2e8f0" : "#bbf7d0"}`,
            }}>
              {isVacated ? "Vacated" : "Active"}
            </span>
            <i className="bi bi-chevron-right" style={{ color: "#9ca3af", fontSize: 12 }}></i>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
<div className="sn-page-enter" style={{ background: "linear-gradient(180deg,#f8fafc,#ffffff)", minHeight: "100vh", paddingBottom: 80 }}>        <div className="container pt-5">

          {/* Back */}
          <button onClick={() => navigate("/owner/dashboard")}
            style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: "0.875rem", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#10b981"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
          >
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>

          {/* Header */}
          <div className="sn-reveal" style={{ marginBottom: 24 }}>
            <p style={{ color: "#10b981", fontWeight: 600, fontSize: "0.8rem", marginBottom: 2, letterSpacing: "0.5px" }}>PAYMENTS</p>
            <h2 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Manage Payments</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>Track rents, deposits, food and offline tenants</p>
          </div>

          {/* ── Main Tabs ── */}
          <div className="sn-reveal" style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedBookingId(null); setTenantDetail(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px",
                  border: `1px solid ${activeTab === tab.key ? "#10b981" : "#e2e8f0"}`,
                  borderRadius: 8,
                  background: activeTab === tab.key ? "#f0fdf4" : "#fff",
                  color: activeTab === tab.key ? "#059669" : "#6b7280",
                  fontSize: "0.875rem", fontWeight: activeTab === tab.key ? 600 : 400,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (activeTab !== tab.key) { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#059669"; } }}
                onMouseLeave={(e) => { if (activeTab !== tab.key) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#6b7280"; } }}
              >
                <i className={`bi ${tab.icon}`} style={{ fontSize: 14 }}></i>
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ background: "#10b981", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.68rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Property filter */}
          {["tenants", "deposits"].includes(activeTab) && (
            <div className="sn-reveal sn-delay-1" style={{ marginBottom: 16 }}>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151", background: "#fff", maxWidth: 280 }}
              >
                <option value="">All Properties</option>
                {properties.map((p) => (<option key={p.id} value={p.id}>{p.property_name}</option>))}
              </select>
            </div>
          )}

          {/* ══════════════════════════════════
              TENANTS TAB
          ══════════════════════════════════ */}
          {activeTab === "tenants" && (
            <div className="sn-reveal sn-delay-2">
              <>
                {/* Sub tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {[{ key: "all", label: "All Tenants" }, { key: "month", label: "By Month" }].map((st) => (
                    <button key={st.key} onClick={() => setTenantSubTab(st.key)}
                      style={{
                        padding: "6px 14px", border: `1px solid ${tenantSubTab === st.key ? "#10b981" : "#e2e8f0"}`,
                        borderRadius: 8, background: tenantSubTab === st.key ? "#f0fdf4" : "#fff",
                        color: tenantSubTab === st.key ? "#059669" : "#6b7280",
                        fontSize: "0.82rem", fontWeight: tenantSubTab === st.key ? 600 : 400, cursor: "pointer",
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Upcoming summary */}
                {upcomingData && (
                  <SectionCard style={{ marginBottom: 20, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <h6 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>
                          <i className="bi bi-calendar2 me-2" style={{ color: "#10b981" }}></i>
                          Upcoming — {upcomingData.month_label}
                        </h6>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ background: "#f8fafc", color: "#374151", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
                          {upcomingData.summary.total_tenants} tenants
                        </span>
                        <span style={{ background: "#f0fdf4", color: "#059669", fontSize: "0.78rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
                          ₹{upcomingData.summary.grand_total} total
                        </span>
                      </div>
                    </div>
                    {upcomingLoading && <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Loading...</div>}
                    {!upcomingLoading && upcomingData.tenants.length === 0 && (
                      <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No active tenants.</div>
                    )}
                    {!upcomingLoading && upcomingData.tenants.length > 0 && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Tenant", "Property", "Sharing", "Rent", "Food", "Total", "Due By", "Status"].map((h) => (
                                <TableHeader key={h}>{h}</TableHeader>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {upcomingData.tenants.map((t) => (
                              <tr key={t.booking_id} style={{ cursor: "pointer" }}
                                onClick={() => { setTenantSubTab("all"); setSelectedBookingId(t.booking_id); fetchTenantDetail(t.booking_id); }}
                              >
                                <TableCell><span style={{ fontWeight: 600 }}>{t.user_name}</span></TableCell>
                                <TableCell>{t.property_name}</TableCell>
                                <TableCell>{t.sharing_label}</TableCell>
                                <TableCell>₹{t.rent_amount}</TableCell>
                                <TableCell>{t.food_amount ? `₹${t.food_amount}` : "—"}</TableCell>
                                <TableCell><span style={{ fontWeight: 700 }}>₹{t.total}</span></TableCell>
                                <TableCell>
                                  <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                                    {new Date(t.rent_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={t.rent_status === "UPCOMING" ? "UPCOMING" : t.rent_status === "PENDING" ? "PENDING" : "PAID_ONLINE"} />
                                </TableCell>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: "#f8fafc" }}>
                              <TableCell style={{ fontWeight: 700 }} colSpan={3}>Total Expected</TableCell>
                              <TableCell style={{ fontWeight: 700 }}>₹{upcomingData.summary.total_rent}</TableCell>
                              <TableCell style={{ fontWeight: 700 }}>₹{upcomingData.summary.total_food}</TableCell>
                              <TableCell style={{ fontWeight: 700, color: "#10b981" }}>₹{upcomingData.summary.grand_total}</TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </SectionCard>
                )}

                {/* Pending deposit summary */}
                {(() => {
                  const activeCount = tenantList.active.length;
                  if (activeCount === 0) return null;
                  const pendingCount = tenantList.active.filter(t => ["PENDING_RECEIPT", "PENDING_CONFIRMATION"].includes(t.deposit_status)).length;
                  return pendingCount > 0 ? (
                    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "#c2410c" }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {pendingCount} active tenant{pendingCount > 1 ? "s have" : " has"} pending deposits
                    </div>
                  ) : (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "#059669" }}>
                      <i className="bi bi-check-circle me-2"></i>All deposits confirmed ✓
                    </div>
                  );
                })()}

                {/* ── ALL TENANTS ── */}
                {tenantSubTab === "all" && (
                  <div className="row g-3">
                    <div className={selectedBookingId ? "col-12 col-md-4" : "col-12"}>
                      {tenantList.active.length === 0 && tenantList.vacated.length === 0 && (
                        <SectionCard style={{ padding: 40, textAlign: "center" }}>
                          <i className="bi bi-people" style={{ color: "#10b981", fontSize: 32, marginBottom: 12, display: "block" }}></i>
                          <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>No tenants found</div>
                        </SectionCard>
                      )}
                      {tenantList.active.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                            Active Tenants ({tenantList.active.length})
                          </div>
                          {tenantList.active.map((t) => renderTenantCard(t, false))}
                        </>
                      )}
                      {tenantList.vacated.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, marginTop: 20 }}>
                            Vacated Tenants ({tenantList.vacated.length})
                          </div>
                          {tenantList.vacated.map((t) => renderTenantCard(t, true))}
                        </>
                      )}
                    </div>

                    {selectedBookingId && (
                      <div className="col-12 col-md-8">
                        {detailLoading && (
                          <div style={{ textAlign: "center", padding: 40 }}>
                            <div className="spinner-border" style={{ color: "#10b981", width: 28, height: 28 }}></div>
                          </div>
                        )}
                        {!detailLoading && tenantDetail && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                              <div>
                                <h5 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>{tenantDetail.user_name}</h5>
                                <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: 0 }}>
                                  {tenantDetail.property_name} · {tenantDetail.sharing_label}
                                </p>
                              </div>
                              <button onClick={() => { setSelectedBookingId(null); setTenantDetail(null); }}
                                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", fontSize: "0.8rem", color: "#6b7280", cursor: "pointer" }}>
                                ✕ Close
                              </button>
                            </div>
                            {renderDepositCard(tenantDetail.deposit, tenantDetail.booking_id)}
                            {tenantDetail.ledger.length === 0 ? (
                              <SectionCard style={{ padding: 32, textAlign: "center", marginTop: 16 }}>
                                <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>No payment records yet</div>
                              </SectionCard>
                            ) : (
                              renderLedgerTable(tenantDetail.ledger, tenantDetail.booking_status === "ACTIVE")
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── BY MONTH ── */}
                {tenantSubTab === "month" && (
                  <>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                      <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151" }}
                      />
                      <button onClick={() => fetchMonthLedger(selectedProperty, selectedMonth)}
                        style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                        Load
                      </button>
                    </div>
                    {!monthLoaded && (
                      <SectionCard style={{ padding: 32, textAlign: "center" }}>
                        <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Select a month and click Load</div>
                      </SectionCard>
                    )}
                    {monthLoaded && monthLedger.length === 0 && (
                      <SectionCard style={{ padding: 32, textAlign: "center" }}>
                        <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No records for this month</div>
                      </SectionCard>
                    )}
                    {monthLoaded && monthLedger.filter(e => e.booking_status !== "VACATED").length > 0 && (
                      <>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Active Tenants</div>
                        <SectionCard>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>{["Tenant", "Sharing", "Rent", "Rent Status", "Food", "Food Status", "Actions", "Overall"].map(h => <TableHeader key={h}>{h}</TableHeader>)}</tr>
                              </thead>
                              <tbody>
                                {monthLedger.filter(e => e.booking_status !== "VACATED").map((entry) => (
                                  <tr key={entry.id} style={{ cursor: "pointer" }}
                                    onClick={() => { setTenantSubTab("all"); setSelectedBookingId(entry.booking_id); fetchTenantDetail(entry.booking_id); }}
                                  >
                                    <TableCell><span style={{ fontWeight: 600 }}>{entry.user_name}</span></TableCell>
                                    <TableCell>{entry.sharing_label}</TableCell>
                                    <TableCell>₹{entry.rent_amount}</TableCell>
                                    <TableCell><StatusBadge status={entry.rent_status} /></TableCell>
                                    <TableCell>{entry.food_amount ? `₹${entry.food_amount}` : "—"}</TableCell>
                                    <TableCell>
                                      {entry.food_status === "NA" && entry.food_upcoming_month ? (
                                        <span style={{ fontSize: "0.72rem", color: "#0891b2" }}>Starts {new Date(entry.food_upcoming_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                                      ) : <StatusBadge status={entry.food_status} />}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {entry.rent_status === "PENDING" && !entry.rent_offline_confirmed_by_owner && (
                                          <ActionBtn label={offlineLoading === `RENT-${entry.id}` ? "..." : "Mark Cash"} disabled={offlineLoading === `RENT-${entry.id}`} onClick={() => handleMarkOffline(entry, "RENT")} />
                                        )}
                                        {entry.rent_offline_confirmed_by_user && !entry.rent_offline_confirmed_by_owner && entry.rent_status !== "PAID_OFFLINE" && (
                                          <ActionBtn label={offlineLoading === `CONFIRM-RENT-${entry.id}` ? "..." : "Confirm"} variant="green" disabled={offlineLoading === `CONFIRM-RENT-${entry.id}`} onClick={() => handleConfirmOffline(entry, "RENT")} />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <StatusBadge status={entry.overall_status === "PAID" ? "PAID_ONLINE" : entry.overall_status === "PARTIAL" ? "PENDING" : "OVERDUE"} />
                                    </TableCell>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </SectionCard>
                      </>
                    )}
                    {monthLoaded && monthLedger.filter(e => e.booking_status === "VACATED").length > 0 && (
                      <>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, marginTop: 20 }}>Vacated</div>
                        <SectionCard>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>{["Tenant", "Sharing", "Rent Status", "Overall"].map(h => <TableHeader key={h}>{h}</TableHeader>)}</tr>
                              </thead>
                              <tbody>
                                {monthLedger.filter(e => e.booking_status === "VACATED").map((entry) => (
                                  <tr key={entry.id}>
                                    <TableCell>{entry.user_name}</TableCell>
                                    <TableCell>{entry.sharing_label}</TableCell>
                                    <TableCell><StatusBadge status={entry.rent_status} /></TableCell>
                                    <TableCell><StatusBadge status={entry.overall_status === "PAID" ? "PAID_ONLINE" : "OVERDUE"} /></TableCell>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </SectionCard>
                      </>
                    )}
                  </>
                )}
              </>
            </div>
          )}


          {/* ══════════════════════════════════
              OFFLINE SLOTS TAB
          ══════════════════════════════════ */}
          {activeTab === "offline" && (
            <div className="sn-reveal sn-delay-2">
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {[{ key: "register", label: "Register Book" }, { key: "manage", label: "Manage Slots" }].map((st) => (
                    <button key={st.key} onClick={() => setOfflineSubTab(st.key)}
                      style={{
                        padding: "6px 14px", border: `1px solid ${offlineSubTab === st.key ? "#10b981" : "#e2e8f0"}`,
                        borderRadius: 8, background: offlineSubTab === st.key ? "#f0fdf4" : "#fff",
                        color: offlineSubTab === st.key ? "#059669" : "#6b7280",
                        fontSize: "0.82rem", fontWeight: offlineSubTab === st.key ? 600 : 400, cursor: "pointer",
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* ── REGISTER BOOK ── */}
                {offlineSubTab === "register" && (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                      <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151", background: "#fff" }}>
                        <option value="">All Properties</option>
                        {properties.map((p) => (<option key={p.id} value={p.id}>{p.property_name}</option>))}
                      </select>
                      <input type="month" value={registerMonth} onChange={(e) => setRegisterMonth(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151" }}
                      />
                      <ActionBtn label="Refresh" onClick={() => fetchRegister(selectedProperty, registerMonth)} />
                    </div>

                    <div className="row g-3">
                      <div className={selectedSlotHistory ? "col-12 col-md-4" : "col-12"}>
                        {registerEntries.length === 0 && (
                          <SectionCard style={{ padding: 48, textAlign: "center" }}>
                            <i className="bi bi-journal-text" style={{ color: "#10b981", fontSize: 36, display: "block", marginBottom: 12 }}></i>
                            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>No offline tenants</div>
                            <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>Add slots from the Manage Slots tab</div>
                          </SectionCard>
                        )}
                        {registerEntries.map((entry) => {
                          const isSelected = selectedSlotHistory === entry.slot_id;
                          return (
                            <div key={entry.id}
                              onClick={() => { if (isSelected) { setSelectedSlotHistory(null); setSlotHistory([]); } else { setSelectedSlotHistory(entry.slot_id); fetchSlotHistory(entry.slot_id); } }}
                              style={{
                                background: isSelected ? "#f0fdf4" : "#fff",
                                border: `1px solid ${isSelected ? "#10b981" : "#e2e8f0"}`,
                                borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                                transition: "all 0.15s ease", marginBottom: 8,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{entry.tenant_name}</div>
                                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>{entry.property_name} · {entry.sharing_label} · {entry.month_label}</div>
                                </div>
                                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                  <StatusBadge status={entry.rent_status === "PAID_CASH" ? "PAID_CASH" : entry.rent_status === "WAIVED" ? "WAIVED" : "PENDING"} />
                                  {entry.deposit_status === "PENDING" && <StatusBadge status="PENDING" />}
                                  {entry.deposit_status === "HELD" && <span style={{ fontSize: "0.7rem", color: "#059669", background: "#f0fdf4", padding: "2px 8px", borderRadius: 20, border: "1px solid #bbf7d0" }}>Dep ✓</span>}
                                  <i className="bi bi-chevron-right" style={{ color: "#9ca3af", fontSize: 12 }}></i>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedSlotHistory && (() => {
                        const entry = registerEntries.find(e => e.slot_id === selectedSlotHistory);
                        if (!entry) return null;
                        return (
                          <div className="col-12 col-md-8">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                              <div>
                                <h5 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>{entry.tenant_name}</h5>
                                <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: 0 }}>{entry.property_name} · {entry.sharing_label}</p>
                              </div>
                              <button onClick={() => { setSelectedSlotHistory(null); setSlotHistory([]); }}
                                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", fontSize: "0.8rem", color: "#6b7280", cursor: "pointer" }}>
                                ✕ Close
                              </button>
                            </div>

                            {/* Rent */}
                            <SectionCard style={{ padding: 16, marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>Rent ₹{entry.rent_amount}</span>
                                  <StatusBadge status={entry.rent_status === "PAID_CASH" ? "PAID_CASH" : entry.rent_status === "WAIVED" ? "WAIVED" : "PENDING"} />
                                  {entry.rent_paid_date && <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{new Date(entry.rent_paid_date).toLocaleDateString()}</span>}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {entry.rent_status === "PENDING" && (
                                    <>
                                      <ActionBtn label="Mark Paid" variant="green" disabled={registerLoading === `mark_rent_paid-${entry.id}`} onClick={() => handleRegisterAction(entry.id, "mark_rent_paid")} />
                                      <ActionBtn label="Waive" disabled={registerLoading === `waive_rent-${entry.id}`} onClick={() => handleRegisterAction(entry.id, "waive_rent")} />
                                    </>
                                  )}
                                  {(entry.rent_status === "PAID_CASH" || entry.rent_status === "WAIVED") && (
                                    <ActionBtn label="Undo" variant="amber" disabled={registerLoading === `mark_rent_pending-${entry.id}`} onClick={() => handleRegisterAction(entry.id, "mark_rent_pending")} />
                                  )}
                                </div>
                              </div>
                            </SectionCard>

                            {/* Food */}
                            <SectionCard style={{ padding: 16, marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>Food {entry.food_opted ? `₹${entry.food_amount || "—"}` : "(not subscribed)"}</span>
                                  {entry.food_opted && <StatusBadge status={entry.food_status === "PAID_CASH" ? "PAID_CASH" : entry.food_status === "WAIVED" ? "WAIVED" : "PENDING"} />}
                                  {entry.food_paid_date && <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{new Date(entry.food_paid_date).toLocaleDateString()}</span>}
                                </div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <ActionBtn
                                    label={entry.food_opted ? "Remove Food" : "Add Food"}
                                    variant={entry.food_opted ? "red" : "green"}
                                    disabled={registerLoading === `toggle_food-${entry.id}`}
                                    onClick={() => handleRegisterAction(entry.id, "toggle_food")}
                                  />
                                  {entry.food_opted && entry.food_status === "PENDING" && (
                                    <>
                                      <ActionBtn label="Mark Paid" variant="green" disabled={registerLoading === `mark_food_paid-${entry.id}`} onClick={() => handleRegisterAction(entry.id, "mark_food_paid")} />
                                      <ActionBtn label="Waive" disabled={registerLoading === `waive_food-${entry.id}`} onClick={() => handleRegisterAction(entry.id, "waive_food")} />
                                    </>
                                  )}
                                  {entry.food_opted && (entry.food_status === "PAID_CASH" || entry.food_status === "WAIVED") && (
                                    <ActionBtn label="Undo" variant="amber" disabled={registerLoading === `mark_food_pending-${entry.id}`} onClick={() => handleRegisterAction(entry.id, "mark_food_pending")} />
                                  )}
                                </div>
                              </div>
                            </SectionCard>

                            {/* Deposit */}
                            <SectionCard style={{ padding: 16, marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>
                                    Deposit {entry.deposit_amount ? `₹${entry.deposit_amount}` : "(not set)"}
                                  </span>
                                  {entry.deposit_status && <StatusBadge status={entry.deposit_status === "HELD" ? "PAID_CASH" : entry.deposit_status === "RETURNED" ? "PAID_ONLINE" : "PENDING"} />}
                                </div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                  {(!entry.deposit_status || entry.deposit_status === "PENDING") && (
                                    <>
                                      {depositAmountInput[entry.id] !== undefined ? (
                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                          <input
                                            type="number"
                                            value={depositAmountInput[entry.id]}
                                            onChange={(e) => setDepositAmountInput(prev => ({ ...prev, [entry.id]: e.target.value }))}
                                            placeholder="₹ Amount"
                                            style={{ width: 90, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.82rem" }}
                                          />
                                          <ActionBtn label="Save" variant="green"
                                            disabled={registerLoading === `mark_deposit_held-${entry.id}`}
                                            onClick={() => {
                                              handleRegisterAction(entry.id, "mark_deposit_held", { deposit_amount: depositAmountInput[entry.id] || entry.deposit_amount });
                                              setDepositAmountInput(prev => { const n = { ...prev }; delete n[entry.id]; return n; });
                                            }}
                                          />
                                          <ActionBtn label="Cancel" onClick={() => setDepositAmountInput(prev => { const n = { ...prev }; delete n[entry.id]; return n; })} />
                                        </div>
                                      ) : (
                                        <ActionBtn label="Mark Received"
                                          onClick={() => {
                                            if (entry.deposit_amount) {
                                              handleRegisterAction(entry.id, "mark_deposit_held", { deposit_amount: entry.deposit_amount });
                                            } else {
                                              setDepositAmountInput(prev => ({ ...prev, [entry.id]: "" }));
                                            }
                                          }}
                                        />
                                      )}
                                    </>
                                  )}
                                  {entry.deposit_status === "HELD" && (
                                    <>
                                      {returnInputOpen === `reg-${entry.id}` ? (
                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                          <input type="number" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)}
                                            placeholder={`Full: ₹${entry.deposit_amount}`}
                                            style={{ width: 100, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.82rem" }}
                                          />
                                          <ActionBtn label="Confirm" variant="green"
                                            disabled={registerLoading === `mark_deposit_returned-${entry.id}`}
                                            onClick={() => { handleRegisterAction(entry.id, "mark_deposit_returned", { returned_amount: returnAmount }); setReturnInputOpen(null); }}
                                          />
                                          <ActionBtn label="Cancel" onClick={() => setReturnInputOpen(null)} />
                                        </div>
                                      ) : (
                                        <ActionBtn label="Mark Returned" onClick={() => { setReturnInputOpen(`reg-${entry.id}`); setReturnAmount(entry.deposit_amount); }} />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </SectionCard>

                            {/* Notes */}
                            <SectionCard style={{ padding: 16, marginBottom: 10 }}>
                              <input type="text" className="form-control form-control-sm" placeholder="Add a note..."
                                defaultValue={entry.notes}
                                onBlur={(e) => { if (e.target.value !== entry.notes) handleRegisterAction(entry.id, "update_notes", { notes: e.target.value }); }}
                                style={{ fontSize: "0.85rem", border: "1px solid #e2e8f0", borderRadius: 7 }}
                              />
                            </SectionCard>

                            {/* History */}
                            {/* ── Deposit (one-time, shown once above history) ── */}
                            {(() => {
                              const latestWithDeposit = slotHistory.find(h => h.deposit_amount);
                              if (!latestWithDeposit) return null;
                              const ds = latestWithDeposit.deposit_status;
                              const depositColor = ds === "HELD" ? { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0", label: "Held ✓" }
                                : ds === "RETURNED" ? { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Returned ✓" }
                                  : ds === "PARTIAL_RETURNED" ? { bg: "#f8fafc", color: "#475569", border: "#e2e8f0", label: `Partial ₹${latestWithDeposit.deposit_returned_amount}` }
                                    : { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Pending" };
                              return (
                                <SectionCard style={{ padding: 16, marginBottom: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <i className="bi bi-shield-check" style={{ color: "#10b981", fontSize: 16 }}></i>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Security Deposit</div>
                                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>₹{latestWithDeposit.deposit_amount}</div>
                                      </div>
                                    </div>
                                    <span style={{
                                      background: depositColor.bg, color: depositColor.color,
                                      border: `1px solid ${depositColor.border}`,
                                      fontSize: "0.72rem", fontWeight: 600,
                                      padding: "4px 12px", borderRadius: 20,
                                    }}>
                                      {depositColor.label}
                                    </span>
                                  </div>
                                </SectionCard>
                              );
                            })()}

                            {/* ── Payment History (monthly, NO deposit rows) ── */}
                            <SectionCard style={{ padding: 20 }}>
                              <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 16, fontSize: "0.9rem" }}>
                                <i className="bi bi-clock-history me-2" style={{ color: "#10b981" }}></i>Payment History
                              </h6>
                              {historyLoading && (
                                <div style={{ textAlign: "center", padding: 20 }}>
                                  <div className="spinner-border" style={{ color: "#10b981", width: 24, height: 24 }}></div>
                                </div>
                              )}
                              {!historyLoading && slotHistory.length === 0 && (
                                <div style={{ textAlign: "center", padding: 20, color: "#9ca3af", fontSize: "0.85rem" }}>No past records yet</div>
                              )}
                              {!historyLoading && slotHistory.map((h, idx) => (
                                <div key={h.id} style={{
                                  display: "flex", gap: 14, paddingBottom: idx < slotHistory.length - 1 ? 20 : 0,
                                  marginBottom: idx < slotHistory.length - 1 ? 20 : 0,
                                  borderBottom: idx < slotHistory.length - 1 ? "1px solid #f1f5f9" : "none",
                                }}>
                                  {/* Timeline dot */}
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                    <div style={{
                                      width: 34, height: 34, borderRadius: 10,
                                      background: h.rent_status === "PAID_CASH" ? "#f0fdf4" : h.rent_status === "WAIVED" ? "#f8fafc" : "#fff7ed",
                                      border: `1px solid ${h.rent_status === "PAID_CASH" ? "#bbf7d0" : h.rent_status === "WAIVED" ? "#e2e8f0" : "#fed7aa"}`,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                      <i className={`bi ${h.rent_status === "PAID_CASH" ? "bi-check-lg" : h.rent_status === "WAIVED" ? "bi-dash" : "bi-hourglass"}`}
                                        style={{ fontSize: 14, color: h.rent_status === "PAID_CASH" ? "#059669" : h.rent_status === "WAIVED" ? "#94a3b8" : "#c2410c" }}>
                                      </i>
                                    </div>
                                    {idx < slotHistory.length - 1 && (
                                      <div style={{ width: 1, flex: 1, background: "#e2e8f0", marginTop: 6 }}></div>
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div style={{ flex: 1, paddingTop: 6 }}>
                                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", marginBottom: 10 }}>
                                      {h.month_label}
                                    </div>

                                    {/* Rent row */}
                                    <div style={{
                                      display: "flex", justifyContent: "space-between", alignItems: "center",
                                      background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginBottom: 6,
                                    }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="bi bi-house" style={{ color: "#10b981", fontSize: 13 }}></i>
                                        <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 500 }}>Rent</span>
                                        <span style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: 700 }}>₹{h.rent_amount}</span>
                                      </div>
                                      <StatusBadge status={h.rent_status === "PAID_CASH" ? "PAID_CASH" : h.rent_status === "WAIVED" ? "WAIVED" : "PENDING"} />
                                    </div>

                                    {/* Food row — only if opted */}
                                    {h.food_opted && (
                                      <div style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
                                      }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <i className="bi bi-egg-fried" style={{ color: "#10b981", fontSize: 13 }}></i>
                                          <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 500 }}>Food</span>
                                          {h.food_amount && <span style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: 700 }}>₹{h.food_amount}</span>}
                                        </div>
                                        <StatusBadge status={h.food_status === "PAID_CASH" ? "PAID_CASH" : h.food_status === "WAIVED" ? "WAIVED" : "PENDING"} />
                                      </div>
                                    )}

                                    {h.notes && (
                                      <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                        <i className="bi bi-sticky" style={{ color: "#94a3b8" }}></i>{h.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </SectionCard>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* ── MANAGE SLOTS ── */}
                {offlineSubTab === "manage" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <select value={slotProperty} onChange={(e) => setSlotProperty(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151", background: "#fff", maxWidth: 280 }}>
                        <option value="">Select a Property</option>
                        {properties.map((p) => (<option key={p.id} value={p.id}>{p.property_name}</option>))}
                      </select>
                    </div>

                    {!slotProperty && (
                      <SectionCard style={{ padding: 48, textAlign: "center" }}>
                        <i className="bi bi-building" style={{ color: "#10b981", fontSize: 32, display: "block", marginBottom: 12 }}></i>
                        <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Select a property to manage offline slots</div>
                      </SectionCard>
                    )}

                    {slotProperty && (
                      <>
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                          <input type="text" placeholder="Search by tenant name..." value={slotSearch}
                            onChange={(e) => setSlotSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchSlots(slotProperty, slotSearch)}
                            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151", maxWidth: 260 }}
                          />
                          <ActionBtn label="Search" onClick={() => fetchSlots(slotProperty, slotSearch)} />
                          {slotSearch && <ActionBtn label="Clear" onClick={() => { setSlotSearch(""); fetchSlots(slotProperty, ""); }} />}
                          <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{
                              marginLeft: "auto", padding: "8px 16px",
                              background: showCreateForm ? "#fef2f2" : "#f0fdf4",
                              color: showCreateForm ? "#dc2626" : "#059669",
                              border: `1px solid ${showCreateForm ? "#fecaca" : "#bbf7d0"}`,
                              borderRadius: 8, fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                            }}
                          >
                            {showCreateForm ? "✕ Close" : "+ Add New Slot"}
                          </button>
                        </div>

                        {showCreateForm && (
                          <SectionCard style={{ padding: 20, marginBottom: 16 }}>
                            <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 16, fontSize: "0.9rem" }}>Create Offline Tenant Slot</h6>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
                              <input type="text" placeholder="Tenant Name" value={tenantName} onChange={(e) => setTenantName(e.target.value)}
                                style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem" }}
                              />
                              <select value={sharingId} onChange={(e) => setSharingId(e.target.value)}
                                style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151", background: "#fff" }}>
                                <option value="">Select Sharing Option</option>
                                {slotPropertyDetail?.sharing_options?.map((o) => (
                                  <option key={o.id} value={o.id}>{o.sharing_type}-Sharing (Available: {o.available_beds})</option>
                                ))}
                              </select>
                              <ActionBtn label="Create Slot" variant="green" small={false}
                                onClick={async () => {
                                  if (!tenantName.trim()) { toast.error("Enter tenant name"); return; }
                                  if (!sharingId) { toast.error("Select a sharing option"); return; }
                                  try {
                                    await createTenantSlot({ property: slotProperty, sharing_option: sharingId, tenant_name: tenantName });
                                    toast.success("Tenant slot created");
                                    setTenantName(""); setSharingId(""); setShowCreateForm(false);
                                    fetchSlots(slotProperty, slotSearch); fetchSlotPropertyDetail(slotProperty);
                                    fetchRegister(selectedProperty, registerMonth);
                                  } catch { toast.error("Unable to create slot"); }
                                }}
                              />
                            </div>
                          </SectionCard>
                        )}

                        {slots.length === 0 && (
                          <SectionCard style={{ padding: 32, textAlign: "center" }}>
                            <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                              {slotSearch ? `No results for "${slotSearch}"` : "No offline tenants yet. Add one above."}
                            </div>
                          </SectionCard>
                        )}

                        {slots.map((slot) => (
                          <div key={slot.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{slot.tenant_name}</div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                                  {slotPropertyDetail?.sharing_options?.find(o => o.id == slot.sharing_option)?.sharing_type}-Sharing · Offline
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <ActionBtn label="Generate Invite"
                                  onClick={async () => {
                                    try {
                                      const res = await inviteTenant(slot.id);
                                      navigator.clipboard.writeText(res.data.token);
                                      toast.success("Invite token copied to clipboard");
                                    } catch { toast.error("Unable to generate invite"); }
                                  }}
                                />
                                <ActionBtn label="Delete" variant="red"
                                  onClick={() => setConfirmModal({
                                    open: true,
                                    title: "Delete Slot",
                                    message: `Delete slot for "${slot.tenant_name}"? This will remove their register entries.`,
                                    onConfirm: async () => {
                                      setConfirmModal(p => ({ ...p, open: false }));
                                      try {
                                        await deleteSlot(slot.id);
                                        toast.success("Slot deleted");
                                        fetchSlots(slotProperty, slotSearch);
                                        fetchSlotPropertyDetail(slotProperty);
                                        fetchRegister(selectedProperty, registerMonth);
                                      } catch (err) { toast.error(err.response?.data?.error || "Cannot delete slot"); }
                                    },
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            </div>
          )}

          {/* ══════════════════════════════════
              DEPOSITS TAB
          ══════════════════════════════════ */}
          {activeTab === "deposits" && (
            <div className="sn-reveal sn-delay-2">
              <>
                {deposits.length === 0 && (
                  <SectionCard style={{ padding: 48, textAlign: "center" }}>
                    <i className="bi bi-shield" style={{ color: "#10b981", fontSize: 32, display: "block", marginBottom: 12 }}></i>
                    <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>No deposit records found</div>
                  </SectionCard>
                )}

                {deposits.filter(d => d.booking_status !== "VACATED").length > 0 && (
                  <>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Active Tenants</div>
                    <SectionCard style={{ marginBottom: 24 }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>{["Tenant", "Property", "Amount", "Status", "Actions"].map(h => <TableHeader key={h}>{h}</TableHeader>)}</tr>
                          </thead>
                          <tbody>
                            {deposits.filter(d => d.booking_status !== "VACATED")
                              .sort((a, b) => ({ PENDING_RECEIPT: 0, PENDING_CONFIRMATION: 1, HELD_BY_OWNER: 2 }[a.deposit_status] ?? 3) - ({ PENDING_RECEIPT: 0, PENDING_CONFIRMATION: 1, HELD_BY_OWNER: 2 }[b.deposit_status] ?? 3))
                              .map((dep) => (
                                <tr key={dep.booking_id}>
                                  <TableCell><span style={{ fontWeight: 600 }}>{dep.user_name}</span></TableCell>
                                  <TableCell>{dep.property_name}</TableCell>
                                  <TableCell>₹{dep.deposit_amount}</TableCell>
                                  <TableCell>
                                    {dep.deposit_status === "PENDING_RECEIPT" && <StatusBadge status="PENDING" />}
                                    {dep.deposit_status === "PENDING_CONFIRMATION" && dep.marked_by_user && !dep.marked_by_owner && (
                                      <span style={{ fontSize: "0.72rem", color: "#0891b2", background: "#f0f9ff", padding: "2px 8px", borderRadius: 20, border: "1px solid #bae6fd" }}>Tenant marked cash</span>
                                    )}
                                    {dep.deposit_status === "PENDING_CONFIRMATION" && dep.marked_by_owner && !dep.marked_by_user && (
                                      <span style={{ fontSize: "0.72rem", color: "#6b7280", background: "#f8fafc", padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>You marked — waiting tenant</span>
                                    )}
                                    {dep.deposit_status === "HELD_BY_OWNER" && <StatusBadge status="PAID_ONLINE" />}
                                  </TableCell>
                                  <TableCell>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {dep.deposit_status === "PENDING_RECEIPT" && (
                                        <ActionBtn label={depositLoading === dep.booking_id ? "Marking..." : "Mark Cash Received"} disabled={depositLoading === dep.booking_id}
                                          onClick={async () => {
                                            setDepositLoading(dep.booking_id);
                                            try { await markDepositOffline(dep.booking_id, dep.deposit_amount); toast.success("Marked. Tenant will confirm."); fetchDeposits(selectedProperty); }
                                            catch (err) { toast.error(err.response?.data?.error || "Failed"); }
                                            finally { setDepositLoading(null); }
                                          }}
                                        />
                                      )}
                                      {dep.deposit_status === "PENDING_CONFIRMATION" && dep.marked_by_user && !dep.marked_by_owner && (
                                        <ActionBtn label={depositLoading === dep.booking_id ? "Confirming..." : "Confirm Tenant's Cash"} variant="green" disabled={depositLoading === dep.booking_id}
                                          onClick={async () => {
                                            setDepositLoading(dep.booking_id);
                                            try { await ownerConfirmDepositPaid(dep.booking_id); toast.success("Deposit confirmed"); fetchDeposits(selectedProperty); }
                                            catch (err) { toast.error(err.response?.data?.error || "Failed"); }
                                            finally { setDepositLoading(null); }
                                          }}
                                        />
                                      )}
                                    </div>
                                  </TableCell>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  </>
                )}

                {deposits.filter(d => d.booking_status === "VACATED").length > 0 && (
                  <>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Vacated — Deposit Returns</div>
                    <SectionCard>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>{["Tenant", "Property", "Amount", "Status", "Actions"].map(h => <TableHeader key={h}>{h}</TableHeader>)}</tr>
                          </thead>
                          <tbody>
                            {deposits.filter(d => d.booking_status === "VACATED")
                              .sort((a, b) => ({ RETURN_MARKED: 0, HELD_BY_OWNER: 1, RETURNED: 2, PARTIAL_RETURNED: 3 }[a.deposit_status] ?? 4) - ({ RETURN_MARKED: 0, HELD_BY_OWNER: 1, RETURNED: 2, PARTIAL_RETURNED: 3 }[b.deposit_status] ?? 4))
                              .map((dep) => (
                                <tr key={dep.booking_id}>
                                  <TableCell><span style={{ fontWeight: 600 }}>{dep.user_name}</span></TableCell>
                                  <TableCell>{dep.property_name}</TableCell>
                                  <TableCell>₹{dep.deposit_amount}</TableCell>
                                  <TableCell>
                                    {dep.deposit_status === "HELD_BY_OWNER" && <StatusBadge status="PAID_CASH" />}
                                    {dep.deposit_status === "RETURN_MARKED" && <span style={{ fontSize: "0.72rem", color: "#c2410c", background: "#fff7ed", padding: "2px 8px", borderRadius: 20, border: "1px solid #fed7aa" }}>Return marked</span>}
                                    {dep.deposit_status === "RETURNED" && <StatusBadge status="PAID_ONLINE" />}
                                    {dep.deposit_status === "PARTIAL_RETURNED" && <span style={{ fontSize: "0.72rem", color: "#6b7280", background: "#f8fafc", padding: "2px 8px", borderRadius: 20, border: "1px solid #e2e8f0" }}>Partial ₹{dep.returned_amount}</span>}
                                  </TableCell>
                                  <TableCell>
                                    {dep.deposit_status === "HELD_BY_OWNER" && (
                                      <>
                                        {returnInputOpen === dep.booking_id ? (
                                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                            <input type="number" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)}
                                              placeholder={`Full: ₹${dep.deposit_amount}`}
                                              style={{ width: 100, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.82rem" }}
                                            />
                                            <ActionBtn label="Confirm" variant="green" disabled={depositLoading === dep.booking_id}
                                              onClick={async () => {
                                                setDepositLoading(dep.booking_id);
                                                try { await ownerMarkDepositReturned(dep.booking_id, returnAmount || undefined); toast.success("Return marked."); setReturnInputOpen(null); fetchDeposits(selectedProperty); }
                                                catch (err) { toast.error(err.response?.data?.error || "Failed"); }
                                                finally { setDepositLoading(null); }
                                              }}
                                            />
                                            <ActionBtn label="Cancel" onClick={() => setReturnInputOpen(null)} />
                                          </div>
                                        ) : (
                                          <ActionBtn label="Mark Returned" onClick={() => { setReturnInputOpen(dep.booking_id); setReturnAmount(dep.deposit_amount); }} />
                                        )}
                                      </>
                                    )}
                                  </TableCell>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  </>
                )}
              </>
            </div>
          )}

          {/* ══════════════════════════════════
              FOOD REQUESTS TAB
          ══════════════════════════════════ */}
          {activeTab === "food" && (
            <div className="sn-reveal sn-delay-2">
              <>
                {foodRequests.length === 0 && (
                  <SectionCard style={{ padding: 48, textAlign: "center" }}>
                    <i className="bi bi-egg-fried" style={{ color: "#10b981", fontSize: 32, display: "block", marginBottom: 12 }}></i>
                    <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>No pending food requests</div>
                    <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>Food subscription requests from tenants will appear here</div>
                  </SectionCard>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {foodRequests.map((req) => (
                    <SectionCard key={req.id} style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{req.user_name}</div>
                          <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>{req.property_name}</div>
                          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{
                              fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                              background: req.request_type === "OPT_IN" ? "#f0fdf4" : "#fef2f2",
                              color: req.request_type === "OPT_IN" ? "#059669" : "#dc2626",
                              border: `1px solid ${req.request_type === "OPT_IN" ? "#bbf7d0" : "#fecaca"}`,
                            }}>
                              {req.request_type === "OPT_IN" ? "Start Food" : "Cancel Food"}
                            </span>
                            {req.effective_from_month && (
                              <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                                from {new Date(req.effective_from_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                              </span>
                            )}
                            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                              {new Date(req.requested_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <ActionBtn label="Accept" variant="green" onClick={() => handleFoodResponse(req.id, "accept")} />
                          <ActionBtn label="Reject" variant="red" onClick={() => handleFoodResponse(req.id, "reject")} />
                        </div>
                      </div>
                    </SectionCard>
                  ))}
                </div>
              </>
            </div>
          )}

          {/* ══════════════════════════════════
              SETTINGS TAB
          ══════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="sn-reveal sn-delay-2">
              <SectionCard style={{ padding: 24, maxWidth: 480 }}>
                <h6 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Rent Due Day</h6>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 16 }}>Set which day of the month rent is due (1–28).</p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="number" min={1} max={28} value={dueDayInput} onChange={(e) => setDueDayInput(Number(e.target.value))}
                    style={{ width: 80, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.875rem", color: "#374151" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>of each month</span>
                  <ActionBtn label="Save" variant="green" small={false} onClick={handleSetDueDay} />
                </div>
              </SectionCard>
            </div>
          )}

        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(p => ({ ...p, open: false }))}
      />
    </>
  );
}