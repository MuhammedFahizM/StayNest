// Register.jsx — SaaS-Style Unified Registration (Logic Unchanged)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [idProof, setIdProof] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim() || !email.trim()) return "Full name & email required";
    if (!password.trim()) return "Password required";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!idProof) return "ID Proof is required";

    if (role === "owner") {
      if (!phone.trim() || !address.trim()) return "Phone & address required";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const err = validateForm();
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

      const res = await register(fd);
      alert(res.data.detail || "Registration successful. Please verify your email.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="bg-white w-full max-w-xl p-8 rounded-2xl shadow-xl border">

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Create Your Account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Register as a user or property owner to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="owner">Owner</option>
            </select>

            {role === "owner" && (
              <p className="text-xs text-gray-500 mt-1">
                Owners must provide verification details.
              </p>
            )}
          </div>

          {/* Base Fields */}
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
              />
              <button
                type="button"
                className="px-4 border rounded-lg text-sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <div className="flex gap-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
              />
              <button
                type="button"
                className="px-4 border rounded-lg text-sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Owner Only Fields */}
          {role === "owner" && (
            <>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
            </>
          )}


          {/* ID Proof */}
          <div>
            <label className="block text-sm font-medium">
              Government ID Proof
            </label>
            <input
              type="file"
              onChange={(e) => setIdProof(e.target.files[0])}
              className="w-full text-sm"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
