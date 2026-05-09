export default function Loader({
  type = "spinner",
  text = "Loading...",
  count = 3,
  height = 220,
}) {
  if (type === "page") {
    return (
      <div
        style={{
          minHeight: "55vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          className="spinner-border"
          style={{
            width: 42,
            height: 42,
          }}
        />
        <span
          style={{
            color: "var(--sn-text-soft)",
            fontWeight: 600,
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="row g-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="col-12 col-md-6 col-lg-4"
          >
            <div
              style={{
                border: "1px solid var(--sn-border)",
                borderRadius: 22,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                className="placeholder"
                style={{
                  height,
                }}
              />

              <div style={{ padding: 18 }}>
                <div
                  className="placeholder mb-3"
                  style={{
                    height: 18,
                    width: "72%",
                  }}
                />

                <div
                  className="placeholder mb-2"
                  style={{
                    height: 14,
                    width: "48%",
                  }}
                />

                <div
                  className="placeholder"
                  style={{
                    height: 14,
                    width: "60%",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "rows") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="placeholder"
            style={{
              height: 54,
              borderRadius: 16,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        className="spinner-border spinner-border-sm"
      />
      <span
        style={{
          color: "var(--sn-text-soft)",
          fontWeight: 600,
          fontSize: ".92rem",
        }}
      >
        {text}
      </span>
    </div>
  );
}
