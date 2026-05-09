import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "../pages/NotificationBell";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () =>
      window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) =>
    location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Home", icon: "bi-house-door" },
    {
      to: "/browse-stays",
      label: "Browse",
      icon: "bi-search",
    },
    ...(user?.role === "owner"
      ? [
          {
            to: "/owner/dashboard",
            label: "Dashboard",
            icon: "bi-grid",
          },
        ]
      : []),
    ...(user?.role === "user"
      ? [
          {
            to: "/user/dashboard",
            label: "Dashboard",
            icon: "bi-grid",
          },
        ]
      : []),
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--sn-navbar-height)",
        zIndex: "var(--sn-z-nav)",
        background: scrolled
          ? "rgba(255,255,255,.78)"
          : "rgba(255,255,255,.94)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: scrolled
          ? "1px solid var(--sn-border)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 10px 28px rgba(0,0,0,.05)"
          : "none",
        transition: "all .28s var(--sn-ease)",
      }}
    >
      <div className="sn-container h-100">
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          {/* Brand */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <motion.div
              whileHover={{
                rotate: -4,
                scale: 1.05,
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg,#10b981,#059669)",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
                boxShadow:
                  "0 12px 28px rgba(16,185,129,.22)",
              }}
            >
              🏠
            </motion.div>

            <span
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--sn-dark)",
              }}
            >
              Stay
              <span
                style={{
                  color: "var(--sn-primary)",
                }}
              >
                Nest
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="d-none d-lg-flex align-items-center gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                active={isActive(item.to)}
              />
            ))}
          </div>

          {/* Right */}
          <div className="d-flex align-items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline-primary d-none d-sm-inline-flex"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {/* Bell */}
  <NotificationBell />


                {/* User */}
                <div className="dropdown">
                  <button
  className="dropdown-toggle no-caret"
  data-bs-toggle="dropdown"
                    style={{
                      border:
                        "1px solid var(--sn-border)",
                      background:
                        "linear-gradient(180deg,#ffffff,#f8fafc)",
                      borderRadius: 999,
                      padding:
                        "4px 12px 4px 4px",

                      display: "flex",
                      alignItems: "center",
                      gap: 10,

                      minHeight: 44,
                      boxShadow:
                        "var(--sn-shadow-sm)",

                      transition:
                        "all .22s ease",
                    }}
                  >
                    <Avatar user={user} />

                    <span
                      className="d-none d-sm-inline"
                      style={{
                        fontWeight: 800,
                        fontSize: ".9rem",
                        color:
                          "var(--sn-text)",
                        maxWidth: 96,
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {user.full_name?.split(
                        " "
                      )[0]}
                    </span>

                    <i className="bi bi-chevron-down small text-muted" />
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    style={{
                      width: 255,
                      marginTop: 12,
                      padding: 8,
                    }}
                  >
                    {/* Header */}
                    <li
                      style={{
                        padding:
                          "10px 12px 12px",
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <Avatar user={user} />

                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize:
                                ".9rem",
                            }}
                          >
                            {user.full_name}
                          </div>

                          <div
                            style={{
                              fontSize:
                                ".78rem",
                              color:
                                "var(--sn-text-soft)",
                              whiteSpace:
                                "nowrap",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <DropdownItem
                      icon="bi-person"
                      label="Profile"
                      onClick={() =>
                        navigate(
                          user.role ===
                            "owner"
                            ? "/owner/profile"
                            : "/user/profile"
                        )
                      }
                    />

                    <DropdownItem
                      icon="bi-pencil"
                      label="Edit Profile"
                      onClick={() =>
                        navigate(
                          user.role ===
                            "owner"
                            ? "/owner/profile/edit"
                            : "/user/profile/edit"
                        )
                      }
                    />

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <DropdownItem
                      icon="bi-box-arrow-right"
                      label="Logout"
                      danger
                      onClick={handleLogout}
                    />
                  </ul>
                </div>
              </>
            )}

            {/* Mobile Toggle */}
            <button
              className="btn d-lg-none"
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
            >
              <i
                className={`bi ${
                  menuOpen
                    ? "bi-x-lg"
                    : "bi-list"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            transition={{
              duration: 0.2,
            }}
            className="d-lg-none"
            style={{
              background:
                "rgba(255,255,255,.96)",
              borderTop:
                "1px solid var(--sn-border)",
              padding: 14,
            }}
          >
            <div className="d-grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="btn btn-light text-start"
                >
                  <i
                    className={`bi ${item.icon} me-2`}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavItem({ item, active }) {
  return (
    <Link
      to={item.to}
      style={{
        textDecoration: "none",
        padding: "9px 14px",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 700,
        fontSize: ".88rem",
        color: active
          ? "var(--sn-primary)"
          : "var(--sn-text-soft)",
        background: active
          ? "var(--sn-primary-soft)"
          : "transparent",
      }}
    >
      <i className={`bi ${item.icon}`} />
      {item.label}
    </Link>
  );
}

function Avatar({ user }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg,#10b981,#059669)",
        color: "#fff",
        fontWeight: 800,
        fontSize: ".82rem",
        boxShadow:
          "0 8px 18px rgba(16,185,129,.18)",
        border: "2px solid #fff",
        flexShrink: 0,
      }}
    >
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt="avatar"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        user.full_name?.charAt(0)?.toUpperCase() ||
        "U"
      )}
    </div>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="dropdown-toggle no-caret"
        style={{
          width: "100%",
          border: "none",
          appearance: "none",
          background: "transparent",
          padding: "11px 14px",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          fontWeight: 700,
          fontSize: ".88rem",
          color: danger
            ? "var(--sn-danger)"
            : "var(--sn-text)",
          transition:
            "all .18s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            danger
              ? "rgba(239,68,68,.08)"
              : "#f8fafc";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "transparent";
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <i className={`bi ${icon}`} />
          {label}
        </span>

        {!danger && (
          <i className="bi bi-chevron-right small text-muted" />
        )}
      </button>
    </li>
  );
}