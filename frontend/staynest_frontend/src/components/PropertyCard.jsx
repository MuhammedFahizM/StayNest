// import { useState } from "react";

// const STATUS_CONFIG = {
//   DRAFT: {
//     label: "Draft",
//     color: "bg-gray-200 text-gray-700",
//   },
//   SUBMITTED: {
//     label: "Submitted",
//     color: "bg-yellow-100 text-yellow-800",
//   },
//   REJECTED: {
//     label: "Rejected",
//     color: "bg-red-100 text-red-700",
//   },
//   APPROVED: {
//     label: "Approved",
//     color: "bg-blue-100 text-blue-700",
//   },
//   ACTIVE: {
//     label: "Active",
//     color: "bg-green-100 text-green-700",
//   },
//   INACTIVE: {
//     label: "Inactive",
//     color: "bg-gray-300 text-gray-700",
//   },
// };

// export default function PropertyCard({
//   property,
//   onEdit,
//   onToggle,
//   onSubmit,
// }) {
//   const [showReason, setShowReason] = useState(false);

//   const statusMeta = STATUS_CONFIG[property.status];

//   return (
//     <>
//       {/* Card */}
//       <div className="bg-white/70 backdrop-blur-xl border border-white/70 rounded-2xl shadow hover:shadow-md transition flex flex-col overflow-hidden">
//         {/* Image Section */}
//         <div className="relative h-44 bg-gray-200 overflow-hidden rounded-t-2xl">
//           {property.images && property.images.length > 0 ? (
//             <div className="h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
//               {property.images.map((img, index) => (
//                 <img
//                   key={index}
//                   src={img.image}
//                   alt={`${property.property_name} ${index + 1}`}
//                   className="h-full w-full object-cover flex-shrink-0 snap-center transition-transform duration-300 hover:scale-105"
//                 />
//               ))}
//             </div>
//           ) : (
//             <div className="h-full flex items-center justify-center text-gray-400 text-sm">
//               No image
//             </div>
//           )}

//           {/* Status Badge */}
//           <span
//             className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${statusMeta.color}`}
//           >
//             {statusMeta.label}
//           </span>
//         </div>



//         {/* Content */}
//         <div className="p-5 flex flex-col flex-grow">
//           {/* Header */}
//           <div className="flex items-start justify-between mb-2">
//             <h3 className="font-semibold text-gray-800 truncate">
//               {property.property_name}
//             </h3>
//             <span
//               className={`text-xs px-2 py-1 rounded-full ${statusMeta.color}`}
//             >
//               {statusMeta.label}
//             </span>
//           </div>

//           {/* Location */}
//           <p className="text-sm text-gray-600">
//             {property.city}, {property.state}
//           </p>

//           {/* Sharing summary */}
//           <p className="text-sm text-gray-600 mt-1">
//             {property.sharing_options?.length || 0} sharing option
//             {property.sharing_options?.length === 1 ? "" : "s"}
//           </p>

//           {/* Actions */}
//           <div className="mt-auto pt-4">
//             <div className="flex items-center justify-between gap-2">
//               {/* View */}
//               <button
//                 onClick={() => window.location.href = `/owner/properties/${property.id}?mode=view`}
//                 className="flex-1 text-sm border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 rounded-xl transition"
//               >
//                 View
//               </button>

//               {/* Edit */}
//               {(property.status === "DRAFT" || property.status === "REJECTED") && (
//                 <button
//                   onClick={onEdit}
//                   className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition"
//                 >
//                   Edit
//                 </button>
//               )}
//             </div>

//             {/* Submit */}
//             {(property.status === "DRAFT" || property.status === "REJECTED") && (
//               <button
//                 onClick={onSubmit}
//                 className="w-full mt-2 text-sm bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition"
//               >
//                 Submit for Review
//               </button>
//             )}

//             {/* Toggle */}
//             {(property.status === "ACTIVE" ||
//               property.status === "INACTIVE" ||
//               property.status === "APPROVED") && (
//                 <button
//                   onClick={onToggle}
//                   className="w-full mt-2 text-sm bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-xl transition"
//                 >
//                   {property.status === "ACTIVE"
//                     ? "Disable Property"
//                     : "Enable Property"}
//                 </button>
//               )}
//           </div>

//         </div>
//       </div>

//       {/* Rejection Reason Modal */}
//       {showReason && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
//           <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">
//               Rejection Reason
//             </h3>
//             <p className="text-sm text-gray-700 mb-6">
//               {property.rejection_reason}
//             </p>

//             <div className="flex justify-end">
//               <button
//                 onClick={() => setShowReason(false)}
//                 className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm transition"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// import { useNavigate } from "react-router-dom";

// const STATUS_META = {
//   DRAFT: { label: "Draft", badge: "bg-secondary-subtle text-secondary" },
//   SUBMITTED: { label: "Under Review", badge: "bg-warning-subtle text-warning" },
//   REJECTED: { label: "Rejected", badge: "bg-danger-subtle text-danger" },
//   APPROVED: { label: "Approved", badge: "bg-primary-subtle text-primary" },
//   ACTIVE: { label: "Live", badge: "bg-success-subtle text-success" },
//   INACTIVE: { label: "Hidden", badge: "bg-secondary text-white" },
// };

// export default function PropertyCard({
//   property,
//   onEdit,
//   onToggle,
//   onSubmit,
//   onPreview,
// }) {
//   const navigate = useNavigate();
//   const status = STATUS_META[property.status];

//   return (
//     <div
//       onClick={onPreview}
//       className="card h-100 shadow-sm border cursor-pointer"
//     >
//       {/* Image */}
//       <div className="position-relative" style={{ height: "190px" }}>
//         {property.images?.length > 0 ? (
//           <img
//             src={property.images[0].image}
//             alt={property.property_name}
//             className="w-100 h-100 object-fit-cover"
//           />
//         ) : (
//           <div className="h-100 d-flex align-items-center justify-content-center text-muted">
//             No image
//           </div>
//         )}

//         {/* Status */}
//         <span
//           className={`badge position-absolute top-0 end-0 m-2 ${status.badge}`}
//         >
//           {status.label}
//         </span>
//       </div>

//       {/* Content */}
//       <div className="card-body d-flex flex-column">
//         <h6 className="fw-semibold text-truncate mb-1">
//           {property.property_name}
//         </h6>

//         <p className="text-muted small mb-1">
//           {property.city}, {property.state}
//         </p>

//         <p className="text-muted small mb-3">
//           {property.sharing_options?.length || 0} sharing option
//           {property.sharing_options?.length === 1 ? "" : "s"}
//         </p>

//         {/* Actions */}
//         <div className="mt-auto d-grid gap-2">
//           {(property.status === "DRAFT" ||
//             property.status === "REJECTED") && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onEdit();
//               }}
//               className="btn btn-primary btn-sm"
//             >
//               Edit Listing
//             </button>
//           )}

//           {(property.status === "DRAFT" ||
//             property.status === "REJECTED") && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onSubmit();
//               }}
//               className="btn btn-success btn-sm"
//             >
//               Submit for Review
//             </button>
//           )}

//           {(property.status === "ACTIVE" ||
//             property.status === "INACTIVE" ||
//             property.status === "APPROVED") && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onToggle();
//               }}
//               className="btn btn-dark btn-sm"
//             >
//               {property.status === "ACTIVE"
//                 ? "Hide Listing"
//                 : "Make Listing Live"}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


const STATUS_META = {
  DRAFT: { label: "Draft", badge: "bg-secondary-subtle text-secondary" },
  SUBMITTED: { label: "Under Review", badge: "bg-warning-subtle text-warning" },
  REJECTED: { label: "Rejected", badge: "bg-danger-subtle text-danger" },
  APPROVED: { label: "Approved", badge: "bg-primary-subtle text-primary" },
  ACTIVE: { label: "Live", badge: "bg-success-subtle text-success" },
  INACTIVE: { label: "Hidden", badge: "bg-success-subtle text-success" },
};

export default function PropertyCard({
  property,
  onView,
  onEdit,
  onToggle,
  onDelete,
}) {

  const status = STATUS_META[property.status];

  return (
    <div className="card h-100 shadow-sm border">
      {/* Image */}
      <div className="position-relative" style={{ height: "190px" }}>
        {property.images?.length > 0 ? (
          <img
            src={property.images[0].image}
            alt={property.property_name}
            className="w-100 h-100 object-fit-cover"
          />
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center text-muted">
            No image
          </div>
        )}

        {/* Status badge */}
        <span
          className={`badge position-absolute top-0 end-0 m-2 ${status.badge}`}
        >
          {status.label}
        </span>
      </div>

      {/* Content */}
      <div className="card-body d-flex flex-column">
        <h6 className="fw-semibold text-truncate mb-1">
          {property.property_name}
        </h6>

        <p className="text-muted small mb-1">
          {property.city}, {property.state}
        </p>


        {/* Actions */}
        <div className="mt-auto d-grid gap-2">
          {/* VIEW */}
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={onView}
          >
            View
          </button>

          {/* EDIT */}
          {property.status !== "SUBMITTED" && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onEdit}
            >
              Edit
            </button>
          )}


          {/* ENABLE / DISABLE */}
          {(property.status === "ACTIVE" ||
            property.status === "INACTIVE" ||
            property.status === "APPROVED") && (
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={onToggle}
              >
                {property.status === "ACTIVE"
                  ? "Disable Listing"
                  : "Enable Listing"}
              </button>
            )}

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={onDelete}
          >
            Delete Permanently
          </button>

        </div>
      </div>
    </div>
  );
}
