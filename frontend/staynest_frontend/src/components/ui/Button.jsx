export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  className = "",
  style = {},
  onClick,
}) {
  const isDisabled = disabled || loading;

  const variants = {
    primary: {
      background: "var(--sn-primary)",
      color: "#fff",
      border: "1px solid var(--sn-primary)",
      boxShadow:
        "0 10px 24px rgba(16,185,129,.18)",
    },

    outline: {
      background: "#fff",
      color: "var(--sn-primary)",
      border: "1px solid var(--sn-primary)",
    },

    ghost: {
      background: "transparent",
      color: "var(--sn-text)",
      border: "1px solid var(--sn-border)",
    },

    dark: {
      background: "var(--sn-dark)",
      color: "#fff",
      border: "1px solid var(--sn-dark)",
    },

    danger: {
      background: "var(--sn-danger)",
      color: "#fff",
      border: "1px solid var(--sn-danger)",
    },
  };

  const sizes = {
    sm: {
      padding: "8px 14px",
      fontSize: "0.82rem",
      borderRadius: "12px",
    },

    md: {
      padding: "10px 18px",
      fontSize: "0.92rem",
      borderRadius: "14px",
    },

    lg: {
      padding: "13px 22px",
      fontSize: "1rem",
      borderRadius: "16px",
    },
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={className}
      style={{
        ...variants[variant],
        ...sizes[size],

        width: fullWidth ? "100%" : "auto",

        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,

        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1,

        cursor: isDisabled
          ? "not-allowed"
          : "pointer",

        transition:
          "transform .25s var(--sn-ease), box-shadow .25s ease, background .25s ease",

        opacity: isDisabled ? 0.7 : 1,
        whiteSpace: "nowrap",
        outline: "none",

        ...style,
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.transform =
          "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "translateY(0)";
      }}
      onFocus={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.boxShadow =
          "0 0 0 4px rgba(16,185,129,.16)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow =
          variants[variant].boxShadow || "none";
      }}
    >
      {loading ? (
        <>
          <span
            className="spinner-border spinner-border-sm"
            style={{
              width: 15,
              height: 15,
            }}
          />
          Loading...
        </>
      ) : (
        <>
          {iconLeft && (
            <span
              style={{
                display: "inline-flex",
              }}
            >
              {iconLeft}
            </span>
          )}

          {children}

          {iconRight && (
            <span
              style={{
                display: "inline-flex",
              }}
            >
              {iconRight}
            </span>
          )}
        </>
      )}
    </button>
  );
}