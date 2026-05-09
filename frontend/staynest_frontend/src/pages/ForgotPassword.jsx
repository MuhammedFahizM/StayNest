import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    touched,
    setTouched,
  ] = useState(false);

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    );

  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    setTouched(
      true
    );
    setError("");

    if (
      !emailValid
    )
      return;

    setLoading(
      true
    );

    try {
      await api.post(
        "/accounts/forgot-password/",
        {
          email:
            email.trim(),
        }
      );

      navigate(
        "/email-sent",
        {
          state: {
            email:
              email.trim(),
            type: "reset",
          },
        }
      );
    } catch (err) {
      setError(
        err
          ?.response
          ?.data
          ?.detail ||
          err
            ?.response
            ?.data
            ?.message ||
          "Unable to send reset link right now."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

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
        <div className="d-flex align-items-center gap-3">
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
        <div>
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
            Secure recovery flow
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
            Forgot your
            password?
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
            Enter your email
            and we'll send a
            secure reset
            link so you can
            regain access to
            your StayNest
            account.
          </p>

          {[
            [
              "bi-shield-lock",
              "Protected password reset",
            ],
            [
              "bi-envelope-check",
              "Email delivery in seconds",
            ],
            [
              "bi-clock-history",
              "Time-limited secure token",
            ],
            [
              "bi-house-heart",
              "Return to premium stays",
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
            maxWidth: 500,
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

          {/* HEADER */}
          <div className="text-center mb-4">
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius:
                  "50%",
                background:
                  "rgba(16,185,129,.10)",
                display:
                  "grid",
                placeItems:
                  "center",
                margin:
                  "0 auto 18px",
                color:
                  "#10b981",
                fontSize: 30,
              }}
            >
              <i className="bi bi-key-fill"></i>
            </div>

            <h2
              style={{
                fontWeight: 800,
                fontSize:
                  "1.85rem",
                color:
                  "#0f172a",
                marginBottom: 8,
              }}
            >
              Reset Password
            </h2>

            <p
              style={{
                color:
                  "#64748b",
                lineHeight:
                  1.7,
                margin: 0,
              }}
            >
              We'll send a
              reset link to
              your email
              address.
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={
              handleSubmit
            }
          >
            <label
              style={
                labelStyle
              }
            >
              Email Address
            </label>

            <div
              style={{
                ...inputWrap,
                borderColor:
                  touched &&
                  !emailValid
                    ? "#fecaca"
                    : "#dbe3ea",
                marginTop: 8,
              }}
            >
              <i className="bi bi-envelope text-muted"></i>

              <input
                type="email"
                value={email}
                disabled={
                  loading
                }
                onBlur={() =>
                  setTouched(
                    true
                  )
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
                placeholder="you@example.com"
                className="form-control border-0"
                style={
                  cleanInput
                }
              />
            </div>

            {touched &&
              !emailValid && (
                <div
                  style={
                    fieldError
                  }
                >
                  Please
                  enter a
                  valid
                  email
                  address.
                </div>
              )}

            {error && (
              <div
                style={{
                  marginTop: 14,
                  background:
                    "#fef2f2",
                  border:
                    "1px solid #fecaca",
                  borderRadius:
                    14,
                  padding:
                    "12px 14px",
                  color:
                    "#dc2626",
                  fontSize:
                    ".88rem",
                }}
              >
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading
              }
              className="btn w-100 mt-4"
              style={{
                ...primaryBtn,
                opacity:
                  loading
                    ? 0.8
                    : 1,
              }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm"></span>
                  Sending...
                </span>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* FOOT ACTION */}
          <div className="text-center mt-4">
            <Link
              to="/login"
              style={{
                textDecoration:
                  "none",
                color:
                  "#64748b",
                fontWeight: 600,
                fontSize:
                  ".92rem",
              }}
            >
              ← Back to Login
            </Link>
          </div>

          <div
            style={{
              textAlign:
                "center",
              fontSize:
                ".82rem",
              color:
                "#94a3b8",
              marginTop:
                16,
            }}
          >
            Check spam if you
            don’t receive the
            email.
          </div>
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
  fontWeight: 700,
  color: "#374151",
  display: "block",
};

const inputWrap = {
  height: 50,
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

const fieldError = {
  marginTop: 8,
  fontSize: ".82rem",
  color: "#dc2626",
};

const primaryBtn = {
  height: 50,
  border: "none",
  borderRadius: 14,
  fontWeight: 700,
  color: "#fff",
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  boxShadow:
    "0 14px 34px rgba(16,185,129,.22)",
};