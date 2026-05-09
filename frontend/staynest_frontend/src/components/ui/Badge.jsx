export default function Badge({
  children,
  variant = "primary",
  size = "md",
  rounded = true,
  className = "",
  style = {},
}) {
  const variants = {
    primary: {
      background: "rgba(16,185,129,.12)",
      color: "var(--sn-primary)",
      border: "1px solid rgba(16,185,129,.18)",
    },

    success: {
      background: "rgba(34,197,94,.12)",
      color: "var(--sn-success)",
      border: "1px solid rgba(34,197,94,.18)",
    },

    warning: {
      background: "rgba(245,158,11,.12)",
      color: "var(--sn-warning)",
      border: "1px solid rgba(245,158,11,.18)",
    },

    danger: {
      background: "rgba(239,68,68,.12)",
      color: "var(--sn-danger)",
      border: "1px solid rgba(239,68,68,.18)",
    },

    info: {
      background: "rgba(59,130,246,.12)",
      color: "#2563eb",
      border: "1px solid rgba(59,130,246,.18)",
    },

    neutral: {
      background: "#f8fafc",
      color: "var(--sn-text-soft)",
      border: "1px solid var(--sn-border)",
    },

    dark: {
      background: "var(--sn-dark)",
      color: "#fff",
      border: "1px solid var(--sn-dark)",
    },
  };

  const sizes = {
    sm: {
      padding: "4px 10px",
      fontSize: ".72rem",
    },

    md: {
      padding: "6px 12px",
      fontSize: ".78rem",
    },

    lg: {
      padding: "8px 14px",
      fontSize: ".84rem",
    },
  };

  return (
    <span
      className={className}
      style={{
        ...variants[variant],
        ...sizes[size],

        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1,

        borderRadius: rounded ? "999px" : "12px",
        whiteSpace: "nowrap",

        ...style,
      }}
    >
      {children}
    </span>
  );
}