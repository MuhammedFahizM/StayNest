import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Wait while AuthContext loads
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        Loading...
      </div>
    );
  }

  // Not logged in → remember where user tried to go
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Wrong role → block
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
