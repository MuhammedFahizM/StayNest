import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);
  const [idProof, setIdProof] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!fullName.trim())
      return "Full name required";
    if (!email.trim()) return "Email required";
    if (!password)
      return "Password required";
    if (password !== confirmPassword)
      return "Passwords do not match";
    if (!idProof)
      return "ID proof required";

    if (
      role === "owner" &&
      (!phone.trim() ||
        !address.trim())
    ) {
      return "Phone & address required for owners";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const err = validate();
    if (err) return setError(err);

    setLoading(true);

    try {
      const fd = new FormData();

      fd.append("full_name", fullName);
      fd.append("email", email);
      fd.append("password", password);
      fd.append("role", role);
      fd.append("proof", idProof);

      if (role === "owner") {
        fd.append("phone", phone);
        fd.append("address", address);
      }

      await register(fd);

      navigate("/email-sent", {
        state: { email, type: "verify" },
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data
            ?.message ||
          "Unable to register"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex"
      style={{
        background:
          "linear-gradient(135deg,#f8fafc 0%,#eefbf5 42%,#ffffff 100%)",
      }}
    >
      {/* LEFT PANEL */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between p-5"
        style={{
          width: "48%",
          background:
            "linear-gradient(180deg,#0f172a 0%,#111827 48%,#052e2b 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* glow */}
        <div
          style={glowTop}
        />
        <div
          style={glowBottom}
        />

        {/* logo */}
        <div className="d-flex align-items-center gap-3 position-relative">
          <div style={logoBox}>
            <i className="bi bi-house-door-fill"></i>
          </div>

          <div
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.25rem",
            }}
          >
            Stay
            <span
              style={{
                color: "#10b981",
              }}
            >
              Nest
            </span>
          </div>
        </div>

        {/* hero */}
        <div className="position-relative">
          <div
            style={{
              display:
                "inline-flex",
              gap: 8,
              alignItems:
                "center",
              padding:
                "8px 12px",
              borderRadius:
                999,
              background:
                "rgba(255,255,255,.06)",
              color:
                "#cbd5e1",
              fontSize:
                ".8rem",
              marginBottom:
                20,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius:
                  "50%",
                background:
                  "#10b981",
              }}
            ></span>
            Trusted onboarding
          </div>

          <h1
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize:
                "2.35rem",
              lineHeight:
                1.18,
              marginBottom:
                18,
              maxWidth:
                520,
            }}
          >
            Join StayNest and
            unlock modern renting.
          </h1>

          <p
            style={{
              color:
                "#94a3b8",
              lineHeight:
                1.8,
              maxWidth:
                520,
              marginBottom:
                30,
            }}
          >
            Find better stays,
            manage properties,
            receive bookings and
            enjoy a clean modern
            platform.
          </p>

          {[
            [
              "bi-person-check",
              "Verified accounts",
            ],
            [
              "bi-house-heart",
              "Premium stay listings",
            ],
            [
              "bi-shield-lock",
              "Secure document flow",
            ],
            [
              "bi-phone",
              "Mobile-first dashboard",
            ],
          ].map(
            ([icon, text]) => (
              <div
                key={text}
                className="d-flex align-items-center gap-3 mb-3"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius:
                      10,
                    background:
                      "rgba(16,185,129,.12)",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    color:
                      "#10b981",
                  }}
                >
                  <i
                    className={`bi ${icon}`}
                  ></i>
                </div>

                <span
                  style={{
                    color:
                      "#e2e8f0",
                    fontSize:
                      ".94rem",
                  }}
                >
                  {text}
                </span>
              </div>
            )
          )}
        </div>

        <div
          style={{
            color:
              "#64748b",
            fontSize:
              ".82rem",
          }}
        >
          ©{" "}
          {new Date().getFullYear()}{" "}
          StayNest
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4 p-lg-5">
        <div
          style={{
            width: "100%",
            maxWidth: 540,
            background:
              "rgba(255,255,255,.94)",
            backdropFilter:
              "blur(16px)",
            border:
              "1px solid rgba(255,255,255,.85)",
            borderRadius: 24,
            padding: 34,
            boxShadow:
              "0 24px 60px rgba(15,23,42,.08)",
          }}
        >
          {/* mobile logo */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
            <div
              style={{
                ...logoBox,
                width: 36,
                height: 36,
                borderRadius: 10,
                fontSize: 16,
              }}
            >
              <i className="bi bi-house-door-fill"></i>
            </div>

            <span
              style={{
                fontWeight: 800,
                fontSize:
                  "1.1rem",
              }}
            >
              Stay
              <span
                style={{
                  color:
                    "#10b981",
                }}
              >
                Nest
              </span>
            </span>
          </div>

          <h2
            style={{
              fontWeight: 800,
              fontSize:
                "1.9rem",
              color:
                "#0f172a",
              marginBottom: 8,
            }}
          >
            Create account
          </h2>

          <p
            style={{
              color:
                "#64748b",
              marginBottom:
                24,
            }}
          >
            Already have an
            account?{" "}
            <Link
              to="/login"
              style={linkStyle}
            >
              Sign in
            </Link>
          </p>

          {/* ROLE SWITCH */}
          <div
            className="d-flex p-1 mb-4"
            style={{
              background:
                "#eef2f7",
              borderRadius: 14,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setRole("user")
              }
              style={roleBtn(
                role === "user"
              )}
              className="border-0 flex-grow-1"
            >
              🏠 Looking for stay
            </button>

            <button
              type="button"
              onClick={() =>
                setRole("owner")
              }
              style={roleBtn(
                role === "owner"
              )}
              className="border-0 flex-grow-1"
            >
              🏢 Property owner
            </button>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="row g-3">
              <div className="col-12">
                <label
                  style={
                    labelStyle
                  }
                >
                  Full Name
                </label>

                <div
                  style={
                    inputWrap
                  }
                >
                  <i className="bi bi-person text-muted"></i>

                  <input
                    className="form-control border-0"
                    style={
                      cleanInput
                    }
                    value={
                      fullName
                    }
                    onChange={(
                      e
                    ) =>
                      setFullName(
                        e.target
                          .value
                      )
                    }
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="col-12">
                <label
                  style={
                    labelStyle
                  }
                >
                  Email
                </label>

                <div
                  style={
                    inputWrap
                  }
                >
                  <i className="bi bi-envelope text-muted"></i>

                  <input
                    type="email"
                    className="form-control border-0"
                    style={
                      cleanInput
                    }
                    value={
                      email
                    }
                    onChange={(
                      e
                    ) =>
                      setEmail(
                        e.target
                          .value
                      )
                    }
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {role ===
                "owner" && (
                <>
                  <div className="col-md-6">
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Phone
                    </label>

                    <div
                      style={
                        inputWrap
                      }
                    >
                      <i className="bi bi-phone text-muted"></i>

                      <input
                        className="form-control border-0"
                        style={
                          cleanInput
                        }
                        value={
                          phone
                        }
                        onChange={(
                          e
                        ) =>
                          setPhone(
                            e
                              .target
                              .value
                          )
                        }
                        placeholder="+91..."
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Address
                    </label>

                    <div
                      style={
                        inputWrap
                      }
                    >
                      <i className="bi bi-geo-alt text-muted"></i>

                      <input
                        className="form-control border-0"
                        style={
                          cleanInput
                        }
                        value={
                          address
                        }
                        onChange={(
                          e
                        ) =>
                          setAddress(
                            e
                              .target
                              .value
                          )
                        }
                        placeholder="City / Area"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="col-md-6">
                <label
                  style={
                    labelStyle
                  }
                >
                  Password
                </label>

                <div
                  style={
                    inputWrap
                  }
                >
                  <i className="bi bi-lock text-muted"></i>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    className="form-control border-0"
                    style={
                      cleanInput
                    }
                    value={
                      password
                    }
                    onChange={(
                      e
                    ) =>
                      setPassword(
                        e.target
                          .value
                      )
                    }
                    placeholder="Password"
                  />

                  <button
                    type="button"
                    style={
                      eyeBtn
                    }
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    <i
                      className={`bi ${
                        showPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <label
                  style={
                    labelStyle
                  }
                >
                  Confirm
                </label>

                <div
                  style={
                    inputWrap
                  }
                >
                  <i className="bi bi-shield-check text-muted"></i>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    className="form-control border-0"
                    style={
                      cleanInput
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(
                      e
                    ) =>
                      setConfirmPassword(
                        e.target
                          .value
                      )
                    }
                    placeholder="Repeat"
                  />

                  <button
                    type="button"
                    style={
                      eyeBtn
                    }
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    <i
                      className={`bi ${
                        showConfirmPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              {/* Upload */}
              <div className="col-12">
                <label
                  style={
                    labelStyle
                  }
                >
                  Government ID
                  Proof
                </label>

                <label
                  style={{
                    height: 54,
                    border:
                      "2px dashed #dbe3ea",
                    borderRadius:
                      14,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 12,
                    padding:
                      "0 14px",
                    cursor:
                      "pointer",
                    overflow:
                      "hidden",
                  }}
                >
                  <i className="bi bi-cloud-upload text-success"></i>

                  <span
                    style={{
                      color:
                        "#64748b",
                      whiteSpace:
                        "nowrap",
                      overflow:
                        "hidden",
                      textOverflow:
                        "ellipsis",
                    }}
                  >
                    {idProof
                      ? idProof.name
                      : "Upload Aadhaar / PAN / Passport"}
                  </span>

                  <input
                    hidden
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(
                      e
                    ) =>
                      setIdProof(
                        e.target
                          .files[0]
                      )
                    }
                  />
                </label>
              </div>
            </div>

            {error && (
              <div
                className="mt-3"
                style={{
                  background:
                    "#fef2f2",
                  color:
                    "#dc2626",
                  border:
                    "1px solid #fecaca",
                  borderRadius:
                    14,
                  padding:
                    "12px 14px",
                  fontSize:
                    ".88rem",
                }}
              >
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            <button
              disabled={
                loading
              }
              className="btn w-100 mt-4"
              style={{
                height: 48,
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                color: "#fff",
                background:
                  "linear-gradient(135deg,#10b981,#059669)",
                boxShadow:
                  "0 14px 34px rgba(16,185,129,.24)",
              }}
            >
              {loading
                ? "Creating..."
                : "Create Account"}
            </button>

            <div
              style={{
                textAlign:
                  "center",
                fontSize:
                  ".8rem",
                color:
                  "#94a3b8",
                marginTop: 14,
              }}
            >
              By continuing
              you agree to
              Terms &
              Privacy.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* helpers */

const glowTop = {
  position: "absolute",
  top: -80,
  right: -80,
  width: 280,
  height: 280,
  borderRadius: "50%",
  background:
    "rgba(16,185,129,.12)",
};

const glowBottom = {
  position: "absolute",
  bottom: -100,
  left: -100,
  width: 320,
  height: 320,
  borderRadius: "50%",
  background:
    "rgba(16,185,129,.08)",
};

const logoBox = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  display: "grid",
  placeItems: "center",
  color: "#fff",
  fontSize: 20,
  boxShadow:
    "0 14px 28px rgba(16,185,129,.28)",
};

const linkStyle = {
  color: "#10b981",
  textDecoration: "none",
  fontWeight: 700,
};

const labelStyle = {
  fontSize: ".88rem",
  fontWeight: 600,
  color: "#374151",
  marginBottom: 8,
  display: "block",
};

const inputWrap = {
  height: 48,
  border:
    "1px solid #dbe3ea",
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding:
    "0 14px",
  background: "#fff",
};

const cleanInput = {
  height: "100%",
  boxShadow: "none",
  padding: 0,
  background:
    "transparent",
};

const eyeBtn = {
  border: "none",
  background:
    "transparent",
  color: "#94a3b8",
};

const roleBtn = (active) => ({
  height: 44,
  borderRadius: 10,
  fontWeight: 700,
  fontSize: ".86rem",
  background: active
    ? "#fff"
    : "transparent",
  color: active
    ? "#0f172a"
    : "#64748b",
  boxShadow: active
    ? "0 8px 18px rgba(15,23,42,.06)"
    : "none",
});