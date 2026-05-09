export default function Card({
  children,
  hover = false,
  clickable = false,
  padding = "md",
  variant = "default",
  className = "",
  style = {},
  onClick,
}) {
  const variants = {
    default: {
      background: "#ffffff",
      border: "1px solid var(--sn-border)",
      boxShadow: "var(--sn-shadow-sm)",
      color: "var(--sn-text)",
    },

    soft: {
      background: "var(--sn-surface-soft)",
      border: "1px solid var(--sn-border)",
      boxShadow: "none",
      color: "var(--sn-text)",
    },

    glass: {
      background: "rgba(255,255,255,.74)",
      border: "1px solid rgba(255,255,255,.45)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      boxShadow: "var(--sn-shadow-md)",
      color: "var(--sn-text)",
    },

    dark: {
      background: "var(--sn-dark)",
      border: "1px solid rgba(255,255,255,.06)",
      boxShadow: "var(--sn-shadow-md)",
      color: "#ffffff",
    },

    bordered: {
      background: "#ffffff",
      border: "1px solid var(--sn-border)",
      boxShadow: "none",
      color: "var(--sn-text)",
    },
  };

  const paddings = {
    none: "0",
    sm: "14px",
    md: "18px",
    lg: "24px",
    xl: "30px",
  };

  const baseShadow =
    variants[variant].boxShadow || "none";

  const enableLift = hover || clickable;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...variants[variant],

        padding: paddings[padding],
        borderRadius: "22px",

        transition:
          "transform .35s var(--sn-ease), box-shadow .35s ease, border-color .25s ease",

        cursor: clickable
          ? "pointer"
          : "default",

        overflow: "hidden",
        position: "relative",

        ...style,
      }}
      onMouseEnter={(e) => {
        if (!enableLift) return;

        e.currentTarget.style.transform =
          "translateY(-8px)";
        e.currentTarget.style.boxShadow =
          "var(--sn-shadow-lg)";
        e.currentTarget.style.borderColor =
          "rgba(16,185,129,.18)";
      }}
      onMouseLeave={(e) => {
        if (!enableLift) return;

        e.currentTarget.style.transform =
          "translateY(0)";
        e.currentTarget.style.boxShadow =
          baseShadow;
        e.currentTarget.style.borderColor =
          variants[variant].border;
      }}
    >
      {children}
    </div>
  );
}