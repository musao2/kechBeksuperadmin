import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Custom Leaflet marker icon fix
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker
      position={position}
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    >
      <Popup>
        <div className="text-xs font-semibold text-slate-800">
          Stansiya joylashuvi<br />
          <span className="text-[10px] text-slate-500 font-mono">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

export default function StationMapPicker({ lat, lng, onChangeLocation }) {
  const [position, setPosition] = useState([lat || 41.3253226, lng || 69.2870051]);

  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handlePositionChange = (newPos) => {
    setPosition(newPos);
    if (onChangeLocation) {
      onChangeLocation(newPos[0], newPos[1]);
    }
  };

  const setTashkentCenter = () => {
    const defaultPos = [41.311081, 69.240562];
    handlePositionChange(defaultPos);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#0f7b4c]" />
          Xaritadagi joylashuv (Koordinatalar)
        </label>
        <button
          type="button"
          onClick={setTashkentCenter}
          className="text-xs font-semibold text-[#0f7b4c] hover:underline flex items-center gap-1"
        >
          <Navigation className="w-3.5 h-3.5" /> Toshkent markaziga o'tish
        </button>
      </div>

      {/* Lat Lng display inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Kenglik (Latitude):</span>
          <input
            type="number"
            step="any"
            value={position[0]}
            onChange={(e) => handlePositionChange([parseFloat(e.target.value) || 0, position[1]])}
            className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
          />
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Uzunlik (Longitude):</span>
          <input
            type="number"
            step="any"
            value={position[1]}
            onChange={(e) => handlePositionChange([position[0], parseFloat(e.target.value) || 0])}
            className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
          />
        </div>
      </div>

      {/* Leaflet Map Frame */}
      <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 shadow-sm">
          💡 Xaritada kerakli nuqtani bosing yoki markerni suring
        </div>
      </div>
    </div>
  );
}
