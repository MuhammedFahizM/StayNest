import { useState } from "react";
import {
  uploadPropertyImages,
  deletePropertyImage,
} from "../../services/propertyService";

export default function ImagesStep({ property, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      await uploadPropertyImages(property.id, files);
      await onRefresh();
      setError("");
    } catch {
      setError("Unable to upload images.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      await deletePropertyImage(property.id, imageId);
      await onRefresh();
      setError("");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Unable to delete image."
      );
    }
  };

  return (
    <div className="d-flex flex-column gap-4">

      {/* Upload */}
      <div>
        <label className="form-label fw-medium">
          Upload Images
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="form-control"
        />

        <small className="text-muted">
          Minimum 3 images required before submission.
        </small>
      </div>

      {/* Gallery */}
      <div className="row g-3">
        {property.images?.map((img) => (
          <div
            key={img.id}
            className="col-6 col-md-4"
          >
            <div className="card h-100 position-relative">
              <img
                src={img.image}
                alt="Property"
                className="card-img-top"
                style={{ height: "160px", objectFit: "cover" }}
              />

              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty */}
      {property.images?.length === 0 && (
        <div className="text-muted">
          No images uploaded yet.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger py-2 mb-0">
          {error}
        </div>
      )}

    </div>
  );
}
