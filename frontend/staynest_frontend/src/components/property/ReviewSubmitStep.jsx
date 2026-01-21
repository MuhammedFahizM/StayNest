export default function ReviewSubmitStep({
  property,
  onSubmit,
}) {
  const missing = [];

  if (!property.property_name) missing.push("Property name");
  if (!property.stay_type) missing.push("Stay type");
  if (!property.preferred_occupants?.length)
    missing.push("Preferred occupants");
  if (!property.sharing_options?.length)
    missing.push("Capacity & pricing");
  if (!property.city) missing.push("Location (city)");
  if (!property.images || property.images.length < 3)
    missing.push("Minimum 3 images");

  const canSubmit =
    missing.length === 0 &&
    (property.status === "DRAFT" ||
      property.status === "REJECTED");

  return (
    <div className="d-flex flex-column gap-4">

      {/* Summary */}
      <div className="border rounded p-3 bg-light">
        <h6 className="fw-semibold mb-3">
          Property Summary
        </h6>

        <div className="d-flex flex-column gap-2 small">
          <div>
            <strong>Name:</strong> {property.property_name}
          </div>
          <div>
            <strong>Stay Type:</strong> {property.stay_type}
          </div>
          <div>
            <strong>Preferred Occupants:</strong>{" "}
            {property.preferred_occupants?.join(", ")}
          </div>
          <div>
            <strong>City:</strong> {property.city}
          </div>
          <div>
            <strong>Sharing Options:</strong>{" "}
            {property.sharing_options?.length}
          </div>
          <div>
            <strong>Images:</strong>{" "}
            {property.images?.length || 0}
          </div>
        </div>
      </div>

      {/* Missing */}
      {missing.length > 0 && (
        <div className="alert alert-danger mb-0">
          <p className="fw-medium mb-2">
            Complete the following before submission:
          </p>
          <ul className="mb-0">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit */}
      <div className="d-flex justify-content-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`btn ${
            canSubmit
              ? "btn-primary"
              : "btn-secondary"
          }`}
        >
          Submit for Review
        </button>
      </div>

      {/* Status Info */}
      {property.status === "SUBMITTED" && (
        <div className="alert alert-warning mb-0">
          This property has already been submitted for admin
          review.
        </div>
      )}

    </div>
  );
}
