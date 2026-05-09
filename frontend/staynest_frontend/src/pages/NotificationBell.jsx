import {
  useEffect,
  useState,
  useContext,
  useRef,
} from "react";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../services/paymentService";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } =
    useContext(AuthContext);

  const isOwner =
    user?.role === "owner";

  const [notifs, setNotifs] =
    useState([]);
  const [open, setOpen] =
    useState(false);

  const wrapperRef =
    useRef(null);

  const fetchNotifs =
    async () => {
      try {
        const data =
          await getNotifications();
        setNotifs(data);
      } catch {}
    };

  useEffect(() => {
    fetchNotifs();

    const interval =
      setInterval(
        fetchNotifs,
        60000
      );

    return () =>
      clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick =
      (e) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(
            e.target
          )
        ) {
          setOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  const unread =
    notifs.filter(
      (n) => !n.is_read
    ).length;

  const togglePanel =
    async () => {
      const next = !open;
      setOpen(next);

      if (
        next &&
        unread > 0
      ) {
        try {
          await markAllNotificationsRead();

          setNotifs((prev) =>
            prev.map((n) => ({
              ...n,
              is_read: true,
            }))
          );
        } catch {}
      }
    };

  const routeNotif = (
    notif
  ) => {
    setOpen(false);

    const type =
      notif.type;
    const bookingId =
      notif.booking_id;
    const propertyId =
      notif.property_id_ref;

    if (isOwner) {
      if (
        type ===
          "BOOKING_CREATED" ||
        type ===
          "VACATE_REQUESTED"
      ) {
        navigate(
          propertyId
            ? `/owner/bookings/${propertyId}`
            : "/owner/bookings"
        );
        return;
      }

      if (
        [
          "FOOD_REQUEST",
          "FOOD_CANCELLED",
          "PAYMENT_RECEIVED",
          "OFFLINE_MARK",
          "OFFLINE_CONFIRMED",
          "DEPOSIT_RECEIVED",
          "DEPOSIT_RETURNED",
          "BOOKING_ACTIVE",
        ].includes(type)
      ) {
        navigate(
          "/owner/payments"
        );
        return;
      }

      navigate(
        "/owner/dashboard"
      );
      return;
    }

    if (
      [
        "PAYMENT_DUE",
        "PAYMENT_RECEIVED",
        "OFFLINE_MARK",
        "OFFLINE_CONFIRMED",
        "DEPOSIT_RECEIVED",
        "DEPOSIT_RETURNED",
      ].includes(type) &&
      bookingId
    ) {
      navigate(
        `/user/payments/${bookingId}`
      );
      return;
    }

    navigate("/user/stays");
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position:
          "relative",
      }}
    >
      {/* Bell */}
      <button
        onClick={
          togglePanel
        }
        aria-label="Notifications"
        style={
          bellBtn
        }
      >
        <i className="bi bi-bell-fill" />

        {unread > 0 && (
          <span
            style={
              badge
            }
          >
            {unread > 9
              ? "9+"
              : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={
            panel
          }
        >
          {/* Header */}
          <div
            style={
              header
            }
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize:
                    ".95rem",
                  color:
                    "#0f172a",
                }}
              >
                Notifications
              </div>

              <div
                style={{
                  fontSize:
                    ".76rem",
                  color:
                    "#64748b",
                  marginTop: 2,
                }}
              >
                Recent updates
              </div>
            </div>

            <button
              onClick={() =>
                setOpen(
                  false
                )
              }
              style={
                closeBtn
              }
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              maxHeight: 420,
              overflowY:
                "auto",
            }}
          >
            {notifs.length ===
              0 && (
              <div
                style={{
                  padding:
                    "40px 20px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    background:
                      "#f8fafc",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    margin:
                      "0 auto 12px",
                    color:
                      "#94a3b8",
                  }}
                >
                  <i className="bi bi-bell" />
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color:
                      "#0f172a",
                    fontSize:
                      ".9rem",
                  }}
                >
                  No notifications
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color:
                      "#64748b",
                    fontSize:
                      ".8rem",
                  }}
                >
                  You're all
                  caught up.
                </div>
              </div>
            )}

            {notifs.map(
              (n) => (
                <button
                  key={
                    n.id
                  }
                  onClick={() =>
                    routeNotif(
                      n
                    )
                  }
                  style={{
                    width:
                      "100%",
                    border:
                      "none",
                    background:
                      n.is_read
                        ? "#fff"
                        : "#f0fdf4",
                    textAlign:
                      "left",
                    padding:
                      "14px 16px",
                    borderBottom:
                      "1px solid #f1f5f9",
                    cursor:
                      "pointer",
                    transition:
                      "all .16s ease",
                  }}
                  onMouseEnter={(
                    e
                  ) => {
                    e.currentTarget.style.background =
                      "#f8fafc";
                  }}
                  onMouseLeave={(
                    e
                  ) => {
                    e.currentTarget.style.background =
                      n.is_read
                        ? "#fff"
                        : "#f0fdf4";
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "flex-start",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius:
                          "50%",
                        background:
                          n.is_read
                            ? "#cbd5e1"
                            : "#10b981",
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight:
                            n.is_read
                              ? 700
                              : 800,
                          color:
                            "#0f172a",
                          fontSize:
                            ".86rem",
                          marginBottom: 4,
                        }}
                      >
                        {n.title}
                      </div>

                      <div
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            ".78rem",
                          lineHeight: 1.55,
                        }}
                      >
                        {n.message
                          .length >
                        95
                          ? n.message.slice(
                              0,
                              95
                            ) +
                            "..."
                          : n.message}
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          color:
                            "#94a3b8",
                          fontSize:
                            ".72rem",
                          fontWeight: 600,
                        }}
                      >
                        {new Date(
                          n.created_at
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const bellBtn = {
  width: 42,
  height: 42,
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background:
    "linear-gradient(180deg,#ffffff,#f8fafc)",
  display: "grid",
  placeItems: "center",
  color: "#475569",
  fontSize: 17,
  cursor: "pointer",
  boxShadow:
    "0 8px 18px rgba(15,23,42,.05)",
};

const badge = {
  position: "absolute",
  top: -4,
  right: -4,
  minWidth: 18,
  height: 18,
  borderRadius: 999,
  background: "#10b981",
  color: "#fff",
  fontSize: ".64rem",
  fontWeight: 800,
  display: "grid",
  placeItems: "center",
  padding: "0 4px",
  border: "2px solid #fff",
};

const panel = {
  position: "absolute",
  top: "115%",
  right: 0,
  width: 360,
  maxWidth: "92vw",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  overflow: "hidden",
  boxShadow:
    "0 24px 60px rgba(15,23,42,.14)",
  zIndex: 999,
};

const header = {
  padding: "16px 18px",
  borderBottom:
    "1px solid #f1f5f9",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
};

const closeBtn = {
  width: 34,
  height: 34,
  border: "none",
  borderRadius: 12,
  background: "#f8fafc",
  color: "#475569",
  cursor: "pointer",
};