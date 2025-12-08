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
    <nav className="w-full bg-white shadow p-4 flex justify-between items-center">

      {/* Left side links */}
      <div className="flex gap-6">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <Link to="/properties" className="hover:text-blue-600">Properties</Link>

        {user && (
          <Link to="/chat" className="hover:text-blue-600">Chat</Link>
        )}

        {user?.role === "owner" && (
          <Link to="/owner/dashboard" className="hover:text-blue-600">
            Owner Dashboard
          </Link>
        )}
      </div>

      {/* Right side buttons */}
      <div className="flex gap-4">
        {!user && (
          <>
            <Link to="/login" className="hover:text-blue-600">Login</Link>
            <Link to="/register" className="hover:text-blue-600">Register</Link>
          </>
        )}

        {user && (
          <button
            onClick={handleLogout}
            className="text-red-600 font-medium hover:opacity-70"
          >
            Logout
          </button>
        )}
      </div>

    </nav>
  );
}
