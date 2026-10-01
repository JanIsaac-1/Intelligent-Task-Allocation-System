import React, { useState, useMemo } from 'react';
import { Task, AgentProfile, AllocationWeights } from '../types';
import { rankAgentsForTask } from '../utils/mockAllocation';
import { formatDistance } from '../utils/geo';
import { Sliders, Award, Compass, Briefcase, Zap, X } from 'lucide-react';

interface AllocationModalProps {
  task: Task;
  agents: AgentProfile[];
  weights: AllocationWeights;
  onWeightsChange: (weights: AllocationWeights) => void;
  onAssign: (taskId: string, agentId: string, compositeScore: number) => void;
  onClose: () => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  task,
  agents,
  weights,
  onWeightsChange,
  onAssign,
  onClose,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Compute live ranking based on current weights
  const rankedCandidates = useMemo(() => {
    return rankAgentsForTask(agents, task, weights);
  }, [agents, task, weights]);

  const topAgent = rankedCandidates[0];
  const chosenAgentId = selectedCandidateId || topAgent?.agentId;
  const chosenCandidate = rankedCandidates.find((c) => c.agentId === chosenAgentId);

  const handleSliderChange = (key: keyof AllocationWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    onWeightsChange(newWeights);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Task Allocation Engine</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                  {task.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Weighted Composite Scoring (Skill Match + Proximity + Workload)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-base p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 overflow-y-auto flex-1 bg-white">
          {/* Left Column: Task Context & Weight Controls */}
          <div className="md:col-span-5 space-y-4">
            {/* Task Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Work Order Details
              </div>
              <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {task.description}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {task.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Configurable Optimization Weights */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Allocation Weights</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Linear Parameters
                </span>
              </div>

              {/* w1: Skill Match Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-blue-600" /> w₁ Skill Match (NLP)
                  </span>
                  <span className="font-mono text-blue-700 font-bold">{weights.wSkill.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={weights.wSkill}
                  onChange={(e) => handleSliderChange('wSkill', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* w2: Proximity Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" /> w₂ Proximity (Haversine)
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">{weights.wProximity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={weights.wProximity}
                  onChange={(e) => handleSliderChange('wProximity', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* w3: Workload Balance Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-600" /> w₃ Workload Balance
                  </span>
                  <span className="font-mono text-slate-800 font-bold">{weights.wWorkload.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={weights.wWorkload}
                  onChange={(e) => handleSliderChange('wWorkload', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Ranked Candidate Agents Leaderboard */}
          <div className="md:col-span-7 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ranked Candidates
              </span>
              <span className="text-xs text-slate-500">
                {rankedCandidates.length} Active Technicians Evaluated
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {rankedCandidates.map((candidate, index) => {
                const isSelected = candidate.agentId === chosenAgentId;
                const isTop = index === 0;

                return (
                  <div
                    key={candidate.agentId}
                    onClick={() => setSelectedCandidateId(candidate.agentId)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            isTop
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {candidate.agentName}
                            </span>
                            {isTop && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                                Top Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{candidate.agentTitle}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-blue-700">
                          {(candidate.compositeScore * 100).toFixed(1)}%
                        </div>
                        <span className="text-[10px] text-slate-500">Composite Score</span>
                      </div>
                    </div>

                    {/* Sub-Score Progress Bars */}
                    <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-200/80 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-600 mb-0.5 text-[10px]">
                          <span>Skill Match:</span>
                          <span className="font-bold text-blue-700">
                            {(candidate.skillScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${candidate.skillScore * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-600 mb-0.5 text-[10px]">
                          <span>Distance:</span>
                          <span className="font-bold text-emerald-700">
                            {formatDistance(candidate.distanceKm)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${candidate.proximityScore * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-600 mb-0.5 text-[10px]">
                          <span>Workload:</span>
                          <span className="font-bold text-slate-800">
                            {(candidate.workloadScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-700 h-full rounded-full"
                            style={{ width: `${candidate.workloadScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Selected for dispatch:{' '}
            <span className="font-bold text-slate-900">
              {chosenCandidate?.agentName || 'None'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              disabled={!chosenCandidate}
              onClick={() => {
                if (chosenCandidate) {
                  onAssign(task.id, chosenCandidate.agentId, chosenCandidate.compositeScore);
                }
              }}
              className="px-4 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
