// src/pages/EmailActionResult.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function EmailActionResult() {
  const navigate = useNavigate();
  const params = useParams(); // possible token from /verify-email/:token
  const query = useQuery();
  const qType = query.get("type"); // optional query param
  const token = params.token || query.get("token") || null;

  const [status, setStatus] = useState("loading"); // loading | success | failed
  const [message, setMessage] = useState("");
  const [resendState, setResendState] = useState({ busy: false, info: null });

  // Determine action
  // If route is /verify-email/:token => action = "verify"
  // If query type is "reset-success" => action = "reset-success" (no API)
  // If query type is "reset-failed" => action = "reset-failed" (no API)
  const action = params.token ? "verify" : qType || null;

  useEffect(() => {
    // If action is verify, call API once (guarded)
    let cancelled = false;
    async function verifyOnce() {
      if (!token) {
        setStatus("failed");
        setMessage("Missing token.");
        return;
      }

      try {
        await api.get(`/accounts/verify-email/${token}/`);
        if (cancelled) return;
        setStatus("success");
        setMessage("Email verified successfully.");
      } catch (err) {
        if (cancelled) return;
        setStatus("failed");
        const errMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid or expired link.";
        setMessage(errMsg);
      }
    }

    // If this is a direct success page for reset, set success immediately
    if (action === "reset-success") {
      setStatus("success");
      setMessage("Password reset successful.");
      // auto redirect to login after 1.5s
      const t = setTimeout(() => navigate("/login"), 1500);
      return () => clearTimeout(t);
    }

    // If reset-failed, simply show failure state
    if (action === "reset-failed") {
      setStatus("failed");
      setMessage("Reset link invalid or expired. Request a new reset link.");
      return;
    }

    if (action === "verify") {
      verifyOnce();
    } else {
      // Unknown action => show failed
      setStatus("failed");
      setMessage("Invalid action.");
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, token, qType]);

  // Resend verification: we may need the user's email. If not available, we show a small input.
  async function handleResendVerification(emailInput) {
    setResendState({ busy: true, info: null });
    try {
      const payload = emailInput ? { email: emailInput } : {};
      const res = await api.post("/accounts/resend-verification/", payload);
      setResendState({ busy: false, info: res.data?.message || "Resent." });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to resend verification. Please re-register or contact support.";
      setResendState({ busy: false, info: msg });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 px-4 py-12">
      <div className="pt-24 w-full max-w-xl">
        <div className="backdrop-blur-xl bg-white/60 border border-white/70 shadow-xl rounded-2xl p-8 text-center">
          {status === "loading" && (
            <p className="text-gray-700 text-lg font-medium">Processing…</p>
          )}

          {status === "success" && (
            <>
              <div className="flex items-center justify-center mb-4">
                <svg className="w-16 h-16 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Success</h2>
              <p className="text-gray-700 mb-6">{message}</p>

              {/* If verify success: manual Continue to login */}
              {action === "verify" && (
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow hover:bg-blue-700 transition"
                >
                  Continue to Login
                </Link>
              )}

              {/* reset-success auto-redirect handled above */}
            </>
          )}

          {status === "failed" && (
            <>
              <div className="flex items-center justify-center mb-4">
                <svg className="w-16 h-16 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Link invalid or expired</h2>
              <p className="text-gray-700 mb-4">{message}</p>

              {/* If verification failed: allow resend (with optional email input) */}
              {action === "verify" && (
                <div className="space-y-3">
                  <ResendVerificationForm onResend={handleResendVerification} busy={resendState.busy} info={resendState.info} />
                  <div className="flex justify-center gap-3">
                    <Link to="/register" className="px-4 py-2 rounded-md border bg-white text-gray-800 hover:bg-gray-50">
                      Re-register
                    </Link>
                    <Link to="/login" className="px-4 py-2 rounded-md border bg-white text-gray-800 hover:bg-gray-50">
                      Back to login
                    </Link>
                  </div>
                </div>
              )}

              {/* If reset failed: ask user to request new reset link */}
              {action === "reset-failed" && (
                <div className="flex justify-center gap-3">
                  <Link to="/forgot-password" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                    Request new reset link
                  </Link>
                  <Link to="/login" className="px-4 py-2 rounded-md border bg-white text-gray-800 hover:bg-gray-50">
                    Back to login
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Small form component for resend; allows entering email if needed
function ResendVerificationForm({ onResend, busy, info }) {
  const [email, setEmail] = useState("");

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">Enter email to resend verification</label>
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 p-3 rounded-lg border border-gray-300 bg-white/80"
        />
        <button
          onClick={() => onResend(email)}
          disabled={busy || !email}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {busy ? "Sending..." : "Resend"}
        </button>
      </div>

      {info && <p className="text-sm text-gray-700 mt-2">{info}</p>}
    </div>
  );
}
