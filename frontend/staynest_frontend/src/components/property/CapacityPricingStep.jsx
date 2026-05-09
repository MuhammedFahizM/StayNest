import {
  useEffect,
  useState,
} from "react";

const SHARING_TYPES = [
  {
    value: 1,
    label: "1 Sharing",
    icon: "bi-person-fill",
    desc: "Private room setup",
  },
  {
    value: 2,
    label: "2 Sharing",
    icon: "bi-people-fill",
    desc: "Dual occupancy",
  },
  {
    value: 3,
    label: "3 Sharing",
    icon: "bi-people",
    desc: "Triple sharing",
  },
  {
    value: 4,
    label: "4 Sharing",
    icon: "bi-grid-3x3-gap",
    desc: "Group stay",
  },
];

export default function CapacityPricingStep({
  property,
  onSave,
}) {
  const [
    sharingMap,
    setSharingMap,
  ] = useState({});

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (
      !property?.sharing_options
    )
      return;

    const map = {};

    property.sharing_options.forEach(
      (opt) => {
        map[
          opt.sharing_type
        ] = {
          enabled: true,
          total_beds:
            opt.total_beds,
          occupied_beds:
            opt.occupied_beds ??
            0,
          rent_amount:
            opt.rent_amount,
          advance_amount:
            opt.advance_amount ||
            0,
        };
      }
    );

    setSharingMap(map);
  }, [property]);

  function toggleSharing(
    type
  ) {
    setSharingMap(
      (prev) => {
        if (
          prev[type]
        ) {
          const copy = {
            ...prev,
          };

          delete copy[
            type
          ];

          return copy;
        }

        return {
          ...prev,
          [type]: {
            enabled: true,
            total_beds:
              "",
            occupied_beds:
              "",
            rent_amount:
              "",
            advance_amount:
              "",
          },
        };
      }
    );
  }

  function updateField(
    type,
    field,
    value
  ) {
    setSharingMap(
      (prev) => ({
        ...prev,
        [type]: {
          ...prev[
            type
          ],
          [field]:
            value,
        },
      })
    );
  }

  function getErrors(
    data
  ) {
    const total =
      Number(
        data.total_beds ||
          0
      );

    const occupied =
      Number(
        data.occupied_beds ||
          0
      );

    const rent =
      Number(
        data.rent_amount ||
          0
      );

    const advance =
      Number(
        data.advance_amount ||
          0
      );

    const errors =
      [];

    if (
      total > 0 &&
      occupied >
        total
    ) {
      errors.push(
        "Occupied beds cannot exceed total beds."
      );
    }

    if (
      rent > 0 &&
      advance >
        rent
    ) {
      errors.push(
        "Advance cannot exceed rent amount."
      );
    }

    return errors;
  }

  async function handleSave() {
    setError("");

    try {
      const sharing_options =
        Object.entries(
          sharingMap
        ).map(
          ([
            type,
            data,
          ]) => {
            const total =
              Number(
                data.total_beds
              );

            const occupied =
              Number(
                data.occupied_beds ||
                  0
              );

            const rent =
              Number(
                data.rent_amount
              );

            const advance =
              Number(
                data.advance_amount ||
                  0
              );

            if (
              !total ||
              !rent
            ) {
              throw new Error(
                "Fill all enabled sharing types properly."
              );
            }

            if (
              occupied >
              total
            ) {
              throw new Error(
                "Occupied beds cannot exceed total beds."
              );
            }

            if (
              advance >
              rent
            ) {
              throw new Error(
                "Advance cannot exceed rent."
              );
            }

            return {
              sharing_type:
                Number(
                  type
                ),
              total_beds:
                total,
              occupied_beds:
                occupied,
              rent_amount:
                rent,
              advance_amount:
                advance,
            };
          }
        );

      if (
        sharing_options.length ===
        0
      ) {
        setError(
          "Enable at least one sharing option."
        );
        return;
      }

      setSaving(
        true
      );

      await onSave({
        sharing_options,
      });
    } catch (
      err
    ) {
      setError(
        err.message ||
          "Unable to save capacity & pricing."
      );
    } finally {
      setSaving(
        false
      );
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
          Step 2
        </div>

        <h3
          style={{
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Capacity &
          Pricing
        </h3>

        <p className="text-muted mb-0">
          Add room sharing
          plans, bed counts
          and monthly rent.
        </p>
      </div>

      {/* Sharing Type Select */}
      <SectionCard title="Sharing Types Offered">
        <div className="row g-3">
          {SHARING_TYPES.map(
            (
              item
            ) => {
              const active =
                !!sharingMap[
                  item
                    .value
                ];

              return (
                <div
                  key={
                    item.value
                  }
                  className="col-md-6"
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleSharing(
                        item.value
                      )
                    }
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
                          className={`bi ${item.icon}`}
                        ></i>
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                          }}
                        >
                          {
                            item.label
                          }
                        </div>

                        <div className="small text-muted">
                          {
                            item.desc
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            }
          )}
        </div>
      </SectionCard>

      {/* Cards */}
      {Object.entries(
        sharingMap
      ).map(
        ([
          type,
          data,
        ]) => {
          const total =
            Number(
              data.total_beds ||
                0
            );

          const occupied =
            Number(
              data.occupied_beds ||
                0
            );

          const available =
            total &&
            occupied <=
              total
              ? total -
                occupied
              : 0;

          return (
            <SectionCard
              key={type}
              title={`${type} Sharing Details`}
            >
              <div className="row g-3">
                <FieldInput
                  label="Total Beds"
                  type="number"
                  value={
                    data.total_beds
                  }
                  onChange={(
                    v
                  ) =>
                    updateField(
                      type,
                      "total_beds",
                      v
                    )
                  }
                />

                <FieldInput
                  label="Occupied Beds"
                  type="number"
                  value={
                    data.occupied_beds
                  }
                  onChange={(
                    v
                  ) =>
                    updateField(
                      type,
                      "occupied_beds",
                      v
                    )
                  }
                />

                <FieldInput
                  label="Available Beds"
                  type="number"
                  disabled
                  value={
                    available
                  }
                />

                <FieldInput
                  label="Rent / Month (₹)"
                  type="number"
                  value={
                    data.rent_amount
                  }
                  onChange={(
                    v
                  ) =>
                    updateField(
                      type,
                      "rent_amount",
                      v
                    )
                  }
                />

                <FieldInput
                  label="Advance (₹)"
                  type="number"
                  value={
                    data.advance_amount
                  }
                  onChange={(
                    v
                  ) =>
                    updateField(
                      type,
                      "advance_amount",
                      v
                    )
                  }
                />
              </div>

              <div className="small text-muted mt-3">
                Available beds
                auto-calculate
                from total -
                occupied.
              </div>

              {getErrors(
                data
              ).map(
                (
                  msg,
                  i
                ) => (
                  <div
                    key={
                      i
                    }
                    style={{
                      marginTop: 10,
                      background:
                        "#fef2f2",
                      border:
                        "1px solid #fecaca",
                      color:
                        "#dc2626",
                      padding:
                        "10px 12px",
                      borderRadius: 12,
                      fontSize:
                        ".88rem",
                      fontWeight: 600,
                    }}
                  >
                    {msg}
                  </div>
                )
              )}
            </SectionCard>
          );
        }
      )}

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

function FieldInput({
  label,
  type = "text",
  value,
  onChange,
  disabled =
    false,
}) {
  return (
    <div className="col-md-4">
      <label className="form-label fw-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={
          disabled
        }
        onChange={(e) =>
          onChange?.(
            e.target
              .value
          )
        }
        className="form-control"
        style={{
          height: 48,
          borderRadius: 14,
          border:
            "1px solid var(--sn-border)",
          boxShadow:
            "none",
          background:
            disabled
              ? "#f8fafc"
              : "#fff",
        }}
      />
    </div>
  );
}