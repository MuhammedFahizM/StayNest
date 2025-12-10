// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== passwordConfirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/accounts/reset-password/", {
                token,
                password,
                password_confirm: passwordConfirm,
            });

            //   setMessage("Password reset successful. Redirecting to login...");
            //   setTimeout(() => navigate("/login"), 1500);
            // Use unified action-result page which auto-redirects to login
            navigate("/action-result?type=reset-success");

        } catch (err) {
            setError(err?.response?.data?.error || "Invalid or expired token.");
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = ({ open }) =>
        open ? (
            // eye-off
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.45 10.45 0 0 0 1.5 12c2.1 4.5 6.3 7.5 10.5 7.5 1.95 0 3.9-.6 5.7-1.65M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.23 6.23 3 3m18 18-3.23-3.23M15 12a3 3 0 0 0-3-3" />
            </svg>
        ) : (
            // eye
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322C3.532 7.51 7.86 4.5 12 4.5c4.14 0 8.468 3.01 9.964 7.822a1.38 1.38 0 0 1 0 .856C20.468 16.49 16.14 19.5 12 19.5c-4.14 0-8.468-3.01-9.964-7.822a1.38 1.38 0 0 1 0-.856z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
        );

    return (
        <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 px-4 py-12">
            <div className="pt-24 w-full max-w-3xl">
                <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left info */}
                    <div className="hidden lg:flex items-center justify-center">
                        <div className="max-w-sm text-left">
                            <h3 className="text-3xl font-semibold text-gray-800 mb-3">Secure your account</h3>
                            <p className="text-gray-600">
                                Create a new secure password. Passwords should be at least 8 characters.
                            </p>
                        </div>
                    </div>

                    {/* Right form card */}
                    <div className="mx-auto w-full max-w-md">
                        <div className="backdrop-blur-xl bg-white/60 border border-white/70 shadow-xl rounded-2xl p-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Set a new password</h2>
                            <p className="text-sm text-gray-600 mb-4">Your token will be validated and the password updated.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                                    <div className="flex items-center bg-white/80 border border-gray-300 rounded-lg">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
                                            placeholder="Minimum 8 characters"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-gray-600 hover:text-gray-800 transition">
                                            <EyeIcon open={showPassword} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                                    <div className="flex items-center bg-white/80 border border-gray-300 rounded-lg">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            minLength={8}
                                            value={passwordConfirm}
                                            onChange={(e) => setPasswordConfirm(e.target.value)}
                                            className="w-full p-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
                                            placeholder="Re-enter password"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="px-3 text-gray-600 hover:text-gray-800 transition">
                                            <EyeIcon open={showConfirm} />
                                        </button>
                                    </div>
                                </div>

                                {error && <p className="text-red-600 text-sm">{error}</p>}
                                {message && <p className="text-green-700 text-sm">{message}</p>}

                                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-blue-600 transition">
                                    {loading ? "Resetting..." : "Reset password"}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-700">
                                <Link to="/login" className="underline hover:text-gray-900">Back to login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
