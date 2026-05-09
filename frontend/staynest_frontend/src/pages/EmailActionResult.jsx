import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import api from "../services/api";

function useQuery() {
  return new URLSearchParams(
    useLocation().search
  );
}

function ResendVerificationForm({
  onResend,
  busy,
  info,
}) {
  const [email, setEmail] =
    useState("");

  return (
    <div className="mt-2">
      <label
        style={
          labelStyle
        }
      >
        Enter your email
      </label>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 8,
        }}
      >
        <div
          style={{
            ...inputWrap,
            flex: 1,
          }}
        >
          <i className="bi bi-envelope text-muted"></i>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target
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

        <button
          type="button"
          disabled={
            busy ||
            !email
          }
          onClick={() =>
            onResend(
              email
            )
          }
          className="btn"
          style={{
            ...primaryBtn,
            width: 120,
            opacity:
              busy ||
              !email
                ? 0.75
                : 1,
          }}
        >
          {busy
            ? "Sending..."
            : "Resend"}
        </button>
      </div>

      {info && (
        <div
          style={{
            marginTop: 12,
            background:
              "#f8fafc",
            border:
              "1px solid #e2e8f0",
            borderRadius:
              14,
            padding:
              "12px 14px",
            fontSize:
              ".86rem",
            color:
              "#475569",
          }}
        >
          {info}
        </div>
      )}
    </div>
  );
}

export default function EmailActionResult() {
  const navigate =
    useNavigate();

  const params =
    useParams();

  const query =
    useQuery();

  const qType =
    query.get(
      "type"
    );

  const token =
    params.token ||
    query.get(
      "token"
    ) ||
    null;

  const action =
    params.token
      ? "verify"
      : qType ||
        null;

  const [status, setStatus] =
    useState(
      "loading"
    );

  const [message, setMessage] =
    useState("");

  const [
    resendState,
    setResendState,
  ] = useState({
    busy: false,
    info: null,
  });

  useEffect(() => {
    let cancelled =
      false;

    async function verifyOnce() {
      if (!token) {
        setStatus(
          "failed"
        );
        setMessage(
          "Missing token."
        );
        return;
      }

      try {
        await api.get(
          `/accounts/verify-email/${token}/`
        );

        if (
          !cancelled
        ) {
          setStatus(
            "success"
          );
          setMessage(
            "Email verified successfully."
          );
        }
      } catch (err) {
        if (
          !cancelled
        ) {
          setStatus(
            "failed"
          );

          setMessage(
            err
              ?.response
              ?.data
              ?.message ||
              err
                ?.response
                ?.data
                ?.error ||
              "Invalid or expired verification link."
          );
        }
      }
    }

    if (
      action ===
      "reset-success"
    ) {
      setStatus(
        "success"
      );

      setMessage(
        "Password reset successful."
      );

      const t =
        setTimeout(
          () =>
            navigate(
              "/login"
            ),
          1800
        );

      return () =>
        clearTimeout(
          t
        );
    }

    if (
      action ===
      "reset-failed"
    ) {
      setStatus(
        "failed"
      );

      setMessage(
        "Reset link invalid or expired."
      );

      return;
    }

    if (
      action ===
      "verify"
    ) {
      verifyOnce();
    } else {
      setStatus(
        "failed"
      );

      setMessage(
        "Invalid action."
      );
    }

    return () => {
      cancelled =
        true;
    };
  }, [
    action,
    token,
    navigate,
  ]);

  async function handleResendVerification(
    emailInput
  ) {
    setResendState({
      busy: true,
      info: null,
    });

    try {
      const res =
        await api.post(
          "/accounts/resend-verification/",
          {
            email:
              emailInput,
          }
        );

      setResendState({
        busy: false,
        info:
          res.data
            ?.message ||
          "Verification email resent.",
      });
    } catch (err) {
      setResendState({
        busy: false,
        info:
          err
            ?.response
            ?.data
            ?.message ||
          err
            ?.response
            ?.data
            ?.error ||
          "Unable to resend right now.",
      });
    }
  }

  const successMode =
    status ===
    "success";

  const failedMode =
    status ===
    "failed";

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
            Secure account actions
          </div>

          <h1
            style={{
              color:
                "#fff",
              fontWeight: 800,
              fontSize:
                "2.3rem",
              lineHeight:
                1.18,
              marginBottom:
                18,
              maxWidth:
                520,
            }}
          >
            {successMode
              ? "You're almost back in."
              : "Let's get your access restored."}
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
            Verify your
            account, reset
            your password,
            and continue
            using StayNest
            securely.
          </p>

          {[
            [
              "bi-envelope-check",
              "Trusted email actions",
            ],
            [
              "bi-shield-check",
              "Secure token validation",
            ],
            [
              "bi-lightning-charge",
              "Fast access recovery",
            ],
            [
              "bi-house-heart",
              "Back to premium stays",
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
            maxWidth: 520,
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
          {/* LOADING */}
          {status ===
            "loading" && (
            <div className="text-center py-4">
              <div
                className="spinner-border"
                style={{
                  color:
                    "#10b981",
                  width: 42,
                  height: 42,
                }}
              ></div>

              <h3
                style={{
                  marginTop: 18,
                  fontWeight: 800,
                  color:
                    "#0f172a",
                }}
              >
                Processing...
              </h3>

              <p
                style={{
                  color:
                    "#64748b",
                  margin: 0,
                }}
              >
                Please wait
                while we
                validate your
                request.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {successMode && (
            <div className="text-center">
              <div
                style={{
                  width: 76,
                  height: 76,
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
                  fontSize: 32,
                }}
              >
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <h2
                style={{
                  fontWeight: 800,
                  color:
                    "#0f172a",
                  marginBottom: 10,
                }}
              >
                {action ===
                "reset-success"
                  ? "Password Updated"
                  : "Email Verified"}
              </h2>

              <p
                style={{
                  color:
                    "#64748b",
                  lineHeight:
                    1.7,
                  marginBottom:
                    22,
                }}
              >
                {message}
              </p>

              {action ===
              "verify" ? (
                <Link
                  to="/login"
                  className="btn"
                  style={
                    primaryBtn
                  }
                >
                  Continue to
                  Login
                </Link>
              ) : (
                <div
                  style={{
                    color:
                      "#94a3b8",
                    fontSize:
                      ".88rem",
                  }}
                >
                  Redirecting
                  to login...
                </div>
              )}
            </div>
          )}

          {/* FAILED */}
          {failedMode && (
            <div>
              <div className="text-center">
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius:
                      "50%",
                    background:
                      "#fef2f2",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    margin:
                      "0 auto 18px",
                    color:
                      "#ef4444",
                    fontSize: 32,
                  }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </div>

                <h2
                  style={{
                    fontWeight: 800,
                    color:
                      "#0f172a",
                    marginBottom: 10,
                  }}
                >
                  Action Failed
                </h2>

                <p
                  style={{
                    color:
                      "#64748b",
                    lineHeight:
                      1.7,
                    marginBottom:
                      22,
                  }}
                >
                  {message}
                </p>
              </div>

              {action ===
                "verify" && (
                <ResendVerificationForm
                  onResend={
                    handleResendVerification
                  }
                  busy={
                    resendState.busy
                  }
                  info={
                    resendState.info
                  }
                />
              )}

              <div className="d-grid gap-2 mt-3">
                {(action ===
                  "reset-failed" ||
                  action ===
                    null) && (
                  <Link
                    to="/forgot-password"
                    className="btn"
                    style={
                      primaryBtn
                    }
                  >
                    Request New
                    Link
                  </Link>
                )}

                {action ===
                  "verify" && (
                  <Link
                    to="/register"
                    className="btn"
                    style={
                      secondaryBtn
                    }
                  >
                    Re-register
                  </Link>
                )}

                <Link
                  to="/login"
                  className="btn"
                  style={
                    secondaryBtn
                  }
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
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