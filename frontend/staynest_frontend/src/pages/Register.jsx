// // Register.jsx — SaaS-Style Unified Registration (Logic Unchanged)

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { register } from "../services/authService";

// export default function Register() {
//   const navigate = useNavigate();

//   const [role, setRole] = useState("user");

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [phone, setPhone] = useState("");
//   const [address, setAddress] = useState("");
//   const [idProof, setIdProof] = useState(null);

//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");


//   const validateForm = () => {
//     if (!fullName.trim() || !email.trim()) return "Full name & email required";
//     if (!password.trim()) return "Password required";
//     if (password !== confirmPassword) return "Passwords do not match";
//     if (!idProof) return "ID Proof is required";

//     if (role === "owner") {
//       if (!phone.trim() || !address.trim()) return "Phone & address required";
//     }

//     return null;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setError("");
//     setMessage("");

//     const errMsg = validateForm();
//     if (errMsg) return setError(errMsg);

//     setLoading(true);

//     try {
//       const fd = new FormData();
//       fd.append("full_name", fullName);
//       fd.append("email", email);
//       fd.append("password", password);
//       fd.append("role", role);
//       fd.append("proof", idProof);

//       if (role === "owner") {
//         fd.append("phone", phone);
//         fd.append("address", address);
//       }

//       await register(fd);

//       setMessage("Verification email sent. Check your inbox.");

//       navigate("/email-sent", {
//         state: { email, type: "verify" }
//       });

//     } catch (err) {
//       console.log("REGISTER ERROR:", err);

//       if (!err.response) {
//         return setError("Cannot reach server.");
//       }

//       const data = err.response.data;

//       setError(
//         data.error ||
//         data.message ||
//         JSON.stringify(data) ||
//         "Something went wrong."
//       );

//     } finally {
//       setLoading(false);
//     }
//   };


//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 px-4 py-12">
//       <div className="pt-24 w-full max-w-6xl mx-auto">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

//           {/* LEFT PANEL — Marketing / Welcome */}
//           <div className="px-6 hidden lg:block">
//             <div className="max-w-lg">
//               <h1 className="text-4xl font-bold text-gray-800 mb-4">
//                 Create your StayNest account
//               </h1>
//               <p className="text-gray-600 mb-6">
//                 Register to explore properties, connect with owners, and
//                 manage bookings seamlessly. If you're a property owner,
//                 list and manage your stays with confidence.
//               </p>

//               <ul className="text-sm text-gray-700 space-y-2">
//                 <li>• Secure email verification</li>
//                 <li>• Easy onboarding for property owners</li>
//                 <li>• Protected file uploads for ID verification</li>
//               </ul>
//             </div>
//           </div>

//           {/* RIGHT PANEL — FORM CARD */}
//           <div className="mx-auto w-full max-w-md">
//             <div className="backdrop-blur-xl bg-white/60 border border-white/70 shadow-xl rounded-2xl p-8">

//               <h2 className="text-xl font-semibold text-gray-800 mb-2">
//                 Sign Up
//               </h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 Create an account to get started.
//               </p>

//               <form onSubmit={handleSubmit} className="space-y-4">

//                 {/* ROLE SELECTOR */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Account Type
//                   </label>
//                   <select
//                     value={role}
//                     onChange={(e) => setRole(e.target.value)}
//                     className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
//                   >
//                     <option value="user">User</option>
//                     <option value="owner">Owner</option>
//                   </select>

//                   {role === "owner" && (
//                     <p className="text-xs text-gray-500 mt-1">
//                       Owners must provide verification details.
//                     </p>
//                   )}
//                 </div>

//                 {/* FULL NAME */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Full Name
//                   </label>
//                   <input
//                     type="text"
//                     value={fullName}
//                     onChange={(e) => setFullName(e.target.value)}
//                     className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
//                     placeholder="Your full name"
//                   />
//                 </div>

//                 {/* EMAIL */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Email Address
//                   </label>
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
//                     placeholder="you@example.com"
//                   />
//                 </div>

//                 {/* PASSWORD */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Password
//                   </label>

//                   <div className="flex items-center bg-white/80 border border-gray-300 rounded-lg">
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       className="w-full p-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
//                       placeholder="Choose a secure password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="px-3 text-gray-600 hover:text-gray-800 transition"
//                     >
//                       {showPassword ? (
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.45 10.45 0 0 0 1.5 12c2.1 4.5 6.3 7.5 10.5 7.5 1.95 0 3.9-.6 5.7-1.65M9.88 9.88a3 3 0 1 0 4.24 4.24" />
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M6.23 6.23 3 3m18 18-3.23-3.23M15 12a3 3 0 0 0-3-3" />
//                         </svg>
//                       ) : (
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322C3.532 7.51 7.86 4.5 12 4.5c4.14 0 8.468 3.01 9.964 7.822a1.38 1.38 0 0 1 0 .856C20.468 16.49 16.14 19.5 12 19.5c-4.14 0-8.468-3.01-9.964-7.822a1.38 1.38 0 0 1 0-.856z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
//                         </svg>
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 {/* CONFIRM PASSWORD */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Confirm Password
//                   </label>

//                   <div className="flex items-center bg-white/80 border border-gray-300 rounded-lg">
//                     <input
//                       type={showConfirmPassword ? "text" : "password"}
//                       value={confirmPassword}
//                       onChange={(e) => setConfirmPassword(e.target.value)}
//                       className="w-full p-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none"
//                       placeholder="Re-enter password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                       className="px-3 text-gray-600 hover:text-gray-800 transition"
//                     >
//                       {showConfirmPassword ? (
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.45 10.45 0 0 0 1.5 12c2.1 4.5 6.3 7.5 10.5 7.5 1.95 0 3.9-.6 5.7-1.65M9.88 9.88a3 3 0 1 0 4.24 4.24" />
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M6.23 6.23 3 3m18 18-3.23-3.23M15 12a3 3 0 0 0-3-3" />
//                         </svg>
//                       ) : (
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322C3.532 7.51 7.86 4.5 12 4.5c4.14 0 8.468 3.01 9.964 7.822a1.38 1.38 0 0 1 0 .856C20.468 16.49 16.14 19.5 12 19.5c-4.14 0-8.468-3.01-9.964-7.822a1.38 1.38 0 0 1 0-.856z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
//                         </svg>
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 {/* OWNER FIELDS */}
//                 {role === "owner" && (
//                   <>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Phone
//                       </label>
//                       <input
//                         type="text"
//                         value={phone}
//                         onChange={(e) => setPhone(e.target.value)}
//                         className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
//                         placeholder="+91 98765 43210"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Address
//                       </label>
//                       <textarea
//                         value={address}
//                         onChange={(e) => setAddress(e.target.value)}
//                         className="w-full p-3 rounded-lg bg-white/80 border border-gray-300 text-gray-800"
//                         placeholder="Owner address"
//                       />
//                     </div>
//                   </>
//                 )}

//                 {/* PROOF UPLOAD */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Government ID Proof
//                   </label>
//                   <input
//                     type="file"
//                     onChange={(e) => setIdProof(e.target.files[0])}
//                     className="w-full text-sm"
//                   />
//                   <p className="text-xs text-gray-500 mt-1">
//                     Accepted formats: PDF, JPG, PNG.
//                   </p>
//                 </div>

//                 {error && (
//                   <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded">
//                     {error}
//                   </p>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-blue-600 transition disabled:opacity-50"
//                 >
//                   {loading ? "Creating Account..." : "Create Account"}
//                 </button>

//                 <p className="text-center text-sm text-gray-700">
//                   Already have an account?{" "}
//                   <span
//                     onClick={() => navigate("/login")}
//                     className="text-blue-600 cursor-pointer hover:underline"
//                   >
//                     Login
//                   </span>
//                 </p>
//               </form>

//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

// }

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
    if (!fullName.trim() || !email.trim())
      return "Full name & email required";
    if (!password.trim()) return "Password required";
    if (password !== confirmPassword)
      return "Passwords do not match";
    if (!idProof) return "ID Proof is required";

    if (role === "owner") {
      if (!phone.trim() || !address.trim())
        return "Phone & address required";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    const errMsg = validateForm();
    if (errMsg) return setError(errMsg);

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
      if (!err.response) {
        setError("Cannot reach server.");
      } else {
        const data = err.response.data;
        setError(
          data.error ||
            data.message ||
            JSON.stringify(data) ||
            "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-vh-100 bg-white d-flex justify-content-center pt-5">
    <div className="container pt-5">
      <div className="row align-items-center justify-content-center">

        {/* LEFT PANEL — Marketing */}
        <div className="col-lg-6 d-none d-lg-block">
          <div className="pe-5">
            <h1 className="fw-bold mb-3">
              Create your StayNest account
            </h1>

            <p className="text-muted mb-4">
              Register to explore properties, connect with owners,
              and manage bookings seamlessly. If you're a property
              owner, list and manage your stays with confidence.
            </p>

            <ul className="text-muted small ps-3">
              <li className="mb-2">
                Secure email verification
              </li>
              <li className="mb-2">
                Easy onboarding for property owners
              </li>
              <li className="mb-2">
                Protected file uploads for ID verification
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL — Form */}
        <div className="col-12 col-md-10 col-lg-6 col-xl-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">

              <h4 className="fw-semibold mb-1">
                Create Account
              </h4>
              <p className="text-muted mb-4">
                Register to get started with StayNest
              </p>

              <form onSubmit={handleSubmit}>

                {/* Account Type */}
                <div className="mb-3">
                  <label className="form-label">Account Type</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                {/* Full Name */}
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                </div>

                {/* Owner-only fields */}
                {role === "owner" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* ID Proof */}
                <div className="mb-3">
                  <label className="form-label">Government ID Proof</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setIdProof(e.target.files[0])}
                  />
                </div>

                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>

                <p className="text-center mt-3 small">
                  Already have an account?{" "}
                  <span
                    role="button"
                    className="text-primary text-decoration-underline"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </span>
                </p>

              </form>

            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);
}
