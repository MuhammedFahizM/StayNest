import {
  useState,
  useEffect,
  useContext,
} from "react";
import {
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";

import {
  getOwnerProfile,
  updateOwnerProfile,
} from "../services/ownerService";

import {
  AuthContext,
} from "../context/AuthContext";

export default function OwnerProfileEdit() {
  const navigate =
    useNavigate();

  const { updateUser } =
    useContext(AuthContext);

  const [form, setForm] =
    useState({});

  const [file, setFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    getOwnerProfile().then(
      setForm
    );
  }, []);

  const handleChange = (
    key,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const data =
          new FormData();

        [
          "full_name",
          "phone",
          "address",
          "city",
          "state",
          "postal_code",
          "bank_account_number",
          "bank_ifsc_code",
          "bank_beneficiary_name",
        ].forEach((f) => {
          if (form[f]) {
            data.append(
              f,
              form[f]
            );
          }
        });

        if (file) {
          data.append(
            "profile_photo",
            file
          );
        }

        await updateOwnerProfile(
          data
        );

        const updated =
          await getOwnerProfile();

        updateUser({
          full_name:
            updated.full_name,
          profile_image:
            updated.profile_photo,
        });

        toast.success(
          "Profile updated successfully"
        );

        navigate(
          "/owner/profile"
        );
      } catch {
        toast.error(
          "Unable to update profile"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(180deg,#f8fafc,#ffffff)",
        padding:
          "26px 0 60px",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: 920,
        }}
      >
        {/* Back */}
        <button
          onClick={() =>
            navigate(
              "/owner/profile"
            )
          }
          style={
            backBtn
          }
        >
          <i className="bi bi-arrow-left" />
          Back to Profile
        </button>

        {/* Hero */}
        <div
          style={
            hero
          }
        >
          <div>
            <div
              style={
                tag
              }
            >
              OWNER ACCOUNT
            </div>

            <h2
              style={{
                margin:
                  "6px 0 4px",
                fontWeight: 800,
                color:
                  "#0f172a",
              }}
            >
              Edit Profile
            </h2>

            <p
              style={
                muted
              }
            >
              Update your
              personal info,
              payout details
              and profile
              photo.
            </p>
          </div>

          <div
            style={
              avatarBox
            }
          >
            {form
              ?.profile_photo ? (
              <img
                src={
                  form.profile_photo
                }
                alt=""
                style={{
                  width:
                    "100%",
                  height:
                    "100%",
                  objectFit:
                    "cover",
                }}
              />
            ) : (
              <i className="bi bi-person-fill" />
            )}
          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="row g-4">
            {/* Left */}
            <div className="col-12 col-lg-7">
              <div
                style={
                  card
                }
              >
                <SectionTitle
                  icon="bi-person-badge"
                  title="Personal Information"
                />

                <div className="row g-3">
                  <Field
                    label="Full Name"
                    value={
                      form.full_name ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "full_name",
                        v
                      )
                    }
                  />

                  <Field
                    label="Email"
                    value={
                      form.email ||
                      ""
                    }
                    disabled
                  />

                  <Field
                    label="Phone"
                    value={
                      form.phone ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "phone",
                        v
                      )
                    }
                  />

                  <Field
                    label="Status"
                    value={
                      form.is_owner_approved
                        ? "Verified"
                        : "Pending"
                    }
                    disabled
                  />

                  <div className="col-12">
                    <label
                      style={
                        label
                      }
                    >
                      Address
                    </label>

                    <textarea
                      rows="3"
                      style={{
                        ...input,
                        resize:
                          "vertical",
                      }}
                      value={
                        form.address ||
                        ""
                      }
                      onChange={(
                        e
                      ) =>
                        handleChange(
                          "address",
                          e
                            .target
                            .value
                        )
                      }
                    />
                  </div>

                  <Field
                    label="City"
                    value={
                      form.city ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "city",
                        v
                      )
                    }
                  />

                  <Field
                    label="State"
                    value={
                      form.state ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "state",
                        v
                      )
                    }
                  />

                  <Field
                    label="Postal Code"
                    value={
                      form.postal_code ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "postal_code",
                        v
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="col-12 col-lg-5">
              <div
                style={{
                  ...card,
                  marginBottom: 16,
                }}
              >
                <SectionTitle
                  icon="bi-bank"
                  title="Bank Details"
                />

                <div className="row g-3">
                  <Field
                    label="Account Holder"
                    value={
                      form.bank_beneficiary_name ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "bank_beneficiary_name",
                        v
                      )
                    }
                  />

                  <Field
                    label="IFSC Code"
                    value={
                      form.bank_ifsc_code ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "bank_ifsc_code",
                        v.toUpperCase()
                      )
                    }
                  />

                  <Field
                    label="Account Number"
                    value={
                      form.bank_account_number ||
                      ""
                    }
                    onChange={(
                      v
                    ) =>
                      handleChange(
                        "bank_account_number",
                        v
                      )
                    }
                  />
                </div>
              </div>

              <div
                style={
                  card
                }
              >
                <SectionTitle
                  icon="bi-image"
                  title="Profile Photo"
                />

                <label
                  style={
                    uploadBox
                  }
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{
                      display:
                        "none",
                    }}
                    onChange={(
                      e
                    ) =>
                      setFile(
                        e
                          .target
                          .files?.[0]
                      )
                    }
                  />

                  <i className="bi bi-cloud-arrow-up fs-4 text-success" />

                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 700,
                      color:
                        "#0f172a",
                      fontSize:
                        ".88rem",
                    }}
                  >
                    {file
                      ? file.name
                      : "Upload new photo"}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color:
                        "#64748b",
                      fontSize:
                        ".78rem",
                    }}
                  >
                    JPG / PNG •
                    square images
                    recommended
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent:
                "flex-end",
              marginTop: 22,
              flexWrap:
                "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/owner/profile"
                )
              }
              style={
                ghostBtn
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              style={{
                ...primaryBtn,
                opacity:
                  loading
                    ? 0.8
                    : 1,
              }}
            >
              {loading && (
                <span className="spinner-border spinner-border-sm me-2" />
              )}
              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Components */

function SectionTitle({
  icon,
  title,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems:
          "center",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <div
        style={
          iconBox
        }
      >
        <i
          className={`bi ${icon}`}
        />
      </div>

      <h6
        style={{
          margin: 0,
          fontWeight: 800,
          color:
            "#0f172a",
          fontSize:
            ".95rem",
        }}
      >
        {title}
      </h6>
    </div>
  );
}

function Field({
  label: text,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div className="col-12 col-md-6">
      <label
        style={label}
      >
        {text}
      </label>

      <input
        type="text"
        value={value}
        disabled={
          disabled
        }
        style={{
          ...input,
          background:
            disabled
              ? "#f8fafc"
              : "#fff",
          color:
            disabled
              ? "#94a3b8"
              : "#0f172a",
        }}
        onChange={(e) =>
          onChange?.(
            e.target.value
          )
        }
      />
    </div>
  );
}

/* Styles */

const hero = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 22,
  marginBottom: 22,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 16,
  boxShadow:
    "0 10px 24px rgba(15,23,42,.04)",
};

const card = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 22,
  boxShadow:
    "0 10px 24px rgba(15,23,42,.04)",
  transition:
    "all .2s ease",
};

const tag = {
  color: "#10b981",
  fontWeight: 800,
  fontSize: ".74rem",
  letterSpacing:
    ".06em",
};

const muted = {
  margin: 0,
  color: "#64748b",
  fontSize: ".9rem",
};

const label = {
  display: "block",
  marginBottom: 7,
  fontWeight: 700,
  fontSize: ".78rem",
  color: "#475569",
  textTransform:
    "uppercase",
  letterSpacing:
    ".04em",
};

const input = {
  width: "100%",
  height: 44,
  border:
    "1px solid #e2e8f0",
  borderRadius: 14,
  padding:
    "0 14px",
  outline: "none",
  fontSize: ".92rem",
  transition:
    "all .18s ease",
};

const iconBox = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: "grid",
  placeItems:
    "center",
  background:
    "rgba(16,185,129,.10)",
  color: "#10b981",
};

const avatarBox = {
  width: 66,
  height: 66,
  borderRadius: 18,
  overflow: "hidden",
  background:
    "#f1f5f9",
  display: "grid",
  placeItems:
    "center",
  color: "#94a3b8",
  fontSize: 26,
};

const uploadBox = {
  border:
    "2px dashed #dbeafe",
  borderRadius: 18,
  padding: "24px",
  background:
    "#f8fafc",
  textAlign: "center",
  cursor: "pointer",
  width: "100%",
  transition:
    "all .18s ease",
};

const backBtn = {
  border: "none",
  background:
    "transparent",
  padding: 0,
  marginBottom: 18,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#64748b",
  fontWeight: 700,
};

const ghostBtn = {
  height: 46,
  border:
    "1px solid #e2e8f0",
  background: "#fff",
  borderRadius: 14,
  padding:
    "0 18px",
  fontWeight: 700,
  color: "#475569",
};

const primaryBtn = {
  height: 46,
  border: "none",
  borderRadius: 14,
  padding:
    "0 20px",
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  color: "#fff",
  fontWeight: 800,
  boxShadow:
    "0 12px 24px rgba(16,185,129,.18)",
};