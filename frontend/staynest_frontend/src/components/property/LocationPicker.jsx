import { useEffect, useRef, useState } from "react";

export default function LocationPicker({ property, onSave }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [form, setForm] = useState({
    address_text: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [locationSet, setLocationSet] = useState(false);

  useEffect(() => {
    if (!property) return;
    const lat = property.latitude ? parseFloat(property.latitude) : null;
    const lng = property.longitude ? parseFloat(property.longitude) : null;
    setForm({
      address_text: property.address_text || "",
      area: property.area || "",
      city: property.city || "",
      state: property.state || "",
      pincode: property.pincode || "",
      latitude: lat,
      longitude: lng,
    });
    if (lat && lng) setLocationSet(true);
  }, [property]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const lat = property?.latitude ? parseFloat(property.latitude) : 10.8505;
      const lng = property?.longitude ? parseFloat(property.longitude) : 76.2711;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: property?.latitude ? 16 : 12,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (property?.latitude && property?.longitude) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }

      map.on("click", (e) => {
        placeMarker(e.latlng.lat, e.latlng.lng, L, map);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const placeMarker = (lat, lng, L, map) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }
    setLocationSet(true);
  };

  const reverseGeocode = async (lat, lng) => {
    setForm((prev) => ({ 
  ...prev, 
  latitude: parseFloat(lat.toFixed(6)), 
  longitude: parseFloat(lng.toFixed(6)) 
}));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (!data.address) return;
      const a = data.address;
      setForm((prev) => ({
        ...prev,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        address_text: data.display_name || "",
        area: a.suburb || a.neighbourhood || a.village || a.county || "",
        city: a.city || a.town || a.district || a.county || "",
        state: a.state || "",
        pincode: a.postcode || "",
      }));
    } catch {
      // coordinates still saved even if reverse geocode fails
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) setError("No results found. Try a different search.");
    } catch {
      setError("Search failed. Click on the map instead.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.setView([lat, lng], 17);
      placeMarker(lat, lng, L, map);
      reverseGeocode(lat, lng);
    });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
    setError("");
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        import("leaflet").then((L) => {
          const map = mapInstanceRef.current;
          if (!map) return;
          map.setView([lat, lng], 17);
          placeMarker(lat, lng, L, map);
          reverseGeocode(lat, lng);
        });
      },
      () => setError("Unable to get your location.")
    );
  };

  const handleSave = async () => {
    if (!form.latitude || !form.longitude) {
      setError("Please click on the map to set a location first.");
      return;
    }
    if (!form.city) {
      setError("City is required. Please fill in the city field.");
      return;
    }
    try {
      await onSave(form);
      setError("");
    } catch {
      setError("Unable to save location.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search your property address..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={searching}>
            {searching ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleCurrentLocation} title="Use my location">
            <i className="bi bi-geo-alt-fill" />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 9999,
            maxHeight: 220, overflowY: "auto",
          }}>
            {searchResults.map((r) => (
              <div key={r.place_id} onClick={() => handleSelectResult(r)}
                style={{
                  padding: "10px 14px", cursor: "pointer", fontSize: "0.84rem",
                  color: "#374151", borderBottom: "1px solid #f1f5f9",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                <i className="bi bi-geo-alt me-2" style={{ color: "#10b981" }} />
                {r.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ height: 340, borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }} />

      <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: 0 }}>
        <i className="bi bi-info-circle me-1" />
        Click anywhere on the map to pin location, or drag the marker to adjust.
      </p>

      {/* Auto-filled address fields */}
      {locationSet && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#10b981", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <i className="bi bi-check-circle me-1" />Location auto-filled — edit if needed
          </p>
          <div className="row g-2">
            <div className="col-12">
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: 3 }}>Full Address</label>
              <textarea rows={2} className="form-control form-control-sm" value={form.address_text}
                onChange={(e) => setForm((p) => ({ ...p, address_text: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: 3 }}>Area / Locality</label>
              <input type="text" className="form-control form-control-sm" value={form.area}
                onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: 3 }}>
                City <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="text" className="form-control form-control-sm" value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: 3 }}>State</label>
              <input type="text" className="form-control form-control-sm" value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: 3 }}>Pincode</label>
              <input type="text" className="form-control form-control-sm" value={form.pincode}
                onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} />
            </div>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: "10px 0 0" }}>
            <i className="bi bi-pin-map me-1" style={{ color: "#10b981" }} />
            {form.latitude?.toFixed(6)}, {form.longitude?.toFixed(6)}
          </p>
        </div>
      )}

      {error && <div className="alert alert-danger py-2 mb-0" style={{ fontSize: "0.84rem" }}>{error}</div>}

      <div className="d-flex justify-content-end">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Save Location
        </button>
      </div>

    </div>
  );
}