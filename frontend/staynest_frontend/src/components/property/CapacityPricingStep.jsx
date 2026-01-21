import { useEffect, useState } from "react";

const SHARING_TYPES = [
  { value: 1, label: "1 Sharing" },
  { value: 2, label: "2 Sharing" },
  { value: 3, label: "3 Sharing" },
  { value: 4, label: "4 Sharing" },
];

export default function CapacityPricingStep({
  property,
  onSave,
}) {
  const [sharingMap, setSharingMap] = useState({});
  const [error, setError] = useState("");

  /* Populate existing data on edit */
  useEffect(() => {
    if (!property?.sharing_options) return;

    const map = {};
    property.sharing_options.forEach((opt) => {
      map[opt.sharing_type] = {
        enabled: true,
        total_beds: opt.total_beds,
        rent_amount: opt.rent_amount,
      };
    });
    setSharingMap(map);
  }, [property]);

  const toggleSharing = (type) => {
    setSharingMap((prev) => {
      const current = prev[type];
      if (current?.enabled) {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      }
      return {
        ...prev,
        [type]: { enabled: true, total_beds: "", rent_amount: "" },
      };
    });
  };

  const updateField = (type, field, value) => {
    setSharingMap((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const sharing_options = Object.entries(sharingMap).map(
      ([type, data]) => {
        if (!data.total_beds || !data.rent_amount) {
          throw new Error("Invalid sharing data");
        }
        return {
          sharing_type: Number(type),
          total_beds: Number(data.total_beds),
          rent_amount: Number(data.rent_amount),
        };
      }
    );

    if (sharing_options.length === 0) {
      setError("At least one sharing option is required.");
      return;
    }

    try {
      await onSave({ sharing_options });
      setError("");
    } catch {
      setError("Unable to save capacity & pricing.");
    }
  };

  return (
    <div className="d-flex flex-column gap-4">

      {/* Sharing Toggles */}
      <div>
        <label className="form-label fw-medium mb-2">
          Sharing Types Offered
        </label>

        <div className="d-flex flex-wrap gap-2">
          {SHARING_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`btn btn-sm ${
                sharingMap[type.value]
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => toggleSharing(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sharing Details */}
      {Object.entries(sharingMap).map(([type, data]) => (
        <div
          key={type}
          className="border rounded p-3 d-flex flex-column gap-3"
        >
          <h6 className="fw-semibold mb-1">
            {type} Sharing Details
          </h6>

          <div className="row g-3">
            {/* Total Beds */}
            <div className="col-12 col-md-6">
              <label className="form-label">
                Total Beds
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={data.total_beds}
                onChange={(e) =>
                  updateField(type, "total_beds", e.target.value)
                }
              />
            </div>

            {/* Rent */}
            <div className="col-12 col-md-6">
              <label className="form-label">
                Rent Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={data.rent_amount}
                onChange={(e) =>
                  updateField(type, "rent_amount", e.target.value)
                }
              />
            </div>
          </div>

          <small className="text-muted">
            Available beds are managed automatically by the system.
          </small>
        </div>
      ))}

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
