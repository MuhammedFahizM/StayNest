import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublicProperties } from "../services/propertyService";
import { AuthContext } from "../context/AuthContext";

import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";
import SectionHeader from "../components/ui/SectionHeader";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [properties, setProperties] = useState([]);
  const [searchCity, setSearchCity] = useState("");

  useEffect(() => {
    getPublicProperties({})
      .then((data) => setProperties(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    if (searchCity.trim()) {
      navigate(
        `/browse-stays?city=${encodeURIComponent(
          searchCity.trim()
        )}`
      );
    } else {
      navigate("/browse-stays");
    }
  };

  return (
    <div>
      {/* HERO */}
      {/* HERO */}
<section
  style={{
    position: "relative",
    overflow: "hidden",
    minHeight: "96vh",
    display: "flex",
    alignItems: "center",
    marginTop: "-64px",
    paddingTop: "96px",
    background:
      "radial-gradient(circle at 15% 20%, rgba(16,185,129,.16), transparent 28%), radial-gradient(circle at 85% 25%, rgba(59,130,246,.10), transparent 24%), linear-gradient(180deg,#0f172a 0%, #111827 100%)",
  }}
>
  {/* Ambient Blur */}
  <div
    style={{
      position: "absolute",
      width: 320,
      height: 320,
      borderRadius: "50%",
      background:
        "rgba(16,185,129,.10)",
      filter: "blur(90px)",
      top: 40,
      right: -80,
    }}
  />

  <div className="sn-container position-relative">
    <div className="row align-items-center g-5">
      {/* LEFT */}
      <div className="col-lg-7 sn-page-enter">
        <Badge variant="primary" size="lg">
          India’s Trusted PG & Hostel Platform
        </Badge>

        <h1
          style={{
            marginTop: 22,
            color: "#fff",
            fontWeight: 800,
            fontSize:
              "clamp(2.6rem,6vw,5rem)",
            lineHeight: 1.03,
            letterSpacing: "-0.045em",
            maxWidth: 760,
          }}
        >
          Stay Better.
          <br />
          Live Smarter with{" "}
          <span
            style={{
              color:
                "var(--sn-primary)",
            }}
          >
            StayNest
          </span>
        </h1>

        <p
          style={{
            marginTop: 20,
            color:
              "rgba(255,255,255,.70)",
            fontSize: "1.08rem",
            lineHeight: 1.85,
            maxWidth: 620,
          }}
        >
          Discover verified stays for
          students and professionals.
          Transparent pricing, secure
          booking, and zero hassle move-ins.
        </p>

        {/* Search Bar */}
        <div
          style={{
            marginTop: 30,
            maxWidth: 650,
            padding: 10,
            borderRadius: 24,
            background:
              "rgba(255,255,255,.06)",
            border:
              "1px solid rgba(255,255,255,.08)",
            backdropFilter:
              "blur(16px)",
          }}
        >
          <div className="d-flex flex-column flex-md-row gap-2">
            <div
              style={{
                flex: 1,
                position:
                  "relative",
              }}
            >
              <i
                className="bi bi-geo-alt"
                style={{
                  position:
                    "absolute",
                  left: 16,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  color:
                    "rgba(255,255,255,.45)",
                }}
              />

              <input
                type="text"
                value={searchCity}
                onChange={(e) =>
                  setSearchCity(
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  e.key ===
                    "Enter" &&
                  handleSearch()
                }
                placeholder="Search city or locality..."
                className="form-control"
                style={{
                  paddingLeft: 42,
                  background:
                    "rgba(255,255,255,.04)",
                  border:
                    "1px solid rgba(255,255,255,.08)",
                  color: "#fff",
                }}
              />
            </div>

            <Button
              size="lg"
              onClick={
                handleSearch
              }
            >
              Find Stays
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            ["500+", "Verified Stays"],
            ["1200+", "Happy Users"],
            ["4.8★", "Average Rating"],
          ].map((item, i) => (
            <div key={i}>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize:
                    "1.3rem",
                }}
              >
                {item[0]}
              </div>

              <div
                style={{
                  color:
                    "rgba(255,255,255,.55)",
                  fontSize:
                    ".82rem",
                }}
              >
                {item[1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="col-lg-5 d-none d-lg-block">
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {[
            [
              "bi-building",
              "Premium Properties",
            ],
            [
              "bi-shield-check",
              "Verified Owners",
            ],
            [
              "bi-credit-card",
              "Secure Payments",
            ],
            [
              "bi-lightning",
              "Instant Booking Flow",
            ],
          ].map((item, i) => (
            <Card
              key={i}
              variant="glass"
              padding="lg"
              className={`sn-reveal sn-delay-${i + 1}`}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background:
                      "rgba(16,185,129,.14)",
                    color:
                      "var(--sn-primary)",
                    display:
                      "grid",
                    placeItems:
                      "center",
                  }}
                >
                  <i
                    className={`bi ${item[0]} fs-5`}
                  />
                </div>

                <div
                  style={{
                    color:
                      "#fff",
                    fontWeight: 700,
                  }}
                >
                  {item[1]}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>

            {/* TRUST STRIP */}
<section
  className="sn-section"
  style={{
    paddingTop: "22px",
    paddingBottom: "22px",
    background:
      "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)",
    borderTop:
      "1px solid var(--sn-border)",
    borderBottom:
      "1px solid var(--sn-border)",
  }}
>
  <div className="sn-container">
    <div className="row g-3">
      {[
        [
          "bi-patch-check-fill",
          "Verified Owners",
          "Trusted hosts only",
        ],
        [
          "bi-lock-fill",
          "Secure Payments",
          "Protected transactions",
        ],
        [
          "bi-calendar2-check",
          "Live Availability",
          "Real-time listings",
        ],
        [
          "bi-shield-check",
          "Admin Moderation",
          "Quality monitored",
        ],
      ].map((item, i) => (
        <div
          key={i}
          className="col-12 col-sm-6 col-lg-3"
        >
          <div
            style={{
              height: "100%",
              padding: "16px 18px",
              borderRadius: 18,
              background: "#fff",
              border:
                "1px solid var(--sn-border)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition:
                "all .22s ease",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background:
                  "var(--sn-primary-soft)",
                color:
                  "var(--sn-primary)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <i
                className={`bi ${item[0]}`}
              />
            </div>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: ".92rem",
                  color:
                    "var(--sn-text)",
                }}
              >
                {item[1]}
              </div>

              <div
                style={{
                  fontSize: ".78rem",
                  color:
                    "var(--sn-text-soft)",
                }}
              >
                {item[2]}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      
      {/* FEATURED */}
<section className="sn-section">
  <div className="sn-container">
    <SectionHeader
      title="Featured Stays"
      subtitle="Handpicked verified stays available right now"
      right={
        <Link to="/browse-stays">
          <Button variant="outline">
            Explore All
          </Button>
        </Link>
      }
    />

    {properties.length === 0 ? (
      <Loader type="cards" count={3} />
    ) : (
      <div className="row g-4">
        {properties.map((property) => {
          const minRent =
            property.sharing_options
              ?.length > 0
              ? Math.min(
                  ...property.sharing_options.map(
                    (o) =>
                      Number(
                        o.rent_amount
                      )
                  )
                )
              : null;

          return (
            <div
              key={property.id}
              className="col-12 col-md-6 col-lg-4"
            >
              <Card
                hover
                clickable
                padding="0"
                onClick={() =>
                  navigate(
                    `/browse-stays/${property.id}`
                  )
                }
                style={{
                  overflow: "hidden",
                }}
              >
                {/* Image */}
                <div
                  style={{
                    height: 250,
                    position:
                      "relative",
                    overflow:
                      "hidden",
                  }}
                >
                  {property.images
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
                      style={{
                        width:
                          "100%",
                        height:
                          "100%",
                        objectFit:
                          "cover",
                        transition:
                          "transform .6s ease",
                      }}
                    />
                  ) : (
                    <div className="sn-center h-100">
                      <i className="bi bi-image fs-1 text-muted" />
                    </div>
                  )}

                  {/* Gradient */}
                  <div
                    style={{
                      position:
                        "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,.55), transparent 45%)",
                    }}
                  />

                  {/* Type */}
                  <div
                    style={{
                      position:
                        "absolute",
                      top: 14,
                      left: 14,
                    }}
                  >
                    <Badge variant="dark">
                      {
                        property.stay_type
                      }
                    </Badge>
                  </div>

                  {/* Bottom Label */}
                  <div
                    style={{
                      position:
                        "absolute",
                      left: 16,
                      bottom: 14,
                      color:
                        "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize:
                          "1rem",
                      }}
                    >
                      {
                        property.property_name
                      }
                    </div>

                    <div
                      style={{
                        fontSize:
                          ".82rem",
                        opacity:
                          .8,
                      }}
                    >
                      <i className="bi bi-geo-alt me-1" />
                      {property.city}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div
                  style={{
                    padding: 18,
                  }}
                >
                  {/* Amenities */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {property.is_ac && (
                      <Badge variant="info">
                        AC
                      </Badge>
                    )}

                    {property.food_provided && (
                      <Badge variant="success">
                        Food
                      </Badge>
                    )}

                    {property.wifi_available && (
                      <Badge variant="neutral">
                        WiFi
                      </Badge>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {minRent && (
                        <>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize:
                                "1.2rem",
                              lineHeight: 1,
                            }}
                          >
                            ₹
                            {minRent}
                          </div>

                          <div className="sn-text-soft small">
                            starting / month
                          </div>
                        </>
                      )}
                    </div>

                    <Button size="sm">
                      View Stay
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    )}
  </div>
</section>

      
      {/* HOW IT WORKS */}
<section
  className="sn-section"
  style={{
    background:
      "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)",
  }}
>
  <div className="sn-container">
    <SectionHeader
      center
      eyebrow="Simple Process"
      title="Move In Without the Usual Stress"
      subtitle="Everything from discovery to booking designed for speed, trust and convenience."
    />

    <div className="row g-4 mt-2">
      {[
        {
          icon: "bi-search",
          title: "Search Smart",
          text: "Browse verified stays by city, rent, amenities and room type.",
        },
        {
          icon: "bi-building-check",
          title: "Compare & Verify",
          text: "Review property photos, owner profiles and transparent pricing.",
        },
        {
          icon: "bi-credit-card-2-front",
          title: "Book Securely",
          text: "Reserve your stay with safe payments and clear confirmations.",
        },
        {
          icon: "bi-house-check",
          title: "Move In Smoothly",
          text: "Arrive with confidence and manage everything from your dashboard.",
        },
      ].map((step, i) => (
        <div
          key={i}
          className="col-12 col-md-6 col-lg-3"
        >
          <Card
            hover
            padding="lg"
            className={`sn-reveal sn-delay-${i + 1}`}
            style={{
              height: "100%",
              textAlign: "left",
            }}
          >
            {/* Step Number */}
            <div
              style={{
                fontSize: ".75rem",
                fontWeight: 800,
                color:
                  "var(--sn-primary)",
                letterSpacing:
                  ".08em",
                marginBottom: 14,
              }}
            >
              STEP 0{i + 1}
            </div>

            {/* Icon */}
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background:
                  "var(--sn-primary-soft)",
                color:
                  "var(--sn-primary)",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <i
                className={`bi ${step.icon} fs-4`}
              />
            </div>

            {/* Title */}
            <h5
              style={{
                fontWeight: 800,
                marginBottom: 10,
                fontSize: "1.05rem",
              }}
            >
              {step.title}
            </h5>

            {/* Text */}
            <p
              style={{
                margin: 0,
                color:
                  "var(--sn-text-soft)",
                lineHeight: 1.7,
                fontSize: ".94rem",
              }}
            >
              {step.text}
            </p>
          </Card>
        </div>
      ))}
    </div>

    {/* Bottom Trust Strip */}
    <div
      style={{
        marginTop: 34,
        padding: "18px 22px",
        borderRadius: 24,
        background: "#ffffff",
        border:
          "1px solid var(--sn-border)",
        display: "flex",
        justifyContent:
          "space-between",
        gap: 18,
        flexWrap: "wrap",
      }}
    >
      {[
        "Verified Owners",
        "Secure Payments",
        "Transparent Pricing",
        "Responsive Support",
      ].map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 700,
            color:
              "var(--sn-text)",
            fontSize: ".92rem",
          }}
        >
          <i
            className="bi bi-check-circle-fill"
            style={{
              color:
                "var(--sn-primary)",
            }}
          />
          {item}
        </div>
      ))}
    </div>
  </div>
</section>

      {/* OWNER CTA */}
      {/* OWNER CTA */}
<section
  className="sn-section"
  style={{
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg,#0f172a 0%, #111827 100%)",
  }}
>
  {/* Ambient Glow */}
  <div
    style={{
      position: "absolute",
      width: 340,
      height: 340,
      borderRadius: "50%",
      background:
        "rgba(16,185,129,.08)",
      filter: "blur(90px)",
      top: -80,
      right: -90,
    }}
  />

  <div className="sn-container position-relative">
    <div
      style={{
        maxWidth: 880,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <Badge variant="primary" size="lg">
        For Property Owners
      </Badge>

      <h2
        style={{
          marginTop: 18,
          color: "#fff",
          fontWeight: 800,
          fontSize:
            "clamp(2rem,5vw,3.5rem)",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
        }}
      >
        Grow Occupancy.
        <br />
        Manage Everything in{" "}
        <span
          style={{
            color:
              "var(--sn-primary)",
          }}
        >
          One Place
        </span>
      </h2>

      <p
        style={{
          marginTop: 18,
          color:
            "rgba(255,255,255,.68)",
          fontSize: "1.05rem",
          lineHeight: 1.85,
          maxWidth: 720,
          marginInline: "auto",
        }}
      >
        List your hostel or PG,
        receive booking requests,
        manage tenants, track rent,
        payments and operations with a
        modern owner dashboard.
      </p>

      {/* CTA */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {!user ? (
          <>
            <Link to="/register">
              <Button size="lg">
                List Your Property
              </Button>
            </Link>

            <Link to="/browse-stays">
              <Button
                size="lg"
                variant="outline"
              >
                Browse Stays
              </Button>
            </Link>
          </>
        ) : user.role ===
          "owner" ? (
          <>
            <Link to="/owner/dashboard">
              <Button size="lg">
                Go to Dashboard
              </Button>
            </Link>

            <Link to="/owner/properties">
              <Button
                size="lg"
                variant="outline"
              >
                My Properties
              </Button>
            </Link>
          </>
        ) : (
          <Link to="/browse-stays">
            <Button size="lg">
              Find a Stay
            </Button>
          </Link>
        )}
      </div>

      {/* Trust Metrics */}
      <div
        style={{
          marginTop: 38,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(160px,1fr))",
          gap: 14,
        }}
      >
        {[
          ["500+", "Listings"],
          ["1200+", "Tenants"],
          ["4.8★", "User Rating"],
          ["24/7", "Platform Access"],
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding:
                "18px 16px",
              borderRadius: 22,
              background:
                "rgba(255,255,255,.04)",
              border:
                "1px solid rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                color:
                  "#fff",
                fontWeight: 800,
                fontSize:
                  "1.25rem",
              }}
            >
              {item[0]}
            </div>

            <div
              style={{
                color:
                  "rgba(255,255,255,.55)",
                fontSize:
                  ".82rem",
              }}
            >
              {item[1]}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
    </div>
  );
}