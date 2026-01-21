import { useEffect, useState } from "react";

export default function AmenitiesPoliciesStep({
  property,
  onSave,
}) {
  const [form, setForm] = useState({
    is_ac: false,
    parking_available: false,
    food_provided: false,
    wifi_available: false,
    power_backup: false,
    rules_and_regulations: "",
    security_deposit: "",
    notice_period: "",
    visiting_hours: "",
    nearby_landmarks: "",
    floor_info: "",
  });

  const [error, setError] = useState("");

  /* Populate on edit */
  useEffect(() => {
    if (!property) return;

    setForm({
      is_ac: property.is_ac ?? false,
      parking_available: property.parking_available ?? false,
      food_provided: property.food_provided ?? false,
      wifi_available: property.wifi_available ?? false,
      power_backup: property.power_backup ?? false,
      rules_and_regulations: property.rules_and_regulations || "",
      security_deposit: property.security_deposit || "",
      notice_period: property.notice_period || "",
      visiting_hours: property.visiting_hours || "",
      nearby_landmarks: property.nearby_landmarks || "",
      floor_info: property.floor_info || "",
    });
  }, [property]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.rules_and_regulations) {
      setError("Rules & regulations are required.");
      return;
    }

    try {
      await onSave({
        ...form,
        security_deposit:
          form.security_deposit === ""
            ? null
            : Number(form.security_deposit),
        notice_period:
          form.notice_period === ""
            ? null
            : Number(form.notice_period),
      });
      setError("");
    } catch {
      setError("Unable to save amenities & policies.");
    }
  };

  return (
    <div className="d-flex flex-column gap-4">

      {/* Amenities */}
      <div>
        <h6 className="fw-semibold mb-3">
          Amenities
        </h6>

        <div className="row g-3">
          <Toggle
            label="Air Conditioning"
            value={form.is_ac}
            onChange={(v) => updateField("is_ac", v)}
          />
          <Toggle
            label="Parking Available"
            value={form.parking_available}
            onChange={(v) => updateField("parking_available", v)}
          />
          <Toggle
            label="Food Provided"
            value={form.food_provided}
            onChange={(v) => updateField("food_provided", v)}
          />
          <Toggle
            label="Wi-Fi Available"
            value={form.wifi_available}
            onChange={(v) => updateField("wifi_available", v)}
          />
          <Toggle
            label="Power Backup"
            value={form.power_backup}
            onChange={(v) => updateField("power_backup", v)}
          />
        </div>
      </div>

      {/* Conditional info */}
      {form.food_provided && (
        <div className="alert alert-warning mb-0">
          Food facility is enabled. Mess Reduction Policy (if any)
          will be applied during booking.
        </div>
      )}

      {/* Rules */}
      <div>
        <label className="form-label fw-medium">
          Rules & Regulations
        </label>
        <textarea
          rows={4}
          className="form-control"
          value={form.rules_and_regulations}
          onChange={(e) =>
            updateField("rules_and_regulations", e.target.value)
          }
        />
      </div>

      {/* Optional fields */}
      <div className="row g-3">
        <Input
          label="Security Deposit (₹)"
          type="number"
          value={form.security_deposit}
          onChange={(v) => updateField("security_deposit", v)}
        />
        <Input
          label="Notice Period (days)"
          type="number"
          value={form.notice_period}
          onChange={(v) => updateField("notice_period", v)}
        />
        <Input
          label="Visiting Hours"
          value={form.visiting_hours}
          onChange={(v) => updateField("visiting_hours", v)}
        />
        <Input
          label="Floor Information"
          value={form.floor_info}
          onChange={(v) => updateField("floor_info", v)}
        />
      </div>

      <div>
        <label className="form-label fw-medium">
          Nearby Landmarks
        </label>
        <textarea
          rows={3}
          className="form-control"
          value={form.nearby_landmarks}
          onChange={(e) =>
            updateField("nearby_landmarks", e.target.value)
          }
        />
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger py-2 mb-0">
          {error}
        </div>
      )}

      {/* Save */}
      <div className="d-flex justify-content-end">
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
        >
          Save & Continue
        </button>
      </div>

    </div>
  );
}

/* -----------------------------------
Reusable UI atoms (Bootstrap)
----------------------------------- */

function Toggle({ label, value, onChange }) {
  return (
    <div className="col-12 col-md-6">
      <div className="form-check form-switch border rounded p-3">
        <input
          className="form-check-input"
          type="checkbox"
          checked={value}
          onChange={() => onChange(!value)}
        />
        <label className="form-check-label fw-medium ms-2">
          {label}
        </label>
        <span className="float-end text-muted small">
          {value ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange }) {
  return (
    <div className="col-12 col-md-6">
      <label className="form-label">
        {label}
      </label>
      <input
        type={type}
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
