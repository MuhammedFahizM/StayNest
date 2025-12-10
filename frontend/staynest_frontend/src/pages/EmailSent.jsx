// src/pages/EmailSent.jsx
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../services/api";

export default function EmailSent() {
  const { state } = useLocation();
  const email = state?.email || "";
  const type = state?.type || "verify"; // "verify" or "reset"
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // success | error message

  const title = type === "verify" ? "Verify your email" : "Check your inbox";
  const description =
    type === "verify"
      ? "We sent a verification link to your email. Click the link to activate your account."
      : "We sent a password reset link to your email. Click the link to create a new password.";

  async function handleResend() {
    // Only resend verification here (not reset)
    if (!email) {
      setResult("No email provided. Please re-request from the form.");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await api.post("/accounts/resend-verification/", { email });
      setResult(res.data?.message || "Verification email resent.");
    } catch (err) {
      // If endpoint doesn't exist or fails, show friendly message
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to resend. If this persists, re-submit the registration form or contact support.";
      setResult(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 px-4 py-12">
      <div className="pt-24 w-full max-w-2xl">
        <div className="backdrop-blur-xl bg-white/60 border border-white/70 shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{description}</p>

          <div className="bg-white/80 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              Email sent to:
            </p>
            <p className="font-medium text-gray-900">{email || "—"}</p>
          </div>

          {result && (
            <div className="mb-4 p-3 rounded-md bg-gray-50 border">
              <p className="text-sm text-gray-800">{result}</p>
            </div>
          )}

          <div className="flex gap-3">
            {type === "verify" && (
              <button
                onClick={handleResend}
                disabled={sending}
                className="px-4 py-2 rounded-md bg-blue-600 text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
              >
                {sending ? "Resending..." : "Resend verification email"}
              </button>
            )}

            <Link
              to="/login"
              className="px-4 py-2 rounded-md border bg-white text-gray-800 hover:bg-gray-50 transition"
            >
              Go to Login
            </Link>

            {type === "reset" && (
              <Link
                to="/forgot-password"
                className="px-4 py-2 rounded-md border bg-white text-gray-800 hover:bg-gray-50 transition"
              >
                Request new reset link
              </Link>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Didn&apos;t receive the email? Check your spam folder, or try again after a minute.
          </p>
        </div>
      </div>
    </div>
  );
}
