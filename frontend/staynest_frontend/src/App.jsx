import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PropertyList from "./pages/PropertyList";
import PropertyDetails from "./pages/PropertyDetails";
import BookingPage from "./pages/BookingPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import ChatPage from "./pages/ChatPage";
import Navbar from "./components/Navbar";

// NEW
import ProtectedRoute from "./routes/ProtectedRoute";
import OwnerRoute from "./routes/OwnerRoute";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/properties" element={<PropertyList />} />
        <Route path="/property/:id" element={<PropertyDetails />} />

        {/* USER PROTECTED ROUTES */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* OWNER-ONLY ROUTE */}
        <Route
          path="/owner/dashboard"
          element={
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
