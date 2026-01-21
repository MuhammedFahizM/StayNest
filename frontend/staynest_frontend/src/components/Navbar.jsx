// import { Link, useNavigate } from "react-router-dom";
// import { useContext, useState, useRef, useEffect } from "react";
// import { AuthContext } from "../context/AuthContext";

// export default function Navbar() {
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [open, setOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   // Close dropdown on outside click
//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <nav
//       className="
//         fixed top-0 left-0 z-50 w-full
//         backdrop-blur-lg bg-white/30
//         border-b border-white/40
//         px-8 py-3
//         shadow-sm
//         flex items-center justify-between
//       "
//     >
//       {/* LEFT NAV */}
//       <div className="flex items-center gap-6 font-medium text-gray-800">
//         <Link to="/" className="hover:text-blue-600 transition">
//           Home
//         </Link>

//         <Link to="/properties" className="hover:text-blue-600 transition">
//           Properties
//         </Link>

//         {user && (
//           <Link to="/chat" className="hover:text-blue-600 transition">
//             Chat
//           </Link>
//         )}

//         {user?.role === "owner" && (
//           <Link
//             to="/owner/dashboard"
//             className="hover:text-blue-600 transition"
//           >
//             Owner Dashboard
//           </Link>
//         )}
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="flex items-center gap-4">
//         {!user && (
//           <>
//             <Link
//               to="/login"
//               className="px-4 py-2 rounded-lg hover:text-blue-600 transition"
//             >
//               Login
//             </Link>

//             <Link
//               to="/register"
//               className="
//                 px-4 py-2 rounded-lg
//                 bg-blue-500 text-white
//                 shadow hover:bg-blue-600 transition
//               "
//             >
//               Register
//             </Link>
//           </>
//         )}

//         {user && (
//           <div className="relative" ref={dropdownRef}>
//             {/* Avatar + Name */}
//             <button
//               onClick={() => setOpen(!open)}
//               className="flex flex-col items-center gap-1 focus:outline-none"
//             >
//               <div
//                 className="
//                   w-10 h-10 rounded-full
//                   bg-blue-500 text-white
//                   flex items-center justify-center
//                   font-semibold
//                   overflow-hidden
//                   hover:ring-2 hover:ring-blue-400 transition
//                 "
//               >
//                 {user.profile_image ? (
//                   <img
//                     src={user.profile_image}
//                     alt="Profile"
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   user.full_name?.charAt(0)?.toUpperCase() || "U"
//                 )}
//               </div>

//              <span className="
//   text-sm font-semibold tracking-wide
//   bg-gradient-to-r from-rose-600 via-red-500 to-rose-700
//   bg-clip-text text-transparent
//   drop-shadow-[0_0_2px_rgba(244,63,94,0.35)]
//   leading-none
// ">
//   {user.full_name?.split(" ")[0]}
// </span>

//             </button>

//             {/* Dropdown */}
//             {open && (
//               <div
//                 className="
//                   absolute right-0 mt-2 w-48
//                   bg-white/90 backdrop-blur-lg
//                   border border-white/70
//                   rounded-xl shadow-lg
//                   overflow-hidden
//                 "
//               >
//                 <button
//                   onClick={() => {
//                     navigate("/owner/profile");
//                     setOpen(false);
//                   }}
//                   className="
//                     block w-full text-left
//                     px-4 py-2 text-sm text-gray-700
//                     hover:bg-blue-50
//                   "
//                 >
//                   Profile
//                 </button>

//                 <button
//                   onClick={() => {
//                     navigate("/owner/profile/edit");
//                     setOpen(false);
//                   }}
//                   className="
//                     block w-full text-left
//                     px-4 py-2 text-sm text-gray-700
//                     hover:bg-blue-50
//                   "
//                 >
//                   Edit Profile
//                 </button>

//                 <div className="border-t my-1" />

//                 <button
//                   onClick={handleLogout}
//                   className="
//                     block w-full text-left
//                     px-4 py-2 text-sm text-red-600
//                     hover:bg-red-50
//                   "
//                 >
//                   Logout
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }

import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black fixed-top shadow-sm py-3">
      <div className="container-fluid px-5">
        {/* LEFT NAV */}
        <div className="navbar-nav gap-3">
          <Link to="/" className="nav-link">
            Home
          </Link>

          <Link to="/properties" className="nav-link">
            Properties
          </Link>

          {user && (
            <Link to="/chat" className="nav-link">
              Chat
            </Link>
          )}

          {user?.role === "owner" && (
            <Link to="/owner/dashboard" className="nav-link">
              Owner Dashboard
            </Link>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="d-flex align-items-center gap-3">
          {!user && (
            <>
              <Link to="/login" className="btn btn-outline-light">
                Login
              </Link>

              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}

          {user && (
            <div className="dropdown">
              <button
                className="btn btn-dark dropdown-toggle d-flex align-items-center gap-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {/* Avatar */}
                <div
                  className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center"
                  style={{ width: 32, height: 32, fontSize: "0.9rem" }}
                >
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt="Profile"
                      className="w-100 h-100 rounded-circle object-fit-cover"
                    />
                  ) : (
                    user.full_name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                {/* Name */}
                <span className="fw-medium">
                  {user.full_name?.split(" ")[0]}
                </span>
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/owner/profile")}
                  >
                    Profile
                  </button>
                </li>

                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/owner/profile/edit")}
                  >
                    Edit Profile
                  </button>
                </li>

                <li><hr className="dropdown-divider" /></li>

                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
