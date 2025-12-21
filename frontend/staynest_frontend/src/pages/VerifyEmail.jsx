// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import api from "../services/api";

// export default function VerifyEmail() {
//   const { token } = useParams();
//   const [status, setStatus] = useState("loading"); // loading | success | failed
//   const [hasCalled, setHasCalled] = useState(false); // Prevent StrictMode double call

//   useEffect(() => {
//     if (hasCalled) return; // Prevent second execution in React.StrictMode
//     setHasCalled(true);

//     async function verify() {
//       try {
//         await api.get(`/accounts/verify-email/${token}/`);
//         setStatus("success");
//       } catch (err) {
//         setStatus("failed");
//       }
//     }

//     verify();
//   }, [token, hasCalled]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 px-4">
//       <div className="backdrop-blur-xl bg-white/60 border border-white/70 shadow-xl rounded-2xl p-8 max-w-md w-full mt-24">

//         {status === "loading" && (
//           <p className="text-center text-gray-700 text-lg font-medium">
//             Verifying your email...
//           </p>
//         )}

//         {status === "success" && (
//           <>
//             <h2 className="text-2xl font-bold text-green-700 text-center mb-2">
//               Email Verified!
//             </h2>
//             <p className="text-center text-gray-700 mb-4">
//               Your account is now active. You can log in.
//             </p>

//             <Link
//               to="/login"
//               className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
//             >
//               Go to Login
//             </Link>
//           </>
//         )}

//         {status === "failed" && (
//           <>
//             <h2 className="text-2xl font-bold text-red-600 text-center mb-2">
//               Invalid or Expired Link
//             </h2>
//             <p className="text-center text-gray-700 mb-4">
//               The verification link is not valid anymore.
//             </p>

//             <Link
//               to="/register"
//               className="block text-center bg-gray-800 hover:bg-black text-white py-3 rounded-xl font-semibold transition"
//             >
//               Go to Register
//             </Link>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
