import React, { useState, useEffect, useCallback } from 'react';
import { AgentProfile, Task, SystemLog, AnalyticsSummary } from '../../types';
import { fetchAnalyticsSummary, fetchLogs } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Clock,
  Award,
  History,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface AnalyticsViewProps {
  agents: AgentProfile[];
  tasks: Task[];
  logs: SystemLog[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ agents, tasks, logs: sessionLogs }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [backendLogs, setBackendLogs] = useState<SystemLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'success' | 'warning' | 'info'>('all');

  const refreshAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [summaryData, freshLogs] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchLogs(),
      ]);
      if (summaryData) setSummary(summaryData);
      if (freshLogs && freshLogs.length > 0) setBackendLogs(freshLogs);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics, tasks.length, agents.length]);

  // Live fallback computations from current React state if summary hasn't loaded yet
  const totalTasks = summary?.total_tasks ?? tasks.length;
  const pendingCount = summary?.pending_tasks ?? tasks.filter((t) => t.status === 'pending').length;
  const activeCount =
    summary !== null
      ? summary.assigned_tasks + summary.in_progress_tasks
      : tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
  const completedCount = summary?.completed_tasks ?? tasks.filter((t) => t.status === 'completed').length;
  const completionRate =
    summary?.completion_rate_pct ??
    (totalTasks > 0 ? parseFloat(((completedCount / totalTasks) * 100).toFixed(1)) : 0);

  // Compute live Jain's Fairness Index from agents' total workload
  const computeLocalFairness = (): number => {
    if (agents.length === 0) return 1.0;
    const loads = agents.map((a) => a.activeTaskCount + a.completedTasksCount);
    const sum = loads.reduce((acc, v) => acc + v, 0);
    const sumSq = loads.reduce((acc, v) => acc + v * v, 0);
    if (sumSq === 0) return 1.0;
    return parseFloat(((sum * sum) / (agents.length * sumSq)).toFixed(2));
  };

  const fairnessIndex = summary?.fairness_index ?? computeLocalFairness();
  const fairnessLabel =
    fairnessIndex >= 0.85
      ? 'Balanced Distribution'
      : fairnessIndex >= 0.65
      ? 'Moderate Load Spread'
      : 'Uneven Distribution';

  // Combine session logs + refreshed backend logs without duplicates
  const mergedLogs = React.useMemo(() => {
    const base = backendLogs.length > 0 ? backendLogs : sessionLogs;
    const seen = new Set(base.map((l) => `${l.action}::${l.details}`));
    const extras = sessionLogs.filter((l) => !seen.has(`${l.action}::${l.details}`));
    return [...extras, ...base];
  }, [backendLogs, sessionLogs]);

  const filteredLogs = mergedLogs.filter((log) => {
    if (logTypeFilter !== 'all' && log.type !== logTypeFilter) return false;
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  // Sort agents by active task count descending, then completed count
  const sortedAgents = [...agents].sort(
    (a, b) => b.activeTaskCount - a.activeTaskCount || b.completedTasksCount - a.completedTasksCount
  );

  // Domain breakdown fallback from local tasks
  const domainBreakdown = React.useMemo(() => {
    if (summary?.domain_breakdown && summary.domain_breakdown.length > 0) {
      return summary.domain_breakdown;
    }
    const map = new Map<string, { domain: string; total: number; pending: number; active: number; completed: number }>();
    tasks.forEach((t) => {
      const cat = t.category || 'General Field Service';
      const entry = map.get(cat) || { domain: cat, total: 0, pending: 0, active: 0, completed: 0 };
      entry.total += 1;
      if (t.status === 'pending') entry.pending += 1;
      else if (t.status === 'assigned' || t.status === 'in_progress') entry.active += 1;
      else if (t.status === 'completed') entry.completed += 1;
      map.set(cat, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [summary, tasks]);

  // CSV Report Export
  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Section', 'Timestamp / ID', 'Title / Action', 'Technician / Domain', 'Metrics / Details', 'Status / Type'],
    ];

    (summary?.recent_assignments || []).forEach((asg) => {
      rows.push([
        'Dispatch Assignment',
        asg.assigned_at,
        asg.task_title,
        `${asg.agent_name} (${asg.agent_domain})`,
        `Composite=${(asg.allocation_score * 100).toFixed(1)}% | SBERT=${(asg.skill_score * 100).toFixed(1)}% | Dist=${asg.distance_km}km`,
        asg.status,
      ]);
    });

    filteredLogs.forEach((l) => {
      rows.push([
        'System Audit Log',
        l.timestamp,
        l.action,
        '-',
        l.details,
        l.type,
      ]);
    });

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geotask-audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Operational Reports & Live System Audit
          </h2>
          <p className="text-xs text-slate-500">
            Real-time metrics computed from PostgreSQL work orders, SBERT dispatch records, and system event logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAnalytics}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 Live Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Avg SBERT Skill Match
            </span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.avg_skill_score !== null && summary?.avg_skill_score !== undefined
              ? `${(summary.avg_skill_score * 100).toFixed(1)}%`
              : 'No Dispatches'}
          </div>
          <p className="text-[11px] text-blue-600 mt-0.5 font-medium">
            {summary && summary.total_assignments > 0
              ? `Across ${summary.total_assignments} dispatch(es) • Avg Composite: ${((summary.avg_composite_score || 0) * 100).toFixed(1)}%`
              : 'Assign a task to measure live SBERT alignment'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Distance Optimization
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.distance_optimization_pct !== null && summary?.distance_optimization_pct !== undefined
              ? `${summary.distance_optimization_pct > 0 ? '+' : ''}${summary.distance_optimization_pct}%`
              : 'No Dispatches'}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            {summary?.avg_dispatch_distance_km !== null && summary?.avg_dispatch_distance_km !== undefined
              ? `Avg ${summary.avg_dispatch_distance_km} km vs ${summary.avg_baseline_distance_km} km fleet baseline`
              : 'Geodesic savings vs random technician assignment'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Resolution & Turnaround
            </span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.avg_response_minutes !== null && summary?.avg_response_minutes !== undefined
              ? `${summary.avg_response_minutes} min`
              : `${completionRate}% Done`}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {completedCount} completed • {activeCount} active • {pendingCount} unallocated
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Workload Fairness Index
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fairnessIndex.toFixed(2)}</div>
          <p className="text-[11px] text-blue-600 mt-0.5 font-medium">
            Jain&apos;s Index • {fairnessLabel}
          </p>
        </div>
      </div>

      {/* Work Order Pipeline & Domain Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Work Order Pipeline & Trade Domain Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {totalTasks} Total Orders ({completionRate}% Completion Rate)
          </span>
        </div>

        {totalTasks > 0 && (
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${(pendingCount / totalTasks) * 100}%` }}
                title={`Unallocated: ${pendingCount}`}
              />
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${(activeCount / totalTasks) * 100}%` }}
                title={`Allocated / In Progress: ${activeCount}`}
              />
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(completedCount / totalTasks) * 100}%` }}
                title={`Completed: ${completedCount}`}
              />
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Unallocated: <strong>{pendingCount}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Allocated / In Progress: <strong>{activeCount}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed: <strong>{completedCount}</strong>
              </span>
            </div>
          </div>
        )}

        {domainBreakdown.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {domainBreakdown.map((d) => (
              <div
                key={d.domain}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center gap-2"
              >
                <span className="font-semibold text-slate-800">{d.domain}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                  {d.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Dispatch Allocation Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dispatch Score Audit History (PostgreSQL Assignments)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {summary?.recent_assignments?.length || 0} Recorded Dispatches
          </span>
        </div>

        {!summary || summary.recent_assignments.length === 0 ? (
          <div className="p-5 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            No dispatch assignments recorded in PostgreSQL yet. Allocate a pending work order to inspect real SBERT and proximity audit scores here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="py-2 pr-3">Work Order</th>
                  <th className="py-2 pr-3">Assigned Technician</th>
                  <th className="py-2 pr-3 text-right">SBERT Skill</th>
                  <th className="py-2 pr-3 text-right">Distance</th>
                  <th className="py-2 pr-3 text-right">Workload</th>
                  <th className="py-2 pr-3 text-right">Composite</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recent_assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-slate-900">

                        {asg.task_title}
                      </div>
                      <div className="text-[10px] text-slate-500">{asg.task_category}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-slate-800">{asg.agent_name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{asg.agent_domain}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono font-bold text-blue-700">
                      {(asg.skill_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-emerald-700 font-semibold">
                      {asg.distance_km} km
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-slate-700">
                      {(asg.workload_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono font-bold text-slate-900">
                      {(asg.allocation_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          asg.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {asg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {sortedAgents.map((agent) => {
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
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                System Audit Log
              </h3>
            </div>
            <span className="text-xs text-slate-500">{filteredLogs.length} Events</span>
          </div>

          {/* Search & Type Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter audit logs by action, technician, or keyword..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'success', 'warning', 'info'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLogTypeFilter(t)}
                  className={`flex-1 py-1 px-2 rounded text-[10px] font-semibold uppercase transition ${
                    logTypeFilter === t
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No audit logs match your filter.
              </div>
            ) : (
              filteredLogs.map((log) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
