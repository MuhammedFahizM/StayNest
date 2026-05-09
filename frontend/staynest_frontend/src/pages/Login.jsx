import { useState, useContext } from "react";
import { login } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import {
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";

export default function Login() {
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);
  const [error, setError] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const { loginUser } =
    useContext(AuthContext);

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const handleSubmit =
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const data =
          await login({
            email,
            password,
          });

        loginUser(data);

        const from =
          location.state?.from
            ?.pathname;

        if (
          data.role ===
          "owner"
        ) {
          navigate(
            "/owner/dashboard",
            {
              replace: true,
            }
          );
        } else if (
          data.role ===
          "user"
        ) {
          navigate(
            from ||
              "/user/dashboard",
            {
              replace: true,
            }
          );
        } else {
          navigate("/",
            {
              replace: true,
            }
          );
        }
      } catch {
        setError(
          "Invalid email or password"
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
          position:
            "relative",
          overflow:
            "hidden",
        }}
      >
        <div style={glowTop} />
        <div
          style={
            glowBottom
          }
        />

        {/* LOGO */}
        <div className="d-flex align-items-center gap-3 position-relative">
          <div
            style={
              logoBox
            }
          >
            <i className="bi bi-house-door-fill"></i>
          </div>

          <div
            style={{
              color:
                "#fff",
              fontWeight: 800,
              fontSize:
                "1.25rem",
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
          </div>
        </div>

        {/* HERO */}
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
            Trusted by modern renters
          </div>

          <h1
            style={{
              color:
                "#fff",
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
            Welcome back to
            smarter stays.
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
            Access your
            dashboard,
            bookings,
            messages and
            premium stay
            listings in one
            clean platform.
          </p>

          {[
            [
              "bi-shield-check",
              "Secure sign in experience",
            ],
            [
              "bi-house-heart",
              "Verified properties",
            ],
            [
              "bi-lightning-charge",
              "Fast booking flow",
            ],
            [
              "bi-person-badge",
              "Trusted owners",
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
            maxWidth: 440,
            background:
              "rgba(255,255,255,.94)",
            backdropFilter:
              "blur(16px)",
            border:
              "1px solid rgba(255,255,255,.85)",
            borderRadius:
              24,
            padding: 34,
            boxShadow:
              "0 24px 60px rgba(15,23,42,.08)",
          }}
        >
          {/* MOBILE LOGO */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
            <div
              style={{
                ...logoBox,
                width: 36,
                height: 36,
                borderRadius:
                  10,
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
            Welcome back
          </h2>

          <p
            style={{
              color:
                "#64748b",
              marginBottom:
                24,
            }}
          >
            Continue to your
            dashboard,
            bookings and
            stays.
          </p>

          <form
            onSubmit={
              handleSubmit
            }
          >
            {/* EMAIL */}
            <div className="mb-3">
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
                  placeholder="you@example.com"
                  value={
                    email
                  }
                  onChange={(
                    e
                  ) =>
                    setEmail(
                      e
                        .target
                        .value
                    )
                  }
                  required
                  disabled={
                    loading
                  }
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-2">
                <label
                  style={
                    labelStyle
                  }
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  style={
                    linkStyle
                  }
                >
                  Forgot?
                </Link>
              </div>

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
                  placeholder="Enter password"
                  value={
                    password
                  }
                  onChange={(
                    e
                  ) =>
                    setPassword(
                      e
                        .target
                        .value
                    )
                  }
                  required
                  disabled={
                    loading
                  }
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

            {/* ERROR */}
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

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={
                loading
              }
              className="btn w-100 mt-4"
              style={{
                height: 48,
                border: "none",
                borderRadius:
                  14,
                fontWeight: 700,
                color: "#fff",
                background:
                  "linear-gradient(135deg,#10b981,#059669)",
                boxShadow:
                  "0 14px 34px rgba(16,185,129,.24)",
              }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm"></span>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <div
              style={{
                textAlign:
                  "center",
                marginTop: 18,
                fontSize:
                  ".92rem",
                color:
                  "#64748b",
                lineHeight:
                  1.6,
              }}
            >
              Don’t have an
              account?{" "}
              <Link
                to="/register"
                style={
                  linkStyle
                }
              >
                Create one
                free
              </Link>
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

const linkStyle = {
  color: "#10b981",
  textDecoration: "none",
  fontWeight: 700,
};
