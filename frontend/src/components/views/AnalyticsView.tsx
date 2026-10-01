import React from 'react';
import { AgentProfile, Task, SystemLog } from '../../types';
import { BarChart3, TrendingUp, ShieldCheck, Clock, Award, History } from 'lucide-react';

interface AnalyticsViewProps {
  agents: AgentProfile[];
  tasks: Task[];
  logs: SystemLog[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ agents, tasks, logs }) => {
  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Avg Matching Accuracy
            </span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">91.4%</div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">NLP Profile Alignment</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Distance Optimization
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">-34.2%</div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">vs Random Manual Assignment</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Avg Response Time
            </span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">16.4 min</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Nairobi Metro Average</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Workload Fairness Index
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0.89</div>
          <p className="text-[11px] text-blue-600 mt-0.5 font-medium">Balanced Distribution</p>
        </div>
      </div>

      {/* Main Grid: Workload Distribution & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workload Distribution Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Technician Workload Balance
              </h3>
            </div>
            <span className="text-xs text-slate-500">{agents.length} Registered Technicians</span>
          </div>

          <div className="space-y-2.5">
            {agents.map((agent) => {
              const maxScale = 5;
              const loadPct = Math.min(100, (agent.activeTaskCount / maxScale) * 100);

              return (
                <div key={agent.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={agent.avatarUrl}
                        alt={agent.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900">{agent.name}</span>
                        <span className="text-slate-500 ml-2 text-[11px]">({agent.domain})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="text-[11px]">
                        Active: <strong className="text-slate-900">{agent.activeTaskCount}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-[11px]">
                        Completed: <strong className="text-emerald-700">{agent.completedTasksCount}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        agent.activeTaskCount > 2
                          ? 'bg-amber-500'
                          : agent.activeTaskCount > 0
                          ? 'bg-blue-600'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, loadPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Logs & Audit Trail */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                System Audit Log
              </h3>
            </div>
            <span className="text-xs text-slate-500">Activity Trail</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-500">{log.timestamp}</span>
                  <span
                    className={`font-semibold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                      log.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.type === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.action}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
