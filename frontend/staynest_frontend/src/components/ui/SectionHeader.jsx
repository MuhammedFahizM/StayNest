export default function SectionHeader({
  title,
  subtitle = "",
  right = null,
  centered = false,
  compact = false,
  className = "",
  style = {},
}) {
  const spacing = compact
    ? {
        marginBottom: 20,
      }
    : {
        marginBottom: 34,
      };

  if (centered) {
    return (
      <div
        className={className}
        style={{
          textAlign: "center",
          ...spacing,
          ...style,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 3vw, 2.35rem)",
            letterSpacing: "-0.03em",
            color: "var(--sn-text)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "10px auto 0",
              maxWidth: 680,
              color: "var(--sn-text-soft)",
              lineHeight: 1.7,
              fontSize: ".96rem",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "end",
        gap: 16,
        flexWrap: "wrap",
        ...spacing,
        ...style,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: "clamp(1.45rem, 3vw, 2rem)",
            letterSpacing: "-0.03em",
            color: "var(--sn-text)",
            lineHeight: 1.08,
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0",
              color: "var(--sn-text-soft)",
              lineHeight: 1.65,
              fontSize: ".94rem",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {right ? <div>{right}</div> : null}
    </div>
  );
}