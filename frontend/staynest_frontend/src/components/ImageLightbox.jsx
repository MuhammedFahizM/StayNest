import { useEffect } from "react";

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onChange,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onChange(currentIndex - 1);
      if (e.key === "ArrowRight") onChange(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, onClose, onChange]);

  if (!images?.length) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,0.85)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="d-flex align-items-center justify-content-center h-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev */}
        <button
          className="btn btn-light position-absolute start-0 ms-3"
          disabled={currentIndex === 0}
          onClick={() => onChange(currentIndex - 1)}
        >
          ‹
        </button>

        {/* Image */}
        <img
          src={images[currentIndex]}
          alt=""
          className="img-fluid rounded shadow"
          style={{ maxHeight: "85vh" }}
        />

        {/* Next */}
        <button
          className="btn btn-light position-absolute end-0 me-3"
          disabled={currentIndex === images.length - 1}
          onClick={() => onChange(currentIndex + 1)}
        >
          ›
        </button>

        {/* Close */}
        <button
          className="btn btn-danger position-absolute top-0 end-0 m-3"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
