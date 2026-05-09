import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createBooking } from "../services/bookingService";
import { getPublicPropertyDetail } from "../services/propertyService";
import toast from "react-hot-toast";

export default function BookingRequestPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [selectedSharing, setSelectedSharing] = useState(null);
  const [wantFood, setWantFood] = useState(false);
  const [foodStartFrom, setFoodStartFrom] = useState("next");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPublicPropertyDetail(propertyId)
      .then(setProperty)
      .catch(() => {
        toast.error("Property not found");
        navigate("/browse-stays");
      });
  }, [propertyId, navigate]);

  const handleBooking = async () => {
    if (!selectedSharing) {
      toast.error("Select a room option");
      return;
    }

    try {
      setLoading(true);

      await createBooking({
        property: property.id,
        sharing_option: selectedSharing.id,
      });

      if (wantFood && property.food_provided) {
        localStorage.setItem(
          `food_intent_${property.id}`,
          foodStartFrom
        );
      }

      toast.success("Booking request sent");
      navigate("/user/stays");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Unable to create booking";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="spinner-border text-success" />
          <p
            style={{
              marginTop: 12,
              color: "#64748b",
            }}
          >
            Loading property...
          </p>
        </div>
      </div>
    );
  }

  const amenities = [
    property.is_ac && "AC",
    property.food_provided && "Food",
    property.wifi_available && "WiFi",
    property.parking_available && "Parking",
    property.power_backup && "Power Backup",
  ].filter(Boolean);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#ffffff 100%)",
        padding: "28px 0 60px",
      }}
    >
      <div
        className="container"
        style={{ maxWidth: 1180 }}
      >
        {/* Back */}
        <button
          onClick={() =>
            navigate(
              `/browse-stays/${property.id}`
            )
          }
          style={backBtn}
        >
          <i className="bi bi-arrow-left" />
          Back to Property
        </button>

        <div className="row g-4">
          {/* LEFT */}
          <div className="col-12 col-lg-5">
            <div style={card}>
              {/* image */}
              <div
                style={{
                  height: 250,
                  overflow: "hidden",
                  borderRadius:
                    "22px 22px 0 0",
                }}
              >
                {property.images?.length ? (
                  <img
                    src={
                      property.images[0]
                        .image
                    }
                    alt=""
                    style={{
                      width: "100%",
                      height:
                        "100%",
                      objectFit:
                        "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height:
                        "100%",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      background:
                        "linear-gradient(135deg,#dcfce7,#ecfdf5)",
                    }}
                  >
                    <i
                      className="bi bi-building"
                      style={{
                        fontSize: 42,
                        color:
                          "#10b981",
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ padding: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 12,
                    alignItems:
                      "flex-start",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        fontSize:
                          "1.12rem",
                        color:
                          "#0f172a",
                      }}
                    >
                      {
                        property.property_name
                      }
                    </h3>

                    <p
                      style={{
                        margin:
                          "8px 0 0",
                        color:
                          "#64748b",
                        fontSize:
                          ".9rem",
                      }}
                    >
                      <i className="bi bi-geo-alt me-1" />
                      {property.area
                        ? `${property.area}, `
                        : ""}
                      {property.city},{" "}
                      {
                        property.state
                      }
                    </p>
                  </div>

                  <span
                    style={
                      badge
                    }
                  >
                    {
                      property.stay_type
                    }
                  </span>
                </div>

                {/* Amenities */}
                {amenities.length >
                  0 && (
                  <div
                    style={{
                      display:
                        "flex",
                      gap: 8,
                      flexWrap:
                        "wrap",
                      marginTop: 18,
                    }}
                  >
                    {amenities.map(
                      (
                        item
                      ) => (
                        <span
                          key={
                            item
                          }
                          style={
                            miniBadge
                          }
                        >
                          {
                            item
                          }
                        </span>
                      )
                    )}
                  </div>
                )}

                {/* rules */}
                {property.rules_and_regulations && (
                  <div
                    style={{
                      marginTop: 22,
                      padding: 16,
                      borderRadius: 16,
                      background:
                        "#f8fafc",
                      border:
                        "1px solid #eef2f7",
                    }}
                  >
                    <div
                      style={
                        sectionLabel
                      }
                    >
                      House Rules
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color:
                          "#475569",
                        fontSize:
                          ".88rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {property.rules_and_regulations.slice(
                        0,
                        160
                      )}
                      {property
                        .rules_and_regulations
                        .length >
                        160 &&
                        "..."}
                    </p>
                  </div>
                )}

                {/* rows */}
                <div
                  style={{
                    marginTop: 18,
                    display:
                      "grid",
                    gap: 10,
                  }}
                >
                  {property.security_deposit ? (
                    <InfoRow
                      label="Security Deposit"
                      value={`₹${Number(
                        property.security_deposit
                      ).toLocaleString(
                        "en-IN"
                      )}`}
                    />
                  ) : null}

                  {property.notice_period ? (
                    <InfoRow
                      label="Notice Period"
                      value={`${property.notice_period} days`}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-12 col-lg-7">
            <div
              style={{
                ...card,
                padding: 28,
              }}
            >
              <div
                style={{
                  color:
                    "#10b981",
                  fontSize:
                    ".76rem",
                  fontWeight: 800,
                  letterSpacing:
                    ".06em",
                  textTransform:
                    "uppercase",
                  marginBottom: 8,
                }}
              >
                Booking Request
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "1.45rem",
                  fontWeight: 800,
                  color:
                    "#0f172a",
                }}
              >
                Choose your room
              </h2>

              <p
                style={{
                  marginTop: 8,
                  color:
                    "#64748b",
                  fontSize:
                    ".92rem",
                }}
              >
                Select a room
                type and send
                request to the
                owner.
              </p>

              {/* Sharing */}
              <div
                style={{
                  marginTop: 24,
                }}
              >
                <div
                  style={
                    sectionLabel
                  }
                >
                  Sharing Options
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {property.sharing_options.map(
                    (
                      option
                    ) => {
                      const active =
                        selectedSharing?.id ===
                        option.id;

                      const available =
                        option.available_beds >
                        0;

                      return (
                        <div
                          key={
                            option.id
                          }
                          onClick={() =>
                            available &&
                            setSelectedSharing(
                              option
                            )
                          }
                          style={{
                            border:
                              active
                                ? "2px solid #10b981"
                                : "1px solid #e2e8f0",
                            background:
                              active
                                ? "#ecfdf5"
                                : "#fff",
                            borderRadius: 18,
                            padding: 18,
                            cursor:
                              available
                                ? "pointer"
                                : "not-allowed",
                            opacity:
                              available
                                ? 1
                                : 0.55,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap: 14,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                {
                                  option.sharing_type
                                }
                                -Sharing
                              </div>

                              <div
                                style={{
                                  marginTop: 5,
                                  fontSize:
                                    ".82rem",
                                  color:
                                    available
                                      ? "#059669"
                                      : "#ef4444",
                                }}
                              >
                                {available
                                  ? `${option.available_beds} beds available`
                                  : "Unavailable"}
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign:
                                  "right",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 800,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                ₹
                                {Number(
                                  option.rent_amount
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </div>

                              <div
                                style={{
                                  fontSize:
                                    ".78rem",
                                  color:
                                    "#94a3b8",
                                }}
                              >
                                /month
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Food */}
              {property.food_provided &&
                property.food_price && (
                  <div
                    style={{
                      marginTop: 24,
                    }}
                  >
                    <div
                      style={
                        sectionLabel
                      }
                    >
                      Food Option
                    </div>

                    <div
                      onClick={() =>
                        setWantFood(
                          !wantFood
                        )
                      }
                      style={{
                        marginTop: 12,
                        border:
                          wantFood
                            ? "2px solid #10b981"
                            : "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 18,
                        cursor:
                          "pointer",
                        background:
                          wantFood
                            ? "#ecfdf5"
                            : "#fff",
                      }}
                    >
                      Include Food
                      (+ ₹
                      {Number(
                        property.food_price
                      ).toLocaleString(
                        "en-IN"
                      )}
                      /month)
                    </div>

                    {wantFood && (
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 10,
                          marginTop: 12,
                        }}
                      >
                        {[
                          "current",
                          "next",
                        ].map(
                          (
                            val
                          ) => (
                            <button
                              key={
                                val
                              }
                              type="button"
                              onClick={() =>
                                setFoodStartFrom(
                                  val
                                )
                              }
                              style={{
                                flex: 1,
                                height: 44,
                                borderRadius: 14,
                                border:
                                  foodStartFrom ===
                                  val
                                    ? "2px solid #10b981"
                                    : "1px solid #dbe2ea",
                                background:
                                  foodStartFrom ===
                                  val
                                    ? "#ecfdf5"
                                    : "#fff",
                                fontWeight: 700,
                              }}
                            >
                              {val ===
                              "current"
                                ? "This Month"
                                : "Next Month"}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Summary */}
              {selectedSharing && (
                <div
                  style={{
                    marginTop: 24,
                    padding: 18,
                    borderRadius: 18,
                    background:
                      "#f8fafc",
                    border:
                      "1px solid #eef2f7",
                  }}
                >
                  <div
                    style={
                      sectionLabel
                    }
                  >
                    Summary
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display:
                        "grid",
                      gap: 8,
                    }}
                  >
                    <InfoRow
                      label="Room"
                      value={`${selectedSharing.sharing_type}-Sharing`}
                    />
                    <InfoRow
                      label="Rent"
                      value={`₹${Number(
                        selectedSharing.rent_amount
                      ).toLocaleString(
                        "en-IN"
                      )}/month`}
                    />
                    <InfoRow
                      label="Advance"
                      value={`₹${Number(
                        selectedSharing.advance_amount ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}`}
                    />
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={
                  handleBooking
                }
                disabled={
                  !selectedSharing ||
                  loading
                }
                style={{
                  width: "100%",
                  height: 54,
                  marginTop: 26,
                  border: "none",
                  borderRadius: 16,
                  background:
                    !selectedSharing
                      ? "#e2e8f0"
                      : "linear-gradient(135deg,#10b981,#059669)",
                  color:
                    !selectedSharing
                      ? "#94a3b8"
                      : "#fff",
                  fontWeight: 800,
                  boxShadow:
                    !selectedSharing
                      ? "none"
                      : "0 14px 28px rgba(16,185,129,.18)",
                }}
              >
                {loading
                  ? "Submitting..."
                  : selectedSharing
                  ? "Confirm Booking Request"
                  : "Select a Room"}
              </button>

              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  textAlign:
                    "center",
                  fontSize:
                    ".8rem",
                  color:
                    "#94a3b8",
                }}
              >
                Owner approval
                required before
                booking starts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 12,
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontSize: ".88rem",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#0f172a",
          fontWeight: 700,
          fontSize: ".88rem",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  boxShadow:
    "0 10px 30px rgba(15,23,42,.05)",
  overflow: "hidden",
};

const badge = {
  background: "#ecfdf5",
  color: "#059669",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: ".72rem",
  fontWeight: 800,
};

const miniBadge = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: ".76rem",
  color: "#475569",
  fontWeight: 700,
};

const sectionLabel = {
  fontSize: ".76rem",
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: ".05em",
};

const backBtn = {
  border: "none",
  background: "transparent",
  padding: 0,
  marginBottom: 18,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#64748b",
  fontWeight: 700,
  cursor: "pointer",
};