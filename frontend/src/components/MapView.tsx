import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { AgentProfile, Task } from '../types';
import { formatDistance, calculateHaversineDistance } from '../utils/geo';
import { Users, Wrench, Layers, MapPin, Battery, CheckCircle, Clock } from 'lucide-react';

export type MapViewFilter = 'all' | 'agents' | 'tasks';

// Professional Leaflet DivIcons
const createAgentIcon = (status: 'available' | 'busy' | 'offline') => {
  const color =
    status === 'available' ? '#059669' : status === 'busy' ? '#d97706' : '#64748b';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const createTaskIcon = (priority: string, status: string) => {
  const color =
    status === 'completed'
      ? '#2563eb'
      : priority === 'critical'
      ? '#dc2626'
      : priority === 'high'
      ? '#ea580c'
      : '#2563eb';

  return L.divIcon({
    className: 'custom-leaflet-task-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: rotate(45deg);
      ">
        <div style="transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface MapViewProps {
  agents: AgentProfile[];
  tasks: Task[];
  selectedTaskId?: string;
  selectedAgentId?: string;
  onSelectTask?: (taskId: string) => void;
  onSelectAgent?: (agentId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  agents,
  tasks,
  selectedTaskId,
  selectedAgentId,
  onSelectTask,
  onSelectAgent,
}) => {
  const [filterMode, setFilterMode] = useState<MapViewFilter>('all');

  // Center map around Nairobi
  const defaultCenter: [number, number] = [-1.2921, 36.8123];
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const showAgents = filterMode === 'all' || filterMode === 'agents';
  const showTasks = filterMode === 'all' || filterMode === 'tasks';

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
      {/* Map Filter Control Bar (Top-Left) */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-md flex items-center gap-1 pointer-events-auto">
        <button
          onClick={() => setFilterMode('all')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            filterMode === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Pins ({agents.length + tasks.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('agents')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            filterMode === 'agents'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Agents ({agents.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('tasks')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            filterMode === 'tasks'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <span>Tasks ({tasks.length})</span>
        </button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render Proximity Radius for Selected Task if task is visible */}
        {showTasks && selectedTask && (
          <Circle
            center={[selectedTask.location.lat, selectedTask.location.lng]}
            radius={3000}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.08,
              dashArray: '4, 8',
              weight: 1.5,
            }}
          />
        )}

        {/* Line between selected task and selected agent if both are active */}
        {showTasks && showAgents && selectedTask && selectedAgent && (
          <Polyline
            positions={[
              [selectedTask.location.lat, selectedTask.location.lng],
              [selectedAgent.currentLocation.lat, selectedAgent.currentLocation.lng],
            ]}
            pathOptions={{ color: '#059669', weight: 2.5, dashArray: '6, 6' }}
          />
        )}

        {/* Agent Markers */}
        {showAgents &&
          agents.map((agent) => (
            <Marker
              key={agent.id}
              position={[agent.currentLocation.lat, agent.currentLocation.lng]}
              icon={createAgentIcon(agent.availability)}
              eventHandlers={{
                click: () => onSelectAgent?.(agent.id),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px] text-slate-900">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900">{agent.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        agent.availability === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : agent.availability === 'busy'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {agent.availability}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1.5">{agent.title}</p>
                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{agent.currentLocation.addressName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Battery: {agent.batteryLevel}% • Active Tasks: {agent.activeTaskCount}</span>
                    </div>
                  </div>
                  {selectedTask && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs font-semibold text-blue-700">
                      Distance to task:{' '}
                      {formatDistance(
                        calculateHaversineDistance(
                          agent.currentLocation.lat,
                          agent.currentLocation.lng,
                          selectedTask.location.lat,
                          selectedTask.location.lng
                        )
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Task Markers */}
        {showTasks &&
          tasks.map((task) => (
            <Marker
              key={task.id}
              position={[task.location.lat, task.location.lng]}
              icon={createTaskIcon(task.priority, task.status)}
              eventHandlers={{
                click: () => onSelectTask?.(task.id),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[220px] text-slate-900">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-xs text-blue-700 font-mono">{task.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : task.priority === 'high'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-1.5">{task.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.location.addressName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Deadline: {task.deadline.split(' ')[1]}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Map Legend Overlay (Top-Right) */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 z-[1000] shadow-md space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-1">
          Legend
        </div>
        {showAgents && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Available Agent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span>Busy Agent</span>
            </div>
          </>
        )}
        {showTasks && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600 rotate-45"></span>
            <span>Task Order</span>
          </div>
        )}
      </div>
    </div>
  );
};
