import { AgentProfile, Task, AllocationScore, AllocationWeights } from '../types';
import { calculateHaversineDistance, calculateProximityScore } from './geo';

/**
 * Simulates semantic skill matching score between 0.0 and 1.0
 * (Simulating SBERT embedding cosine similarity for the prototype)
 */
export function calculateMockSkillScore(agent: AgentProfile, task: Task): number {
  let score = 0.0;

  // Domain match gives a solid foundational baseline
  if (agent.domain.toLowerCase() === task.category.toLowerCase()) {
    score += 0.40;
  } else if (
    (agent.domain === 'Telecommunications' && task.category === 'IT Support') ||
    (agent.domain === 'IT Support' && task.category === 'Telecommunications') ||
    (agent.domain === 'Electrical' && task.category === 'HVAC')
  ) {
    score += 0.20; // Related domain
  }

  // Check required skills overlap
  const agentSkillTokens = new Set(
    [
      ...agent.skills.map(s => s.toLowerCase()),
      ...agent.certifications.map(c => c.toLowerCase()),
      ...agent.title.toLowerCase().split(/\s+/),
      ...agent.bio.toLowerCase().split(/\s+/)
    ]
  );

  const taskTextTokens = [
    ...task.requiredSkills.map(s => s.toLowerCase()),
    ...task.title.toLowerCase().split(/\s+/),
    ...task.description.toLowerCase().split(/\s+/)
  ].filter(t => t.length > 3);

  let matchedTokensCount = 0;
  task.requiredSkills.forEach(reqSkill => {
    const cleanReq = reqSkill.toLowerCase();
    const hasDirectMatch = Array.from(agentSkillTokens).some(
      agentSkill => agentSkill.includes(cleanReq) || cleanReq.includes(agentSkill)
    );
    if (hasDirectMatch) matchedTokensCount += 2;
  });

  taskTextTokens.forEach(token => {
    if (Array.from(agentSkillTokens).some(agentSkill => agentSkill.includes(token))) {
      matchedTokensCount += 0.3;
    }
  });

  const skillMatchRatio = Math.min(1.0, (matchedTokensCount / Math.max(1, task.requiredSkills.length * 2)));
  score += skillMatchRatio * 0.50;

  // Experience bonus (up to 0.10)
  const experienceBonus = Math.min(0.10, (agent.experienceYears / 10) * 0.10);
  score += experienceBonus;

  return Math.min(0.99, Math.max(0.12, parseFloat(score.toFixed(3))));
}

/**
 * Calculates Workload balance score: inversely proportional to active task count
 * S_workload = 1 / (1 + activeTasks)
 */
export function calculateWorkloadScore(activeTasks: number): number {
  if (activeTasks === 0) return 1.0;
  if (activeTasks === 1) return 0.70;
  if (activeTasks === 2) return 0.45;
  if (activeTasks === 3) return 0.25;
  return 0.10;
}

/**
 * Ranks all available agents for a given task using the proposal's
 * Weighted Composite Scoring formula:
 * Total = (w1 * S_skill) + (w2 * S_proximity) + (w3 * S_workload)
 */
export function rankAgentsForTask(
  agents: AgentProfile[],
  task: Task,
  weights: AllocationWeights = { wSkill: 0.50, wProximity: 0.30, wWorkload: 0.20 }
): AllocationScore[] {
  const scores: AllocationScore[] = agents.map(agent => {
    const distanceKm = calculateHaversineDistance(
      agent.currentLocation.lat,
      agent.currentLocation.lng,
      task.location.lat,
      task.location.lng
    );

    const skillScore = calculateMockSkillScore(agent, task);
    const proximityScore = calculateProximityScore(distanceKm);
    const workloadScore = calculateWorkloadScore(agent.activeTaskCount);

    // If agent is offline, heavily penalize composite score
    const availabilityMultiplier = agent.availability === 'offline' ? 0.1 : (agent.availability === 'busy' ? 0.7 : 1.0);

    const compositeScore = parseFloat(
      (
        ((weights.wSkill * skillScore) +
        (weights.wProximity * proximityScore) +
        (weights.wWorkload * workloadScore)) * availabilityMultiplier
      ).toFixed(3)
    );

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentTitle: agent.title,
      skillScore,
      proximityScore: parseFloat(proximityScore.toFixed(3)),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      workloadScore: parseFloat(workloadScore.toFixed(3)),
      compositeScore,
      breakdown: {
        wSkill: weights.wSkill,
        wProximity: weights.wProximity,
        wWorkload: weights.wWorkload
      }
    };
  });

  // Sort descending by composite score
  return scores.sort((a, b) => b.compositeScore - a.compositeScore);
}
