import { useEffect, useState, useContext } from "react";
import {
  getUserProfile,
  updateUserProfile,
} from "../services/userService";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function UserProfileEdit() {
  const [form, setForm] =
    useState({});
  const [file, setFile] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [pageLoading, setPageLoading] =
    useState(true);

  const navigate =
    useNavigate();

  const { updateUser } =
    useContext(AuthContext);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile =
    async () => {
      try {
        const data =
          await getUserProfile();
        setForm(data || {});
      } catch {
        toast.error(
          "Unable to load profile"
        );
      } finally {
        setPageLoading(false);
      }
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
        ].forEach(
          (field) =>
            form[field] &&
            data.append(
              field,
              form[field]
            )
        );

        if (file) {
          data.append(
            "profile_photo",
            file
          );
        }

        await updateUserProfile(
          data
        );

        updateUser({
          full_name:
            form.full_name,
          profile_image:
            form.profile_photo,
        });

        toast.success(
          "Profile updated successfully"
        );

        navigate(
          "/user/profile"
        );
      } catch {
        toast.error(
          "Unable to update profile"
        );
      } finally {
        setLoading(false);
      }
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
            Loading profile...
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
      <div
        className="container py-4"
        style={{
          maxWidth: 720,
        }}
      >
        {/* Back */}
        <button
          onClick={() =>
            navigate(
              "/user/profile"
            )
          }
          style={backBtn}
        >
          <i className="bi bi-arrow-left" />
          Back to Profile
        </button>

        {/* Hero */}
        <div
          className="sn-reveal"
          style={hero}
        >
          <div>
            <div style={tag}>
              YOUR ACCOUNT
            </div>

            <h2 style={heroTitle}>
              Edit Profile
            </h2>

            <p style={heroText}>
              Update your
              personal
              information.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          {/* Personal */}
          <div
            className="sn-reveal sn-delay-1"
            style={card}
          >
            <h6 style={sectionTitle}>
              Personal
              Information
            </h6>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label style={label}>
                  Full Name
                </label>

                <input
                  type="text"
                  style={
                    input
                  }
                  value={
                    form.full_name ||
                    ""
                  }
                  disabled={
                    loading
                  }
                  placeholder="Your full name"
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      full_name:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label style={label}>
                  Email
                </label>

                <input
                  type="email"
                  value={
                    form.email ||
                    ""
                  }
                  disabled
                  style={{
                    ...input,
                    background:
                      "#f8fafc",
                    color:
                      "#94a3b8",
                  }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label style={label}>
                  Phone
                </label>

                <input
                  type="text"
                  style={
                    input
                  }
                  value={
                    form.phone ||
                    ""
                  }
                  disabled={
                    loading
                  }
                  placeholder="+91 XXXXX XXXXX"
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      phone:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </div>

              <div className="col-12">
                <label style={label}>
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
                  disabled={
                    loading
                  }
                  placeholder="Your address"
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      address:
                        e
                          .target
                          .value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Photo */}
          <div
            className="sn-reveal sn-delay-2"
            style={card}
          >
            <h6 style={sectionTitle}>
              Profile Photo
            </h6>

            <div
              style={
                uploadBox
              }
            >
              <i
                className="bi bi-image"
                style={{
                  fontSize: 24,
                  color:
                    "#10b981",
                  marginBottom: 8,
                }}
              />

              <div
                style={{
                  fontSize:
                    ".92rem",
                  color:
                    "#0f172a",
                  fontWeight: 600,
                }}
              >
                {file
                  ? file.name
                  : "Upload profile photo"}
              </div>

              <div
                style={{
                  fontSize:
                    ".78rem",
                  color:
                    "#94a3b8",
                  marginTop: 4,
                }}
              >
                JPG or PNG ·
                Square image
                preferred
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(
                  e
                ) =>
                  setFile(
                    e
                      .target
                      .files?.[0] ||
                      null
                  )
                }
                style={
                  fileInput
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div
            className="sn-reveal sn-delay-3"
            style={
              actions
            }
          >
            <button
              type="submit"
              disabled={
                loading
              }
              style={{
                ...primaryBtn,
                opacity:
                  loading
                    ? 0.85
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

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/user/profile"
                )
              }
              style={
                secondaryBtn
              }
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Styles */

const page = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#f8fafc,#ffffff)",
};

const hero = {
  background:
    "linear-gradient(135deg,#ffffff,#f8fafc)",
  border:
    "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 24,
  marginBottom: 18,
  boxShadow:
    "0 12px 28px rgba(15,23,42,.05)",
};

const heroTitle = {
  margin: "4px 0",
  fontWeight: 800,
  color: "#0f172a",
};

const heroText = {
  margin: 0,
  color: "#64748b",
  fontSize: ".92rem",
};

const tag = {
  color: "#10b981",
  fontWeight: 800,
  fontSize: ".74rem",
  letterSpacing: ".08em",
};

const backBtn = {
  border: "none",
  background:
    "transparent",
  color: "#64748b",
  fontSize: ".9rem",
  padding: 0,
  marginBottom: 18,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const card = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 22,
  marginBottom: 18,
  boxShadow:
    "0 10px 24px rgba(15,23,42,.05)",
};

const sectionTitle = {
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 18,
  fontSize: ".96rem",
};

const label = {
  fontSize: ".78rem",
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
  display: "block",
  letterSpacing:
    ".04em",
};

const input = {
  width: "100%",
  height: 46,
  border:
    "1px solid #e2e8f0",
  borderRadius: 12,
  padding:
    "0 14px",
  fontSize: ".92rem",
  color: "#0f172a",
  outline: "none",
  background: "#fff",
};

const uploadBox = {
  border:
    "2px dashed #dbe3ee",
  borderRadius: 16,
  padding: 26,
  textAlign: "center",
  background:
    "#f8fafc",
  position:
    "relative",
};

const fileInput = {
  position:
    "absolute",
  inset: 0,
  opacity: 0,
  cursor: "pointer",
  width: "100%",
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const primaryBtn = {
  height: 46,
  border: "none",
  borderRadius: 14,
  padding:
    "0 18px",
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  color: "#fff",
  fontWeight: 700,
  transition:
    "all .22s ease",
};

const secondaryBtn = {
  height: 46,
  border:
    "1px solid #e2e8f0",
  borderRadius: 14,
  padding:
    "0 18px",
  background:
    "#fff",
  color: "#64748b",
  fontWeight: 600,
};

const muted = {
  color: "#64748b",
  margin: 0,
};