import {
  useState,
  useEffect,
} from "react";

const STAY_TYPES = [
  {
    value: "GENTS",
    label: "Gents",
    icon: "bi-person-fill",
    desc: "For male tenants",
  },
  {
    value: "LADIES",
    label: "Ladies",
    icon: "bi-person-heart",
    desc: "For female tenants",
  },
  {
    value: "UNISEX",
    label: "Unisex",
    icon: "bi-people-fill",
    desc: "Open for all",
  },
];

const OCCUPANTS_BY_TYPE = {
  GENTS: [
    "Working Men",
    "Students (Male)",
  ],

  LADIES: [
    "Working Women",
    "Students (Female)",
  ],

  UNISEX: [
    "Working Men",
    "Working Women",
    "Students (Male)",
    "Students (Female)",
  ],
};

export default function BasicInfoStep({
  property,
  onCreateDraft,
  onSave,
}) {
  const [
    propertyName,
    setPropertyName,
  ] = useState("");

  const [
    stayType,
    setStayType,
  ] = useState("");

  const [
    preferredOccupants,
    setPreferredOccupants,
  ] = useState([]);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!property) return;

    setPropertyName(
      property.property_name ||
        ""
    );

    setStayType(
      property.stay_type || ""
    );

    setPreferredOccupants(
      property.preferred_occupants ||
        []
    );
  }, [property]);

  const availableOccupants =
    OCCUPANTS_BY_TYPE[
      stayType
    ] || [];

  function toggleOccupant(
    value
  ) {
    setPreferredOccupants(
      (prev) =>
        prev.includes(
          value
        )
          ? prev.filter(
              (v) =>
                v !==
                value
            )
          : [
              ...prev,
              value,
            ]
    );
  }

  async function handleSave() {
    setError("");

    if (
      !propertyName.trim() ||
      !stayType ||
      preferredOccupants.length ===
        0
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    const payload = {
      property_name:
        propertyName.trim(),
      stay_type: stayType,
      preferred_occupants:
        preferredOccupants,
      sharing_options: [],
    };

    try {
      setSaving(true);

      if (!property) {
        await onCreateDraft(
          payload
        );
      } else {
        await onSave(
          payload
        );
      }
    } catch {
      setError(
        "Unable to save basic information."
      );
    } finally {
      setSaving(false);
    }
  }

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
          Step 1
        </div>

        <h3
          style={{
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Basic Property
          Information
        </h3>

        <p className="text-muted mb-0">
          Add your property
          identity and who
          it is best suited
          for.
        </p>
      </div>

      {/* Property Name */}
      <SectionCard title="Property Name">
        <label className="form-label fw-semibold">
          Name
        </label>

        <input
          type="text"
          className="form-control"
          placeholder="e.g. Sunrise PG for Men"
          value={
            propertyName
          }
          onChange={(e) =>
            setPropertyName(
              e.target
                .value
            )
          }
          style={
            inputStyle
          }
        />

        <div className="text-muted small mt-2">
          Choose a clear,
          memorable name
          for better trust.
        </div>
      </SectionCard>

      {/* Stay Type */}
      <SectionCard title="Stay Type">
        <div className="row g-3">
          {STAY_TYPES.map(
            (type) => {
              const active =
                stayType ===
                type.value;

              return (
                <div
                  key={
                    type.value
                  }
                  className="col-md-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStayType(
                        type.value
                      );

                      setPreferredOccupants(
                        []
                      );
                    }}
                    style={{
                      width:
                        "100%",
                      textAlign:
                        "left",
                      border:
                        active
                          ? "1px solid #10b981"
                          : "1px solid var(--sn-border)",
                      background:
                        active
                          ? "rgba(16,185,129,.08)"
                          : "#fff",
                      borderRadius: 18,
                      padding:
                        "18px 16px",
                      transition:
                        ".2s ease",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          background:
                            active
                              ? "#10b981"
                              : "#f1f5f9",
                          color:
                            active
                              ? "#fff"
                              : "#64748b",
                        }}
                      >
                        <i
                          className={`bi ${type.icon}`}
                        ></i>
                      </div>

                      <div
                        style={{
                          fontWeight: 800,
                        }}
                      >
                        {
                          type.label
                        }
                      </div>
                    </div>

                    <div className="text-muted small">
                      {
                        type.desc
                      }
                    </div>
                  </button>
                </div>
              );
            }
          )}
        </div>
      </SectionCard>

      {/* Preferred Occupants */}
      <SectionCard title="Preferred Occupants">
        {!stayType ? (
          <div
            style={{
              background:
                "#f8fafc",
              border:
                "1px dashed #cbd5e1",
              borderRadius: 14,
              padding:
                "14px 16px",
              color:
                "#64748b",
              fontSize:
                ".92rem",
            }}
          >
            Select a stay
            type first.
          </div>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {availableOccupants.map(
              (
                occ
              ) => {
                const active =
                  preferredOccupants.includes(
                    occ
                  );

                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() =>
                      toggleOccupant(
                        occ
                      )
                    }
                    style={{
                      border:
                        active
                          ? "1px solid #10b981"
                          : "1px solid var(--sn-border)",
                      background:
                        active
                          ? "rgba(16,185,129,.08)"
                          : "#fff",
                      color:
                        active
                          ? "#059669"
                          : "#475569",
                      borderRadius: 999,
                      padding:
                        "10px 16px",
                      fontWeight: 700,
                      fontSize:
                        ".88rem",
                    }}
                  >
                    {active && (
                      <i className="bi bi-check2 me-2"></i>
                    )}
                    {occ}
                  </button>
                );
              }
            )}
          </div>
        )}
      </SectionCard>

      {/* Error */}
      {error && (
        <div
          style={{
            background:
              "#fef2f2",
            border:
              "1px solid #fecaca",
            color:
              "#dc2626",
            borderRadius: 14,
            padding:
              "12px 14px",
            fontWeight: 600,
            fontSize:
              ".9rem",
          }}
        >
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="d-flex justify-content-end">
        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            saving
          }
          className="btn"
          style={{
            minWidth: 220,
            height: 50,
            border: "none",
            borderRadius: 14,
            color: "#fff",
            fontWeight: 700,
            background:
              "linear-gradient(135deg,#10b981,#059669)",
            boxShadow:
              "0 14px 34px rgba(16,185,129,.20)",
          }}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Saving...
            </>
          ) : (
            <>
              Save &
              Continue{" "}
              <i className="bi bi-arrow-right ms-2"></i>
            </>
          )}
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
        borderRadius: 20,
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

const inputStyle = {
  height: 50,
  borderRadius: 14,
  border:
    "1px solid var(--sn-border)",
  boxShadow: "none",
};