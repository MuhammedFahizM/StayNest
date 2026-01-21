// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import BasicInfoStep from "../components/property/BasicInfoStep";
// import CapacityPricingStep from "../components/property/CapacityPricingStep";
// import AmenitiesPoliciesStep from "../components/property/AmenitiesPoliciesStep";
// import LocationStep from "../components/property/LocationStep";
// import ImagesStep from "../components/property/ImagesStep";
// import ReviewSubmitStep from "../components/property/ReviewSubmitStep";
// import toast from "react-hot-toast";
// import { useSearchParams } from "react-router-dom";




// import {
//     createProperty,
//     getOwnerProperty,
//     updateProperty,
//     submitProperty,
// } from "../services/propertyService";

// /*
// ====================================================
// WIZARD STEPS (ORDER IS LOCKED)
// ====================================================
// */
// const STEPS = [
//     { key: "basic", label: "Basic Info" },
//     { key: "capacity", label: "Capacity & Pricing" },
//     { key: "amenities", label: "Amenities & Policies" },
//     { key: "location", label: "Location" },
//     { key: "images", label: "Images" },
//     { key: "review", label: "Review & Submit" },
// ];

// export default function PropertyDetails() {
//     const navigate = useNavigate();
//     const { id } = useParams(); // "new" or property id

//     const isNew = id === "new";

//     const [property, setProperty] = useState(null);
//     const [currentStep, setCurrentStep] = useState(STEPS[0].key);
//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");

//     const refreshProperty = async () => {
//         if (!property?.id) return;
//         const data = await getOwnerProperty(property.id);
//         setProperty(data);
//     };
//     const canAccessStep = (stepKey) => {
//         if (stepKey === "basic") return true;
//         if (!property?.id) return false;
//         return true;
//     };
//     const [searchParams] = useSearchParams();
//     const isViewMode = searchParams.get("mode") === "view";




//     /*
//     ====================================================
//     INITIAL LOAD
//     ====================================================
//     */
//     useEffect(() => {
//         if (isNew) {
//             // Auto-create draft after minimal user input later.
//             // For now, we initialize empty state.
//             setLoading(false);
//             return;
//         }

//         const fetchProperty = async () => {
//             try {
//                 const data = await getOwnerProperty(id);
//                 setProperty(data);
//             } catch {
//                 setError("Unable to load property.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchProperty();
//     }, [id, isNew]);

//     /*
//     ====================================================
//     DRAFT CREATION (CALLED AFTER BASIC INFO)
//     ====================================================
//     */
//     // NOTE: payload MUST include sharing_options (backend requirement)

//     const createDraft = async (payload) => {
//         if (isViewMode) return;
//         setSaving(true);
//         try {
//             const data = await createProperty(payload);
//             setProperty(data);
//             navigate(`/owner/properties/${data.id}`, { replace: true });
//             return data;
//         } catch {
//             setError("Unable to create property draft.");
//             throw new Error("Draft creation failed");
//         } finally {
//             setSaving(false);
//         }
//     };

//     /*
//     ====================================================
//     SAVE STEP (PATCH)
//     ====================================================
//     */
//     const saveStep = async (payload) => {
//         if (!property?.id) return;
//         if (isViewMode) return;


//         setSaving(true);
//         try {
//             const data = await updateProperty(property.id, payload);
//             setProperty(data);
//             return data;
//         } catch {
//             toast.error("Unable to save changes");
//             throw new Error("Save failed");
//         } finally {
//             setSaving(false);
//         }
//     };

//     /*
//     ====================================================
//     SUBMIT FOR REVIEW
//     ====================================================
//     */
//     const handleSubmitForReview = async () => {
//         if (!property?.id) return;
//         if (isViewMode) return;

//         setSaving(true);
//         try {
//             await submitProperty(property.id);
//             toast.success("Property submitted for review");
//             navigate("/owner/properties");
//         } catch (err) {
//             toast.error(
//                 err?.response?.data?.error ||
//                 "Unable to submit property for review."
//             );
//         }
//         finally {
//             setSaving(false);
//         }
//     };

//     /*
//     ====================================================
//     RENDER STATES
//     ====================================================
//     */
//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center text-gray-700">
//                 Loading property...
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
//                     {error}
//                 </div>
//             </div>
//         );
//     }

//     /*
//     ====================================================
//     MAIN LAYOUT
//     ====================================================
//     */
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 pt-28 px-4">
//             <div className="max-w-6xl mx-auto flex gap-6">
//                 {/* Sidebar */}
//                 <aside className="w-64 bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl p-4 h-fit">
//                     <h2 className="text-lg font-semibold text-gray-800 mb-4">
//                         Property Setup
//                     </h2>

//                     <ul className="space-y-1">
//                         {STEPS.map((step) => (
//                             <li key={step.key}>
//                                 <button
//                                     disabled={isViewMode || !canAccessStep(step.key) || saving}


//                                     onClick={() => setCurrentStep(step.key)}
//                                     className={`w-full text-left px-3 py-2 rounded-xl text-sm transition
//   ${currentStep === step.key
//                                             ? "bg-blue-600 text-white"
//                                             : "text-gray-700 hover:bg-gray-200"
//                                         }
//   ${(!canAccessStep(step.key) || saving)
//                                             ? "opacity-50 cursor-not-allowed hover:bg-transparent"
//                                             : ""
//                                         }
// `}

//                                 >
//                                     {step.label}
//                                 </button>
//                             </li>
//                         ))}
//                     </ul>
//                 </aside>

//                 {/* Content */}
//                 <main className="flex-1 bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow">
//                     {/* Step header */}
//                     <div className="flex items-center justify-between mb-6">
//                         <h1 className="text-xl font-semibold text-gray-800">
//                             {STEPS.find((s) => s.key === currentStep)?.label}
//                         </h1>

//                         {saving && (
//                             <div className="text-sm text-blue-600 flex items-center gap-2">
//                                 <span className="animate-spin">⏳</span>
//                                 Saving changes…
//                             </div>
//                         )}

//                         {isViewMode && (
//                             <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm">
//                                 Owner Preview Mode — this is how users see your property
//                             </div>
//                         )}


//                     </div>

//                     {/* Step content placeholder */}
//                     <div className="text-gray-600 text-sm">
//                         {currentStep === "basic" && (
//                             <BasicInfoStep
//                                 property={property}
//                                 onCreateDraft={createDraft}
//                                 onSave={saveStep}
//                             />
//                         )}
//                         {currentStep === "capacity" && property && (
//                             <CapacityPricingStep
//                                 property={property}
//                                 onSave={saveStep}
//                             />
//                         )}
//                         {currentStep === "amenities" && property && (
//                             <AmenitiesPoliciesStep
//                                 property={property}
//                                 onSave={saveStep}
//                             />
//                         )}
//                         {currentStep === "location" && property && (
//                             <LocationStep
//                                 property={property}
//                                 onSave={saveStep}
//                             />
//                         )}
//                         {currentStep === "images" && property && (
//                             <ImagesStep
//                                 property={property}
//                                 onRefresh={refreshProperty}
//                             />
//                         )}

//                         {currentStep === "review" && property && (
//                             <ReviewSubmitStep
//                                 property={property}
//                                 onSubmit={handleSubmitForReview}
//                             />
//                         )}

//                         {!property && currentStep !== "basic" && (
//                             <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl">
//                                 Please complete Basic Info first.
//                             </div>
//                         )}




//                     </div>
//                 </main>
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import BasicInfoStep from "../components/property/BasicInfoStep";
import CapacityPricingStep from "../components/property/CapacityPricingStep";
import AmenitiesPoliciesStep from "../components/property/AmenitiesPoliciesStep";
import LocationStep from "../components/property/LocationStep";
import ImagesStep from "../components/property/ImagesStep";
import ReviewSubmitStep from "../components/property/ReviewSubmitStep";
import ImageLightbox from "../components/ImageLightbox";


import {
  createProperty,
  getOwnerProperty,
  updateProperty,
  submitProperty,
} from "../services/propertyService";

/* --------------------------------------------------
Wizard steps (EDIT ONLY)
-------------------------------------------------- */
const STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "capacity", label: "Capacity & Pricing" },
  { key: "amenities", label: "Amenities & Policies" },
  { key: "location", label: "Location" },
  { key: "images", label: "Images" },
  { key: "review", label: "Review & Submit" },
];

export default function PropertyDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isEdit = location.pathname.endsWith("/edit");
  const isNew = id === "new";

  const [property, setProperty] = useState(null);
  const [currentStep, setCurrentStep] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);


  /* --------------------------------------------------
Initial load
-------------------------------------------------- */
  useEffect(() => {
    // ONLY for edit / view
    if (!id || id === "new") return;

    setLoading(true);

    const fetchProperty = async () => {
      try {
        const data = await getOwnerProperty(id);
        setProperty(data);
      } catch {
        toast.error("Unable to load property");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);


  /* --------------------------------------------------
Create Draft (Basic Info)
-------------------------------------------------- */
  const createDraft = async (payload) => {
    setSaving(true);
    try {
      const data = await createProperty(payload);
      setProperty(data);
      toast.success("Basic info saved");
      navigate(`/owner/properties/${data.id}/edit`, { replace: true });
      return data;
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------
Save Step (after draft exists)
-------------------------------------------------- */
  const saveStep = async (payload, label) => {
    if (!property?.id) {
      throw new Error("Property not created yet");
    }

    setSaving(true);
    try {
      const data = await updateProperty(property.id, payload);
      setProperty(data);
      toast.success(`${label} updated`);
      return data;
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------
Submit
-------------------------------------------------- */
  const handleSubmit = async () => {
    if (!property?.id) return;

    setSaving(true);
    try {
      await submitProperty(property.id);
      toast.success("Listing submitted for admin review");
      navigate("/owner/properties");
    } finally {
      setSaving(false);
    }
  };

  const refreshProperty = async () => {
    if (!property?.id) return;
    const data = await getOwnerProperty(property.id);
    setProperty(data);
  };


  /* --------------------------------------------------
Loading
-------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        Loading property…
      </div>
    );
  }



  /* ==================================================
     ================= VIEW MODE ======================
     ================================================== */
  if (!isEdit && property) {
    return (
      <>
        <div className="min-vh-100 pt-5 px-3">

          <div className="container pt-5">
            <div className="card shadow border mx-auto" style={{ maxWidth: "900px" }}>
              <div className="card-body">

                <button
                  className="btn btn-link px-0 mb-3"
                  onClick={() => navigate("/owner/properties")}
                >
                  ← Back to Listings
                </button>

                {property.status === "REJECTED" && property.rejection_reason && (
                  <>
                    <div className="alert alert-danger mb-3">
                      <strong>Rejection Reason:</strong>
                      <div>{property.rejection_reason}</div>
                    </div>
                    <hr />
                  </>
                )}

                <h3 className="fw-bold mb-2">
                  {property.property_name}
                </h3>

                <p className="text-muted">
                  {property.city}, {property.state}
                </p>

                <hr />

                <Section title="Basic Information">
                  <Info label="Stay Type" value={property.stay_type} />
                  <Info
                    label="Preferred Occupants"
                    value={property.preferred_occupants?.join(", ")}
                  />

                  <Info label="Status" value={property.status} />
                </Section>

                <Section title="Capacity & Pricing">
                  {property.sharing_options?.map((opt) => (
                    <div key={opt.sharing_type} className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <small className="text-muted">
                          {opt.sharing_type} Sharing
                        </small>
                        <div className="fw-medium">
                          Rent: ₹{opt.rent_amount}
                        </div>
                        <div className="text-muted small">
                          Beds: {opt.available_beds} / {opt.total_beds}
                        </div>
                      </div>
                    </div>
                  ))}

                </Section>

                <Section title="Amenities & Policies">
                  <Info label="AC" value={property.is_ac ? "Yes" : "No"} />
                  <Info label="Parking" value={property.parking_available ? "Yes" : "No"} />
                  <Info label="Food Provided" value={property.food_provided ? "Yes" : "No"} />
                  <Info label="WiFi" value={property.wifi_available ? "Yes" : "No"} />
                  <Info label="Power Backup" value={property.power_backup ? "Yes" : "No"} />

                  {property.security_deposit && (
                    <Info label="Security Deposit" value={`₹${property.security_deposit}`} />
                  )}

                  {property.notice_period && (
                    <Info label="Notice Period" value={`${property.notice_period} days`} />
                  )}

                  {property.visiting_hours && (
                    <Info label="Visiting Hours" value={property.visiting_hours} />
                  )}

                  {property.floor_info && (
                    <Info label="Floor Info" value={property.floor_info} />
                  )}

                  {property.nearby_landmarks && (
                    <div className="col-12">
                      <div className="border rounded p-3">
                        <small className="text-muted">Nearby Landmarks</small>
                        <div>{property.nearby_landmarks}</div>
                      </div>
                    </div>
                  )}

                  {property.rules_and_regulations && (
                    <div className="col-12">
                      <div className="border rounded p-3">
                        <small className="text-muted">Rules & Regulations</small>
                        <div>{property.rules_and_regulations}</div>
                      </div>
                    </div>
                  )}
                </Section>


                <Section title="Location">
                  <Info label="City" value={property.city} />
                  <Info label="State" value={property.state} />
                </Section>

                <Section title="Images">
                  {property.images?.length ? (
                    <div className="row g-3">
                      {property.images.map((img, index) => (
                        <div key={img.id} className="col-4">
                          <img
                            src={img.image}
                            alt=""
                            className="img-fluid rounded border"
                            style={{ cursor: "pointer" }}
                            onClick={() => setLightboxIndex(index)}
                          />
                        </div>
                      ))}
                    </div>

                  ) : (
                    <p className="text-muted">No images uploaded</p>
                  )}
                </Section>

              </div>
            </div>
          </div>

        </div>
        {lightboxIndex !== null && property?.images?.length > 0 && (
          <ImageLightbox
            images={property.images.map((i) => i.image)}
            currentIndex={lightboxIndex}
            onChange={(i) => {
              if (i >= 0 && i < property.images.length) {
                setLightboxIndex(i);
              }
            }}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  /* ==================================================
     ================= EDIT MODE ======================
     ================================================== */

  // CREATE MODE SAFETY: lock steps until draft exists
  if (isNew && !property && currentStep !== "basic") {
    setCurrentStep("basic");
  }

  return (
    <>
      <div className="min-vh-100 pt-5 px-3">
        <div className="container pt-5">
          <div className="row g-4">

            {/* Sidebar */}
            <div className="col-12 col-lg-3">
              <div className="card shadow border p-3">
                <h6 className="fw-semibold mb-3">
                  Edit Listing
                </h6>

                <div className="list-group list-group-flush">
                  {STEPS.map((step) => (
                    <button
                      key={step.key}
                      className={`list-group-item list-group-item-action ${currentStep === step.key ? "active" : ""
                        }`}
                      disabled={saving || (!property && step.key !== "basic")}
                      onClick={() => setCurrentStep(step.key)}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="col-12 col-lg-9">
              <div className="card shadow border p-4">

                <div className="d-flex align-items-center mb-3">
                  <button
                    type="button"
                    className="btn btn-link px-0"
                    onClick={() => navigate("/owner/properties")}
                  >
                    ← Back to Listings
                  </button>
                </div>

                {/* BASIC INFO — always allowed */}
                {currentStep === "basic" && (
                  <BasicInfoStep
                    property={property}
                    onCreateDraft={createDraft}
                    onSave={(p) => saveStep(p, "Basic info")}
                  />
                )}

                {/* OTHER STEPS — only after draft exists */}
                {property && currentStep === "capacity" && (
                  <CapacityPricingStep
                    property={property}
                    onSave={(p) => saveStep(p, "Capacity & pricing")}
                  />
                )}

                {property && currentStep === "amenities" && (
                  <AmenitiesPoliciesStep
                    property={property}
                    onSave={(p) => saveStep(p, "Amenities & policies")}
                  />
                )}

                {property && currentStep === "location" && (
                  <LocationStep
                    property={property}
                    onSave={(p) => saveStep(p, "Location")}
                  />
                )}

                {property && currentStep === "images" && (
                  <ImagesStep
                    property={property}
                    onRefresh={refreshProperty}
                  />
                )}

                {property && currentStep === "review" && (
                  <ReviewSubmitStep
                    property={property}
                    onSubmit={handleSubmit}
                  />
                )}


              </div>
            </div>

          </div>
        </div>
      </div>

      {lightboxIndex !== null && property?.images?.length > 0 && (
        <ImageLightbox
          images={property.images.map((i) => i.image)}
          currentIndex={lightboxIndex}
          onChange={(i) => {
            if (i >= 0 && i < property.images.length) {
              setLightboxIndex(i);
            }
          }}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>

  );


}

/* --------------------------------------------------
Helpers
-------------------------------------------------- */
function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h6 className="fw-semibold mb-3">{title}</h6>
      <div className="row g-3">{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="col-md-6">
      <div className="border rounded p-3 h-100">
        <small className="text-muted">{label}</small>
        <div className="fw-medium">{value ?? "—"}</div>
      </div>
    </div>
  );
}
