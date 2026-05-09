import { useEffect, useState } from "react";

export default function AmenitiesPoliciesStep({
  property,
  onSave,
}) {
  const [form, setForm] =
    useState({
      is_ac: false,
      parking_available:
        false,
      food_provided:
        false,
      food_price: "",
      wifi_available:
        false,
      power_backup:
        false,
      rules_and_regulations:
        "",
      security_deposit:
        "",
      notice_period:
        "",
      visiting_hours:
        "",
      nearby_landmarks:
        "",
      floor_info: "",
    });

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!property) return;

    setForm({
      is_ac:
        property.is_ac ??
        false,
      parking_available:
        property.parking_available ??
        false,
      food_provided:
        property.food_provided ??
        false,
      food_price:
        property.food_price ||
        "",
      wifi_available:
        property.wifi_available ??
        false,
      power_backup:
        property.power_backup ??
        false,
      rules_and_regulations:
        property.rules_and_regulations ||
        "",
      security_deposit:
        property.security_deposit ||
        "",
      notice_period:
        property.notice_period ||
        "",
      visiting_hours:
        property.visiting_hours ||
        "",
      nearby_landmarks:
        property.nearby_landmarks ||
        "",
      floor_info:
        property.floor_info ||
        "",
    });
  }, [property]);

  function updateField(
    key,
    value
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    setError("");

    if (
      !form.rules_and_regulations.trim()
    ) {
      setError(
        "Rules & regulations are required."
      );
      return;
    }

    if (
      form.food_provided &&
      !form.food_price
    ) {
      setError(
        "Food price is required when food facility is enabled."
      );
      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,

        security_deposit:
          form.security_deposit ===
          ""
            ? null
            : Number(
                form.security_deposit
              ),

        notice_period:
          form.notice_period ===
          ""
            ? null
            : Number(
                form.notice_period
              ),

        food_price:
          form.food_provided &&
          form.food_price !==
            ""
            ? Number(
                form.food_price
              )
            : null,
      });
    } catch {
      setError(
        "Unable to save amenities & policies."
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
          Step 3
        </div>

        <h3
          style={{
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Amenities &
          Policies
        </h3>

        <p className="text-muted mb-0">
          Add comfort
          features, house
          rules and rental
          terms.
        </p>
      </div>

      {/* Amenities */}
      <SectionCard title="Amenities">
        <div className="row g-3">
          <ToggleCard
            icon="bi-snow"
            label="Air Conditioning"
            value={
              form.is_ac
            }
            onChange={(v) =>
              updateField(
                "is_ac",
                v
              )
            }
          />

          <ToggleCard
            icon="bi-p-circle"
            label="Parking"
            value={
              form.parking_available
            }
            onChange={(v) =>
              updateField(
                "parking_available",
                v
              )
            }
          />

          <ToggleCard
            icon="bi-cup-hot"
            label="Food Facility"
            value={
              form.food_provided
            }
            onChange={(v) =>
              updateField(
                "food_provided",
                v
              )
            }
          />

          <ToggleCard
            icon="bi-wifi"
            label="Wi-Fi"
            value={
              form.wifi_available
            }
            onChange={(v) =>
              updateField(
                "wifi_available",
                v
              )
            }
          />

          <ToggleCard
            icon="bi-lightning-charge"
            label="Power Backup"
            value={
              form.power_backup
            }
            onChange={(v) =>
              updateField(
                "power_backup",
                v
              )
            }
          />
        </div>
      </SectionCard>

      {/* Food */}
      {form.food_provided && (
        <SectionCard title="Food Details">
          <div
            className="mb-3"
            style={{
              background:
                "#fffbeb",
              border:
                "1px solid #fde68a",
              color:
                "#92400e",
              padding:
                "12px 14px",
              borderRadius: 14,
              fontSize:
                ".9rem",
            }}
          >
            Food facility is
            enabled for this
            property.
          </div>

          <div className="row g-3">
            <FieldInput
              label="Food Price / Month (₹)"
              type="number"
              value={
                form.food_price
              }
              onChange={(v) =>
                updateField(
                  "food_price",
                  v
                )
              }
            />
          </div>
        </SectionCard>
      )}

      {/* Rules */}
      <SectionCard title="Rules & Regulations">
        <TextAreaField
          rows={5}
          placeholder="Guests rules, curfew timings, smoking policy, visitor rules, cleanliness expectations..."
          value={
            form.rules_and_regulations
          }
          onChange={(v) =>
            updateField(
              "rules_and_regulations",
              v
            )
          }
        />
      </SectionCard>

      {/* Terms */}
      <SectionCard title="Rental Terms">
        <div className="row g-3">
          <FieldInput
            label="Security Deposit (₹)"
            type="number"
            value={
              form.security_deposit
            }
            onChange={(v) =>
              updateField(
                "security_deposit",
                v
              )
            }
          />

          <FieldInput
            label="Notice Period (days)"
            type="number"
            value={
              form.notice_period
            }
            onChange={(v) =>
              updateField(
                "notice_period",
                v
              )
            }
          />

          <FieldInput
            label="Visiting Hours"
            value={
              form.visiting_hours
            }
            onChange={(v) =>
              updateField(
                "visiting_hours",
                v
              )
            }
          />

          <FieldInput
            label="Floor Information"
            value={
              form.floor_info
            }
            onChange={(v) =>
              updateField(
                "floor_info",
                v
              )
            }
          />
        </div>
      </SectionCard>

      {/* Nearby */}
      <SectionCard title="Nearby Landmarks">
        <TextAreaField
          rows={4}
          placeholder="Metro station, college, mall, hospital, tech park..."
          value={
            form.nearby_landmarks
          }
          onChange={(v) =>
            updateField(
              "nearby_landmarks",
              v
            )
          }
        />
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
            padding:
              "12px 14px",
            borderRadius: 14,
            fontSize:
              ".9rem",
            fontWeight: 600,
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
          disabled={
            saving
          }
          onClick={
            handleSave
          }
          className="btn"
          style={{
            minWidth: 210,
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

/* ---------- atoms ---------- */

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

function ToggleCard({
  icon,
  label,
  value,
  onChange,
}) {
  return (
    <div className="col-md-6">
      <button
        type="button"
        onClick={() =>
          onChange(
            !value
          )
        }
        style={{
          width: "100%",
          border:
            value
              ? "1px solid #10b981"
              : "1px solid var(--sn-border)",
          background:
            value
              ? "rgba(16,185,129,.08)"
              : "#fff",
          borderRadius: 16,
          padding:
            "16px 18px",
          textAlign:
            "left",
          transition:
            ".2s ease",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background:
                  value
                    ? "#10b981"
                    : "#f1f5f9",
                color:
                  value
                    ? "#fff"
                    : "#64748b",
                display:
                  "grid",
                placeItems:
                  "center",
              }}
            >
              <i
                className={`bi ${icon}`}
              ></i>
            </div>

            <div
              style={{
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          </div>

          <div
            style={{
              fontSize:
                ".85rem",
              fontWeight: 700,
              color:
                value
                  ? "#059669"
                  : "#94a3b8",
            }}
          >
            {value
              ? "ON"
              : "OFF"}
          </div>
        </div>
      </button>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div className="col-md-6">
      <label className="form-label fw-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
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
        }}
      />
    </div>
  );
}

function TextAreaField({
  value,
  onChange,
  rows = 4,
  placeholder,
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={
        placeholder
      }
      onChange={(e) =>
        onChange(
          e.target
            .value
        )
      }
      className="form-control"
      style={{
        borderRadius: 16,
        border:
          "1px solid var(--sn-border)",
        boxShadow:
          "none",
        resize: "none",
      }}
    />
  );
}