import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Task, TaskPriority } from '../../types';
import { MASTER_DOMAINS } from '../../data/config';
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

  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);

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
  onCreateTask: (task: Task) => void;
  onNavigateToAdmin: () => void;
}

export const TaskRequesterView: React.FC<TaskRequesterViewProps> = ({
  onCreateTask,
  onNavigateToAdmin,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Task['category']>(MASTER_DOMAINS[0].domain);
  const [requiredSkillsText, setRequiredSkillsText] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');

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
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          const concise = parts.slice(0, 3).join(',').trim();
          setAddressName(concise || data.display_name);
        }
      }
    } catch {
      // offline or rate limited fallback: keep current address
    }
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

  // Handler for Address Search (Nominatim)
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const queryWithCountry = searchQuery.toLowerCase().includes('kenya')
        ? searchQuery
        : `${searchQuery}, Nairobi, Kenya`;

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
        } else {
          setGpsStatusMessage('No matching place found. Try another landmark or click on the map.');
        }
      }
    } catch {
      setGpsStatusMessage('Search failed. Check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const finalAddress = addressName.trim() || `Site Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    const newTask: Task = {
      id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      category,
      requiredSkills: requiredSkillsText
        ? requiredSkillsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [category],
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

    onCreateTask(newTask);
    setSubmittedTask(newTask);
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
                Order <strong className="font-mono text-slate-900">{submittedTask.id}</strong> has been logged in the dispatch queue.
              </p>
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
                  setRequiredSkillsText('');
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
              <label className="text-slate-700 font-semibold mb-1 block">
                Problem Description (Free Text)
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, symptoms, and required equipment. The system will match this with technician profiles..."
                className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold block">Service Domain</label>
                  <span className="text-[11px] text-blue-600 font-semibold">22 Specialized Domains</span>
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setCategory(selected);
                    const domObj = MASTER_DOMAINS.find(d => d.domain === selected);
                    if (domObj && !requiredSkillsText.trim()) {
                      setRequiredSkillsText(domObj.skills.slice(0, 3).join(', '));
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium text-xs sm:text-sm"
                >
                  {MASTER_DOMAINS.map((dom) => (
                    <option key={dom.code} value={dom.domain}>
                      [{dom.code}] {dom.domain}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            {/* Skills with Quick Clickable Chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold block">
                  Required Competencies (comma-separated)
                </label>
                <span className="text-[10px] text-slate-400">Click chips below to add</span>
              </div>
              <input
                type="text"
                value={requiredSkillsText}
                onChange={(e) => setRequiredSkillsText(e.target.value)}
                placeholder="e.g. Fiber optic cable fusion splicing, OTDR fault trace analysis"
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 text-xs sm:text-sm"
              />

              {/* Dynamic Domain Skills Badges */}
              {(() => {
                const activeDom = MASTER_DOMAINS.find(d => d.domain === category);
                if (!activeDom) return null;
                return (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Suggested:</span>
                    {activeDom.skills.map((skill, sIdx) => {
                      const isSelected = requiredSkillsText.toLowerCase().includes(skill.toLowerCase());
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            if (isSelected) return;
                            setRequiredSkillsText(prev => prev ? `${prev}, ${skill}` : skill);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold cursor-default'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
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
                    required
                    value={addressName}
                    onChange={(e) => setAddressName(e.target.value)}
                    placeholder="e.g. Hospital Road, Upper Hill or Waiyaki Way, Westlands"
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
                className="px-5 py-2.5 rounded-md font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Work Order</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
