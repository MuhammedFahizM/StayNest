import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../services/api";

export default function EmailSent() {
  const { state } = useLocation();

  const email = state?.email || "";
  const type = state?.type || "verify";

  const isVerify =
    type === "verify";

  const [sending, setSending] =
    useState(false);

  const [result, setResult] =
    useState(null);

  async function handleResend() {
    if (!email) {
      setResult({
        type: "error",
        msg: "No email provided.",
      });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res =
        await api.post(
          "/accounts/resend-verification/",
          { email }
        );

      setResult({
        type: "success",
        msg:
          res.data?.message ||
          "Verification email resent successfully.",
      });
    } catch (err) {
      setResult({
        type: "error",
        msg:
          err?.response?.data
            ?.message ||
          err?.response?.data
            ?.error ||
          "Unable to resend right now.",
      });
    } finally {
      setSending(false);
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
            Secure email flow
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
            {isVerify
              ? "One more step to activate your account."
              : "Your password reset request is ready."}
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
            {isVerify
              ? "We've sent a verification link to your inbox. Confirm your email to start using StayNest."
              : "We've sent a secure reset link to your email. Use it to create a new password and continue."}
          </p>

          {[
            [
              "bi-envelope-check",
              "Fast delivery to your inbox",
            ],
            [
              "bi-shield-check",
              "Secure account protection",
            ],
            [
              "bi-lightning-charge",
              "Quick access after confirmation",
            ],
            [
              "bi-house-heart",
              "Continue to premium stays",
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

          {/* ICON */}
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
            <i
              className={`bi ${
                isVerify
                  ? "bi-envelope-check"
                  : "bi-key-fill"
              }`}
            ></i>
          </div>

          <h2
            style={{
              textAlign:
                "center",
              fontWeight: 800,
              fontSize:
                "1.85rem",
              color:
                "#0f172a",
              marginBottom: 8,
            }}
          >
            {isVerify
              ? "Check your email"
              : "Reset link sent"}
          </h2>

          <p
            style={{
              textAlign:
                "center",
              color:
                "#64748b",
              lineHeight:
                1.7,
              marginBottom:
                24,
            }}
          >
            {isVerify
              ? "Open the verification email and click the link to activate your account."
              : "Open your email and click the secure link to create a new password."}
          </p>

          {/* EMAIL BOX */}
          {email && (
            <div
              style={{
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  16,
                padding:
                  "14px 16px",
                marginBottom:
                  18,
                display:
                  "flex",
                gap: 12,
                alignItems:
                  "center",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius:
                    12,
                  background:
                    "#ecfdf5",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  color:
                    "#10b981",
                }}
              >
                <i className="bi bi-envelope"></i>
              </div>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize:
                      ".75rem",
                    color:
                      "#94a3b8",
                    marginBottom: 2,
                  }}
                >
                  Email sent to
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color:
                      "#0f172a",
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                  }}
                >
                  {email}
                </div>
              </div>
            </div>
          )}

          {/* RESULT */}
          {result && (
            <div
              style={{
                background:
                  result.type ===
                  "success"
                    ? "#f0fdf4"
                    : "#fef2f2",
                border:
                  `1px solid ${
                    result.type ===
                    "success"
                      ? "#bbf7d0"
                      : "#fecaca"
                  }`,
                borderRadius:
                  14,
                padding:
                  "12px 14px",
                marginBottom:
                  16,
                color:
                  result.type ===
                  "success"
                    ? "#059669"
                    : "#dc2626",
                fontSize:
                  ".88rem",
              }}
            >
              <i
                className={`bi ${
                  result.type ===
                  "success"
                    ? "bi-check-circle"
                    : "bi-exclamation-circle"
                } me-2`}
              ></i>
              {result.msg}
            </div>
          )}

          {/* ACTIONS */}
          <div className="d-grid gap-2">
            {isVerify && (
              <button
                onClick={
                  handleResend
                }
                disabled={
                  sending
                }
                className="btn"
                style={
                  primaryBtn
                }
              >
                {sending ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm"></span>
                    Resending...
                  </span>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Resend verification email
                  </>
                )}
              </button>
            )}

            <Link
              to="/login"
              className="btn"
              style={
                isVerify
                  ? secondaryBtn
                  : primaryBtn
              }
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Go to Login
            </Link>

            {!isVerify && (
              <Link
                to="/forgot-password"
                className="btn"
                style={
                  secondaryBtn
                }
              >
                <i className="bi bi-envelope-plus me-2"></i>
                Request new reset link
              </Link>
            )}
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
                18,
              lineHeight:
                1.6,
            }}
          >
            Didn’t receive it?
            Check spam or
            wait a minute
            before retrying.
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

const primaryBtn = {
  height: 48,
  border: "none",
  borderRadius: 14,
  fontWeight: 700,
  color: "#fff",
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  boxShadow:
    "0 14px 34px rgba(16,185,129,.22)",
};

const secondaryBtn = {
  height: 48,
  borderRadius: 14,
  fontWeight: 700,
  border:
    "1px solid #e2e8f0",
  background: "#fff",
  color: "#374151",
};