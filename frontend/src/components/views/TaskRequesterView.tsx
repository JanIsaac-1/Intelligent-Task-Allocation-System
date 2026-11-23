import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Task, TaskPriority } from '../../types';
import { reverseGeocodeLocation } from '../../utils/geo';
import {
  Send,
  MapPin,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Crosshair,
  Search,
  ExternalLink,
  Loader2,
  Navigation,
} from 'lucide-react';

// Custom teardrop pin icon for task target
const targetPinIcon = L.divIcon({
  className: 'custom-task-target-pin',
  html: `
    <div style="
      background-color: #2563eb;
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
    ">
      <div style="
        transform: rotate(45deg);
        width: 10px;
        height: 10px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Map controller to synchronize center & invalidate size
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  const targetLat = center?.[0];
  const targetLng = center?.[1];

  useEffect(() => {
    if (targetLat !== undefined && targetLng !== undefined && !isNaN(targetLat) && !isNaN(targetLng)) {
      map.setView([targetLat, targetLng], map.getZoom(), { animate: true });
    }
  }, [targetLat, targetLng, map]);

  return null;
}

// Map click listener to drop pins interactively
function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(
        parseFloat(e.latlng.lat.toFixed(5)),
        parseFloat(e.latlng.lng.toFixed(5))
      );
    },
  });
  return null;
}

interface TaskRequesterViewProps {
  onCreateTask: (task: Task) => Promise<Task | void> | void;
  onNavigateToAdmin: () => void;
}

export const TaskRequesterView: React.FC<TaskRequesterViewProps> = ({
  onCreateTask,
  onNavigateToAdmin,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location State (defaults to Nairobi center coordinates)
  const [lat, setLat] = useState<number>(-1.2921);
  const [lng, setLng] = useState<number>(36.8219);
  const [addressName, setAddressName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // Requester Info
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [submittedTask, setSubmittedTask] = useState<Task | null>(null);

  // Reverse geocode to resolve human-readable address from coordinates
  const reverseGeocode = async (targetLat: number, targetLng: number) => {
    const coordLabel = `Pinned Site (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})`;
    setAddressName(coordLabel);
    const resolved = await reverseGeocodeLocation(targetLat, targetLng);
    setAddressName(resolved);
  };

  // Handler when map is clicked
  const handleMapClick = async (clickedLat: number, clickedLng: number) => {
    setLat(clickedLat);
    setLng(clickedLng);
    setGpsStatusMessage(null);
    await reverseGeocode(clickedLat, clickedLng);
  };

  // Handler for "Use Current GPS Location"
  const handleUseCurrentGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsDetectingGps(true);
      setGpsStatusMessage('Acquiring hardware GPS fix...');

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const liveLat = parseFloat(pos.coords.latitude.toFixed(5));
          const liveLng = parseFloat(pos.coords.longitude.toFixed(5));
          setLat(liveLat);
          setLng(liveLng);
          setIsDetectingGps(false);
          setGpsStatusMessage(`Device GPS acquired (±${Math.round(pos.coords.accuracy || 10)}m)`);
          await reverseGeocode(liveLat, liveLng);
        },
        (err) => {
          setIsDetectingGps(false);
          setGpsStatusMessage(`GPS error: ${err.message}. Click on the map or type an address.`);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setGpsStatusMessage('Geolocation not supported by this browser.');
    }
  };

  // Handler for Address Search (Nominatim with Photon fallback)
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const queryWithCountry = searchQuery.toLowerCase().includes('kenya')
        ? searchQuery
        : `${searchQuery}, Nairobi, Kenya`;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryWithCountry
          )}&limit=1`
        );

        if (res.ok) {
          const results = await res.json();
          if (results && results.length > 0) {
            const item = results[0];
            const newLat = parseFloat(parseFloat(item.lat).toFixed(5));
            const newLng = parseFloat(parseFloat(item.lon).toFixed(5));
            setLat(newLat);
            setLng(newLng);
            const parts = item.display_name.split(',');
            const concise = parts.slice(0, 3).join(',').trim();
            setAddressName(concise || item.display_name);
            setGpsStatusMessage(`Found location: ${concise}`);
            return;
          }
        }
      } catch {
        // Fall through to Photon
      }

      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(queryWithCountry)}&limit=1`
      );
      if (photonRes.ok) {
        const pData = await photonRes.json();
        const feat = pData?.features?.[0];
        if (feat?.geometry?.coordinates) {
          const newLng = parseFloat(Number(feat.geometry.coordinates[0]).toFixed(5));
          const newLat = parseFloat(Number(feat.geometry.coordinates[1]).toFixed(5));
          const props = feat.properties || {};
          const parts = [props.name || props.street, props.locality || props.district, props.city || props.state].filter(Boolean);
          const concise = Array.from(new Set(parts)).slice(0, 3).join(', ') || searchQuery;
          setLat(newLat);
          setLng(newLng);
          setAddressName(concise);
          setGpsStatusMessage(`Found location: ${concise}`);
          return;
        }
      }

      setGpsStatusMessage('No matching place found. Try another landmark or click on the map.');
    } catch {
      setGpsStatusMessage('Search failed. Check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || isSubmitting) return;

    setIsSubmitting(true);
    const finalAddress = addressName.trim() || `Site Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    const newTask: Task = {
      id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      category: '',
      requiredSkills: [],
      location: {
        lat,
        lng,
        addressName: finalAddress,
      },
      priority,
      status: 'pending',
      requesterName,
      requesterPhone,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deadline: '2026-08-19 16:00',
      estimatedHours: 2.0,
    };

    try {
      const saved = await onCreateTask(newTask);
      setSubmittedTask(saved || newTask);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Field Work Order</h2>
              <p className="text-xs text-slate-500">
                Log a task request with real GPS coordinates to be routed and assigned to available field agents
              </p>
            </div>
          </div>
        </div>

        {submittedTask ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Work Order Created Successfully
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Work order <strong className="text-slate-900">&ldquo;{submittedTask.title}&rdquo;</strong> has been logged in the dispatch queue.
              </p>
              {submittedTask.category && submittedTask.category !== 'General Field Service' && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] text-blue-800 font-semibold">
                  <span>AI-Detected Trade Domain: {submittedTask.category}</span>
                </div>
              )}
              <div className="mt-2 text-xs text-slate-600 flex items-center justify-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {submittedTask.location.addressName} ({submittedTask.location.lat.toFixed(4)}, {submittedTask.location.lng.toFixed(4)})
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  setSubmittedTask(null);
                  setTitle('');
                  setDescription('');
                  setAddressName('');
                  setRequesterName('');
                  setRequesterPhone('');
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Create Another Order
              </button>
              <button
                onClick={onNavigateToAdmin}
                className="px-4 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <span>View on Operational Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Task Title */}
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">
                Work Order Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fiber link severed during road maintenance near junction"
                className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold block">
                  Problem Description (Free Text)
                </label>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  AI Auto-Detects Trade & Skills
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened in plain words (e.g., symptoms, equipment, error lights). Our NLP model automatically matches the right specialist..."
                className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Priority Level */}
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium text-xs sm:text-sm"
              >
                <option value="critical">Critical (Immediate Emergency)</option>
                <option value="high">High (Service Disruption)</option>
                <option value="medium">Medium (Standard Routine)</option>
                <option value="low">Low (Preventive Scheduled)</option>
              </select>
            </div>

            {/* ============================================================ */}
            {/* INTERACTIVE GEOGRAPHIC LOCATION PICKER */}
            {/* ============================================================ */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900">Incident Target Location</span>
                  <span className="text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    disabled={isDetectingGps}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white shadow-xs transition"
                    title="Detect and use current physical device GPS location"
                  >
                    {isDetectingGps ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>{isDetectingGps ? 'Detecting GPS...' : 'Use Current Device GPS'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-white border border-slate-200 transition"
                    title="Verify coordinates on Google Maps"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Verify</span>
                  </a>
                </div>
              </div>

              {gpsStatusMessage && (
                <div className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3 shrink-0" />
                  <span>{gpsStatusMessage}</span>
                </div>
              )}

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddressSearch(e);
                      }
                    }}
                    placeholder="Search landmark, estate, or road (e.g. Westlands, Upper Hill, Yaya Centre, Roysambu...)"
                    className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition"
                >
                  {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  <span>Search</span>
                </button>
              </div>

              {/* Interactive Mini Map */}
              <div className="relative h-56 rounded-lg overflow-hidden border border-slate-300 shadow-inner bg-slate-200">
                <MapContainer
                  center={[lat, lng]}
                  zoom={13}
                  scrollWheelZoom={true}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenterController center={[lat, lng]} />
                  <MapClickHandler onSelect={handleMapClick} />
                  <Marker position={[lat, lng]} icon={targetPinIcon}>
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-blue-700 font-bold block">
                          {addressName || 'Target Incident Site'}
                        </strong>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
                <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-slate-600 font-medium shadow-xs border border-slate-200 pointer-events-none">
                  💡 Click anywhere on the map to place the work order pin
                </div>
              </div>

              {/* Editable Address Name & Coordinate Precision */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="sm:col-span-1">
                  <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                    Site / Address Description
                  </label>
                  <input
                    type="text"
                    value={addressName}
                    onChange={(e) => setAddressName(e.target.value)}
                    placeholder="Auto-filled on map click or type landmark (e.g. Waiyaki Way, Westlands)"
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                    Latitude (°N/°S)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                    Longitude (°E/°W)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Requester Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">On-Site Contact Person</label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Contact Phone</label>
                <input
                  type="text"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-md font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white flex items-center gap-1.5 shadow-xs transition text-xs"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Analyzing & Submitting...' : 'Submit Work Order'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
