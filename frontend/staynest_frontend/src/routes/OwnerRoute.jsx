import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OwnerRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // Wait until context finishes loading user from storage
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        Loading...
      </div>
    );
  }

  // If no user → not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but not owner → redirect to home
  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  return children;
}
