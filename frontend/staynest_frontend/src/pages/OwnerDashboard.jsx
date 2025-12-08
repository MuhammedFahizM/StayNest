import { useEffect, useState, useContext } from "react";
import { ownerDashboard } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

export default function OwnerDashboard() {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ownerDashboard();
        console.log("Owner dashboard:", data);

        setStatus(data.status);
        setMessage(data.message);
      } catch (error) {
        // Handle unauthorized
        if (error.response?.status === 401) {
          setErrorMsg("Unauthorized access. Please login again.");
        } 
        else {
          setErrorMsg("Something went wrong");
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl shadow">
          {errorMsg}
        </div>
      </div>
    );
  }

  // 🔷 If owner is not yet approved
  if (status === "pending_admin_approval") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 text-yellow-800 p-6 rounded-xl shadow max-w-md text-center">
          <h2 className="text-xl font-bold">Verification Pending</h2>
          <p className="mt-2">{message}</p>
        </div>
      </div>
    );
  }

  // 🔷 Owner approved — show dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="bg-white p-6 rounded-2xl shadow max-w-xl w-full">

        <h1 className="text-2xl font-bold mb-3">Owner Dashboard</h1>

        <p className="text-gray-700 mb-4">
          Welcome back, <span className="font-semibold">{user?.full_name}</span>
        </p>

        <p className="text-gray-500 mb-2">Email: {user?.email}</p>

        <div className="bg-blue-50 text-blue-700 p-3 rounded-xl mt-4">
          {message}
        </div>

      </div>
    </div>
  );
}
