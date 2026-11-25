import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AgentProfile, AuthUser, Task, TaskPriority } from '../../types';
import {
  reverseGeocodeLocation,
  searchPlaceSuggestions,
  PlaceSuggestion,
  calculateHaversineDistance,
  formatDistance,
} from '../../utils/geo';
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
  ClipboardList,
  Clock,
  UserCheck,
  Phone,
  XCircle,
  Wrench,
  RotateCcw,
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
  tasks?: Task[];
  agents?: AgentProfile[];
  currentUser?: AuthUser | null;
  onCreateTask: (task: Task) => Promise<Task | void> | void;
  onUpdateTaskStatus?: (taskId: string, status: Task['status']) => void;
  onNavigateToAdmin: () => void;
}

const REQUEST_STEPS: Array<{ key: Task['status']; label: string }> = [
  { key: 'pending', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export const TaskRequesterView: React.FC<TaskRequesterViewProps> = ({
  tasks = [],
  agents = [],
  currentUser = null,
  onCreateTask,
  onUpdateTaskStatus,
  onNavigateToAdmin,
}) => {
  const isAdmin = currentUser?.role === 'administrator';

  const myTasks = isAdmin
    ? tasks
    : tasks.filter((t) => {
        if (!currentUser) return false;
        if (t.requesterId && String(t.requesterId) === String(currentUser.id)) return true;
        return Boolean(
          currentUser.fullName &&
            t.requesterName &&
            t.requesterName.toLowerCase() === currentUser.fullName.toLowerCase()
        );
      });

  const [portalTab, setPortalTab] = useState<'my-requests' | 'new-order'>(() =>
    currentUser?.role === 'requester' && tasks.length > 0 ? 'my-requests' : 'new-order'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed' | 'cancelled'>('all');
  const [ticketSearch, setTicketSearch] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location State (defaults to Nairobi center coordinates)
  const [lat, setLat] = useState<number>(-1.2921);
  const [lng, setLng] = useState<number>(36.8219);
  const [addressName, setAddressName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const skipNextAutocompleteRef = useRef(false);

  // Requester Info (pre-filled from signed-in user when available)
  const [requesterName, setRequesterName] = useState(() => currentUser?.fullName || '');
  const [requesterPhone, setRequesterPhone] = useState(() => currentUser?.phone || '');
  const [submittedTask, setSubmittedTask] = useState<Task | null>(null);

  const filteredRequests = myTasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? t.status === 'pending' || t.status === 'assigned' || t.status === 'in_progress'
        : t.status === statusFilter;
    const q = ticketSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.location?.addressName || '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

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

  // Close autocomplete dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced typeahead recommendations as user types a location
  useEffect(() => {
    if (skipNextAutocompleteRef.current) {
      skipNextAutocompleteRef.current = false;
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      setIsSuggesting(false);
      return;
    }

    const controller = new AbortController();
    setIsSuggesting(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaceSuggestions(trimmed, 6, controller.signal);
        if (controller.signal.aborted) return;
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    skipNextAutocompleteRef.current = true;
    setLat(place.lat);
    setLng(place.lng);
    setAddressName(place.fullName);
    setSearchQuery(place.fullName);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setGpsStatusMessage(`Pinned location: ${place.fullName}`);
  };

  // Handler for resetting the New Work Order form
  const handleClearOrderForm = () => {
    setTitle('');
    setDescription('');
    setPriority('high');
    setLat(-1.2921);
    setLng(36.8219);
    setAddressName('');
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setGpsStatusMessage(null);
    setRequesterName(currentUser?.fullName || '');
    setRequesterPhone(currentUser?.phone || '');
  };

  // Handler for explicit Address Search button / Enter submit
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      handleSelectSuggestion(suggestions[highlightedIndex]);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const results = await searchPlaceSuggestions(trimmed, 5);
      if (results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        setGpsStatusMessage('No matching place found. Try another landmark or click on the map.');
      }
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
      requesterName: requesterName.trim() || currentUser?.fullName || 'Task Requester',
      requesterPhone: requesterPhone.trim() || currentUser?.phone || '+254 700 000 000',
      requesterId: currentUser?.id ? String(currentUser.id) : undefined,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deadline: 'Within 4 hours',
      estimatedHours: 2.0,
    };

    try {
      const saved = await onCreateTask(newTask);
      setSubmittedTask(saved || newTask);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRequestsCount = myTasks.filter(
    (t) => t.status === 'pending' || t.status === 'assigned' || t.status === 'in_progress'
  ).length;
  const completedCount = myTasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Portal Header + Sub-Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isAdmin ? 'Work Order Intake & Request Log' : 'Client Work Order Portal'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'Log a new field incident or inspect submitted work order progress'
                : 'Submit new field service requests, track dispatch status, and view assigned technicians'}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPortalTab('my-requests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              portalTab === 'my-requests'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAdmin ? 'All Requests' : 'My Requests'} ({myTasks.length})</span>
            {openRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                {openRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPortalTab('new-order')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              portalTab === 'new-order'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {portalTab === 'my-requests' ? (
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <div className="text-slate-500 font-semibold text-[11px]">Total Requests</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{myTasks.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <div className="text-amber-700 font-semibold text-[11px]">Pending Dispatch</div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {myTasks.filter((t) => t.status === 'pending').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <div className="text-blue-700 font-semibold text-[11px]">Technician Active</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {myTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <div className="text-emerald-700 font-semibold text-[11px]">Completed</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{completedCount}</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold border transition ${
                    statusFilter === pill.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search requests or location..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Requests Feed */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Matching Work Orders</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {myTasks.length === 0
                    ? 'You have not submitted any work orders yet. Log your first field request below.'
                    : 'No requests match your active filter criteria.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPortalTab('new-order')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Work Order</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((task) => {
                const assignedAgent = task.assignedAgentId
                  ? agents.find((a) => a.id === task.assignedAgentId)
                  : undefined;
                const stepIdx = REQUEST_STEPS.findIndex((s) => s.key === task.status);
                const distanceKm =
                  assignedAgent &&
                  calculateHaversineDistance(
                    task.location.lat,
                    task.location.lng,
                    assignedAgent.currentLocation.lat,
                    assignedAgent.currentLocation.lng
                  );

                return (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              task.priority === 'critical'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {task.priority}
                          </span>
                          {task.category && task.category !== 'General Field Service' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              {task.category}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 leading-relaxed">{task.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase inline-flex items-center gap-1 ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : task.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : task.status === 'assigned'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : task.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-500 border border-slate-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{task.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    {task.status === 'cancelled' ? (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>This work order was cancelled prior to completion.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {REQUEST_STEPS.map((step, idx) => {
                          const reached = stepIdx >= idx;
                          return (
                            <div key={step.key} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition ${
                                  reached
                                    ? task.status === 'completed'
                                      ? 'bg-emerald-500'
                                      : 'bg-blue-600'
                                    : 'bg-slate-200'
                                }`}
                              />
                              <div
                                className={`text-[10px] font-semibold ${
                                  reached ? 'text-slate-800' : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Location & Assigned Technician Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {task.location.addressName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)} • Logged {task.createdAt}
                          </div>
                        </div>
                      </div>

                      {assignedAgent ? (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <UserCheck className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                                <span>{assignedAgent.name}</span>
                                <Wrench className="w-3 h-3 text-emerald-700 shrink-0" />
                              </div>
                              <div className="text-[10px] text-slate-600 truncate">
                                {assignedAgent.title}
                                {distanceKm !== undefined ? ` • ${formatDistance(distanceKm)} away` : ''}
                              </div>
                            </div>
                          </div>
                          {assignedAgent.phone && (
                            <a
                              href={`tel:${assignedAgent.phone}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-emerald-200 text-emerald-800 font-semibold text-[10px] hover:bg-emerald-50 shrink-0"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{assignedAgent.phone}</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 text-slate-500">
                          <span>
                            {task.status === 'cancelled'
                              ? 'No technician assigned'
                              : 'Awaiting dispatcher technician assignment'}
                          </span>
                          {task.status === 'pending' && onUpdateTaskStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateTaskStatus(task.id, 'cancelled')}
                              className="px-2.5 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] inline-flex items-center gap-1 shrink-0 transition"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Cancel Request</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
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

            <div className="flex justify-center gap-2.5 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSubmittedTask(null);
                  setTitle('');
                  setDescription('');
                  setAddressName('');
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setGpsStatusMessage(null);
                  setRequesterName(currentUser?.fullName || '');
                  setRequesterPhone(currentUser?.phone || '');
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Create Another Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedTask(null);
                  setPortalTab('my-requests');
                }}
                className="px-4 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'View Submitted Requests' : 'Track My Request'}</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onNavigateToAdmin}
                  className="px-4 py-1.5 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>View on Operational Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
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

              {/* Search Bar with Live Place Recommendations */}
              <div ref={searchWrapperRef} className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' && suggestions.length > 0) {
                          e.preventDefault();
                          setShowSuggestions(true);
                          setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
                        } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
                          e.preventDefault();
                          setShowSuggestions(true);
                          setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddressSearch(e);
                        }
                      }}
                      placeholder="Search landmark, estate, or road (e.g. Westlands, Upper Hill, Yaya Centre, Roysambu...)"
                      className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    {isSuggesting && (
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                    )}
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

                {showSuggestions && suggestions.length > 0 && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 mt-1 z-[1200] bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100"
                  >
                    {suggestions.map((place, idx) => (
                      <li key={place.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(place);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-start gap-2 text-xs transition ${
                            idx === highlightedIndex
                              ? 'bg-blue-50 text-blue-900'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{place.label}</div>
                            {place.secondaryText && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {place.secondaryText}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClearOrderForm}
                className="px-4 py-2.5 rounded-md font-semibold border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 flex items-center gap-1.5 transition text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>
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
      )}
    </div>
  );
};
