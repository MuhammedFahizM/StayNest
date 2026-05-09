import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* Layout */
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* Guards */
import ProtectedRoute from "./routes/ProtectedRoute";
import OwnerRoute from "./routes/OwnerRoute";

/* Pages */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import EmailSent from "./pages/EmailSent";
import EmailActionResult from "./pages/EmailActionResult";

import PublicPropertyList from "./pages/PublicPropertyList";
import PropertyDetails from "./pages/PropertyDetails";

import PropertyList from "./pages/PropertyList";
import OwnerDashboard from "./pages/OwnerDashboard";
import ChatPage from "./pages/ChatPage";

import OwnerProfileView from "./pages/OwnerProfileView";
import OwnerProfileEdit from "./pages/OwnerProfileEdit";

import UserDashboard from "./pages/UserDashboard";
import UserStays from "./pages/UserStays";

import UserProfileView from "./pages/UserProfileView";
import UserProfileEdit from "./pages/UserProfileEdit";

import BookingRequestPage from "./pages/BookingRequestPage";
import OwnerBookingsPage from "./pages/OwnerBookingsPage";
import OwnerPropertyBookingPage from "./pages/OwnerPropertyBookingPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";

import PublicUserProfilePage from "./pages/PublicUserProfilePage";
import PublicOwnerProfilePage from "./pages/PublicOwnerProfilePage";

import UserPaymentsPage from "./pages/Userpaymentspage";
import OwnerPaymentsPage from "./pages/Ownerpaymentspage";

/* Scroll to top on route change */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

/* Route transitions */
function PageShell({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.995,
          filter: "blur(6px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        exit={{
          opacity: 0,
          y: -10,
          scale: 0.995,
        }}
        transition={{
          duration: 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          flex: 1,
          minHeight: "100%",
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          display: "flex",
          flexDirection: "column",
          background: "var(--sn-bg)",
        }}
      >
        <PageShell>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/email-sent" element={<EmailSent />} />
            <Route path="/action-result" element={<EmailActionResult />} />
            <Route path="/verify-email/:token" element={<EmailActionResult />} />

            <Route path="/browse-stays" element={<PublicPropertyList />} />
            <Route path="/browse-stays/:id" element={<PropertyDetails />} />

            {/* User */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute role="user">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/stays"
              element={
                <ProtectedRoute role="user">
                  <UserStays />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/profile"
              element={
                <ProtectedRoute role="user">
                  <UserProfileView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/profile/edit"
              element={
                <ProtectedRoute role="user">
                  <UserProfileEdit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/book/:propertyId"
              element={
                <ProtectedRoute role="user">
                  <BookingRequestPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenant/accept-invite"
              element={
                <ProtectedRoute role="user">
                  <AcceptInvitationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/payments/:bookingId"
              element={
                <ProtectedRoute role="user">
                  <UserPaymentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/view-owner/:ownerId"
              element={
                <ProtectedRoute role="user">
                  <PublicOwnerProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Owner */}
            <Route
              path="/owner/dashboard"
              element={
                <OwnerRoute>
                  <OwnerDashboard />
                </OwnerRoute>
              }
            />

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

            <Route
              path="/owner/bookings"
              element={
                <OwnerRoute>
                  <OwnerBookingsPage />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/bookings/:propertyId"
              element={
                <OwnerRoute>
                  <OwnerPropertyBookingPage />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/payments"
              element={
                <OwnerRoute>
                  <OwnerPaymentsPage />
                </OwnerRoute>
              }
            />

            <Route
              path="/owner/view-user/:userId"
              element={
                <OwnerRoute>
                  <PublicUserProfilePage />
                </OwnerRoute>
              }
            />
          </Routes>
        </PageShell>

        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;