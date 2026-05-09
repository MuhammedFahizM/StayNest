import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { acceptInvitation } from "../services/bookingService";
import toast from "react-hot-toast";

export default function AcceptInvitationPage() {
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token.trim()) {
      toast.error("Enter invitation token");
      return;
    }

    try {
      setLoading(true);
      await acceptInvitation(token.trim());

      toast.success(
        "Invitation accepted successfully"
      );

      navigate("/user/stays");
    } catch {
      toast.error(
        "Invalid or expired token"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#eef8f4 100%)",
        padding: "32px 16px",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: 560,
        }}
      >
        {/* Back */}
        <button
          onClick={() =>
            navigate("/user/stays")
          }
          style={{
            border: "none",
            background:
              "transparent",
            padding: 0,
            marginBottom: 22,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#64748b",
            fontWeight: 600,
            fontSize: ".92rem",
            cursor: "pointer",
          }}
        >
          <i className="bi bi-arrow-left" />
          Back to Your Stays
        </button>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            border:
              "1px solid rgba(226,232,240,.9)",
            borderRadius: 26,
            padding: 30,
            boxShadow:
              "0 20px 60px rgba(15,23,42,.08)",
          }}
        >
          {/* Top Icon */}
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              background:
                "linear-gradient(135deg,#10b981,#059669)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              color: "#fff",
              fontSize: 24,
              marginBottom: 18,
              boxShadow:
                "0 14px 28px rgba(16,185,129,.22)",
            }}
          >
            <i className="bi bi-ticket-perforated-fill" />
          </div>

          {/* Badge */}
          <div
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 6,
              padding:
                "6px 12px",
              borderRadius: 999,
              background:
                "#ecfdf5",
              color: "#059669",
              fontWeight: 700,
              fontSize: ".74rem",
              letterSpacing:
                ".04em",
              textTransform:
                "uppercase",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius:
                  "50%",
                background:
                  "#10b981",
              }}
            />
            Offline Tenant
          </div>

          <h1
            style={{
              margin: 0,
              fontSize:
                "2rem",
              lineHeight: 1.2,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Accept Invitation
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 24,
              color: "#64748b",
              fontSize:
                ".96rem",
              lineHeight: 1.6,
            }}
          >
            Enter the booking
            invitation token
            shared by your
            property owner to
            activate your stay.
          </p>

          {/* Input */}
          <label
            style={{
              display:
                "block",
              marginBottom: 8,
              fontSize:
                ".78rem",
              fontWeight: 800,
              color: "#475569",
              textTransform:
                "uppercase",
              letterSpacing:
                ".05em",
            }}
          >
            Invitation Token
          </label>

          <div
            style={{
              position:
                "relative",
              marginBottom: 18,
            }}
          >
            <i
              className="bi bi-key-fill"
              style={{
                position:
                  "absolute",
                top: "50%",
                left: 16,
                transform:
                  "translateY(-50%)",
                color:
                  "#94a3b8",
                fontSize: 14,
              }}
            />

            <input
              type="text"
              value={token}
              disabled={loading}
              placeholder="Paste token here"
              onChange={(e) =>
                setToken(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                e.key ===
                  "Enter" &&
                handleSubmit()
              }
              style={{
                width: "100%",
                height: 54,
                borderRadius: 16,
                border:
                  "1px solid #dbe2ea",
                padding:
                  "0 16px 0 42px",
                outline:
                  "none",
                fontSize:
                  ".98rem",
                fontWeight: 600,
                letterSpacing:
                  ".02em",
                color:
                  "#0f172a",
                background:
                  loading
                    ? "#f8fafc"
                    : "#fff",
              }}
            />
          </div>

          {/* Action */}
          <button
            onClick={
              handleSubmit
            }
            disabled={
              loading ||
              !token.trim()
            }
            style={{
              width: "100%",
              height: 54,
              border: "none",
              borderRadius: 16,
              background:
                loading ||
                !token.trim()
                  ? "#e2e8f0"
                  : "linear-gradient(135deg,#10b981,#059669)",
              color:
                loading ||
                !token.trim()
                  ? "#94a3b8"
                  : "#fff",
              fontWeight: 800,
              fontSize:
                ".96rem",
              cursor:
                loading ||
                !token.trim()
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: 10,
              boxShadow:
                loading ||
                !token.trim()
                  ? "none"
                  : "0 14px 28px rgba(16,185,129,.20)",
              transition:
                "all .18s ease",
            }}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm" />
            )}

            {loading
              ? "Activating..."
              : "Accept Invitation"}
          </button>

          {/* Footer Note */}
          <div
            style={{
              marginTop: 18,
              padding:
                "14px 16px",
              borderRadius: 16,
              background:
                "#f8fafc",
              border:
                "1px solid #eef2f7",
              display: "flex",
              alignItems:
                "flex-start",
              gap: 10,
            }}
          >
            <i
              className="bi bi-info-circle"
              style={{
                color:
                  "#10b981",
                marginTop: 1,
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize:
                  ".84rem",
                color:
                  "#64748b",
                lineHeight: 1.55,
              }}
            >
              Token is shared
              by the owner.
              Contact them if
              you haven’t
              received one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}