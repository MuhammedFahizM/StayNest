import { useState } from "react";
import {
  uploadPropertyImages,
  deletePropertyImage,
} from "../../services/propertyService";
import ConfirmModal from "../ConfirmModal";

export default function ImagesStep({
  property,
  onRefresh,
}) {
  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const images =
    property?.images || [];

  const enoughImages =
    images.length >= 3;

  async function handleUpload(
    e
  ) {
    const files =
      Array.from(
        e.target.files
      );

    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      await uploadPropertyImages(
        property.id,
        files
      );

      await onRefresh();
    } catch {
      setError(
        "Unable to upload images."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    try {
      await deletePropertyImage(
        property.id,
        deleteTarget
      );

      await onRefresh();
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err?.response?.data
          ?.error ||
          "Unable to delete image."
      );
      setDeleteTarget(null);
    }
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div>
        <div
          style={{
            fontSize:
              ".75rem",
            fontWeight: 800,
            letterSpacing:
              ".08em",
            color:
              "var(--sn-primary)",
            textTransform:
              "uppercase",
            marginBottom: 8,
          }}
        >
          Step 5
        </div>

        <h3
          style={{
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Property Images
        </h3>

        <p className="text-muted mb-0">
          Strong photos
          increase trust,
          clicks and
          bookings.
        </p>
      </div>

      {/* Upload Card */}
      <SectionCard title="Upload Photos">
        <div
          style={{
            position:
              "relative",
            border:
              uploading
                ? "2px dashed #10b981"
                : "2px dashed #dbe3ea",
            borderRadius: 22,
            padding:
              "38px 24px",
            background:
              uploading
                ? "rgba(16,185,129,.04)"
                : "#f8fafc",
            textAlign:
              "center",
            transition:
              ".2s ease",
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              margin:
                "0 auto 14px",
              display:
                "grid",
              placeItems:
                "center",
              background:
                "rgba(16,185,129,.10)",
              color:
                "#10b981",
              fontSize:
                24,
            }}
          >
            <i className="bi bi-cloud-arrow-up"></i>
          </div>

          <div
            style={{
              fontWeight: 800,
              fontSize:
                "1rem",
              marginBottom: 6,
            }}
          >
            {uploading
              ? "Uploading images..."
              : "Click or drop files here"}
          </div>

          <div className="text-muted small">
            JPG, PNG supported
            · Upload clear
            room, washroom
            and exterior
            images
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            disabled={
              uploading
            }
            onChange={
              handleUpload
            }
            style={{
              position:
                "absolute",
              inset: 0,
              opacity: 0,
              cursor:
                "pointer",
              width: "100%",
            }}
          />
        </div>
      </SectionCard>

      {/* Status */}
      <SectionCard title="Upload Status">
        <div className="d-flex flex-wrap gap-2">
          <StatusPill
            ok={
              enoughImages
            }
            text={
              enoughImages
                ? `${images.length} images uploaded`
                : `${images.length}/3 minimum images required`
            }
          />

          <StatusPill
            ok={
              images.length >=
              6
            }
            text={
              images.length >=
              6
                ? "Excellent coverage"
                : "Add more angles for better conversions"
            }
          />
        </div>
      </SectionCard>

      {/* Gallery */}
      <SectionCard title="Gallery">
        {images.length >
        0 ? (
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(210px,1fr))",
              gap: 16,
            }}
          >
            {images.map(
              (
                img,
                index
              ) => (
                <div
                  key={
                    img.id
                  }
                  style={{
                    position:
                      "relative",
                    borderRadius: 20,
                    overflow:
                      "hidden",
                    background:
                      "#f8fafc",
                    border:
                      "1px solid #eef2f7",
                  }}
                >
                  <img
                    src={
                      img.image
                    }
                    alt=""
                    style={{
                      width:
                        "100%",
                      aspectRatio:
                        "4 / 3",
                      objectFit:
                        "cover",
                      display:
                        "block",
                    }}
                  />

                  <div
                    style={{
                      position:
                        "absolute",
                      top: 10,
                      left: 10,
                      background:
                        "rgba(0,0,0,.55)",
                      color:
                        "#fff",
                      padding:
                        "4px 9px",
                      borderRadius: 999,
                      fontSize:
                        ".75rem",
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget(
                        img.id
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      top: 10,
                      right: 10,
                      width: 34,
                      height: 34,
                      border: "none",
                      borderRadius:
                        "50%",
                      background:
                        "rgba(0,0,0,.58)",
                      color:
                        "#fff",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      cursor:
                        "pointer",
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </SectionCard>

      {/* Error */}
      {error && (
        <div
          style={{
            background:
              "#fef2f2",
            border:
              "1px solid #fecaca",
            color:
              "#dc2626",
            borderRadius: 14,
            padding:
              "12px 14px",
            fontWeight: 600,
            fontSize:
              ".9rem",
          }}
        >
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {/* Confirm */}
      <ConfirmModal
        open={
          !!deleteTarget
        }
        title="Delete Image"
        message="This image will be permanently removed from your listing."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={
          handleDelete
        }
        onCancel={() =>
          setDeleteTarget(
            null
          )
        }
      />
    </div>
  );
}

/* helpers */

function SectionCard({
  title,
  children,
}) {
  return (
    <div
      style={{
        border:
          "1px solid var(--sn-border)",
        borderRadius: 22,
        padding: 22,
        background:
          "#fff",
        boxShadow:
          "0 10px 26px rgba(15,23,42,.04)",
      }}
    >
      <h6
        style={{
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        {title}
      </h6>
      {children}
    </div>
  );
}

function StatusPill({
  ok,
  text,
}) {
  return (
    <div
      style={{
        borderRadius:
          999,
        padding:
          "9px 14px",
        fontSize:
          ".84rem",
        fontWeight: 700,
        background: ok
          ? "rgba(16,185,129,.10)"
          : "#fff7ed",
        border: ok
          ? "1px solid rgba(16,185,129,.18)"
          : "1px solid #fed7aa",
        color: ok
          ? "#059669"
          : "#c2410c",
      }}
    >
      {ok && (
        <i className="bi bi-check2-circle me-2"></i>
      )}
      {!ok && (
        <i className="bi bi-info-circle me-2"></i>
      )}
      {text}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign:
          "center",
        padding:
          "38px 12px",
        color:
          "#94a3b8",
      }}
    >
      <div
        style={{
          fontSize: 30,
          marginBottom: 8,
        }}
      >
        <i className="bi bi-images"></i>
      </div>

      <div
        style={{
          fontWeight: 700,
          color:
            "#64748b",
        }}
      >
        No images uploaded yet
      </div>

      <div className="small mt-1">
        Add clear photos
        to continue.
      </div>
    </div>
  );
}