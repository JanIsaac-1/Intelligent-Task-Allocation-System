import React, { useState, useEffect } from 'react';
import { AgentProfile, Task, AuthUser } from '../../types';
import {
  Smartphone,
  MapPin,
  CheckCircle,
  Navigation,
  Phone,
  Clock,
  Radio,
  Battery,
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

  useEffect(() => {
    if (currentUser?.agentProfileId) {
      const match = agents.find((a) => String(a.id) === String(currentUser.agentProfileId));
      if (match) setSelectedAgentId(match.id);
    }
  }, [currentUser, agents]);

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const assignedTasks = tasks.filter((t) => t.assignedAgentId === currentAgent?.id);
  const activeTask = assignedTasks.find((t) => t.status === 'assigned' || t.status === 'in_progress');

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Agent Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Field Agent Mobile Terminal</h3>
            <p className="text-[11px] text-slate-500">
              {currentUser?.role === 'agent'
                ? `Logged in as technician: ${currentAgent?.name || currentUser.fullName}`
                : 'Preview the mobile task execution workflow for active technicians'}
            </p>
          </div>
        </div>

        {currentUser?.role !== 'agent' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">Active Agent:</label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
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

      {/* Smartphone Device Frame */}
      <div className="flex justify-center">
        <div className="w-full max-w-[380px] bg-slate-900 border-4 border-slate-700 rounded-[38px] shadow-xl p-3.5 space-y-3.5 overflow-hidden relative">
          {/* Top Speaker / Dynamic Island bar */}
          <div className="flex justify-center mb-1">
            <div className="w-20 h-3.5 bg-slate-800 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
            </div>
          </div>

          {/* Inner Screen - Clean Light Theme */}
          <div className="bg-slate-50 rounded-[28px] p-3.5 space-y-3.5 border border-slate-200">
            {/* Agent Profile Top Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentAgent.avatarUrl}
                    alt={currentAgent.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{currentAgent.name}</h4>
                    <p className="text-[11px] text-slate-500">{currentAgent.title}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    onClick={() => onToggleAvailability(currentAgent.id)}
                    className={`cursor-pointer inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase transition ${
                      currentAgent.availability === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : currentAgent.availability === 'busy'
                        ? 'bg-amber-50 text-amber-700 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {currentAgent.availability}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                    <Battery className="w-3 h-3 text-slate-400" />
                    <span>{currentAgent.batteryLevel}%</span>
                  </div>
                </div>
              </div>

              {/* GPS Beacon Status */}
              <div className="bg-slate-50 rounded-lg p-2 text-[11px] flex items-center justify-between border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="truncate max-w-[150px] font-medium">{currentAgent.currentLocation.addressName}</span>
                </div>
                <button
                  onClick={() => onSimulateGpsMovement(currentAgent.id)}
                  className="text-[10px] font-semibold text-blue-700 hover:text-blue-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                >
                  Update GPS
                </button>
              </div>
            </div>

            {/* Active Job Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Assigned Work Order
                </span>
                <span className="text-[10px] text-slate-400">Live Status</span>
              </div>

              {activeTask ? (
                <div className="bg-white border border-blue-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700">
                      {activeTask.id}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        activeTask.priority === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}
                    >
                      {activeTask.priority} Priority
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{activeTask.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {activeTask.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 space-y-1 border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] font-medium">{activeTask.location.addressName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px] font-medium">{activeTask.requesterPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-[11px] text-slate-600">Due: {activeTask.deadline}</span>
                    </div>
                  </div>

                  {/* Workflow Buttons */}
                  <div className="pt-1">
                    {activeTask.status === 'assigned' && (
                      <button
                        onClick={() => onUpdateTaskStatus(activeTask.id, 'in_progress')}
                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Accept & Start Transit</span>
                      </button>
                    )}

                    {activeTask.status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateTaskStatus(activeTask.id, 'completed')}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Order Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">No Active Assignments</div>
                  <p className="text-[11px] text-slate-500">
                    You are in the dispatch pool. New tasks assigned by the dispatcher will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px]">Today's Completed</div>
                <div className="text-sm font-bold text-emerald-700">
                  {currentAgent.completedTasksCount}
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px]">Avg Response Time</div>
                <div className="text-sm font-bold text-blue-700">18 min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
