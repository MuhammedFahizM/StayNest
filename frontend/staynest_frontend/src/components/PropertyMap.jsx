import { useEffect, useRef } from "react";

// Shows a read-only map with property location pin.
// Used in property detail view (both owner view and public browse).

export default function PropertyMap({ latitude, longitude, title }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const lat = latitude ? parseFloat(latitude) : null;
  const lng = longitude ? parseFloat(longitude) : null;

  useEffect(() => {
    if (!lat || !lng) return;
    if (mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false, // better UX on detail pages
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      if (title) {
        marker.bindPopup(`<b>${title}</b>`).openPopup();
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  if (!lat || !lng) return null;

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          height: 260,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      />
      <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "6px 0 0" }}>
        <i className="bi bi-pin-map me-1" />
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  );
}