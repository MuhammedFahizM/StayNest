import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />

    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 3200,

        style: {
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.92rem",
          fontWeight: 600,
          padding: "14px 16px",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          color: "#111827",
          boxShadow: "0 20px 45px rgba(0,0,0,0.08)",
        },

        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #10b981",
          },
        },

        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #ef4444",
          },
        },

        loading: {
          iconTheme: {
            primary: "#64748b",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #64748b",
          },
        },
      }}
    />
  </AuthProvider>
);