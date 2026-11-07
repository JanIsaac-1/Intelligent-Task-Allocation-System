import { AgentProfile } from '../types';

export interface DutyStatusInfo {
  isDutyActive: boolean;        // true if within shift hours OR on-call
  isOnDutyShift: boolean;       // true if within shift hours
  isOnCall: boolean;            // true if on-call standby
  status: 'on_duty' | 'on_call' | 'off_duty' | 'busy' | 'offline';
  label: string;
  badgeClass: string;
  dotColor: string;
}

/**
 * Returns current time in Africa/Nairobi (UTC+3)
 */
export function getNairobiTime(): { hours: number; minutes: number; timeString: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hours = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return { hours, minutes, timeString };
  } catch {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes(), timeString: now.toTimeString().slice(0, 5) };
  }
}

/**
 * Evaluates whether an agent's working shift is currently active according to Africa/Nairobi time.
 */
export function getAgentDutyStatus(agent: Partial<AgentProfile>): DutyStatusInfo {
  if (agent.availability === 'offline') {
    return {
      isDutyActive: false,
      isOnDutyShift: false,
      isOnCall: false,
      status: 'offline',
      label: 'Offline',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotColor: 'bg-slate-400',
    };
  }

  // If designated as On-Call, they are standby active even outside regular shift
  if (agent.isOnCall) {
    if (agent.availability === 'busy') {
      return {
        isDutyActive: true,
        isOnDutyShift: false,
        isOnCall: true,
        status: 'busy',
        label: 'Busy (On Task)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500',
      };
    }
    return {
      isDutyActive: true,
      isOnDutyShift: false,
      isOnCall: true,
      status: 'on_call',
      label: 'On-Call (Standby)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
      dotColor: 'bg-purple-600',
    };
  }

  // Calculate regular shift window
  const startStr = agent.shiftStart || '08:00';
  const endStr = agent.shiftEnd || '17:00';

  const [sH, sM] = startStr.split(':').map((v) => parseInt(v, 10) || 0);
  const [eH, eM] = endStr.split(':').map((v) => parseInt(v, 10) || 0);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;

  const { hours, minutes } = getNairobiTime();
  const currentMin = hours * 60 + minutes;

  let isOnDutyShift = false;
  if (startMin <= endMin) {
    isOnDutyShift = currentMin >= startMin && currentMin <= endMin;
  } else {
    // Overnight shift (e.g. 22:00 to 06:00)
    isOnDutyShift = currentMin >= startMin || currentMin <= endMin;
  }

  if (isOnDutyShift) {
    if (agent.availability === 'busy') {
      return {
        isDutyActive: true,
        isOnDutyShift: true,
        isOnCall: false,
        status: 'busy',
        label: 'Busy (On Task)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500',
      };
    }
    return {
      isDutyActive: true,
      isOnDutyShift: true,
      isOnCall: false,
      status: 'on_duty',
      label: 'Available (On Duty)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
    };
  }

  // Shift has ended and not on-call
  return {
    isDutyActive: false,
    isOnDutyShift: false,
    isOnCall: false,
    status: 'off_duty',
    label: `Off Duty (Shift Ended at ${endStr})`,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
    dotColor: 'bg-slate-400',
  };
}
