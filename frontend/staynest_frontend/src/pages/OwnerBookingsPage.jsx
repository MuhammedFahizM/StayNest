import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function OwnerBookingsPage() {
  const [properties, setProperties] =
    useState([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const navigate =
    useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties =
    async () => {
      try {
        const res =
          await api.get(
            "/owner/properties/"
          );

        setProperties(
          res.data || []
        );
      } catch {
        toast.error(
          "Unable to load properties"
        );
      } finally {
        setPageLoading(false);
      }
    };

  const getLowestRent = (
    options = []
  ) => {
    if (!options.length)
      return null;

    return Math.min(
      ...options.map((o) =>
        Number(
          o.rent_amount
        )
      )
    );
  };

  if (pageLoading) {
    return (
      <div
        style={page}
        className="sn-page-enter"
      >
        <div
          className="container py-5 text-center"
          style={{
            paddingTop: 120,
          }}
        >
          <div className="spinner-border text-success mb-3" />
          <p style={muted}>
            Loading properties...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={page}
      className="sn-page-enter"
    >
      <div className="container py-4">
        {/* Back */}
        <button
          onClick={() =>
            navigate(
              "/owner/dashboard"
            )
          }
          style={backBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.color =
              "#10b981";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "#64748b";
          }}
        >
          <i className="bi bi-arrow-left" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div
          style={hero}
          className="sn-reveal"
        >
          <div>
            <div style={tag}>
              BOOKINGS
            </div>

            <h2 style={heroTitle}>
              Manage Bookings
            </h2>

            <p style={heroText}>
              Select a property to
              review booking
              requests.
            </p>
          </div>

          <div style={heroStat}>
            <i className="bi bi-building me-2" />
            {properties.length}{" "}
            Properties
          </div>
        </div>

        {/* Empty */}
        {properties.length ===
          0 && (
          <div
            style={emptyCard}
            className="sn-reveal sn-delay-1"
          >
            <div
              style={
                emptyIconWrap
              }
            >
              <i
                className="bi bi-building"
                style={{
                  fontSize: 28,
                  color:
                    "#10b981",
                }}
              />
            </div>

            <h5
              style={{
                fontWeight: 800,
                color:
                  "#0f172a",
                marginBottom: 8,
              }}
            >
              No properties found
            </h5>

            <p style={muted}>
              Add a property first
              to manage bookings.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/owner/properties/new"
                )
              }
              style={
                primaryBtn
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 26px rgba(16,185,129,.20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "none";
              }}
            >
              <i className="bi bi-plus-circle me-2" />
              Add Property
            </button>
          </div>
        )}

        {/* Grid */}
        {properties.length >
          0 && (
          <div className="row g-4">
            {properties.map(
              (
                property,
                index
              ) => {
                const lowestRent =
                  getLowestRent(
                    property.sharing_options
                  );

                return (
                  <div
                    key={
                      property.id
                    }
                    className={`col-12 col-md-6 col-lg-4 sn-reveal sn-delay-${
                      index + 1 >
                      5
                        ? 5
                        : index +
                          1
                    }`}
                  >
                    <div
                      style={
                        card
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-6px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 34px rgba(15,23,42,.10)";
                        e.currentTarget.style.borderColor =
                          "#10b981";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 22px rgba(15,23,42,.04)";
                        e.currentTarget.style.borderColor =
                          "#e2e8f0";
                      }}
                    >
                      {/* Image */}
                      <div
                        style={
                          imageWrap
                        }
                      >
                        {property
                          .images
                          ?.length >
                        0 ? (
                          <img
                            src={
                              property
                                .images[0]
                                .image
                            }
                            alt={
                              property.property_name
                            }
                            style={
                              image
                            }
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform =
                                "scale(1)";
                            }}
                          />
                        ) : (
                          <div
                            style={
                              placeholder
                            }
                          >
                            <i
                              className="bi bi-building"
                              style={{
                                fontSize: 34,
                                color:
                                  "#10b981",
                              }}
                            />
                          </div>
                        )}

                        <span
                          style={
                            typePill
                          }
                        >
                          <i className="bi bi-house-door me-1" />
                          {
                            property.stay_type
                          }
                        </span>
                      </div>

                      {/* Body */}
                      <div
                        style={
                          body
                        }
                      >
                        <h6
                          style={
                            title
                          }
                        >
                          {
                            property.property_name
                          }
                        </h6>

                        <p
                          style={
                            location
                          }
                        >
                          <i className="bi bi-geo-alt-fill me-1" />
                          {property.area
                            ? `${property.area}, `
                            : ""}
                          {
                            property.city
                          }
                        </p>

                        {lowestRent && (
                          <div
                            style={{
                              marginBottom: 14,
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  ".72rem",
                                color:
                                  "#94a3b8",
                                marginBottom: 2,
                              }}
                            >
                              Starting from
                            </div>

                            <div>
                              <span
                                style={{
                                  fontSize:
                                    "1.12rem",
                                  fontWeight: 800,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                ₹
                                {lowestRent.toLocaleString(
                                  "en-IN"
                                )}
                              </span>

                              <span
                                style={{
                                  fontSize:
                                    ".8rem",
                                  color:
                                    "#94a3b8",
                                  marginLeft: 4,
                                }}
                              >
                                /month
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() =>
                            navigate(
                              `/owner/bookings/${property.id}`
                            )
                          }
                          style={{
                            ...primaryBtn,
                            width:
                              "100%",
                            marginTop:
                              "auto",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.background =
                              "#059669";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(0)";
                            e.currentTarget.style.background =
                              "linear-gradient(135deg,#10b981,#059669)";
                          }}
                        >
                          <i className="bi bi-calendar2-check me-2" />
                          Manage Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* styles */

const page = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#f8fafc,#ffffff)",
};

const backBtn = {
  border: "none",
  background:
    "transparent",
  color: "#64748b",
  padding: 0,
  marginBottom: 18,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: ".92rem",
  transition:
    "all .2s ease",
};

const hero = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 24,
  marginBottom: 20,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
  boxShadow:
    "0 10px 24px rgba(15,23,42,.05)",
};

const tag = {
  color: "#10b981",
  fontWeight: 800,
  fontSize: ".74rem",
  letterSpacing:
    ".08em",
};

const heroTitle = {
  margin: "4px 0",
  fontWeight: 800,
  color: "#0f172a",
};

const heroText = {
  margin: 0,
  color: "#64748b",
};

const heroStat = {
  padding:
    "10px 14px",
  borderRadius: 14,
  background:
    "#ecfdf5",
  color: "#059669",
  fontWeight: 700,
  fontSize: ".88rem",
};

const card = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 18,
  overflow: "hidden",
  height: "100%",
  display: "flex",
  flexDirection:
    "column",
  boxShadow:
    "0 10px 22px rgba(15,23,42,.04)",
  transition:
    "all .25s ease",
};

const imageWrap = {
  height: 190,
  position:
    "relative",
  overflow: "hidden",
};

const image = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition:
    "transform .35s ease",
};

const placeholder = {
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  background:
    "linear-gradient(135deg,#ecfdf5,#d1fae5)",
};

const typePill = {
  position:
    "absolute",
  top: 12,
  left: 12,
  padding:
    "5px 10px",
  borderRadius: 999,
  background:
    "rgba(15,23,42,.68)",
  color: "#fff",
  fontSize: ".72rem",
  fontWeight: 700,
};

const body = {
  padding: 16,
  display: "flex",
  flexDirection:
    "column",
  flex: 1,
};

const title = {
  fontWeight: 700,
  color: "#0f172a",
  fontSize: ".96rem",
  marginBottom: 6,
  whiteSpace:
    "nowrap",
  overflow: "hidden",
  textOverflow:
    "ellipsis",
};

const location = {
  color: "#64748b",
  fontSize: ".82rem",
  marginBottom: 14,
};

const primaryBtn = {
  height: 44,
  border: "none",
  borderRadius: 12,
  padding:
    "0 16px",
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  color: "#fff",
  fontWeight: 700,
  fontSize: ".88rem",
  transition:
    "all .2s ease",
};

const emptyCard = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 54,
  textAlign: "center",
};

const emptyIconWrap = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background:
    "#ecfdf5",
  display: "grid",
  placeItems: "center",
  margin:
    "0 auto 16px",
};

const muted = {
  color: "#64748b",
  marginBottom: 18,
};