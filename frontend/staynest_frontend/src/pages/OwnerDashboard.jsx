// import { useEffect, useState, useContext } from "react";
// import { ownerDashboard } from "../services/authService";
// import { AuthContext } from "../context/AuthContext";
// import { getOwnerProperties } from "../services/propertyService";


// export default function OwnerDashboard() {
//   const { user } = useContext(AuthContext);
//   const [status, setStatus] = useState(null);
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [propertyCount, setPropertyCount] = useState(0);


//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const data = await ownerDashboard();
//         setStatus(data.status);
//         setMessage(data.message);

//         const properties = await getOwnerProperties();
//         setPropertyCount(properties.length);

//       } catch (error) {
//         if (error.response?.status === 401) {
//           setErrorMsg("Unauthorized access. Please login again.");
//         } else {
//           setErrorMsg("Something went wrong.");
//         }
//       }
//       setLoading(false);
//     };

//     fetchData();
//   }, []);

//   /* Loading */
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">
//         Loading dashboard...
//       </div>
//     );
//   }

//   /* Error */
//   if (errorMsg) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl shadow">
//           {errorMsg}
//         </div>
//       </div>
//     );
//   }

//   /* Pending approval */
//   if (status === "pending_admin_approval") {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4">
//         <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-2xl shadow max-w-md text-center">
//           <h2 className="text-xl font-semibold mb-2">
//             Verification Pending
//           </h2>
//           <p className="text-sm">{message}</p>
//         </div>
//       </div>
//     );
//   }

//   /* Approved dashboard */
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 pt-28 px-4">
//       <div className="max-w-6xl mx-auto">

//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-800">
//             Owner Dashboard
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Welcome back, {user?.full_name}
//           </p>
//         </div>

//         {/* Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

//           {/* Status Card */}
//           <div className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow hover:shadow-md transition">
//             <h3 className="text-sm font-medium text-gray-500 mb-2">
//               Account Status
//             </h3>
//             <p className="text-lg font-semibold text-green-600">
//               Approved
//             </p>
//             <p className="text-sm text-gray-600 mt-2">
//               {message}
//             </p>
//           </div>

//           {/* Properties Card */}
//           <div className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow hover:shadow-md transition">
//             <h3 className="text-sm font-medium text-gray-500 mb-2">
//               Properties
//             </h3>
//             <p className="text-2xl font-bold text-gray-800">
//               {propertyCount}
//             </p>
//             <p className="text-sm text-gray-600 mt-2">
//               Properties listed
//             </p>
//           </div>

//           {/* Messages Card */}
//           <div className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow hover:shadow-md transition">
//             <h3 className="text-sm font-medium text-gray-500 mb-2">
//               Messages
//             </h3>
//             <p className="text-2xl font-bold text-gray-800">
//               0
//             </p>
//             <p className="text-sm text-gray-600 mt-2">
//               Unread conversations
//             </p>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState, useContext } from "react";
import { ownerDashboard } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { getOwnerProperties } from "../services/propertyService";
import { useNavigate } from "react-router-dom";


export default function OwnerDashboard() {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [propertyCount, setPropertyCount] = useState(0);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ownerDashboard();
        setStatus(data.status);
        setMessage(data.message);

        const properties = await getOwnerProperties();
        setPropertyCount(properties.length);
      } catch (error) {
        if (error.response?.status === 401) {
          setErrorMsg("Unauthorized access. Please login again.");
        } else {
          setErrorMsg("Something went wrong.");
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  /* Loading */
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-muted">
        Loading dashboard...
      </div>
    );
  }

  /* Error */
  if (errorMsg) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger shadow-sm">
          {errorMsg}
        </div>
      </div>
    );
  }

  /* Pending approval */
  if (status === "pending_admin_approval") {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-warning text-center shadow-sm" style={{ maxWidth: 420 }}>
          <h5 className="fw-semibold mb-2">Verification Pending</h5>
          <p className="mb-0">{message}</p>
        </div>
      </div>
    );
  }

  /* Approved dashboard */
  return (
    <div className="min-vh-100 bg-white pt-5">
      <div className="container pt-5">

        {/* Header */}
        <div className="mb-4">
          <h2 className="fw-semibold mb-1">Owner Dashboard</h2>
          <p className="text-muted">
            Welcome back, {user?.full_name}
          </p>
        </div>

        {/* Cards */}
        <div className="row g-4">

          {/* Status Card */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted mb-2">Account Status</h6>
                <p className="fw-semibold text-success mb-1">
                  Approved
                </p>
                <p className="text-muted small mb-0">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Properties Card */}
         <div className="col-12 col-md-6 col-lg-4">
  <div
    className="card shadow-sm h-100 cursor-pointer hover-shadow"
    onClick={() => navigate("/owner/properties")}
  >
    <div className="card-body">
      <h6 className="text-muted mb-2">Properties</h6>
      <p className="fs-3 fw-bold mb-1">
        {propertyCount}
      </p>
      <p className="text-muted small mb-0">
        Properties listed
      </p>
    </div>
  </div>
</div>


          {/* Messages Card */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted mb-2">Messages</h6>
                <p className="fs-3 fw-bold mb-1">0</p>
                <p className="text-muted small mb-0">
                  Unread conversations
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
