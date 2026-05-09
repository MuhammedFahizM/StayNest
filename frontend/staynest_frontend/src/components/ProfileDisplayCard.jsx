import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageLightbox from "./ImageLightbox";

export default function ProfileDisplayCard({
  profile,
  title = "Profile",
  showBack = false,
  backPath = "/",
  showEdit = false,
  editPath = null,
}) {
  const navigate = useNavigate();

  const [photoOpen, setPhotoOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  if (!profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="spinner-border"
            style={{
              width: 34,
              height: 34,
              color: "#10b981",
            }}
          />
          <p
            style={{
              marginTop: 14,
              color: "#64748b",
              fontSize: ".92rem",
            }}
          >
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  const isOwner = profile.role === "owner";

  const card = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,.05)",
  };

  const label = {
    fontSize: ".72rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: ".06em",
    marginBottom: 4,
  };

  const value = {
    fontSize: ".95rem",
    color: "#0f172a",
    fontWeight: 600,
  };

  const Row = ({ icon, title, text }) => (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: "rgba(16,185,129,.08)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <i
          className={`bi ${icon}`}
          style={{
            color: "#10b981",
            fontSize: 15,
          }}
        />
      </div>

      <div>
        <div style={label}>{title}</div>
        <div style={value}>{text || "Not provided"}</div>
      </div>
    </div>
  );

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
        style={{ maxWidth: 980 }}
      >
        {/* Back */}
        {showBack && (
          <button
            onClick={() =>
              navigate(backPath)
            }
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              marginBottom: 18,
              color: "#64748b",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <i className="bi bi-arrow-left" />
            Back
          </button>
        )}

        {/* Hero */}
        <div
          style={{
            ...card,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          {/* top banner */}
          <div
            style={{
              height: 110,
              background:
                "linear-gradient(135deg,#0f172a,#1e293b,#10b981)",
            }}
          />

          <div
            style={{
              padding:
                "0 28px 28px",
              marginTop: -42,
            }}
          >
            {/* avatar */}
            <div
              onClick={() =>
                profile.profile_photo &&
                setPhotoOpen(true)
              }
              style={{
                width: 84,
                height: 84,
                borderRadius:
                  "50%",
                border:
                  "4px solid #fff",
                overflow:
                  "hidden",
                background:
                  "linear-gradient(135deg,#10b981,#059669)",
                display: "grid",
                placeItems:
                  "center",
                fontSize:
                  "1.9rem",
                fontWeight: 800,
                color: "#fff",
                cursor:
                  profile.profile_photo
                    ? "pointer"
                    : "default",
                boxShadow:
                  "0 10px 28px rgba(15,23,42,.16)",
              }}
            >
              {profile.profile_photo ? (
                <img
                  src={
                    profile.profile_photo
                  }
                  alt="profile"
                  style={{
                    width: "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                  }}
                />
              ) : (
                profile.full_name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "U"
              )}
            </div>

            {/* title row */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 18,
                flexWrap:
                  "wrap",
              }}
            >
              <div>
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
                  {profile.full_name}
                </h2>

                <div
                  style={{
                    marginTop: 10,
                    display:
                      "flex",
                    gap: 8,
                    flexWrap:
                      "wrap",
                  }}
                >
                  <span
                    style={{
                      padding:
                        "6px 12px",
                      borderRadius: 999,
                      fontSize:
                        ".74rem",
                      fontWeight: 700,
                      background:
                        isOwner
                          ? "rgba(16,185,129,.10)"
                          : "rgba(59,130,246,.10)",
                      color:
                        isOwner
                          ? "#059669"
                          : "#2563eb",
                    }}
                  >
                    {profile.role ||
                      "User"}
                  </span>

                  {isOwner && (
                    <span
                      style={{
                        padding:
                          "6px 12px",
                        borderRadius: 999,
                        fontSize:
                          ".74rem",
                        fontWeight: 700,
                        background:
                          profile.is_owner_approved
                            ? "rgba(16,185,129,.10)"
                            : "rgba(245,158,11,.10)",
                        color:
                          profile.is_owner_approved
                            ? "#059669"
                            : "#b45309",
                      }}
                    >
                      {profile.is_owner_approved
                        ? "Verified"
                        : "Pending Review"}
                    </span>
                  )}
                </div>
              </div>

              {showEdit &&
                editPath && (
                  <button
                    onClick={() =>
                      navigate(
                        editPath
                      )
                    }
                    style={{
                      height: 44,
                      padding:
                        "0 18px",
                      border:
                        "none",
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg,#10b981,#059669)",
                      color:
                        "#fff",
                      fontWeight: 700,
                      cursor:
                        "pointer",
                      boxShadow:
                        "0 10px 22px rgba(16,185,129,.18)",
                    }}
                  >
                    <i className="bi bi-pencil me-2" />
                    Edit Profile
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="row g-4">
          {/* Left */}
          <div className="col-12 col-lg-6">
            <div
              style={{
                ...card,
                padding: 24,
              }}
            >
              <h5
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontWeight: 800,
                  color:
                    "#0f172a",
                  fontSize:
                    "1rem",
                }}
              >
                Contact Information
              </h5>

              <Row
                icon="bi-envelope"
                title="Email"
                text={
                  profile.email
                }
              />
              <Row
                icon="bi-telephone"
                title="Phone"
                text={
                  profile.phone
                }
              />
              <Row
                icon="bi-house"
                title="Address"
                text={
                  profile.address
                }
              />
              <Row
                icon="bi-geo-alt"
                title="Location"
                text={[
                  profile.city,
                  profile.state,
                  profile.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </div>

          {/* Right */}
          <div className="col-12 col-lg-6">
            {/* ID proof */}
            <div
              style={{
                ...card,
                padding: 24,
                marginBottom: 18,
              }}
            >
              <h5
                style={{
                  margin: 0,
                  marginBottom: 14,
                  fontWeight: 800,
                  color:
                    "#0f172a",
                  fontSize:
                    "1rem",
                }}
              >
                ID Proof
              </h5>

              {profile.proof ? (
                /\.png$|\.jpg$|\.jpeg$/i.test(
                  profile.proof
                ) ? (
                  <img
                    src={
                      profile.proof
                    }
                    alt="proof"
                    onClick={() =>
                      setProofOpen(
                        true
                      )
                    }
                    style={{
                      width: "100%",
                      height: 220,
                      objectFit:
                        "cover",
                      borderRadius: 16,
                      border:
                        "1px solid #e2e8f0",
                      cursor:
                        "pointer",
                    }}
                  />
                ) : (
                  <a
                    href={
                      profile.proof
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration:
                        "none",
                      color:
                        "#10b981",
                      fontWeight: 700,
                    }}
                  >
                    View uploaded
                    document
                  </a>
                )
              ) : (
                <div
                  style={{
                    color:
                      "#94a3b8",
                  }}
                >
                  No proof uploaded
                </div>
              )}
            </div>

            {/* Bank */}
            {isOwner &&
              (profile.bank_account_number ||
                profile.bank_ifsc_code ||
                profile.bank_beneficiary_name) && (
                <div
                  style={{
                    ...card,
                    padding: 24,
                  }}
                >
                  <h5
                    style={{
                      margin: 0,
                      marginBottom: 10,
                      fontWeight: 800,
                      color:
                        "#0f172a",
                      fontSize:
                        "1rem",
                    }}
                  >
                    Bank Details
                  </h5>

                  <Row
                    icon="bi-person"
                    title="Account Holder"
                    text={
                      profile.bank_beneficiary_name
                    }
                  />
                  <Row
                    icon="bi-bank"
                    title="IFSC"
                    text={
                      profile.bank_ifsc_code
                    }
                  />
                  <Row
                    icon="bi-credit-card"
                    title="Account Number"
                    text={
                      profile.bank_account_number
                        ? `••••${profile.bank_account_number.slice(
                            -4
                          )}`
                        : ""
                    }
                  />
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {photoOpen &&
        profile.profile_photo && (
          <ImageLightbox
            images={[
              profile.profile_photo,
            ]}
            currentIndex={0}
            onClose={() =>
              setPhotoOpen(
                false
              )
            }
            onChange={() => {}}
          />
        )}

      {proofOpen &&
        profile.proof && (
          <ImageLightbox
            images={[
              profile.proof,
            ]}
            currentIndex={0}
            onClose={() =>
              setProofOpen(
                false
              )
            }
            onChange={() => {}}
          />
        )}
    </div>
  );
}