// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//   getOwnerProperties,
//   togglePropertyStatus,
//   submitProperty,
// } from "../services/propertyService";

// import PropertyCard from "../components/PropertyCard";

// export default function PropertyList() {
//   const navigate = useNavigate();

//   const [properties, setProperties] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchProperties = async () => {
//     try {
//       const data = await getOwnerProperties();
//       setProperties(data);
//     } catch (err) {
//       setError("Unable to load your properties. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProperties();
//   }, []);

//   const handleToggle = async (propertyId) => {
//     try {
//       await togglePropertyStatus(propertyId);
//       fetchProperties();
//     } catch {
//       alert("Unable to update property status.");
//     }
//   };

//   const handleSubmit = async (propertyId) => {
//     try {
//       await submitProperty(propertyId);
//       fetchProperties();
//     } catch (err) {
//       alert(
//         err?.response?.data?.error ||
//           "Unable to submit property. Please check requirements."
//       );
//     }
//   };

//   /* Loading */
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-gray-700">
//         Loading properties...
//       </div>
//     );
//   }

//   /* Error */
//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
//           {error}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 pt-28 px-4">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-800">
//               My Properties
//             </h1>
//             <p className="text-gray-600 mt-1">
//               Manage your listings and visibility
//             </p>
//           </div>

//           <button
//             onClick={() => navigate("/owner/properties/new")}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow transition"
//           >
//             + Add Property
//           </button>
//         </div>

//         {/* Empty state */}
//         {properties.length === 0 && (
//           <div className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl p-10 text-center text-gray-600">
//             <p className="text-lg font-medium">
//               No properties added yet
//             </p>
//             <p className="text-sm mt-2">
//               Start by creating your first property listing.
//             </p>
//           </div>
//         )}

//         {/* Property grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {properties.map((property) => (
//             <PropertyCard
//               key={property.id}
//               property={property}
//               onEdit={() =>
//                 navigate(`/owner/properties/${property.id}`)
//               }
//               onToggle={() => handleToggle(property.id)}
//               onSubmit={() => handleSubmit(property.id)}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getOwnerProperties,
  togglePropertyStatus,
  submitProperty,
} from "../services/propertyService";

import PropertyCard from "../components/PropertyCard";
import { deleteProperty } from "../services/propertyService";


export default function PropertyList() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProperties = async () => {
    try {
      const data = await getOwnerProperties();
      setProperties(data);
    } catch {
      setError("Unable to load your properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleToggle = async (property) => {
    try {
      await togglePropertyStatus(property.id);
      toast.success(
        property.status === "ACTIVE"
          ? "Listing hidden from users"
          : "Listing is now visible to users"
      );
      fetchProperties();
    } catch {
      toast.error("Unable to update listing visibility.");
    }
  };

  const handleSubmit = async (property) => {
    try {
      await submitProperty(property.id);
      toast.success("Listing submitted for admin review");
      fetchProperties();
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        "Unable to submit property. Please check requirements."
      );
    }
  };

  const handleDelete = async (property) => {
    if (
      !window.confirm(
        "This will permanently delete the property and all its data. This action cannot be undone. Continue?"
      )
    ) {
      return;
    }

    try {
      await deleteProperty(property.id);
      toast.success("Property permanently deleted");
      fetchProperties();
    } catch {
      toast.error("Unable to delete property");
    }
  };


  /* -------------------------------------
     Loading
  ------------------------------------- */
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">
        Loading properties…
      </div>
    );
  }

  /* -------------------------------------
     Error
  ------------------------------------- */
  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 pt-2 px-3">
      <div className="container pt-2 pb-5">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="mb-1">Your Listings</h2>
            <p className="text-muted mb-3">
              Manage and review your properties
            </p>

          </div>

          <button
            onClick={() => navigate("/owner/properties/new")}
            className="btn btn-primary"
          >
            + Add Property
          </button>
        </div>

        {/* Empty State */}
        {properties.length === 0 && (
          <div className="card border shadow-sm text-center p-5 text-muted">
            <h5 className="fw-semibold mb-2">
              You haven’t added any listings yet
            </h5>
            <p className="mb-0">
              Create your first property to get started.
            </p>
          </div>
        )}

        {/* Grid */}
        {properties.length > 0 && (
          <div className="row g-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="col-12 col-md-6 col-lg-4"
              >
                {/* <PropertyCard
                  property={property}
                  onEdit={() =>
                    navigate(`/owner/properties/${property.id}`)
                  }
                  onToggle={() => handleToggle(property)}
                  onSubmit={() => handleSubmit(property)}
                  onPreview={() =>
                    navigate(`/owner/properties/${property.id}`)
                  }
                /> */}

                <PropertyCard
                  property={property}
                  onView={() =>
                    navigate(`/owner/properties/${property.id}`)
                  }
                  onEdit={() =>
                    navigate(`/owner/properties/${property.id}/edit`)
                  }
                  onToggle={() => handleToggle(property)}
                  onDelete={() => handleDelete(property)}
                />



              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
