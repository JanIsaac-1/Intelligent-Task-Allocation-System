import React, { useState, useEffect } from 'react';
import { AgentProfile, Task, AuthUser } from '../../types';
import {
  MapPin,
  CheckCircle2,
  Navigation,
  Phone,
  Clock,
  Radio,
  Battery,
  UserCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Calendar,
  Wrench,
  Award,
  ListTodo,
  History,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface AgentMobileViewProps {
  agents: AgentProfile[];
  tasks: Task[];
  currentUser?: AuthUser | null;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onSimulateGpsMovement: (agentId: string) => void;
  onToggleAvailability: (agentId: string) => void;
}

export const AgentMobileView: React.FC<AgentMobileViewProps> = ({
  agents,
  tasks,
  currentUser,
  onUpdateTaskStatus,
  onSimulateGpsMovement,
  onToggleAvailability,
}) => {
  const getInitialAgentId = () => {
    if (currentUser?.agentProfileId) {
      const match = agents.find((a) => String(a.id) === String(currentUser.agentProfileId));
      if (match) return match.id;
    }
    if (currentUser?.fullName) {
      const first = currentUser.fullName.toLowerCase().split(' ')[0];
      const match = agents.find((a) => a.name.toLowerCase().includes(first));
      if (match) return match.id;
    }
    return agents[0]?.id || '1';
  };

  const [selectedAgentId, setSelectedAgentId] = useState<string>(getInitialAgentId);
  const [activeTab, setActiveTab] = useState<'current' | 'queue' | 'history'>('current');
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);

  useEffect(() => {
    if (currentUser?.agentProfileId) {
      const match = agents.find((a) => String(a.id) === String(currentUser.agentProfileId));
      if (match) setSelectedAgentId(match.id);
    }
  }, [currentUser, agents]);

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const assignedTasks = tasks.filter((t) => t.assignedAgentId === currentAgent?.id);
  
  // Tasks breakdown
  const activeTask = assignedTasks.find((t) => t.status === 'in_progress') || 
                     assignedTasks.find((t) => t.status === 'assigned');
  const queueTasks = assignedTasks.filter((t) => t.status === 'assigned' && t.id !== activeTask?.id);
  const completedTasks = assignedTasks.filter((t) => t.status === 'completed');

  const handleGpsClick = () => {
    if (!currentAgent) return;
    setIsUpdatingGps(true);
    onSimulateGpsMovement(currentAgent.id);
    setTimeout(() => setIsUpdatingGps(false), 600);
  };

  if (!currentAgent) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="font-medium">No technician profile found.</p>
      </div>
    );
  }

  const batteryLevel = currentAgent.batteryLevel ?? 88;

  return (
    <div className="space-y-4">
      {/* Top Banner / Technician Role Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Field Operations Terminal</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Mobile Responsive
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentUser?.role === 'agent'
                ? `Logged in as ${currentAgent.name} • Active Field Session`
                : `Simulating field terminal for: ${currentAgent.name}`}
            </p>
          </div>
        </div>

        {/* Technician Selector for Administrators */}
        {currentUser?.role !== 'agent' && (
          <div className="w-full sm:w-auto flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Switch Agent:</span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.domain})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Responsive Layout: 1 col on mobile, 3 cols on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Technician Profile & Telemetry (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Profile & Shift Status Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentAgent.avatarUrl}
                  alt={currentAgent.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{currentAgent.name}</h3>
                  <p className="text-xs font-medium text-slate-600">{currentAgent.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentAgent.domain} • {currentAgent.experienceYears}y exp</p>
                </div>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Dispatch Status</span>
                <span className="text-[11px] text-slate-400">Tap to toggle</span>
              </div>
              <button
                type="button"
                onClick={() => onToggleAvailability(currentAgent.id)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition border shadow-2xs ${
                  currentAgent.availability === 'available'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : currentAgent.availability === 'busy'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentAgent.availability === 'available'
                        ? 'bg-emerald-500 animate-pulse'
                        : currentAgent.availability === 'busy'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="capitalize">{currentAgent.availability}</span>
                </div>
                <span className="text-[11px] font-medium underline">Change</span>
              </button>
            </div>

            {/* GPS Telemetry & Coordinates */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>GPS Beacon</span>
                </div>
                <button
                  type="button"
                  onClick={handleGpsClick}
                  disabled={isUpdatingGps}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isUpdatingGps ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingGps ? 'Syncing...' : 'Ping GPS'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-700 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-800 break-words">{currentAgent.currentLocation.addressName}</span>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-200">
                <span>Lat: {currentAgent.currentLocation.lat.toFixed(4)}</span>
                <span>Lng: {currentAgent.currentLocation.lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] font-medium text-slate-500">Battery</div>
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                  <Battery className={`w-3.5 h-3.5 ${batteryLevel < 25 ? 'text-red-500' : 'text-emerald-600'}`} />
                  <span>{batteryLevel}%</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] font-medium text-slate-500">Active</div>
                <div className="text-xs font-bold text-blue-700 mt-0.5">
                  {assignedTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] font-medium text-slate-500">Done Today</div>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">
                  {currentAgent.completedTasksCount}
                </div>
              </div>
            </div>

            {/* Extracted Skills */}
            {currentAgent.skills && currentAgent.skills.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Verified Skills
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentAgent.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Work Order Dispatch Deck (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Navigation Sub-Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 shadow-xs">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'current'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Current Work Order</span>
              {activeTask && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-blue-700 font-black">
                  1
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Queue ({queueTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({completedTasks.length})</span>
            </button>
          </div>

          {/* TAB 1: CURRENT ACTIVE TASK */}
          {activeTab === 'current' && (
            <div>
              {activeTask ? (
                <div className="bg-white border border-blue-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Status & Priority Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Task #{activeTask.id}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          activeTask.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {activeTask.status === 'in_progress' ? 'In Progress / On-Site' : 'Assigned (Pending Accept)'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        activeTask.priority === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : activeTask.priority === 'high'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {activeTask.priority} Priority
                    </span>
                  </div>

                  {/* Task Progression Stepper */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5 text-blue-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>1. Assigned</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <div className={`flex items-center gap-1.5 ${activeTask.status === 'in_progress' ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                        <Navigation className={`w-4 h-4 ${activeTask.status === 'in_progress' ? 'text-amber-600' : 'text-slate-300'}`} />
                        <span>2. In Transit / On Site</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-slate-300" />
                        <span>3. Resolved</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Work Order Title & Scope
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Category: {activeTask.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{activeTask.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {activeTask.description}
                    </p>
                  </div>

                  {/* Customer Contact & Location Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Location & Directions */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Site Location
                        </span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${activeTask.location.lat},${activeTask.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-800">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{activeTask.location.addressName}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {activeTask.location.lat.toFixed(4)}, {activeTask.location.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Requester Contact */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Requester Contact
                        </span>
                        <a
                          href={`tel:${activeTask.requesterPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Client</span>
                        </a>
                      </div>
                      <div className="text-xs text-slate-800 space-y-1">
                        <p className="font-semibold">{activeTask.requesterName}</p>
                        <p className="text-[11px] text-slate-600 font-mono">{activeTask.requesterPhone}</p>
                      </div>
                    </div>

                  </div>

                  {/* Skill Requirements & SLA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Target SLA: <strong className="text-slate-800">{activeTask.deadline}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Est: {activeTask.estimatedHours}h</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium text-slate-500">Skills:</span>
                      {activeTask.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Action Buttons */}
                  <div className="pt-2">
                    {activeTask.status === 'assigned' && (
                      <button
                        type="button"
                        onClick={() => onUpdateTaskStatus(activeTask.id, 'in_progress')}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Accept Work Order & Start Transit</span>
                      </button>
                    )}

                    {activeTask.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => onUpdateTaskStatus(activeTask.id, 'completed')}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Order Completed & Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* No Active Task State */
                <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">All Caught Up!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    You currently have no active work order in progress. You are registered in the dispatch pool and ready to receive optimal assignments.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Listening for dispatch assignments
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASK QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              {queueTasks.length > 0 ? (
                queueTasks.map((t) => (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-700">Task #{t.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                        {t.priority} Priority
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.location.addressName}</span>
                      </div>
                      <button
                        onClick={() => onUpdateTaskStatus(t.id, 'in_progress')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        Start Now &rarr;
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                  <ListTodo className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium">No additional queued jobs for this technician.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPLETED HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {completedTasks.length > 0 ? (
                completedTasks.map((t) => (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700">Task #{t.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Resolved
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{t.category}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.location.addressName}</span>
                      </div>
                      <span>Client: {t.requesterName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                  <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium">No completed tasks recorded in this session yet.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
