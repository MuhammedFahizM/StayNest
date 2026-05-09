import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import BasicInfoStep from "../components/property/BasicInfoStep";
import CapacityPricingStep from "../components/property/CapacityPricingStep";
import AmenitiesPoliciesStep from "../components/property/AmenitiesPoliciesStep";
import LocationPicker from "../components/property/LocationPicker";
import ImagesStep from "../components/property/ImagesStep";
import ReviewSubmitStep from "../components/property/ReviewSubmitStep";
import ImageLightbox from "../components/ImageLightbox";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PropertyMapView from "../components/PropertyMap";

import {
  createProperty,
  getOwnerProperty,
  updateProperty,
  submitProperty,
  getPublicPropertyDetail,
  updatePropertyLocation,
} from "../services/propertyService";

const STEPS = [
  { key: "basic", label: "Basic Info", icon: "bi-info-circle" },
  { key: "capacity", label: "Capacity & Pricing", icon: "bi-people" },
  { key: "amenities", label: "Amenities & Policies", icon: "bi-shield-check" },
  { key: "location", label: "Location", icon: "bi-geo-alt" },
  { key: "images", label: "Images", icon: "bi-images" },
  { key: "review", label: "Review & Submit", icon: "bi-send" },
];

const AMENITY_ICONS = {
  is_ac: { icon: "bi-wind", label: "Air Conditioning" },
  parking_available: { icon: "bi-p-circle", label: "Parking" },
  food_provided: { icon: "bi-egg-fried", label: "Food Provided" },
  wifi_available: { icon: "bi-wifi", label: "WiFi" },
  power_backup: { icon: "bi-lightning-charge", label: "Power Backup" },
};

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 6px 20px rgba(0,0,0,.04)",
};

const title = {
  fontWeight: 700,
  fontSize: "1rem",
  marginBottom: 18,
  color: "#111827",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
};

const row = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#374151",
  fontSize: ".94rem",
  marginBottom: 10,
};

const stat = (label, value) => (
  <div
    style={{
      background: "#f8fafc",
      border: "1px solid #eef2f7",
      borderRadius: 12,
      padding: "14px",
    }}
  >
    <div style={{ fontSize: ".78rem", color: "#6b7280" }}>
      {label}
    </div>
    <div
      style={{
        fontWeight: 700,
        color: "#111827",
        marginTop: 4,
      }}
    >
      {value}
    </div>
  </div>
);


const OCCUPANT_LABELS = {
  working_men: "Working Men",
  working_women: "Working Women",
  students_male: "Students (Male)",
  students_female: "Students (Female)",
  family: "Family",
  bachelors: "Bachelors",
};

function formatOccupant(value) {
  return OCCUPANT_LABELS[value] ||
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
}


export default function PropertyDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isEdit = location.pathname.endsWith("/edit");
  const isNew = id === "new";
  const isPublicView = location.pathname.startsWith("/browse-stays");
  const { user } = useContext(AuthContext);

  const [property, setProperty] = useState(null);
  const [currentStep, setCurrentStep] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);


  const [userHasActiveBooking, setUserHasActiveBooking] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "user") return;
    import("../services/bookingService").then(({ getUserBookings }) => {
      getUserBookings().then((bookings) => {
        const hasActive = bookings.some((b) =>
          ["ACTIVE", "CONFIRMED", "APPROVED_AWAITING_PAYMENT", "PENDING"].includes(b.status)
        );
        setUserHasActiveBooking(hasActive);
      }).catch(() => { });
    });
  }, [user]);

  useEffect(() => {
    if (!id || id === "new") return;
    setLoading(true);
    const fetch = async () => {
      try {
        const data = isPublicView
          ? await getPublicPropertyDetail(id)
          : await getOwnerProperty(id);
        setProperty(data);
      } catch {
        toast.error("Unable to load property");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const createDraft = async (payload) => {
    setSaving(true);
    try {
      const data = await createProperty(payload);
      setProperty(data);
      toast.success("Basic info saved");
      navigate(`/owner/properties/${data.id}/edit`, { replace: true });
      return data;
    } finally {
      setSaving(false);
    }
  };

  const saveStep = async (payload, label) => {
    if (!property?.id) throw new Error("Property not created yet");
    setSaving(true);
    try {
      const data = await updateProperty(property.id, payload);
      setProperty(data);
      toast.success(`${label} updated`);
      return data;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!property?.id) return;
    setSaving(true);
    try {
      await submitProperty(property.id);
      toast.success("Listing submitted for admin review");
      navigate("/owner/properties");
    } finally {
      setSaving(false);
    }
  };

  const refreshProperty = async () => {
    if (!property?.id) return;
    const data = await getOwnerProperty(property.id);
    setProperty(data);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner-border" style={{ color: "#10b981", width: 36, height: 36 }}></div>
          <p style={{ color: "#6b7280", marginTop: 12, fontSize: "0.9rem" }}>Loading property...</p>
        </div>
      </div>
    );
  }

  const sharing_options = property?.sharing_options || [];
  const totalBeds = sharing_options.reduce((s, o) => s + o.total_beds, 0);
  const availableBeds = sharing_options.reduce((s, o) => s + o.available_beds, 0);
  const minRent = sharing_options.length
    ? Math.min(...sharing_options.map((o) => Number(o.rent_amount)))
    : null;

  /* ══════════════════════════════════════
     VIEW MODE
  ══════════════════════════════════════ */
  if (!isEdit && property) {
    return (
      <>
        <div style={{ background: "#f8fafc", minHeight: "100vh" }}>

          {/* ── Back button ── */}
          <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 0" }}>
            <div className="container">
              <button
                onClick={() => navigate(isPublicView ? "/browse-stays" : "/owner/properties")}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#6b7280", fontSize: "0.875rem", display: "flex",
                  alignItems: "center", gap: 6, padding: 0,
                }}
              >
                <i className="bi bi-arrow-left"></i>
                {isPublicView ? "Back to Browse Stays" : "Back to My Properties"}
              </button>
            </div>
          </div>

          <div className="container py-4">

            {/* ── Rejection Banner ── */}
            {property.status === "REJECTED" && property.rejection_reason && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 12, padding: "16px 20px", marginBottom: 24,
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <i className="bi bi-exclamation-circle-fill" style={{ color: "#ef4444", fontSize: 18, marginTop: 2 }}></i>
                <div>
                  <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>Property Not Approved</div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>{property.rejection_reason}</div>
                </div>
              </div>
            )}

            {/* ── Image Gallery ── */}
            {property.images?.length > 0 && (
              <ImageGallery
                images={property.images}
                onOpenLightbox={(i) => setLightboxIndex(i)}
              />
            )}


            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: "rgba(16,185,129,0.1)", color: "#059669",
                  fontSize: "0.75rem", fontWeight: 600,
                  padding: "3px 12px", borderRadius: 20,
                }}>
                  {property.stay_type}
                </span>
                <span style={{
                  background: "#f1f5f9", color: "#64748b",
                  fontSize: "0.75rem", fontWeight: 500,
                  padding: "3px 12px", borderRadius: 20,
                }}>
                  {property.status}
                </span>
              </div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                {property.property_name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: "0.9rem" }}>
                <i className="bi bi-geo-alt"></i>
                {[property.area, property.city, property.state].filter(Boolean).join(", ")}
              </div>
              {property.latitude && property.longitude && (
                <PropertyMapView
                  latitude={property.latitude}
                  longitude={property.longitude}
                  title={property.property_name}
                />
              )}
            </div>

            <hr style={{ borderColor: "#e2e8f0", margin: "0 0 24px" }} />


            {/* ── Main Content ── */}
            <div className="row g-4">

              {/* LEFT — Details */}
              <div className="col-12 col-lg-8">

                {/* Preferred Occupants */}
                <div style={{ marginBottom: 28 }}>
                  <h6
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 14,
                      fontSize: "1rem",
                    }}
                  >
                    Preferred For
                  </h6>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    {property.preferred_occupants?.map((occ) => (
                      <div
                        key={occ}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 16px",
                          background: "#ffffff",
                          border: "1px solid #dbeafe",
                          borderRadius: 999,
                          fontSize: ".92rem",
                          fontWeight: 600,
                          color: "#0f172a",
                          boxShadow: "0 4px 10px rgba(0,0,0,.03)",
                          transition: "all .2s ease",
                          cursor: "default",
                        }}
                      >
                        <i
                          className="bi bi-person-check-fill"
                          style={{
                            color: "#10b981",
                            fontSize: "0.9rem",
                          }}
                        ></i>

                        {formatOccupant(occ)}
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ borderColor: "#e2e8f0", margin: "0 0 24px" }} />

                {/* Amenities */}
                <div style={{ marginBottom: 24 }}>
                  <h6 style={{ fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Amenities</h6>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                    {Object.entries(AMENITY_ICONS).map(([key, { icon, label }]) => {
                      const active = property[key];
                      return (
                        <div key={key} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "12px 16px", borderRadius: 10,
                          border: `1px solid ${active ? "#bbf7d0" : "#e2e8f0"}`,
                          background: active ? "rgba(16,185,129,0.05)" : "#f8fafc",
                          opacity: active ? 1 : 0.5,
                        }}>
                          <i className={`bi ${icon}`} style={{ color: active ? "#10b981" : "#9ca3af", fontSize: 18 }}></i>
                          <span style={{ fontSize: "0.82rem", fontWeight: 500, color: active ? "#0f172a" : "#9ca3af" }}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ borderColor: "#e2e8f0", margin: "0 0 24px" }} />

                {/* Capacity */}
                <div style={{ marginBottom: 24 }}>
                  <h6 style={{ fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Capacity & Pricing</h6>

                  {/* Summary pills */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    {[
                      { label: "Total Beds", value: totalBeds },
                      { label: "Available", value: availableBeds, green: true },
                      { label: "Occupied", value: totalBeds - availableBeds },
                    ].map((item) => (
                      <div key={item.label} style={{
                        background: "#f8fafc", border: "1px solid #e2e8f0",
                        borderRadius: 10, padding: "10px 20px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 700, color: item.green ? "#059669" : "#0f172a" }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sharing option cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sharing_options.map((opt) => (
                      <div key={opt.sharing_type} style={{
                        background: "#ffffff", border: "1px solid #e2e8f0",
                        borderRadius: 10, padding: "14px 20px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>
                            {opt.sharing_type}-Sharing
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: 2 }}>
                            {opt.available_beds} of {opt.total_beds} beds available
                            {opt.advance_amount > 0 && ` · Advance ₹${opt.advance_amount}`}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                            ₹{opt.rent_amount}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>/month</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>



                {/* Food info */}
                {property.food_provided && property.food_price && (
                  <>
                    <hr style={{ borderColor: "#e2e8f0", margin: "0 0 24px" }} />
                    <div style={{ marginBottom: 24 }}>
                      <h6 style={{ fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>Food</h6>
                      <div style={{
                        background: "rgba(16,185,129,0.05)", border: "1px solid #bbf7d0",
                        borderRadius: 10, padding: "14px 20px",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <i className="bi bi-egg-fried" style={{ color: "#10b981", fontSize: 22 }}></i>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>Food Available</div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                            ₹{property.food_price}/month — opt in after booking
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: "grid", gap: 18, marginBottom: 24 }}>

                  {/* Property Details */}
                  {(property.security_deposit ||
                    property.notice_period ||
                    property.visiting_hours ||
                    property.floor_info) && (
                      <section style={card}>
                        <h6 style={title}>
                          <i className="bi bi-house-door me-2 text-success"></i>
                          Property Details
                        </h6>

                        <div style={grid2}>
                          {property.security_deposit &&
                            stat("Security Deposit", `₹${property.security_deposit}`)}

                          {property.notice_period &&
                            stat("Notice Period", `${property.notice_period} Days`)}

                          {property.visiting_hours &&
                            stat("Visiting Hours", property.visiting_hours)}

                          {property.floor_info &&
                            stat("Floor", property.floor_info)}
                        </div>
                      </section>
                    )}

                  {/* Rules */}
                  {property.rules_and_regulations && (
                    <section style={card}>
                      <h6 style={title}>
                        <i className="bi bi-shield-check me-2 text-success"></i>
                        Rules & Regulations
                      </h6>

                      <div style={{ display: "grid", gap: 10 }}>
                        {property.rules_and_regulations.split("\n").map((rule, i) => (
                          <div key={i} style={row}>
                            <i className="bi bi-check-circle-fill text-success"></i>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Landmarks */}
                  {property.nearby_landmarks && (
                    <section style={card}>
                      <h6 style={title}>
                        <i className="bi bi-geo-alt me-2 text-success"></i>
                        Nearby Landmarks
                      </h6>

                      {property.nearby_landmarks.split("\n").map((item, i) => (
                        <div key={i} style={row}>
                          <i className="bi bi-pin-map-fill text-success"></i>
                          <span>{item}</span>
                        </div>
                      ))}
                    </section>
                  )}
                </div>

              </div>

              {/* RIGHT — Sticky card */}
              <div className="col-12 col-lg-4">
                <div style={{
                  position: "sticky", top: 88,
                  background: "#ffffff", borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                  padding: "24px",
                  overflow: "hidden",
                }}>
                  {/* Price */}
                  {minRent && (
                    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 4 }}>Starting from</div>
                      <div>
                        <span style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
                          ₹{minRent.toLocaleString("en-IN")}
                        </span>
                        <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>/month</span>
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  <div style={{
                    background: "#f8fafc", borderRadius: 10,
                    padding: "12px 16px", marginBottom: 20,
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Available Beds</span>
                    <span style={{ fontWeight: 700, color: availableBeds > 0 ? "#059669" : "#ef4444" }}>
                      {availableBeds > 0 ? `${availableBeds} beds` : "Full"}
                    </span>
                  </div>

                  {/* Sharing options mini list */}
                  <div style={{ marginBottom: 20 }}>
                    {sharing_options.map((opt) => (
                      <div key={opt.sharing_type} style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "6px 0", borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.85rem",
                      }}>
                        <span style={{ color: "#374151" }}>{opt.sharing_type}-Sharing</span>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>₹{opt.rent_amount}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isPublicView && (!user || user.role === "user") && (
                    <>
                      {userHasActiveBooking ? (
                        <div style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: "13px 16px",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 2 }}>
                            You already have an active stay
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                            Vacate your current stay before booking another
                          </div>
                        </div>
                      ) : availableBeds > 0 ? (
                        <button
                          onClick={() => navigate(`/book/${property.id}`)}
                          style={{
                            width: "100%", padding: "13px",
                            background: "#10b981", color: "#ffffff",
                            border: "none", borderRadius: 10,
                            fontWeight: 600, fontSize: "0.95rem",
                            cursor: "pointer", transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
                        >
                          Request Booking
                        </button>
                      ) : (
                        <button disabled style={{
                          width: "100%", padding: "13px",
                          background: "#e2e8f0", color: "#9ca3af",
                          border: "none", borderRadius: 10,
                          fontWeight: 600, fontSize: "0.95rem",
                          cursor: "not-allowed",
                        }}>
                          No Beds Available
                        </button>
                      )}
                    </>
                  )}

                  {!isPublicView && (
                    <button
                      onClick={() => navigate(`/owner/properties/${property.id}/edit`)}
                      style={{
                        width: "100%", padding: "13px",
                        background: "#10b981", color: "#ffffff",
                        border: "none", borderRadius: 10,
                        fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                      }}
                    >
                      Edit Property
                    </button>
                  )}

                  {/* Deposit note */}
                  {property.security_deposit && (
                    <p style={{ fontSize: "0.78rem", color: "#9ca3af", textAlign: "center", marginTop: 12, marginBottom: 0 }}>
                      Security deposit ₹{property.security_deposit} required
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {lightboxIndex !== null && property?.images?.length > 0 && (
          <ImageLightbox
            images={property.images.map((i) => i.image)}
            currentIndex={lightboxIndex}
            onChange={(i) => { if (i >= 0 && i < property.images.length) setLightboxIndex(i); }}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  /* ══════════════════════════════════════
     EDIT MODE
  ══════════════════════════════════════ */
  if (isNew && !property && currentStep !== "basic") setCurrentStep("basic");

  const completedSteps = [];
  if (property) {
    if (property.property_name) completedSteps.push("basic");
    if (property.sharing_options?.length) completedSteps.push("capacity");
    if (property.rules_and_regulations) completedSteps.push("amenities");
    if (property.city) completedSteps.push("location");
    if (property.images?.length >= 3) completedSteps.push("images");
  }

  return (
    <>
      <div style={{ background: "#f8fafc", minHeight: "100vh", paddingTop: 24 }}>
        <div className="container py-4">
          <div className="row g-4">

            {/* Sidebar */}
            <div className="col-12 col-lg-3">
              <div style={{
                background: "#ffffff", borderRadius: 12,
                border: "1px solid #e2e8f0", padding: "20px",
                position: "sticky", top: 88,
              }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#10b981", letterSpacing: "0.5px", marginBottom: 16 }}>
                  LISTING WIZARD
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {STEPS.map((step) => {
                    const isActive = currentStep === step.key;
                    const isDone = completedSteps.includes(step.key);
                    const isLocked = !property && step.key !== "basic";

                    return (
                      <button
                        key={step.key}
                        onClick={() => !isLocked && setCurrentStep(step.key)}
                        disabled={isLocked || saving}
                        style={{
                          background: isActive ? "rgba(16,185,129,0.08)" : "transparent",
                          border: isActive ? "1px solid #bbf7d0" : "1px solid transparent",
                          borderRadius: 8, padding: "10px 12px",
                          display: "flex", alignItems: "center", gap: 10,
                          cursor: isLocked ? "not-allowed" : "pointer",
                          opacity: isLocked ? 0.4 : 1,
                          transition: "all 0.15s ease",
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          background: isDone ? "#10b981" : isActive ? "rgba(16,185,129,0.15)" : "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12,
                        }}>
                          {isDone
                            ? <i className="bi bi-check" style={{ color: "#fff", fontWeight: 700 }}></i>
                            : <i className={`bi ${step.icon}`} style={{ color: isActive ? "#10b981" : "#9ca3af" }}></i>
                          }
                        </div>
                        <span style={{
                          fontSize: "0.875rem",
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#0f172a" : "#6b7280",
                        }}>
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="col-12 col-lg-9">
              <div style={{
                background: "#ffffff", borderRadius: 12,
                border: "1px solid #e2e8f0", padding: "32px",
              }}>
                {/* Back */}
                <button
                  onClick={() => navigate("/owner/properties")}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: "#6b7280", fontSize: "0.875rem",
                    display: "flex", alignItems: "center", gap: 6,
                    padding: 0, marginBottom: 24,
                  }}
                >
                  <i className="bi bi-arrow-left"></i> Back to Listings
                </button>

                {/* Step title */}
                <div style={{ marginBottom: 28 }}>
                  <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                    {STEPS.find((s) => s.key === currentStep)?.label}
                  </h4>
                  {property?.property_name && (
                    <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
                      {property.property_name}
                    </p>
                  )}
                </div>

                {currentStep === "basic" && (
                  <BasicInfoStep
                    property={property}
                    onCreateDraft={createDraft}
                    onSave={(p) => saveStep(p, "Basic info")}
                  />
                )}
                {property && currentStep === "capacity" && (
                  <CapacityPricingStep
                    property={property}
                    onSave={(p) => saveStep(p, "Capacity & pricing")}
                  />
                )}
                {property && currentStep === "amenities" && (
                  <AmenitiesPoliciesStep
                    property={property}
                    onSave={(p) => saveStep(p, "Amenities & policies")}
                  />
                )}
                {property && currentStep === "location" && (
                  <LocationPicker
                    property={property}
                    onSave={async (p) => {
                      if (!property?.id) throw new Error("Property not created yet");
                      setSaving(true);
                      try {
                        const { updatePropertyLocation } = await import("../services/propertyService");
                        await updatePropertyLocation(property.id, p);
                        const data = await getOwnerProperty(property.id);
                        setProperty(data);
                        toast.success("Location updated");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                )}
                {property && currentStep === "images" && (
                  <ImagesStep property={property} onRefresh={refreshProperty} />
                )}
                {property && currentStep === "review" && (
                  <ReviewSubmitStep property={property} onSubmit={handleSubmit} />
                )}
              </div>
            </div>






          </div>
        </div>
      </div>

      {lightboxIndex !== null && property?.images?.length > 0 && (
        <ImageLightbox
          images={property.images.map((i) => i.image)}
          currentIndex={lightboxIndex}
          onChange={(i) => { if (i >= 0 && i < property.images.length) setLightboxIndex(i); }}
          onClose={() => setLightboxIndex(null)}
        />
      )}





    </>
  );
}





function ImageGallery({ images, onOpenLightbox }) {
  const [activeIndexes, setActiveIndexes] = useState([0, 1, 2]);
  const [fading, setFading] = useState(false);

  const visibleCount = 3;
  const total = images.length;

  useEffect(() => {
    if (total <= visibleCount) return;

    const timer = setInterval(() => {
      setFading(true);

      setTimeout(() => {
        setActiveIndexes((prev) =>
          prev.map((i) => (i + visibleCount) % total)
        );
        setFading(false);
      }, 700);
    }, 5000);

    return () => clearInterval(timer);
  }, [total]);

  const shown = activeIndexes.map(
    (i) => images[Math.min(i, total - 1)]
  );

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 14,
          boxShadow: "0 10px 28px rgba(0,0,0,.05)",
        }}
      >
        {/* Gallery Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            alignItems: "start",
          }}
        >
          {shown.map((img, slot) => {
            if (!img) return null;

            const realIndex = activeIndexes[slot];

            return (
              <div
                key={`${slot}-${img.id}`}
                onClick={() => onOpenLightbox(realIndex)}
                style={{
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "#f8fafc",
                  border: "1px solid #eef2f7",
                  opacity: fading ? 0.55 : 1,
                  transition: "opacity .7s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <img
                  src={img.image}
                  alt=""
                  style={{
                    width: "100%",
                    height: "260px",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform .7s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  onMouseEnter={(e) =>
                  (e.currentTarget.style.transform =
                    "scale(1.04)")
                  }
                  onMouseLeave={(e) =>
                  (e.currentTarget.style.transform =
                    "scale(1)")
                  }
                />

                {/* Gradient */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,.22), transparent 45%)",
                  }}
                />

                {/* Expand icon */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.18)",
                    backdropFilter: "blur(10px)",
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontSize: 14,
                  }}
                >
                  <i className="bi bi-arrows-fullscreen" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {/* Slider dots */}
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({
              length: Math.ceil(total / visibleCount),
            }).map((_, i) => {
              const active =
                Math.floor(activeIndexes[0] / visibleCount) === i;

              return (
                <div
                  key={i}
                  style={{
                    width: active ? 24 : 8,
                    height: 8,
                    borderRadius: 999,
                    background: active
                      ? "#10b981"
                      : "#d1d5db",
                    transition: "all .25s ease",
                  }}
                />
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={() => onOpenLightbox(0)}
            style={{
              border: "none",
              background: "#10b981",
              color: "#fff",
              padding: "11px 18px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: ".92rem",
              cursor: "pointer",
              boxShadow:
                "0 10px 24px rgba(16,185,129,.18)",
            }}
          >
            <i className="bi bi-images me-2" />
            View all {total} photos
          </button>
        </div>
      </div>
    </div>
  );
}

