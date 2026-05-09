const STATUS_META = {
  DRAFT: { label: "Draft", bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  SUBMITTED: { label: "Under Review", bg: "#fffbeb", color: "#92400e", dot: "#f59e0b" },
  REJECTED: { label: "Rejected", bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  APPROVED: { label: "Approved", bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6" },
  ACTIVE: { label: "Live", bg: "#f0fdf4", color: "#065f46", dot: "#10b981" },
  INACTIVE: { label: "Hidden", bg: "#f8fafc", color: "#475569", dot: "#94a3b8" },
};

export default function PropertyCard({
  property,
  onClick,
  onView,
  onEdit,
  onToggle,
  onDelete,
}) {
  const isOwnerMode = !!onDelete;
  const status = STATUS_META[property.status];

  const amenities = [
    property.is_ac && { icon: "bi-snow", label: "AC" },
    property.food_provided && { icon: "bi-egg-fried", label: "Food" },
    property.wifi_available && { icon: "bi-wifi", label: "WiFi" },
    property.parking_available && { icon: "bi-p-circle", label: "Parking" },
  ].filter(Boolean);

  const minRent =
    property.sharing_options?.length > 0
      ? Math.min(
          ...property.sharing_options.map((o) => Number(o.rent_amount))
        )
      : null;

  return (
    <div
      onClick={!isOwnerMode ? onClick : undefined}
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.7)",
        overflow: "hidden",
        cursor: !isOwnerMode ? "pointer" : "default",
        transition: "all .45s cubic-bezier(.22,1,.36,1)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 10px 35px rgba(15,23,42,.06), 0 2px 10px rgba(15,23,42,.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          "translateY(-10px) scale(1.015)";
        e.currentTarget.style.boxShadow =
          "0 30px 60px rgba(15,23,42,.14)";
        e.currentTarget.style.borderColor =
          "rgba(16,185,129,.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow =
          "0 10px 35px rgba(15,23,42,.06)";
        e.currentTarget.style.borderColor =
          "rgba(255,255,255,.7)";
      }}
    >
      {/* IMAGE */}
      <div
        style={{
          height: 220,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          background:
            "linear-gradient(135deg,#eef2ff,#f8fafc)",
        }}
      >
        {property.images?.length > 0 ? (
          <img
            src={property.images[0].image}
            alt={property.property_name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform .8s ease",
              filter: "saturate(1.06) contrast(1.02)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform =
                "scale(1.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                "scale(1)")
            }
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#ecfeff,#dcfce7)",
            }}
          >
            <i
              className="bi bi-building"
              style={{
                fontSize: 38,
                color: "#10b981",
              }}
            />
          </div>
        )}

        {/* overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,.34), transparent 45%)",
          }}
        />

        {/* stay type */}
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,.16)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: ".72rem",
            border:
              "1px solid rgba(255,255,255,.25)",
          }}
        >
          {property.stay_type}
        </span>

        {!isOwnerMode && property.sharing_options?.length > 0 && (() => {
  const available = property.sharing_options.reduce((sum, o) => sum + o.available_beds, 0);
  return (
    <span style={{
      position: "absolute",
      bottom: 12,
      left: 12,
      background: "rgba(255,255,255,0.18)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      color: "#fff",
      fontWeight: 700,
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: ".72rem",
      border: "1px solid rgba(255,255,255,0.28)",
      display: "flex",
      alignItems: "center",
      gap: 5,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: available > 0 ? "#4ade80" : "#f87171",
        flexShrink: 0,
      }} />
      {available > 0 ? `${available} beds available` : "Fully Occupied"}
    </span>
  );
})()}

        {/* owner status */}
        {isOwnerMode && status && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: status.bg,
              color: status.color,
              fontSize: ".72rem",
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${status.dot}25`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: status.dot,
              }}
            />
            {status.label}
          </span>
        )}
      </div>

      {/* BODY */}
      <div
        style={{
          padding: "18px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h6
          style={{
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 6,
            fontSize: "1.05rem",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {property.property_name}
        </h6>

        <p
          style={{
            color: "#64748b",
            fontSize: ".85rem",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i
            className="bi bi-geo-alt"
            style={{ color: "#10b981" }}
          />
          {property.area
            ? `${property.area}, `
            : ""}
          {property.city}
        </p>

        {/* amenities */}
        {amenities.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {amenities.map(({ icon, label }) => (
              <span
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: ".72rem",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <i
                  className={`bi ${icon}`}
                  style={{
                    color: "#10b981",
                    fontSize: 11,
                  }}
                />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* PRICE */}
        {minRent && (
          <div style={{ marginTop: "auto" }}>
            <div
              style={{
                fontSize: ".7rem",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                marginBottom: 4,
              }}
            >
              Starting from
            </div>

            <div>
              <span
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                ₹{minRent.toLocaleString("en-IN")}
              </span>

              <span
                style={{
                  fontSize: ".82rem",
                  color: "#94a3b8",
                  marginLeft: 4,
                }}
              >
                /month
              </span>
            </div>
          </div>
        )}

        {/* OWNER ACTIONS */}
        {isOwnerMode && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                style={actionBtn(
                  "#f8fafc",
                  "#0f172a",
                  "#e2e8f0"
                )}
              >
                <i className="bi bi-eye me-1" />
                View
              </button>

              {property.status !==
                "SUBMITTED" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  style={actionBtn(
                    "#ecfdf5",
                    "#059669",
                    "#bbf7d0"
                  )}
                >
                  <i className="bi bi-pencil me-1" />
                  Edit
                </button>
              )}
            </div>

            {["ACTIVE", "INACTIVE", "APPROVED"].includes(
              property.status
            ) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                style={actionBtn(
                  property.status === "ACTIVE"
                    ? "#fff7ed"
                    : "#ecfdf5",
                  property.status === "ACTIVE"
                    ? "#c2410c"
                    : "#059669",
                  property.status === "ACTIVE"
                    ? "#fed7aa"
                    : "#bbf7d0"
                )}
              >
                <i
                  className={`bi ${
                    property.status === "ACTIVE"
                      ? "bi-eye-slash"
                      : "bi-eye"
                  } me-1`}
                />
                {property.status === "ACTIVE"
                  ? "Disable Listing"
                  : "Enable Listing"}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={actionBtn(
                "#fef2f2",
                "#dc2626",
                "#fecaca"
              )}
            >
              <i className="bi bi-trash me-1" />
              Delete Permanently
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function actionBtn(bg, color, border) {
  return {
    flex: 1,
    padding: "9px 12px",
    border: `1px solid ${border}`,
    borderRadius: 12,
    background: bg,
    color,
    fontSize: ".8rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all .2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}