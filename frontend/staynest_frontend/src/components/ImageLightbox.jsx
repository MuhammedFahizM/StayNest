import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onChange,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();

      if (
        e.key === "ArrowLeft" &&
        currentIndex > 0
      ) {
        onChange(currentIndex - 1);
      }

      if (
        e.key === "ArrowRight" &&
        currentIndex < images.length - 1
      ) {
        onChange(currentIndex + 1);
      }
    };

    const prevOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      document.body.style.overflow =
        prevOverflow;

      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [
    currentIndex,
    images.length,
    onClose,
    onChange,
  ]);

  if (!images?.length) return null;

  const canPrev =
    currentIndex > 0;

  const canNext =
    currentIndex <
    images.length - 1;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          "rgba(12,12,12,.72)",
        backdropFilter:
          "blur(10px)",
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "32px 24px",
        animation:
          "fadeIn .22s ease",
      }}
    >
      {/* Close */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={iconBtn({
          top: 20,
          right: 20,
        })}
      >
        <i className="bi bi-x-lg" />
      </button>

      {/* Prev */}
      {canPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(
              currentIndex - 1
            );
          }}
          style={iconBtn({
            left: 26,
            top: "50%",
            transform:
              "translateY(-50%)",
          })}
        >
          <i className="bi bi-chevron-left" />
        </button>
      )}

      {/* Main Image */}
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          display: "flex",
          flexDirection:
            "column",
          alignItems:
            "center",
          gap: 18,
          width: "100%",
        }}
      >
        <img
          src={
            images[
              currentIndex
            ]
          }
          alt=""
          style={{
            width: "980px",
            height: "560px",
            maxWidth:
              "84vw",
            maxHeight:
              "74vh",
            objectFit:
              "contain",
            borderRadius: 18,
            display:
              "block",
            boxShadow:
              "0 35px 90px rgba(0,0,0,.34)",
            animation:
              "zoomFade .22s ease",
          }}
        />

        {/* Thumbnail Strip */}
        {images.length >
          1 && (
          <div
            style={{
              display:
                "flex",
              gap: 10,
              overflowX:
                "auto",
              padding:
                "4px 4px 8px",
              maxWidth:
                "84vw",
              scrollbarWidth:
                "none",
            }}
          >
            {images.map(
              (
                img,
                index
              ) => (
                <img
                  key={
                    index
                  }
                  src={
                    img
                  }
                  alt=""
                  onClick={() =>
                    onChange(
                      index
                    )
                  }
                  style={{
                    width: 78,
                    height: 54,
                    objectFit:
                      "cover",
                    borderRadius: 10,
                    cursor:
                      "pointer",
                    border:
                      index ===
                      currentIndex
                        ? "2px solid #10b981"
                        : "2px solid transparent",
                    opacity:
                      index ===
                      currentIndex
                        ? 1
                        : 0.72,
                    transition:
                      "all .18s ease",
                    flexShrink: 0,
                  }}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Next */}
      {canNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(
              currentIndex + 1
            );
          }}
          style={iconBtn({
            right: 26,
            top: "50%",
            transform:
              "translateY(-50%)",
          })}
        >
          <i className="bi bi-chevron-right" />
        </button>
      )}

      {/* Counter */}
      <div
        style={{
          position:
            "absolute",
          bottom: 20,
          left: "50%",
          transform:
            "translateX(-50%)",
          padding:
            "8px 14px",
          borderRadius: 999,
          background:
            "rgba(255,255,255,.12)",
          color: "#fff",
          fontSize:
            ".88rem",
          fontWeight: 600,
          backdropFilter:
            "blur(12px)",
        }}
      >
        {currentIndex + 1} /{" "}
        {images.length}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes zoomFade {
            from {
              opacity: 0;
              transform: scale(.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>,
    document.body
  );
}

function iconBtn(pos) {
  return {
    position: "absolute",
    width: 48,
    height: 48,
    border: "none",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,.12)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 20,
    backdropFilter:
      "blur(10px)",
    boxShadow:
      "0 10px 30px rgba(0,0,0,.18)",
    transition:
      "all .18s ease",
    ...pos,
  };
}