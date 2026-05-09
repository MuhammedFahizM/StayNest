import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPublicProperties } from "../services/propertyService";
import PropertyCard from "../components/PropertyCard";

const STAY_TYPES = ["GENTS", "LADIES", "UNISEX"];
const OCCUPANTS = ["Working Men", "Working Women", "Students (Male)", "Students (Female)"];
const SHARING_TYPES = [1, 2, 3, 4];

const DEFAULT_FILTERS = {
  search: "",
  city: "",
  area: "",
  stay_type: "",
  preferred_occupants: "",
  sharing_type: "",
  min_rent: "",
  max_rent: "",
  is_ac: false,
  food_provided: false,
  parking_available: false, 
  wifi_available: false,
  power_backup: false,
  has_deposit: false,
};

export default function PublicPropertyList() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

  const fetchProperties = async (params) => {
    setLoading(true);
    try {
      const data = await getPublicProperties(params);
      setProperties(data);
      setError("");
    } catch {
      setError("Unable to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const city = searchParams.get("city");
    if (city) {
      const initialFilters = { ...DEFAULT_FILTERS, city };
      setFilters(initialFilters);
      setApplied(initialFilters);
      fetchProperties(buildParams(initialFilters));
    } else {
      fetchProperties({});
    }
  }, []);

  const handleApply = () => {
    setApplied(filters);
    fetchProperties(buildParams(filters));
    setSidebarOpen(false);
  };

  const handleClear = () => {
  setFilters(DEFAULT_FILTERS);
  setApplied(DEFAULT_FILTERS);
  setNearbyActive(false);
  fetchProperties({});
  setSidebarOpen(false);    
};

  const handleNearby = () => {
  if (nearbyActive) {
    setNearbyActive(false);
    fetchProperties(buildParams(filters));
    return;
  }
  if (!navigator.geolocation) { 
    alert("Geolocation not supported by your browser.");
    return; 
  }
  setNearbyLoading(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setNearbyActive(true);
      setNearbyLoading(false);
      fetchProperties({ ...buildParams(filters), lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 5 });
    },
    () => { 
      setNearbyLoading(false);
      alert("Unable to get your location. Please allow location access.");
    }
  );
};

  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const buildParams = (f) => {
    const p = {};
    if (f.search) p.search = f.search;
    if (f.city) p.city = f.city;
    if (f.area) p.area = f.area;
    if (f.stay_type) p.stay_type = f.stay_type;
    if (f.preferred_occupants) p.preferred_occupants = f.preferred_occupants;
    if (f.sharing_type) p.sharing_type = f.sharing_type;
    if (f.min_rent) p.min_rent = f.min_rent;
    if (f.max_rent) p.max_rent = f.max_rent;
    if (f.is_ac) p.is_ac = "true";
    if (f.food_provided) p.food_provided = "true";
    if (f.parking_available) p.parking_available = "true";
    if (f.wifi_available) p.wifi_available = "true";
    if (f.power_backup) p.power_backup = "true";
    if (f.has_deposit) p.has_deposit = "true";
    return p;
  };

  const activeFilterCount = Object.entries(applied).filter(
    ([, v]) => v !== "" && v !== false
  ).length;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="container py-4">

        {/* Header */}
        <div
          style={{
            marginBottom: 22,
          }}
        >
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-3">
            <div>
              <div
                style={{
                  color: "var(--sn-primary)",
                  fontWeight: 800,
                  fontSize: ".78rem",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Browse Stays
              </div>

              <h1
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(1.8rem,4vw,2.7rem)",
                  marginBottom: 6,
                  lineHeight: 1.08,
                }}
              >
                Find Your Next Stay
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "var(--sn-text-soft)",
                  fontSize: ".96rem",
                }}
              >
                {loading
                  ? "Searching premium listings..."
                  : `${properties.length} verified stays available`}
              </p>
            </div>

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="btn btn-light"
              style={{
                borderRadius: 999,
                padding: "10px 16px",
                border:
                  activeFilterCount > 0
                    ? "1px solid var(--sn-primary)"
                    : "1px solid var(--sn-border)",
                background:
                  activeFilterCount > 0
                    ? "var(--sn-primary-soft)"
                    : "#fff",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <i className="bi bi-sliders2" />

              Filters

              {activeFilterCount > 0 && (
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background:
                      "var(--sn-primary)",
                    color: "#fff",
                    fontSize: ".72rem",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Surface */}
          <div className="row g-2 align-items-center">
  <div className="col-lg-7">
    <div style={{ position: "relative" }}>
      <i className="bi bi-search" style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", color: "var(--sn-text-soft)" }} />
      <input
        type="text"
        placeholder="Search by property, city or locality..."
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        className="form-control"
        style={{ paddingLeft: 42, minHeight: 48, borderRadius: 16 }}
      />
    </div>
  </div>
  <div className="col-sm-6 col-lg-2">
    <input
      type="text"
      placeholder="City"
      value={filters.city}
      onChange={(e) => set("city", e.target.value)}
      className="form-control"
      style={{ minHeight: 48, borderRadius: 16 }}
    />
  </div>
  <div className="col-sm-3 col-lg-2">
    <button
      onClick={handleApply}
      className="btn btn-primary w-100"
      style={{ minHeight: 48, borderRadius: 16, fontWeight: 700 }}
    >
      Search
    </button>
  </div>
  <div className="col-sm-3 col-lg-1">
    <button
      onClick={handleNearby}
      disabled={nearbyLoading}
      title={nearbyActive ? "Clear nearby filter" : "Find stays near me"}
      style={{
        width: "100%", minHeight: 48, borderRadius: 16,
        border: `1px solid ${nearbyActive ? "#10b981" : "#e2e8f0"}`,
        background: nearbyActive ? "#f0fdf4" : "#fafafa",
        color: nearbyActive ? "#059669" : "#6b7280",
        cursor: nearbyLoading ? "wait" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
        fontSize: 18,
      }}
    >
      {nearbyLoading
        ? <span className="spinner-border spinner-border-sm" style={{ width: 16, height: 16 }} />
        : <i className={`bi ${nearbyActive ? "bi-geo-alt-fill" : "bi-geo-alt"}`} />
      }
    </button>
  </div>
</div>
</div>

        {/* Filters + Results Toolbar */}
        <div
          style={{
            marginBottom: 18,
          }}
        >
          {/* Top Row */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
            <div
              style={{
                color: "var(--sn-text-soft)",
                fontSize: ".92rem",
                fontWeight: 600,
              }}
            >
              {!loading &&
                `${properties.length} result${properties.length !== 1
                  ? "s"
                  : ""
                } found`}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: ".84rem",
                  color:
                    "var(--sn-text-soft)",
                  fontWeight: 700,
                }}
              >
                Sort
              </span>

              <div
                style={{
                  padding: "8px 12px",
                  border:
                    "1px solid var(--sn-border)",
                  borderRadius: 999,
                  background: "#fff",
                  fontSize: ".85rem",
                  fontWeight: 700,
                }}
              >
                Recommended
              </div>
            </div>
          </div>

          {/* Chips */}
          {(activeFilterCount > 0 || nearbyActive) && (
  <div className="d-flex flex-wrap gap-2 align-items-center">
              {applied.stay_type && (
                <Chip
                  label={`Stay: ${applied.stay_type}`}
                  onRemove={() => {
                    set(
                      "stay_type",
                      ""
                    );
                    fetchProperties(
                      buildParams({
                        ...filters,
                        stay_type:
                          "",
                      })
                    );
                  }}
                />
              )}

              {applied.city && (
                <Chip
                  label={`City: ${applied.city}`}
                  onRemove={() => {
                    set(
                      "city",
                      ""
                    );
                    fetchProperties(
                      buildParams({
                        ...filters,
                        city: "",
                      })
                    );
                  }}
                />
              )}

              {applied.area && (
                <Chip
                  label={`Area: ${applied.area}`}
                  onRemove={() => {
                    set(
                      "area",
                      ""
                    );
                    fetchProperties(
                      buildParams({
                        ...filters,
                        area: "",
                      })
                    );
                  }}
                />
              )}

              {applied.sharing_type && (
                <Chip
                  label={`${applied.sharing_type}-Sharing`}
                  onRemove={() => {
                    set(
                      "sharing_type",
                      ""
                    );
                    fetchProperties(
                      buildParams({
                        ...filters,
                        sharing_type:
                          "",
                      })
                    );
                  }}
                />
              )}

              {applied.is_ac && (
                <Chip
                  label="AC"
                  onRemove={() => {
                    set(
                      "is_ac",
                      false
                    );
                    fetchProperties(
                      buildParams({
                        ...filters,
                        is_ac:
                          false,
                      })
                    );
                  }}
                />
              )}

              {applied.food_provided && (
                <Chip
                  label="Food"
                  onRemove={() => {
                    set(
                      "food_provided",
                      false
                    );
                    fetchProperties(
                      buildParams({
                        ...filters,
                        food_provided:
                          false,
                      })
                    );
                  }}
                />
              )}

              {nearbyActive && (
  <Chip
    label="Nearby (5km)"
    onRemove={() => {
      setNearbyActive(false);
      fetchProperties(buildParams(filters));
    }}
  />
)}

              <button
                onClick={
                  handleClear
                }
                style={{
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "var(--sn-danger)",
                  fontSize: ".84rem",
                  fontWeight: 800,
                  padding:
                    "6px 4px",
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#dc2626",
            fontSize: "0.875rem",
            marginBottom: 16,
          }}>
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6].map(
              (i) => (
                <div
                  key={i}
                  className="col-12 col-md-6 col-xl-4"
                >
                  <div
                    style={{
                      background:
                        "#fff",
                      border:
                        "1px solid var(--sn-border)",
                      borderRadius: 24,
                      overflow:
                        "hidden",
                      boxShadow:
                        "var(--sn-shadow-sm)",
                    }}
                  >
                    <div
                      className="placeholder"
                      style={{
                        height: 230,
                        width: "100%",
                      }}
                    />

                    <div
                      style={{
                        padding: 18,
                      }}
                    >
                      <div
                        className="placeholder mb-3"
                        style={{
                          height: 18,
                          width: "70%",
                        }}
                      />

                      <div
                        className="placeholder mb-2"
                        style={{
                          height: 14,
                          width: "45%",
                        }}
                      />

                      <div
                        className="placeholder"
                        style={{
                          height: 14,
                          width: "35%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          properties.length ===
          0 && (
            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px solid var(--sn-border)",
                borderRadius: 28,
                padding:
                  "64px 24px",
                textAlign:
                  "center",
                boxShadow:
                  "var(--sn-shadow-sm)",
              }}
            >
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius:
                    "50%",
                  background:
                    "var(--sn-primary-soft)",
                  color:
                    "var(--sn-primary)",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  margin:
                    "0 auto 18px",
                  fontSize: 26,
                }}
              >
                <i className="bi bi-search" />
              </div>

              <h4
                style={{
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                No stays found
              </h4>

              <p
                style={{
                  color:
                    "var(--sn-text-soft)",
                  maxWidth: 460,
                  margin:
                    "0 auto 18px",
                  lineHeight: 1.7,
                }}
              >
                Try changing your
                city, rent range,
                amenities or other
                filters.
              </p>

              <button
                onClick={
                  handleClear
                }
                className="btn btn-primary"
                style={{
                  borderRadius: 999,
                  padding:
                    "10px 18px",
                  fontWeight: 700,
                }}
              >
                Reset Filters
              </button>
            </div>
          )}


        {/* Property Grid */}
        {!loading && properties.length > 0 && (
          <div
            style={{
              marginTop: 10,
            }}
          >
            <div className="row g-4">
              {properties.map(
                (
                  property,
                  index
                ) => (
                  <div
                    key={
                      property.id
                    }
                    className="col-12 col-md-6 col-xl-4"
                  >
                    <div
                      className={`sn-reveal sn-delay-${(index %
                          6) +
                        1
                        }`}
                    >
                      <PropertyCard
                        property={
                          property
                        }
                        onClick={() =>
                          navigate(
                            `/browse-stays/${property.id}`
                          )
                        }
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Bottom spacing */}
            <div
              style={{
                height: 10,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Filter Sidebar ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 1040,
              animation: "fadeIn 0.2s ease",
            }}
          />

          {/* Sidebar */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(420px,100%)",
              background:
                "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)",
              zIndex: 1050,
              display: "flex",
              flexDirection: "column",
              boxShadow:
                "-20px 0 50px rgba(0,0,0,.14)",
              borderLeft:
                "1px solid var(--sn-border)",
              animation:
                "slideInRight .24s ease",
            }}
          >
            {/* Sidebar Header */}
            <div
              style={{
                padding: "22px 22px 18px",
                borderBottom:
                  "1px solid var(--sn-border)",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                background:
                  "rgba(255,255,255,.78)",
                backdropFilter:
                  "blur(12px)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: ".78rem",
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform:
                      "uppercase",
                    color:
                      "var(--sn-primary)",
                    marginBottom: 4,
                  }}
                >
                  Refine Search
                </div>

                <h5
                  style={{
                    margin: 0,
                    fontWeight: 800,
                  }}
                >
                  Filters
                </h5>

                {activeFilterCount >
                  0 && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: ".82rem",
                        color:
                          "var(--sn-text-soft)",
                      }}
                    >
                      {activeFilterCount} active
                    </div>
                  )}
              </div>

              <button
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border:
                    "1px solid var(--sn-border)",
                  background:
                    "#fff",
                }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Sidebar Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "22px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* City */}
                <FilterSection label="City">
                  <input
                    type="text"
                    placeholder="e.g. Kochi"
                    value={filters.city}
                    onChange={(e) => set("city", e.target.value)}
                    style={filterInputStyle}
                  />
                </FilterSection>

                {/* Area */}
                <FilterSection label="Area / Locality">
                  <input
                    type="text"
                    placeholder="e.g. Kakkanad"
                    value={filters.area}
                    onChange={(e) => set("area", e.target.value)}
                    style={filterInputStyle}
                  />
                </FilterSection>

                {/* Stay Type */}
                <FilterSection label="Stay Type">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STAY_TYPES.map((t) => (
                      <FilterToggleBtn
                        key={t}
                        label={t}
                        active={filters.stay_type === t}
                        onClick={() => set("stay_type", filters.stay_type === t ? "" : t)}
                      />
                    ))}
                  </div>
                </FilterSection>

                {/* Preferred Occupants */}
                <FilterSection label="Preferred Occupants">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {OCCUPANTS.map((o) => (
                      <FilterToggleBtn
                        key={o}
                        label={o}
                        active={filters.preferred_occupants === o}
                        onClick={() => set("preferred_occupants", filters.preferred_occupants === o ? "" : o)}
                        fullWidth
                      />
                    ))}
                  </div>
                </FilterSection>

                {/* Sharing Type */}
                <FilterSection label="Sharing Type">
                  <div style={{ display: "flex", gap: 8 }}>
                    {SHARING_TYPES.map((t) => (
                      <FilterToggleBtn
                        key={t}
                        label={`${t}`}
                        active={filters.sharing_type === t}
                        onClick={() => set("sharing_type", filters.sharing_type === t ? "" : t)}
                      />
                    ))}
                  </div>
                </FilterSection>

                {/* Rent Range */}
                <FilterSection label="Rent Range (₹/month)">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_rent}
                      onChange={(e) => set("min_rent", e.target.value)}
                      style={{ ...filterInputStyle, flex: 1 }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_rent}
                      onChange={(e) => set("max_rent", e.target.value)}
                      style={{ ...filterInputStyle, flex: 1 }}
                    />
                  </div>
                </FilterSection>

                {/* Amenities */}
                <FilterSection label="Amenities">
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { key: "is_ac", label: "Air Conditioning", icon: "bi-snow" },
                      { key: "food_provided", label: "Food Provided", icon: "bi-egg-fried" },
                      { key: "parking_available", label: "Parking", icon: "bi-p-circle" },
                      { key: "wifi_available", label: "WiFi", icon: "bi-wifi" },
                      { key: "power_backup", label: "Power Backup", icon: "bi-lightning" },
                      { key: "has_deposit", label: "Has Security Deposit", icon: "bi-shield" },
                    ].map(({ key, label, icon }) => (
                      <div
                        key={key}
                        onClick={() => set(key, !filters[key])}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${filters[key] ? "#bbf7d0" : "#e2e8f0"}`,
                          background: filters[key] ? "#f0fdf4" : "#fafafa",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <i className={`bi ${icon}`} style={{ color: filters[key] ? "#10b981" : "#9ca3af", fontSize: 14 }}></i>
                          <span style={{ fontSize: "0.875rem", color: filters[key] ? "#059669" : "#374151", fontWeight: filters[key] ? 500 : 400 }}>
                            {label}
                          </span>
                        </div>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${filters[key] ? "#10b981" : "#d1d5db"}`,
                          background: filters[key] ? "#10b981" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}>
                          {filters[key] && (
                            <i className="bi bi-check" style={{ color: "#fff", fontSize: 11 }}></i>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </FilterSection>

              </div>
            </div>

            {/* Sidebar Footer */}
            <div
              style={{
                padding: "18px 22px 24px",
                borderTop:
                  "1px solid var(--sn-border)",
                background:
                  "rgba(255,255,255,.86)",
                backdropFilter:
                  "blur(12px)",
                display: "grid",
                gap: 10,
              }}
            >
              <button
                onClick={
                  handleApply
                }
                className="btn btn-primary"
                style={{
                  minHeight: 48,
                  borderRadius: 16,
                  fontWeight: 800,
                }}
              >
                Apply Filters
              </button>

              <button
                onClick={
                  handleClear
                }
                className="btn btn-light"
                style={{
                  minHeight: 46,
                  borderRadius: 16,
                  fontWeight: 700,
                  border:
                    "1px solid var(--sn-border)",
                }}
              >
                Reset All
              </button>
            </div>

          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}


/* ── Helper components ── */
function Chip({ label, onRemove }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "#f0fdf4",
      color: "#059669",
      border: "1px solid #bbf7d0",
      borderRadius: 20,
      fontSize: "0.78rem",
      fontWeight: 500,
      padding: "4px 10px",
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#6b7280",
          padding: 0,
          fontSize: 11,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        ✕
      </button>
    </span>
  );
}

function FilterSection({ label, children }) {
  return (
    <div>
      <label style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 8,
        display: "block",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterToggleBtn({ label, active, onClick, fullWidth }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        border: `1px solid ${active ? "#10b981" : "#e2e8f0"}`,
        borderRadius: 8,
        background: active ? "#f0fdf4" : "#fafafa",
        color: active ? "#059669" : "#374151",
        fontSize: "0.82rem",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s ease",
        width: fullWidth ? "100%" : "auto",
        textAlign: fullWidth ? "left" : "center",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "#10b981";
          e.currentTarget.style.color = "#059669";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.color = "#374151";
        }
      }}
    >
      {label}
    </button>
  );
}

const filterInputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: "0.875rem",
  color: "#0f172a",
  outline: "none",
  background: "#fafafa",
};