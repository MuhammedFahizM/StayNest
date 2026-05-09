import {
  useEffect,
  useState,
  useContext,
} from "react";
import {
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";

import {
  getOwnerProperties,
  togglePropertyStatus,
  submitProperty,
  deleteProperty,
} from "../services/propertyService";

import {
  AuthContext,
} from "../context/AuthContext";

import PropertyCard from "../components/PropertyCard";
import ConfirmModal from "../components/ConfirmModal";

export default function PropertyList() {
  const navigate =
    useNavigate();

  const { user } =
    useContext(AuthContext);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [properties, setProperties] =
    useState([]);

  const [deleteState, setDeleteState] =
    useState({
      open: false,
      property: null,
    });

  const isOwner =
    user?.role ===
    "owner";

  const loadData =
    async () => {
      try {
        const data =
          await getOwnerProperties();

        setProperties(
          data || []
        );
      } catch {
        setError(
          "Unable to load your properties."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle =
    async (
      property
    ) => {
      try {
        await togglePropertyStatus(
          property.id
        );

        toast.success(
          property.status ===
            "ACTIVE"
            ? "Listing hidden"
            : "Listing activated"
        );

        loadData();
      } catch {
        toast.error(
          "Unable to update listing"
        );
      }
    };

  const handleDelete =
    async () => {
      const item =
        deleteState.property;

      try {
        await deleteProperty(
          item.id
        );

        toast.success(
          "Property deleted"
        );

        setDeleteState({
          open: false,
          property: null,
        });

        loadData();
      } catch {
        toast.error(
          "Unable to delete property"
        );
      }
    };

  /* Loading */
  if (loading) {
    return (
      <Wrap>
        <CenterCard>
          <div className="spinner-border text-success mb-3" />
          <h6
            style={
              title
            }
          >
            Loading Listings
          </h6>
          <p
            style={
              muted
            }
          >
            Please wait...
          </p>
        </CenterCard>
      </Wrap>
    );
  }

  /* Error */
  if (error) {
    return (
      <Wrap>
        <CenterCard>
          <div
            style={
              dangerIcon
            }
          >
            <i className="bi bi-exclamation-triangle" />
          </div>

          <h6
            style={
              title
            }
          >
            Failed to Load
          </h6>

          <p
            style={
              muted
            }
          >
            {error}
          </p>
        </CenterCard>
      </Wrap>
    );
  }

  return (
    <>
      <Wrap>
        <div
          className="container"
          style={{
            maxWidth: 1260,
          }}
        >
          {/* Hero */}
          <div
            style={
              hero
            }
          >
            <div>
              <div
                style={
                  tag
                }
              >
                OWNER LISTINGS
              </div>

              <h2
                style={{
                  margin:
                    "6px 0 4px",
                  fontWeight: 800,
                  color:
                    "#0f172a",
                }}
              >
                Your Properties
              </h2>

              <p
                style={
                  muted
                }
              >
                Manage{" "}
                {
                  properties.length
                }{" "}
                listing
                {properties.length !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>

            {isOwner && (
              <button
                onClick={() =>
                  navigate(
                    "/owner/properties/new"
                  )
                }
                style={
                  primaryBtn
                }
                onMouseEnter={(
                  e
                ) => {
                  e.currentTarget.style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(
                  e
                ) => {
                  e.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                <i className="bi bi-plus-lg me-2" />
                Add Property
              </button>
            )}
          </div>

          {/* Empty */}
          {properties.length ===
            0 && (
            <div
              style={
                emptyBox
              }
            >
              <div
                style={
                  emptyIcon
                }
              >
                <i className="bi bi-house-door" />
              </div>

              <h5
                style={{
                  margin:
                    "0 0 8px",
                  fontWeight: 800,
                }}
              >
                No Listings Yet
              </h5>

              <p
                style={{
                  margin:
                    "0 0 18px",
                  color:
                    "#64748b",
                }}
              >
                Add your first
                property and
                start getting
                bookings.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/owner/properties/new"
                  )
                }
                style={
                  primaryBtn
                }
              >
                Add First Property
              </button>
            </div>
          )}

          {/* Grid */}
          {properties.length >
            0 && (
            <div className="row g-4">
              {properties.map(
                (
                  property,
                  index
                ) => (
                  <div
                    key={
                      property.id
                    }
                    className="col-12 col-md-6 col-xl-4"
                    style={{
                      animation: `fadeInUp .45s ease forwards`,
                      animationDelay: `${index * 0.05}s`,
                      opacity: 1,
                    }}
                  >
                    <PropertyCard
                      property={
                        property
                      }
                      onView={() =>
                        navigate(
                          `/owner/properties/${property.id}`
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/owner/properties/${property.id}/edit`
                        )
                      }
                      onToggle={() =>
                        handleToggle(
                          property
                        )
                      }
                      onDelete={() =>
                        setDeleteState(
                          {
                            open: true,
                            property,
                          }
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </Wrap>

      {/* Delete Modal */}
      <ConfirmModal
        open={
          deleteState.open
        }
        title="Delete Property"
        message={`Delete "${deleteState.property?.property_name}" permanently? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={
          handleDelete
        }
        onCancel={() =>
          setDeleteState({
            open: false,
            property: null,
          })
        }
      />
    </>
  );
}

/* Layout */

function Wrap({
  children,
}) {
  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(180deg,#f8fafc,#ffffff)",
        padding:
          "26px 0 60px",
      }}
    >
      {children}
    </div>
  );
}

function CenterCard({
  children,
}) {
  return (
    <div
      style={{
        maxWidth: 360,
        margin:
          "120px auto",
        background:
          "#fff",
        border:
          "1px solid #e2e8f0",
        borderRadius: 22,
        padding:
          "28px",
        textAlign:
          "center",
        boxShadow:
          "0 14px 30px rgba(15,23,42,.05)",
      }}
    >
      {children}
    </div>
  );
}

/* Styles */

const hero = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 22,
  marginBottom: 24,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16,
  boxShadow:
    "0 12px 26px rgba(15,23,42,.04)",
};

const primaryBtn = {
  height: 46,
  border: "none",
  borderRadius: 14,
  padding:
    "0 18px",
  background:
    "linear-gradient(135deg,#10b981,#059669)",
  color: "#fff",
  fontWeight: 800,
  boxShadow:
    "0 12px 24px rgba(16,185,129,.18)",
  transition:
    "all .2s ease",
};

const tag = {
  color: "#10b981",
  fontWeight: 800,
  fontSize: ".74rem",
  letterSpacing:
    ".06em",
};

const muted = {
  margin: 0,
  color: "#64748b",
  fontSize: ".9rem",
};

const title = {
  margin: 0,
  fontWeight: 800,
  color: "#0f172a",
};

const emptyBox = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 24,
  padding:
    "56px 24px",
  textAlign:
    "center",
  boxShadow:
    "0 12px 28px rgba(15,23,42,.04)",
};

const emptyIcon = {
  width: 64,
  height: 64,
  borderRadius: 18,
  margin:
    "0 auto 16px",
  display: "grid",
  placeItems:
    "center",
  background:
    "linear-gradient(135deg,#dcfce7,#ecfdf5)",
  color: "#10b981",
  fontSize: 24,
};

const dangerIcon = {
  width: 54,
  height: 54,
  borderRadius: 16,
  margin:
    "0 auto 14px",
  display: "grid",
  placeItems:
    "center",
  background:
    "#fef2f2",
  color: "#ef4444",
  fontSize: 22,
};