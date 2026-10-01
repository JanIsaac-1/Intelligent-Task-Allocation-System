import React, { useState } from 'react';
import { AgentProfile, Task, AllocationWeights } from '../../types';
import { MapView } from '../MapView';
import { AllocationModal } from '../AllocationModal';
import { AddAgentModal } from '../AddAgentModal';
import {
  Users,
  MapPin,
  Clock,
  Plus,
  Sliders,
  CheckCircle2,
  Zap,
  RotateCcw,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import { formatDistance, calculateHaversineDistance } from '../../utils/geo';

interface AdminDashboardProps {
  agents: AgentProfile[];
  tasks: Task[];
  weights: AllocationWeights;
  onWeightsChange: (weights: AllocationWeights) => void;
  onAssignTask: (taskId: string, agentId: string, score: number) => void;
  onAddAgent: (agent: AgentProfile) => void;
  onToggleAgentAvailability: (agentId: string) => void;
  onReassignTask: (taskId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  agents,
  tasks,
  weights,
  onWeightsChange,
  onAssignTask,
  onAddAgent,
  onToggleAgentAvailability,
  onReassignTask,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(tasks[0]?.id);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [allocationModalTask, setAllocationModalTask] = useState<Task | null>(null);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'tasks' | 'agents'>('tasks');

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const activeTasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
  const availableAgents = agents.filter((a) => a.availability === 'available');

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Pending Orders
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{pendingTasks.length}</div>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting Dispatch</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Available Technicians
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {availableAgents.length} <span className="text-xs text-slate-400 font-normal">/ {agents.length}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Ready on Field</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              In-Progress Jobs
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{activeTasks.length}</div>
            <span className="text-[11px] text-blue-600 font-medium">Active on Site</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Allocation Parameters
            </span>
            <div className="text-xs font-mono font-bold text-slate-800 mt-1">
              S: {weights.wSkill} | P: {weights.wProximity} | W: {weights.wWorkload}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Composite Linear Weights</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Split Layout: Map & Dispatch Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Live Interactive Map */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Nairobi Operational Map</span>
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Click pins to inspect location details
            </span>
          </div>

          <div className="h-[560px]">
            <MapView
              agents={agents}
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              selectedAgentId={selectedAgentId}
              onSelectTask={(id) => {
                setSelectedTaskId(id);
                setRightPanelTab('tasks');
              }}
              onSelectAgent={(id) => {
                setSelectedAgentId(id);
                setRightPanelTab('agents');
              }}
            />
          </div>
        </div>

        {/* Right 5 Columns: Tasks & Agents Management */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setRightPanelTab('tasks')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  rightPanelTab === 'tasks'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Work Orders ({tasks.length})</span>
              </button>

              <button
                onClick={() => setRightPanelTab('agents')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  rightPanelTab === 'agents'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Technicians ({agents.length})</span>
              </button>
            </div>

            {rightPanelTab === 'agents' && (
              <button
                onClick={() => setShowAddAgentModal(true)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Agent</span>
              </button>
            )}
          </div>

          {/* Tab 1: Tasks List */}
          {rightPanelTab === 'tasks' && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                const assignedAgent = agents.find((a) => a.id === task.assignedAgentId);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-400 shadow-xs ring-1 ring-blue-400'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-700">
                            {task.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded font-semibold uppercase ${
                              task.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded font-semibold uppercase ${
                              task.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : task.status === 'assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{task.description}</p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{task.location.addressName}</span>
                      </div>

                      {task.status === 'pending' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAllocationModalTask(task);
                          }}
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Allocate Task</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Assigned: <strong>{assignedAgent?.name || 'Agent'}</strong>
                          </span>
                          <button
                            title="Reassign"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReassignTask(task.id);
                            }}
                            className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Agents List */}
          {rightPanelTab === 'agents' && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {agents.map((agent) => {
                const isSelected = agent.id === selectedAgentId;

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-400 shadow-xs ring-1 ring-blue-400'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={agent.avatarUrl}
                          alt={agent.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{agent.name}</span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                agent.availability === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : agent.availability === 'busy'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {agent.availability}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{agent.title}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAgentAvailability(agent.id);
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                      >
                        Change Status
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 3 && (
                        <span className="text-[10px] text-slate-500">
                          +{agent.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{agent.currentLocation.addressName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <span>Active: {agent.activeTaskCount}</span>
                        <span>•</span>
                        <span>Completed: {agent.completedTasksCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Allocation Modal Popup */}
      {allocationModalTask && (
        <AllocationModal
          task={allocationModalTask}
          agents={agents}
          weights={weights}
          onWeightsChange={onWeightsChange}
          onAssign={(taskId, agentId, score) => {
            onAssignTask(taskId, agentId, score);
            setAllocationModalTask(null);
          }}
          onClose={() => setAllocationModalTask(null)}
        />
      )}

      {/* Add Agent Modal Popup */}
      {showAddAgentModal && (
        <AddAgentModal
          onAddAgent={(newAgent) => {
            onAddAgent(newAgent);
            setShowAddAgentModal(false);
          }}
          onClose={() => setShowAddAgentModal(false)}
        />
      )}
    </div>
  );
};
