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

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import EmailSent from "./pages/EmailSent";
import EmailActionResult from "./pages/EmailActionResult";

import OwnerProfileView from "./pages/OwnerProfileView";
import OwnerProfileEdit from "./pages/OwnerProfileEdit";




function App() {
  return (
    <div className="min-vh-100 bg-white">
      <Router>
        <Navbar />
        <div style={{ paddingTop: "96px", paddingBottom: "120px" }}>
          {/* ← adds spacing below navbar */}

          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            {/* Email flows */}
            <Route path="/email-sent" element={<EmailSent />} />
            <Route path="/action-result" element={<EmailActionResult />} />

            {/* Keep existing verify-email link working */}
            <Route path="/verify-email/:token" element={<EmailActionResult />} />

            <Route
              path="/owner/properties"
              element={
                <OwnerRoute>
                  <PropertyList />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/properties/new"
              element={
                <OwnerRoute>
                  <PropertyDetails />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/properties/:id"
              element={
                <OwnerRoute>
                  <PropertyDetails />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/properties/:id/edit"
              element={
                <OwnerRoute>
                  <PropertyDetails />
                </OwnerRoute>
              }
            />


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
            {/* OWNER-ONLY ROUTES */}
            <Route
              path="/owner/dashboard"
              element={
                <OwnerRoute>
                  <OwnerDashboard />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/profile"
              element={
                <OwnerRoute>
                  <OwnerProfileView />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/profile/edit"
              element={
                <OwnerRoute>
                  <OwnerProfileEdit />
                </OwnerRoute>
              }
            />

          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
