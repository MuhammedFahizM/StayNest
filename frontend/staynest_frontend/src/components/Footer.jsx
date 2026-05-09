import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Footer() {
  const { user } =
    useContext(AuthContext);

  const year =
    new Date().getFullYear();

  const dashboard =
    user?.role === "owner"
      ? "/owner/dashboard"
      : "/user/dashboard";

  return (
    <footer
      style={{
        marginTop: "auto",
        background:
          "linear-gradient(180deg,#0f172a 0%, #111827 100%)",
        borderTop:
          "1px solid rgba(255,255,255,.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position:
            "absolute",
          width: 220,
          height: 220,
          borderRadius:
            "50%",
          background:
            "rgba(16,185,129,.08)",
          filter:
            "blur(70px)",
          top: -80,
          left: -80,
          pointerEvents:
            "none",
        }}
      />

      <div className="sn-container">
        {/* Main Row */}
        <div
          style={{
            padding:
              "24px 0 18px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 20,
            flexWrap:
              "wrap",
            position:
              "relative",
            zIndex: 2,
          }}
        >
          {/* Brand */}
          <Link
            to="/"
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 10,
              textDecoration:
                "none",
            }}
          >
            <motion.div
              whileHover={{
                rotate: -4,
                scale: 1.05,
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg,#10b981,#059669)",
                display:
                  "grid",
                placeItems:
                  "center",
                fontSize: 15,
                boxShadow:
                  "0 12px 28px rgba(16,185,129,.22)",
              }}
            >
              🏠
            </motion.div>

            <span
              style={{
                color:
                  "#fff",
                fontWeight: 800,
                fontSize:
                  "1rem",
              }}
            >
              Stay
              <span
                style={{
                  color:
                    "#10b981",
                }}
              >
                Nest
              </span>
            </span>
          </Link>

          {/* Links */}
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 18,
              flexWrap:
                "wrap",
            }}
          >
            <FooterLink to="/">
              Home
            </FooterLink>

            <FooterLink to="/browse-stays">
              Browse
            </FooterLink>

            {!user ? (
              <>
                <FooterLink to="/login">
                  Login
                </FooterLink>

                <FooterLink to="/register">
                  Register
                </FooterLink>
              </>
            ) : (
              <FooterLink
                to={dashboard}
              >
                Dashboard
              </FooterLink>
            )}
          </div>

          {/* Social */}
          <div
            style={{
              display:
                "flex",
              gap: 10,
            }}
          >
            {[
              "bi-instagram",
              "bi-twitter-x",
              "bi-linkedin",
            ].map(
              (
                icon
              ) => (
                <a
                  key={
                    icon
                  }
                  href="#"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display:
                      "grid",
                    placeItems:
                      "center",
                    textDecoration:
                      "none",
                    color:
                      "#cbd5e1",
                    background:
                      "rgba(255,255,255,.04)",
                    border:
                      "1px solid rgba(255,255,255,.06)",
                    transition:
                      "all .22s ease",
                  }}
                  onMouseEnter={(
                    e
                  ) => {
                    e.currentTarget.style.color =
                      "#10b981";
                    e.currentTarget.style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(
                    e
                  ) => {
                    e.currentTarget.style.color =
                      "#cbd5e1";
                    e.currentTarget.style.transform =
                      "translateY(0)";
                  }}
                >
                  <i
                    className={`bi ${icon}`}
                  />
                </a>
              )
            )}
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop:
              "1px solid rgba(255,255,255,.06)",
            padding:
              "14px 0 18px",
            display: "flex",
            justifyContent:
              "space-between",
            gap: 12,
            flexWrap:
              "wrap",
            color:
              "rgba(255,255,255,.42)",
            fontSize:
              ".82rem",
          }}
        >
          <span>
            © {year} StayNest
          </span>

          <span>
            Trusted stays for
            modern living.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  to,
  children,
}) {
  return (
    <Link
      to={to}
      style={{
        textDecoration:
          "none",
        color:
          "rgba(255,255,255,.66)",
        fontSize:
          ".88rem",
        fontWeight: 600,
      }}
    >
      {children}
    </Link>
  );
}