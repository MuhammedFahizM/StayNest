import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);

  // Wait while AuthContext loads the user from localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        Loading...
      </div>
    );
  }

  // If not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific role required → check it
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
