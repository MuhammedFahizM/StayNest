import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
  <nav
  className="
    fixed top-0 left-0 z-50 w-full
    backdrop-blur-lg bg-white/30
    border-b border-white/40
    px-8 py-3
    shadow-sm
    flex items-center justify-between
  "
>
  {/* LEFT LINKS */}
  <div className="flex items-center gap-6 font-medium text-gray-800">
    <Link to="/" className="hover:text-blue-600 transition">Home</Link>
    <Link to="/properties" className="hover:text-blue-600 transition">Properties</Link>

    {user && (
      <Link to="/chat" className="hover:text-blue-600 transition">Chat</Link>
    )}

    {user?.role === "owner" && (
      <Link to="/owner/dashboard" className="hover:text-blue-600 transition">
        Owner Dashboard
      </Link>
    )}
  </div>

  {/* RIGHT BUTTONS */}
  <div className="flex items-center gap-4 text-gray-800">

    {!user && (
      <>
        <Link 
          to="/login" 
          className="px-4 py-2 rounded-lg hover:text-blue-600 transition"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="
            px-4 py-2 rounded-lg bg-blue-500 text-white
            shadow hover:bg-blue-600 transition
          "
        >
          Register
        </Link>
      </>
    )}

    {user && (
      <button
        onClick={handleLogout}
        className="
          px-4 py-2 rounded-lg bg-red-500 text-white
          shadow hover:bg-red-600 transition
        "
      >
        Logout
      </button>
    )}
  </div>
</nav>

);

}
