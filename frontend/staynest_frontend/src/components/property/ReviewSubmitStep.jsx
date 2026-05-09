export default function ReviewSubmitStep({
  property,
  onSubmit,
}) {
  const checks = [
    {
      label: "Property name",
      done:
        !!property.property_name,
    },
    {
      label: "Stay type",
      done:
        !!property.stay_type,
    },
    {
      label:
        "Preferred occupants",
      done:
        !!property
          .preferred_occupants
          ?.length,
    },
    {
      label:
        "Capacity & pricing",
      done:
        !!property
          .sharing_options
          ?.length,
    },
    {
      label:
        "Location (city)",
      done:
        !!property.city,
    },
    {
      label:
        "Minimum 3 images",
      done:
        property.images
          ?.length >= 3,
    },
  ];

  const allDone =
    checks.every(
      (c) => c.done
    );

  const canSubmit =
    allDone &&
    [
      "DRAFT",
      "REJECTED",
    ].includes(
      property.status
    );

  const totalBeds =
    property.sharing_options?.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total_beds ||
            0
        ),
      0
    ) || 0;

  const minRent =
    property.sharing_options
      ?.length
      ? Math.min(
          ...property.sharing_options.map(
            (
              item
            ) =>
              Number(
                item.rent_amount ||
                  0
              )
          )
        )
      : null;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div>
        <div
          style={{
            fontSize:
              ".75rem",
            fontWeight: 800,
            letterSpacing:
              ".08em",
            color:
              "var(--sn-primary)",
            textTransform:
              "uppercase",
            marginBottom: 8,
          }}
        >
          Final Step
        </div>

        <h3
          style={{
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Review &
          Submit
        </h3>

        <p className="text-muted mb-0">
          Confirm your
          listing details
          and send it for
          admin approval.
        </p>
      </div>

      {/* Checklist */}
      <SectionCard title="Listing Checklist">
        <div className="d-flex flex-column gap-2">
          {checks.map(
            (
              item
            ) => (
              <CheckRow
                key={
                  item.label
                }
                label={
                  item.label
                }
                done={
                  item.done
                }
              />
            )
          )}
        </div>
      </SectionCard>

      {/* Summary */}
      <SectionCard title="Property Summary">
        <div className="row g-3">
          <SummaryItem
            label="Name"
            value={
              property.property_name ||
              "—"
            }
          />

          <SummaryItem
            label="Stay Type"
            value={
              property.stay_type ||
              "—"
            }
          />

          <SummaryItem
            label="City"
            value={
              property.city ||
              "—"
            }
          />

          <SummaryItem
            label="Images"
            value={`${property.images?.length || 0}`}
          />

          <SummaryItem
            label="Beds"
            value={`${totalBeds}`}
          />

          <SummaryItem
            label="Starting Rent"
            value={
              minRent
                ? `₹${minRent}`
                : "—"
            }
          />

          <SummaryItem
            label="Status"
            value={
              property.status
            }
          />
        </div>
      </SectionCard>

      {/* Pending */}
      {property.status ===
        "SUBMITTED" && (
        <div
          style={{
            background:
              "#fffbeb",
            border:
              "1px solid #fde68a",
            color:
              "#92400e",
            borderRadius: 16,
            padding:
              "14px 16px",
            fontWeight: 600,
            fontSize:
              ".92rem",
          }}
        >
          <i className="bi bi-clock-history me-2"></i>
          This property
          is currently
          under admin
          review.
        </div>
      )}

      {/* Rejected */}
      {property.status ===
        "REJECTED" &&
        property.rejection_reason && (
          <div
            style={{
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              color:
                "#dc2626",
              borderRadius: 16,
              padding:
                "14px 16px",
              fontWeight: 600,
              fontSize:
                ".92rem",
            }}
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            {
              property.rejection_reason
            }
          </div>
        )}

      {/* CTA */}
      <div className="d-flex justify-content-end">
        <button
          type="button"
          onClick={
            onSubmit
          }
          disabled={
            !canSubmit
          }
          className="btn"
          style={{
            minWidth: 240,
            height: 52,
            border: "none",
            borderRadius: 14,
            fontWeight: 700,
            color:
              canSubmit
                ? "#fff"
                : "#94a3b8",
            background:
              canSubmit
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "#e5e7eb",
            boxShadow:
              canSubmit
                ? "0 14px 34px rgba(16,185,129,.20)"
                : "none",
            cursor:
              canSubmit
                ? "pointer"
                : "not-allowed",
          }}
        >
          {property.status ===
          "SUBMITTED"
            ? "Already Submitted"
            : "Submit for Review"}
        </button>
      </div>
    </div>
  );
}

/* helpers */

function SectionCard({
  title,
  children,
}) {
  return (
    <div
      style={{
        border:
          "1px solid var(--sn-border)",
        borderRadius: 22,
        padding: 22,
        background:
          "#fff",
        boxShadow:
          "0 10px 26px rgba(15,23,42,.04)",
      }}
    >
      <h6
        style={{
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        {title}
      </h6>

      {children}
    </div>
  );
}

function CheckRow({
  label,
  done,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        alignItems:
          "center",
        gap: 12,
        padding:
          "12px 14px",
        borderRadius: 16,
        border: done
          ? "1px solid #bbf7d0"
          : "1px solid #fde68a",
        background: done
          ? "rgba(16,185,129,.05)"
          : "#fffbeb",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius:
            "50%",
          display:
            "grid",
          placeItems:
            "center",
          background:
            done
              ? "#10b981"
              : "#f59e0b",
          color:
            "#fff",
          flexShrink: 0,
        }}
      >
        <i
          className={`bi ${
            done
              ? "bi-check-lg"
              : "bi-exclamation"
          }`}
        ></i>
      </div>

      <div
        style={{
          fontWeight: 700,
          color:
            done
              ? "#14532d"
              : "#92400e",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginLeft:
            "auto",
          fontSize:
            ".8rem",
          fontWeight: 700,
          color:
            done
              ? "#059669"
              : "#b45309",
        }}
      >
        {done
          ? "Done"
          : "Pending"}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="col-md-6">
      <div
        style={{
          border:
            "1px solid #eef2f7",
          borderRadius: 16,
          padding:
            "14px 16px",
          background:
            "#f8fafc",
        }}
      >
        <div
          style={{
            fontSize:
              ".78rem",
            color:
              "#64748b",
            fontWeight: 700,
            textTransform:
              "uppercase",
            letterSpacing:
              ".04em",
            marginBottom: 4,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontWeight: 800,
            color:
              "#0f172a",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}