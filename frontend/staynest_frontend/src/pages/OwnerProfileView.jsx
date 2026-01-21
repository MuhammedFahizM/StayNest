// import { useEffect, useState } from "react";
// import { getOwnerProfile } from "../services/ownerService";
// import { useNavigate } from "react-router-dom";

// export default function OwnerProfileView() {
//   const [profile, setProfile] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     getOwnerProfile().then(setProfile);
//   }, []);

//   if (!profile) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-gray-700">
//         Loading profile...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 pt-28 px-4">
//       <div className="max-w-4xl mx-auto">

//         <div className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl shadow-lg p-8 relative">

//           {/* TOP ACTION */}
//           <button
//             onClick={() => navigate("/owner/dashboard")}
//             className="absolute top-6 right-6 text-sm text-gray-600 hover:text-gray-800 transition"
//           >
//             ← Back to Dashboard
//           </button>

//           <h2 className="text-2xl font-semibold text-gray-800 mb-6">
//             Owner Profile
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

//             {/* LEFT — IDENTITY */}
//             <div className="flex flex-col items-center text-center">
//               <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-semibold overflow-hidden">
//                 {profile.profile_photo ? (
//                   <img
//                     src={profile.profile_photo}
//                     alt="Profile"
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   profile.full_name?.charAt(0)?.toUpperCase() || "O"
//                 )}
//               </div>

//               {/* NAME — FIXED */}
//               <h3 className="mt-4 text-xl font-semibold text-gray-800">
//                 {profile.full_name}
//               </h3>

//               <span
//                 className={`mt-2 px-3 py-1 text-xs rounded-full font-medium
//                   ${
//                     profile.is_owner_approved
//                       ? "bg-green-100 text-green-700"
//                       : "bg-yellow-100 text-yellow-700"
//                   }
//                 `}
//               >
//                 {profile.is_owner_approved ? "Approved" : "Pending Approval"}
//               </span>
//             </div>

//             {/* RIGHT — DETAILS */}
//             <div className="md:col-span-2 space-y-4">
//               <div>
//                 <p className="text-sm text-gray-500">Email</p>
//                 <p className="text-gray-800 font-medium">
//                   {profile.email}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Phone</p>
//                 <p className="text-gray-800 font-medium">
//                   {profile.phone || "—"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Address</p>
//                 <p className="text-gray-800 font-medium">
//                   {profile.address || "—"}
//                 </p>
//               </div>

//               <div className="pt-4">
//                 <button
//                   onClick={() => navigate("/owner/profile/edit")}
//                   className="
//                     px-6 py-2 rounded-xl
//                     bg-blue-500 text-white font-semibold
//                     hover:bg-blue-600 transition
//                   "
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             </div>

//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { getOwnerProfile } from "../services/ownerService";
import { useNavigate } from "react-router-dom";

export default function OwnerProfileView() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getOwnerProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-vh-100 pt-5 px-3">
      <div className="container pt-5">
<div className="card shadow border rounded-3 position-relative p-4">

          {/* TOP ACTION */}
          <button
  onClick={() => navigate("/owner/dashboard")}
  className="btn btn-primary btn-sm position-absolute top-0 end-0 mt-3 me-3"
>
  ← Back to Dashboard
</button>


          <h2 className="h4 fw-semibold text-dark mb-4">
            Owner Profile
          </h2>

          <div className="row g-4">

            {/* LEFT — IDENTITY */}
            <div className="col-12 col-md-4 text-center">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                style={{ width: "128px", height: "128px", fontSize: "2rem", overflow: "hidden" }}
              >
                {profile.profile_photo ? (
                  <img
                    src={profile.profile_photo}
                    alt="Profile"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  profile.full_name?.charAt(0)?.toUpperCase() || "O"
                )}
              </div>

              <h3 className="mt-3 h5 fw-semibold text-dark">
                {profile.full_name}
              </h3>

              <span
                className={`badge mt-2 ${
                  profile.is_owner_approved
                    ? "bg-success-subtle text-success"
                    : "bg-warning-subtle text-warning"
                }`}
              >
                {profile.is_owner_approved ? "Approved" : "Pending Approval"}
              </span>
            </div>

            {/* RIGHT — DETAILS */}
            <div className="col-12 col-md-8">
              <div className="mb-3">
                <small className="text-muted">Email</small>
                <div className="fw-medium text-dark">
                  {profile.email}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted">Phone</small>
                <div className="fw-medium text-dark">
                  {profile.phone || "—"}
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted">Address</small>
                <div className="fw-medium text-dark">
                  {profile.address || "—"}
                </div>
              </div>

              <button
                onClick={() => navigate("/owner/profile/edit")}
                className="btn btn-primary"
              >
                Edit Profile
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
