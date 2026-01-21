/* =========================================================
   MAP-BASED LOCATION STEP (BOOTSTRAP)
   — currently commented, ready for future enable
========================================================= */

// import { useEffect, useRef, useState } from "react";

// export default function LocationStep({
//   property,
//   onSave,
// }) {
//   const mapRef = useRef(null);
//   const searchRef = useRef(null);
//   const markerRef = useRef(null);

//   const [form, setForm] = useState({
//     address_text: "",
//     area: "",
//     city: "",
//     state: "",
//     pincode: "",
//     latitude: null,
//     longitude: null,
//   });

//   const [error, setError] = useState("");

//   /* Populate on edit */
//   useEffect(() => {
//     if (!property) return;

//     setForm({
//       address_text: property.address_text || "",
//       area: property.area || "",
//       city: property.city || "",
//       state: property.state || "",
//       pincode: property.pincode || "",
//       latitude: property.latitude || null,
//       longitude: property.longitude || null,
//     });
//   }, [property]);

//   /* Initialize map */
//   useEffect(() => {
//     if (!window.google) return;

//     const center = form.latitude
//       ? { lat: Number(form.latitude), lng: Number(form.longitude) }
//       : { lat: 12.9716, lng: 77.5946 }; // fallback

//     const map = new window.google.maps.Map(mapRef.current, {
//       center,
//       zoom: 15,
//     });

//     const marker = new window.google.maps.Marker({
//       position: center,
//       map,
//       draggable: true,
//     });

//     marker.addListener("dragend", () => {
//       const pos = marker.getPosition();
//       updateFromCoords(pos.lat(), pos.lng());
//     });

//     markerRef.current = marker;

//     const autocomplete = new window.google.maps.places.Autocomplete(
//       searchRef.current,
//       { types: ["geocode"] }
//     );

//     autocomplete.addListener("place_changed", () => {
//       const place = autocomplete.getPlace();
//       if (!place.geometry) return;

//       const lat = place.geometry.location.lat();
//       const lng = place.geometry.location.lng();

//       map.panTo({ lat, lng });
//       marker.setPosition({ lat, lng });
//       updateFromPlace(place, lat, lng);
//     });
//   }, []);

//   const updateFromCoords = (lat, lng) => {
//     const geocoder = new window.google.maps.Geocoder();

//     geocoder.geocode({ location: { lat, lng } }, (results, status) => {
//       if (status !== "OK" || !results[0]) return;
//       updateFromPlace(results[0], lat, lng);
//     });
//   };

//   const updateFromPlace = (place, lat, lng) => {
//     const components = {};
//     place.address_components.forEach((c) => {
//       c.types.forEach((t) => {
//         components[t] = c.long_name;
//       });
//     });

//     setForm({
//       address_text: place.formatted_address || "",
//       area: components.sublocality || components.locality || "",
//       city:
//         components.locality ||
//         components.administrative_area_level_2 || "",
//       state: components.administrative_area_level_1 || "",
//       pincode: components.postal_code || "",
//       latitude: lat,
//       longitude: lng,
//     });
//   };

//   const useCurrentLocation = () => {
//     if (!navigator.geolocation) return;

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const lat = pos.coords.latitude;
//         const lng = pos.coords.longitude;

//         markerRef.current.setPosition({ lat, lng });
//         updateFromCoords(lat, lng);
//       },
//       () => setError("Unable to fetch current location.")
//     );
//   };

//   const handleSave = async () => {
//     if (!form.city) {
//       setError("City is mandatory.");
//       return;
//     }

//     try {
//       await onSave(form);
//       setError("");
//     } catch {
//       setError("Unable to save location.");
//     }
//   };

//   return (
//     <div className="d-flex flex-column gap-4">

//       <input
//         ref={searchRef}
//         type="text"
//         className="form-control"
//         placeholder="Search address"
//       />

//       <div
//         ref={mapRef}
//         className="border rounded"
//         style={{ height: "320px" }}
//       />

//       <button
//         type="button"
//         onClick={useCurrentLocation}
//         className="btn btn-link px-0"
//       >
//         Use current location
//       </button>

//       <div className="border rounded p-3 bg-light small">
//         <p><strong>Address:</strong> {form.address_text}</p>
//         <p><strong>Area:</strong> {form.area}</p>
//         <p><strong>City:</strong> {form.city}</p>
//         <p><strong>State:</strong> {form.state}</p>
//         <p><strong>Pincode:</strong> {form.pincode}</p>
//       </div>

//       {error && (
//         <div className="alert alert-danger py-2 mb-0">
//           {error}
//         </div>
//       )}

//       <div className="d-flex justify-content-end">
//         <button
//           type="button"
//           onClick={handleSave}
//           className="btn btn-primary"
//         >
//           Save & Continue
//         </button>
//       </div>

//     </div>
//   );
// }


/* =========================================================
   MANUAL LOCATION STEP (ACTIVE — BOOTSTRAP)
========================================================= */

import { useEffect, useState } from "react";

export default function LocationStep({ property, onSave }) {
  const [form, setForm] = useState({
    address_text: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
  });

  const [error, setError] = useState("");

  /* Populate on edit */
  useEffect(() => {
    if (!property) return;

    setForm({
      address_text: property.address_text || "",
      area: property.area || "",
      city: property.city || "",
      state: property.state || "",
      pincode: property.pincode || "",
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
    });
  }, [property]);

  const handleSave = async () => {
    if (!form.city) {
      setError("City is mandatory.");
      return;
    }

    try {
      await onSave({
        ...form,
        latitude: form.latitude ?? 0,
        longitude: form.longitude ?? 0,
      });
      setError("");
    } catch {
      setError("Unable to save location.");
    }
  };

  return (
    <div className="d-flex flex-column gap-4">

      <div className="row g-3">
        <Input
          label="Address"
          value={form.address_text}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, address_text: v }))
          }
        />
        <Input
          label="Area / Locality"
          value={form.area}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, area: v }))
          }
        />
        <Input
          label="City"
          value={form.city}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, city: v }))
          }
        />
        <Input
          label="State"
          value={form.state}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, state: v }))
          }
        />
        <Input
          label="Pincode"
          value={form.pincode}
          onChange={(v) =>
            setForm((prev) => ({ ...prev, pincode: v }))
          }
        />
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-0">
          {error}
        </div>
      )}

      <div className="d-flex justify-content-end">
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
        >
          Save & Continue
        </button>
      </div>

    </div>
  );
}

/* -----------------------------------
Reusable Input (Bootstrap)
----------------------------------- */

function Input({ label, value, onChange }) {
  return (
    <div className="col-12 col-md-6">
      <label className="form-label">
        {label}
      </label>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
