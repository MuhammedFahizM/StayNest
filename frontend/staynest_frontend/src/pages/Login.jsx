// import { useState, useContext } from "react";
// import { login } from "../services/authService";
// import { AuthContext } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");

//   const { loginUser } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const data = await login({
//         email: email,
//         password: password,
//       });

//       // Save user + token in AuthContext
//       loginUser(data);

//       alert("Login successful!");

//       // Redirect based on role
//       if (data.role === "owner") {
//         navigate("/owner/dashboard");
//       } else {
//         navigate("/");
//       }
//     } catch (err) {
//       setError("Invalid email or password");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center 
//                   bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 
//                   px-4 py-8">

//       <div className="
//                       backdrop-blur-xl bg-white/60
//                       border border-white/70
//                       shadow-xl
//                       rounded-2xl
//                       p-8 w-full max-w-md
//                       transition-all">

//         {/* Heading */}
//         <h2 className="text-3xl font-semibold text-gray-800 text-center mb-4 tracking-wide">
//           Welcome Back
//         </h2>
//         <p className="text-gray-600 text-center text-sm mb-6">
//           Log in to continue your StayNest experience
//         </p>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-6">

//           {/* Email */}
//           <div>
//             <label className="text-gray-700 font-medium text-sm mb-1 block">Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full p-3 rounded-lg bg-white/70 border border-gray-300 
//                        text-gray-800 placeholder-gray-500 
//                        focus:outline-none focus:ring-2 focus:ring-blue-400"
//               placeholder="you@example.com"
//               required
//             />
//           </div>

//           {/* Password */}
//           <div>
//             <label className="text-gray-700 font-medium text-sm mb-1 block">Password</label>

//             <div className="flex items-center bg-white/70 border border-gray-300 rounded-lg">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full p-3 bg-transparent 
//                          text-gray-800 placeholder-gray-500 
//                          focus:outline-none"
//                 placeholder="Enter your password"
//                 required
//               />

//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="px-3 text-gray-600 hover:text-gray-800 transition"
//               >
//                 {showPassword ? (
//                   // Eye-Off Icon
//                   <svg xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={1.5}
//                     stroke="currentColor"
//                     className="w-5 h-5">
//                     <path strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M3.98 8.223A10.45 10.45 0 0 0 1.5 12c2.1 4.5 6.3 7.5 10.5 7.5 1.95 0 3.9-.6 5.7-1.65M9.88 9.88a3 3 0 1 0 4.24 4.24" />
//                     <path strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M6.23 6.23 3 3m18 18-3.23-3.23M15 12a3 3 0 0 0-3-3" />
//                   </svg>
//                 ) : (
//                   // Eye Icon
//                   <svg xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth={1.5}
//                     stroke="currentColor"
//                     className="w-5 h-5">
//                     <path strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M2.036 12.322C3.532 7.51 7.86 4.5 12 4.5c4.14 0 8.468 3.01 9.964 7.822a1.38 1.38 0 0 1 0 .856C20.468 16.49 16.14 19.5 12 19.5c-4.14 0-8.468-3.01-9.964-7.822a1.38 1.38 0 0 1 0-.856z" />
//                     <path strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
//                   </svg>
//                 )}
//               </button>

//             </div>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <p className="text-red-600 text-sm text-center">{error}</p>
//           )}

//           {/* Login Button */}
//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white py-3 rounded-xl 
//                      font-semibold shadow-lg hover:bg-blue-600 
//                      transition duration-200"
//           >
//             Login
//           </button>
//         </form>

//         {/* Links */}
//         <div className="mt-6 text-center text-sm text-gray-700 space-y-2">
//           <p>
//             <a href="/forgot-password" className="hover:text-gray-900 underline">
//               Forgot your password?
//             </a>
//           </p>

//           <p>
//             Don’t have an account?{" "}
//             <a href="/register" className="underline hover:text-gray-900">
//               Create one
//             </a>
//           </p>
//         </div>
//       </div>
//     </div>
//   );

// }

import { useState, useContext } from "react";
import { login } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login({ email, password });
      loginUser(data);

      if (data.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/");
      }
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3">
      <div className="card shadow-sm w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-4">
          <h4 className="text-center fw-semibold mb-2">
            Welcome Back
          </h4>
          <p className="text-center text-muted mb-4">
            Log in to your StayNest account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            {error && (
              <div className="alert alert-danger py-2 text-center">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>

          <div className="text-center mt-4 small">
            <p className="mb-1">
              <a href="/forgot-password">Forgot your password?</a>
            </p>
            <p className="mb-0">
              Don’t have an account?{" "}
              <a href="/register">Create one</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
