import { useEffect } from "react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  onConfirm,
  onCancel,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: "⚠️",
      confirmBg: "#ef4444",
      confirmHover: "#dc2626",
      confirmShadow: "rgba(239,68,68,0.35)",
    },
    warning: {
      icon: "🔔",
      confirmBg: "#f59e0b",
      confirmHover: "#d97706",
      confirmShadow: "rgba(245,158,11,0.35)",
    },
    primary: {
      icon: "✅",
      confirmBg: "#10b981",
      confirmHover: "#059669",
      confirmShadow: "rgba(16,185,129,0.35)",
    },
  };

  const v = variantStyles[variant] || variantStyles.danger;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 1050,
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1051,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "28px 32px",
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            animation: "slideUp 0.2s ease",
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: 36,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {v.icon}
          </div>

          {/* Title */}
          <h5
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#0f172a",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {title}
          </h5>

          {/* Message */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.875rem",
              color: "#6b7280",
              textAlign: "center",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {/* Cancel */}
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#ffffff",
                color: "#374151",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              {cancelLabel}
            </button>

            {/* Confirm */}
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "none",
                borderRadius: 8,
                background: v.confirmBg,
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = v.confirmHover;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${v.confirmShadow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = v.confirmBg;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
