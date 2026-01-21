// // src/pages/ForgotPassword.jsx
// import { useState } from "react";
// import api from "../services/api";
// import { Link , useNavigate} from "react-router-dom";

// export default function ForgotPassword() {

//     const navigate = useNavigate();
    
//     const [email, setEmail] = useState("");
//     const [message, setMessage] = useState("");
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setMessage("");
//         setError("");
//         setLoading(true);
//         try {
//             await api.post("/accounts/forgot-password/", { email });
//             //   setMessage("If the email exists, a reset link has been sent.");
//             // after successful forgot-password api call
//             navigate("/email-sent", { state: { email, type: "reset" } });

//             setEmail("");
//         } catch (err) {
//             setError(err?.response?.data?.detail || "Unable to send reset link. Try again later.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 px-4 py-12">
//             <div className="pt-24 w-full max-w-5xl">
//                 <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
//                     {/* Left: optional illustration / message */}
//                     <div className="hidden lg:flex items-center justify-center">
//                         <div className="max-w-sm text-left">
//                             <h3 className="text-3xl font-semibold text-gray-800 mb-3">Forgot your password?</h3>
//                             <p className="text-gray-600">
//                                 Enter the email associated with your account and we’ll send a secure link to reset your password.
//                             </p>
//                         </div>
//                     </div>

//                     {/* Right: form card */}
//                     <div className="mx-auto w-full max-w-md">
//                         <div className="backdrop-blur-xl bg-white/60 border border-white/70 shadow-xl rounded-2xl p-8">
//                             <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset password</h2>
//                             <p className="text-sm text-gray-600 mb-6">We'll send a link to your email with instructions.</p>

//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                                     <input
//                                         type="email"
//                                         required
//                                         value={email}
//                                         onChange={(e) => setEmail(e.target.value)}
//                                         className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                                         placeholder="you@example.com"
//                                     />
//                                 </div>

//                                 {error && <p className="text-red-600 text-sm">{error}</p>}
//                                 {message && <p className="text-green-700 text-sm">{message}</p>}

//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-blue-600 transition"
//                                 >
//                                     {loading ? "Sending..." : "Send reset link"}
//                                 </button>
//                             </form>

//                             <div className="mt-6 text-center text-sm text-gray-700">
//                                 <Link to="/login" className="underline hover:text-gray-900">Back to login</Link>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


// src/pages/ForgotPassword.jsx
import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await api.post("/accounts/forgot-password/", { email });

      navigate("/email-sent", {
        state: { email, type: "reset" },
      });

      setEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to send reset link. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-white d-flex justify-content-center pt-5">
      <div className="container pt-5">
        <div className="row align-items-center justify-content-center">

          {/* LEFT PANEL — Message */}
          <div className="col-lg-6 d-none d-lg-flex justify-content-center">
            <div style={{ maxWidth: 360 }}>
              <h3 className="fw-semibold mb-3">
                Forgot your password?
              </h3>
              <p className="text-muted">
                Enter the email associated with your account and we’ll
                send a secure link to reset your password.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL — Form */}
          <div className="col-12 col-md-10 col-lg-6 col-xl-5">
            <div className="card shadow-sm">
              <div className="card-body p-4">

                <h5 className="fw-semibold mb-1">
                  Reset password
                </h5>
                <p className="text-muted mb-4">
                  We'll send a link to your email with instructions.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="alert alert-success py-2">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <div className="text-center mt-4 small">
                  <Link to="/login" className="text-decoration-underline">
                    Back to login
                  </Link>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
