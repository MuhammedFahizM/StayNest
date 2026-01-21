import { useState, useEffect } from "react";

const STAY_TYPES = [
  { value: "GENTS", label: "Gents" },
  { value: "LADIES", label: "Ladies" },
  { value: "UNISEX", label: "Unisex" },
];

const OCCUPANTS = [
  "Working Men",
  "Working Women",
  "Students (Male)",
  "Students (Female)",
];

export default function BasicInfoStep({
  property,
  onCreateDraft,
  onSave,
}) {
  const [propertyName, setPropertyName] = useState("");
  const [stayType, setStayType] = useState("");
  const [preferredOccupants, setPreferredOccupants] = useState([]);
  const [error, setError] = useState("");

  /* Populate on edit */
  useEffect(() => {
    if (!property) return;

    setPropertyName(property.property_name || "");
    setStayType(property.stay_type || "");
    setPreferredOccupants(property.preferred_occupants || []);
  }, [property]);

  const toggleOccupant = (value) => {
    setPreferredOccupants((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!propertyName || !stayType || preferredOccupants.length === 0) {
      setError("All fields are required.");
      return;
    }

    const payload = {
      property_name: propertyName,
      stay_type: stayType,
      preferred_occupants: preferredOccupants,
      sharing_options: [],
    };

    try {
      if (!property) {
        await onCreateDraft(payload);
      } else {
        await onSave(payload);
      }
      setError("");
    } catch {
      setError("Unable to save basic information.");
    }
  };

  return (
    <div className="d-flex flex-column gap-4">

      {/* Property Name */}
      <div>
        <label className="form-label fw-medium">
          Property Name
        </label>
        <input
          type="text"
          className="form-control"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder="e.g. Sunrise PG for Men"
        />
      </div>

      {/* Stay Type */}
      <div>
        <label className="form-label fw-medium mb-2">
          Stay Type
        </label>
        <div className="btn-group" role="group">
          {STAY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`btn ${
                stayType === type.value
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => setStayType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Occupants */}
      <div>
        <label className="form-label fw-medium mb-2">
          Preferred Occupants
        </label>
        <div className="d-flex flex-wrap gap-2">
          {OCCUPANTS.map((occ) => (
            <button
              key={occ}
              type="button"
              className={`btn btn-sm ${
                preferredOccupants.includes(occ)
                  ? "btn-success"
                  : "btn-outline-secondary"
              }`}
              onClick={() => toggleOccupant(occ)}
            >
              {occ}
            </button>
          ))}
        </div>
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
