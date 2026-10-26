import React, { useState, useEffect } from 'react';
import { SystemUser, AllocationWeights, AlgorithmPolicy, Role, AgentProfile } from '../../types';
import { OPTIMIZATION_PRESETS, MASTER_DOMAINS, PresetConfig } from '../../data/config';
import {
  Users,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Zap,
  SlidersHorizontal,
  Settings,
  BookOpen,
  X,
  Clock,
  Radio,
  Calendar,
  Sun,
  Moon,
  RotateCcw,
  AlertTriangle,
  Trash2,
  HelpCircle,
  Briefcase,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { apiFetchSecuritySettings, apiUpdateMasterKey } from '../../services/api';

interface AdminPortalViewProps {
  systemUsers: SystemUser[];
  agents?: AgentProfile[];
  onAddUser: (user: SystemUser) => void;
  onUpdateUserStatus: (userId: string, status: SystemUser['status']) => void;
  onUpdateUserRole: (userId: string, role: Role) => void;
  onApproveUser?: (userId: string) => Promise<void>;
  onDenyUser?: (userId: string, reason?: string, deleteAccount?: boolean) => Promise<void>;
  onResetPassword?: (userId: string, newPassword: string, unlock?: boolean) => Promise<void>;
  onToggleLockout?: (userId: string, lock: boolean) => Promise<void>;
  onUpdateAgentShift?: (
    agentId: string,
    shift: { shiftName?: string; shiftStart?: string; shiftEnd?: string; isOnCall?: boolean }
  ) => Promise<void>;
  currentWeights: AllocationWeights;
  onApplyPreset: (preset: PresetConfig) => void;
  policy: AlgorithmPolicy;
  onUpdatePolicy: (policy: AlgorithmPolicy) => void;
}

const SHIFT_PRESETS = [
  { name: 'Standard Business (08:00 - 17:00)', start: '08:00', end: '17:00', desc: 'Core corporate & facilities dispatch hours' },
  { name: 'Early Morning Shift (06:00 - 14:00)', start: '06:00', end: '14:00', desc: 'Pre-rush fiber splicing & power restoration' },
  { name: 'Afternoon / Evening Shift (14:00 - 22:00)', start: '14:00', end: '22:00', desc: 'Commercial HVAC, lift & retail network coverage' },
  { name: 'Night Emergency On-Call (22:00 - 06:00)', start: '22:00', end: '06:00', desc: 'Critical infrastructure & security system standby' },
];

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  systemUsers,
  agents = [],
  onAddUser,
  onUpdateUserStatus,
  onUpdateUserRole,
  onApproveUser,
  onDenyUser,
  onResetPassword,
  onToggleLockout,
  onUpdateAgentShift,
  currentWeights,
  onApplyPreset,
  policy,
  onUpdatePolicy,
}) => {
  const [adminTab, setAdminTab] = useState<'users' | 'pending' | 'shifts' | 'security' | 'algorithm' | 'taxonomy'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Modals state
  const [selectedUserForReset, setSelectedUserForReset] = useState<SystemUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [unlockOnReset, setUnlockOnReset] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const [selectedUserForDeny, setSelectedUserForDeny] = useState<SystemUser | null>(null);
  const [denyReason, setDenyReason] = useState('Qualifications or credentials not verified');
  const [deletePermanently, setDeletePermanently] = useState(false);
  const [denyingUser, setDenyingUser] = useState(false);

  const [selectedAgentForShift, setSelectedAgentForShift] = useState<AgentProfile | null>(null);
  const [shiftPresetChoice, setShiftPresetChoice] = useState(SHIFT_PRESETS[0].name);
  const [customShiftStart, setCustomShiftStart] = useState('08:00');
  const [customShiftEnd, setCustomShiftEnd] = useState('17:00');
  const [isShiftOnCall, setIsShiftOnCall] = useState(false);
  const [savingShift, setSavingShift] = useState(false);

  // Security tab state
  const [masterPasscode, setMasterPasscode] = useState('geotask2026');
  const [showMasterPasscode, setShowMasterPasscode] = useState(false);
  const [newMasterPasscode, setNewMasterPasscode] = useState('');
  const [updatingPasscode, setUpdatingPasscode] = useState(false);
  const [passcodeSuccessMsg, setPasscodeSuccessMsg] = useState('');
  const [passcodeErrorMsg, setPasscodeErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+254 7');
  const [newRole, setNewRole] = useState<Role>('agent');
  const [newDepartment, setNewDepartment] = useState('Field Operations');

  // Load backend security settings
  useEffect(() => {
    let isMounted = true;
    apiFetchSecuritySettings()
      .then((data) => {
        if (isMounted && data?.master_key) {
          setMasterPasscode(data.master_key);
        }
      })
      .catch((err) => console.warn('Could not load security settings:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered Users
  const filteredUsers = systemUsers.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingUsers = systemUsers.filter((u) => u.status === 'pending');
  const pendingApprovalsCount = pendingUsers.length;
  const adminCount = systemUsers.filter((u) => u.role === 'administrator').length;
  const agentCount = systemUsers.filter((u) => u.role === 'agent').length;
  const requesterCount = systemUsers.filter((u) => u.role === 'requester').length;
  const lockedCount = systemUsers.filter((u) => u.status === 'locked').length;

  // Live Duty Status Calculator
  const getAgentDutyStatus = (start?: string, end?: string, isOnCall?: boolean) => {
    if (isOnCall) {
      return { status: 'ON_CALL', label: 'On-Call (Standby)', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    if (!start || !end) {
      return { status: 'ON_DUTY', label: 'On Duty', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
    try {
      const now = new Date();
      // Nairobi UTC+3
      const utcHours = now.getUTCHours();
      const nairobiHours = (utcHours + 3) % 24;
      const nairobiMinutes = now.getUTCMinutes();
      const currentMinutes = nairobiHours * 60 + nairobiMinutes;

      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      const startMin = (sH || 0) * 60 + (sM || 0);
      const endMin = (eH || 0) * 60 + (eM || 0);

      let onDuty = false;
      if (startMin <= endMin) {
        onDuty = currentMinutes >= startMin && currentMinutes <= endMin;
      } else {
        // Over-night shift (e.g. 22:00 to 06:00)
        onDuty = currentMinutes >= startMin || currentMinutes <= endMin;
      }

      if (onDuty) {
        return { status: 'ON_DUTY', label: 'On Duty (Shift Active)', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      }
      return { status: 'OFF_DUTY', label: 'Off Duty (Shift Ended)', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    } catch {
      return { status: 'ON_DUTY', label: 'On Duty', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
  };

  // Password Reset Handler
  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordInput) return;
    if (newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setResettingPassword(true);
    setResetSuccessMessage('');
    try {
      if (onResetPassword) {
        await onResetPassword(selectedUserForReset.id, newPasswordInput, unlockOnReset);
      }
      setResetSuccessMessage(`Password for ${selectedUserForReset.email} successfully updated.`);
      setTimeout(() => {
        setSelectedUserForReset(null);
        setNewPasswordInput('');
        setResetSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Deny / Reject User Handler
  const handleExecuteDenyUser = async () => {
    if (!selectedUserForDeny) return;
    setDenyingUser(true);
    try {
      if (onDenyUser) {
        await onDenyUser(selectedUserForDeny.id, denyReason, deletePermanently);
      }
      setSelectedUserForDeny(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reject registration');
    } finally {
      setDenyingUser(false);
    }
  };

  // Shift Update Handler
  const handleExecuteSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForShift) return;
    setSavingShift(true);
    try {
      let finalName = shiftPresetChoice;
      let start = customShiftStart;
      let end = customShiftEnd;
      const matched = SHIFT_PRESETS.find((p) => p.name === shiftPresetChoice);
      if (matched) {
        start = matched.start;
        end = matched.end;
      } else {
        finalName = `Custom Hours (${start} - ${end})`;
      }

      if (onUpdateAgentShift) {
        await onUpdateAgentShift(selectedAgentForShift.id, {
          shiftName: finalName,
          shiftStart: start,
          shiftEnd: end,
          isOnCall: isShiftOnCall,
        });
      }
      setSelectedAgentForShift(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update shift');
    } finally {
      setSavingShift(false);
    }
  };

  // Update Master Key Handler
  const handleSaveMasterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPasscode || newMasterPasscode.length < 6) {
      setPasscodeErrorMsg('Passcode must be at least 6 characters long.');
      return;
    }
    setUpdatingPasscode(true);
    setPasscodeErrorMsg('');
    setPasscodeSuccessMsg('');
    try {
      const res = await apiUpdateMasterKey(newMasterPasscode);
      setMasterPasscode(res.master_key || newMasterPasscode);
      setPasscodeSuccessMsg('Master Superuser Authorization Key updated and active!');
      setNewMasterPasscode('');
    } catch (err: any) {
      setPasscodeErrorMsg(err.message || 'Failed to update master passcode');
    } finally {
      setUpdatingPasscode(false);
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GT-2026-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewMasterPasscode(code);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;

    const createdUser: SystemUser = {
      id: `user-${Date.now()}`,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      status: 'active',
      department: newDepartment,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
    };

    onAddUser(createdUser);
    setShowAddUserModal(false);
    setNewFullName('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">System Administration Portal</h2>
            <p className="text-xs text-slate-500">
              Role-based user management, account registration approvals, shift schedules, and global dispatch governance
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs flex-wrap gap-1">
          <button
            onClick={() => setAdminTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Users & RBAC ({systemUsers.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Approvals</span>
            {pendingApprovalsCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                {pendingApprovalsCount}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">(0)</span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('shifts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'shifts'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Work Shifts ({agents.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            <span>Master Key & Security</span>
          </button>

          <button
            onClick={() => setAdminTab('algorithm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'algorithm'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Algorithm Presets</span>
          </button>

          <button
            onClick={() => setAdminTab('taxonomy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'taxonomy'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Skills Catalog</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS & RBAC DIRECTORY */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Accounts</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{systemUsers.length}</div>
            </div>

            <div
              onClick={() => setAdminTab('pending')}
              className={`border rounded-xl p-3 shadow-xs cursor-pointer transition ${
                pendingApprovalsCount > 0
                  ? 'bg-amber-50/90 border-amber-300 hover:bg-amber-100/80 ring-1 ring-amber-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase flex items-center justify-between ${
                pendingApprovalsCount > 0 ? 'text-amber-800' : 'text-slate-500'
              }`}>
                <span>Pending Queue</span>
                <Clock className="w-3 h-3" />
              </span>
              <div className={`text-lg font-bold mt-0.5 flex items-center gap-1.5 ${
                pendingApprovalsCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}>
                {pendingApprovalsCount}
                {pendingApprovalsCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-semibold">
                    Review
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] text-blue-700 font-semibold uppercase">Administrators</span>
              <div className="text-lg font-bold text-blue-700 mt-0.5">{adminCount}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] text-emerald-700 font-semibold uppercase">Field Agents</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{agentCount}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] text-slate-600 font-semibold uppercase">Requesters</span>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{requesterCount}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] text-purple-700 font-semibold uppercase">Locked Accounts</span>
              <div className="text-lg font-bold text-purple-700 mt-0.5">{lockedCount}</div>
            </div>
          </div>

          {/* Attention Banner if Pending */}
          {pendingApprovalsCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-amber-950">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>{pendingApprovalsCount} applicant registration(s)</strong> require administrative authorization before sign-in is granted.
                </span>
              </div>
              <button
                onClick={() => setAdminTab('pending')}
                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg transition text-xs shrink-0"
              >
                Go to Approval Queue
              </button>
            </div>
          )}

          {/* User Directory Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or department..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="administrator">Administrators</option>
                  <option value="agent">Field Agents</option>
                  <option value="requester">Requesters</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending Review ({pendingApprovalsCount})</option>
                  <option value="locked">Locked Out ({lockedCount})</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">User & Contact</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                        No user accounts match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition ${
                          user.status === 'pending'
                            ? 'bg-amber-50/40'
                            : user.status === 'locked'
                            ? 'bg-purple-50/30'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{user.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                          {user.phone && <div className="text-[10px] text-slate-400">{user.phone}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              user.role === 'administrator'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : user.role === 'agent'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {user.department}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1 ${
                              user.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : user.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : user.status === 'locked'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : user.status === 'rejected'
                                ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {user.status === 'pending' && <Clock className="w-3 h-3" />}
                            {user.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            {user.status === 'locked' && <Lock className="w-3 h-3" />}
                            {user.status === 'suspended' && <UserX className="w-3 h-3" />}
                            {user.status === 'pending' ? 'Pending Approval' : user.status === 'locked' ? 'Locked Out' : user.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* If Pending Approval */}
                            {user.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => onApproveUser && onApproveUser(user.id)}
                                  title="Approve User Account"
                                  className="text-[11px] px-2.5 py-1 rounded font-bold border border-emerald-300 text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 shadow-xs transition"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => setSelectedUserForDeny(user)}
                                  title="Deny or Reject Application"
                                  className="text-[11px] px-2.5 py-1 rounded font-semibold border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 transition"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Deny</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Password Reset Button */}
                                <button
                                  onClick={() => {
                                    setSelectedUserForReset(user);
                                    setNewPasswordInput('');
                                  }}
                                  title="Reset Password"
                                  className="text-[11px] px-2 py-1 rounded font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 shadow-xs transition"
                                >
                                  <KeyRound className="w-3 h-3 text-slate-500" />
                                  <span>Reset Pass</span>
                                </button>

                                {/* Lockout / Unlock Toggle */}
                                <button
                                  onClick={() => onToggleLockout && onToggleLockout(user.id, user.status !== 'locked')}
                                  title={user.status === 'locked' ? 'Unlock Account' : 'Lock Out Account'}
                                  className={`text-[11px] px-2 py-1 rounded font-semibold border flex items-center gap-1 transition ${
                                    user.status === 'locked'
                                      ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {user.status === 'locked' ? (
                                    <>
                                      <Unlock className="w-3 h-3" />
                                      <span>Unlock</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3 h-3 text-purple-600" />
                                      <span>Lock</span>
                                    </>
                                  )}
                                </button>

                                {/* Suspend / Reactivate */}
                                <button
                                  onClick={() =>
                                    onUpdateUserStatus(
                                      user.id,
                                      user.status === 'active' ? 'suspended' : 'active'
                                    )
                                  }
                                  className={`text-[11px] px-2 py-1 rounded font-semibold border transition ${
                                    user.status === 'active'
                                      ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEDICATED PENDING APPROVAL QUEUE */}
      {adminTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending Account Registration Review Queue</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit credentials, specialty trade domains, and claimed experience before authorizing system access.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono">
              {pendingApprovalsCount} Pending Review
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">All Registration Requests Cleared</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending accounts awaiting administrative authorization. All registered administrators, technicians, and requesters have been processed.
              </p>
              <button
                onClick={() => setAdminTab('users')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Return to User Directory
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((pUser) => (
                <div
                  key={pUser.id}
                  className="bg-white border border-amber-300 rounded-xl p-4.5 shadow-sm space-y-3.5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-400" />

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{pUser.fullName}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {pUser.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{pUser.email}</div>
                      {pUser.phone && <div className="text-xs text-slate-600 mt-0.5 font-medium">{pUser.phone}</div>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Approval
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Unit / Department:</span>
                      <strong className="text-slate-800">{pUser.department || 'Not specified'}</strong>
                    </div>
                    {pUser.domain && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Target Trade Domain:</span>
                        <strong className="text-blue-700">{pUser.domain}</strong>
                      </div>
                    )}
                    {pUser.experienceYears && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Claimed Experience:</span>
                        <strong className="text-slate-800">{pUser.experienceYears} Years</strong>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Registered On:</span>
                      <span className="text-slate-600 font-mono text-[11px]">{pUser.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedUserForDeny(pUser)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Deny Application</span>
                    </button>
                    <button
                      onClick={() => onApproveUser && onApproveUser(pUser.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Activate Account</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORK SHIFTS & WORKING HOURS */}
      {adminTab === 'shifts' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Field Workforce Shifts & Operational Hours</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure shift schedules and on-call emergency readiness for Nairobi field technicians.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Nairobi Metro Operational Clock (EAT • UTC+3)</span>
            </div>
          </div>

          {/* Shift Schedule Presets Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SHIFT_PRESETS.map((p, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{p.name.split('(')[0].trim()}</span>
                  <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {p.start} - {p.end}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Technicians Shift Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
              Technician Shift Assignments ({agents.length} Field Specialists)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Field Specialist</th>
                    <th className="py-2.5 px-3">Assigned Shift</th>
                    <th className="py-2.5 px-3">Working Hours</th>
                    <th className="py-2.5 px-3">Live Duty Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {agents.map((ag) => {
                    const duty = getAgentDutyStatus(ag.shiftStart, ag.shiftEnd, ag.isOnCall);
                    return (
                      <tr key={ag.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{ag.name}</div>
                          <div className="text-[11px] text-slate-500">{ag.domain}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {ag.shiftName || 'Standard Business (08:00 - 17:00)'}
                          {ag.isOnCall && (
                            <span className="ml-2 px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              On-Call
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {ag.shiftStart || '08:00'} — {ag.shiftEnd || '17:00'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${duty.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${duty.status === 'ON_DUTY' ? 'bg-emerald-600' : duty.status === 'ON_CALL' ? 'bg-amber-600' : 'bg-slate-400'}`} />
                            {duty.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedAgentForShift(ag);
                              setShiftPresetChoice(ag.shiftName || SHIFT_PRESETS[0].name);
                              setCustomShiftStart(ag.shiftStart || '08:00');
                              setCustomShiftEnd(ag.shiftEnd || '17:00');
                              setIsShiftOnCall(Boolean(ag.isOnCall));
                            }}
                            className="text-[11px] px-2.5 py-1 rounded font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition"
                          >
                            Update Shift
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MASTER PASSCODE & SECURITY GOVERNANCE */}
      {adminTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Master Administrator Authorization Passcode</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Superuser registration key used to verify and activate administrator accounts without awaiting manual approval.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                RBAC Level 1 Security
              </span>
            </div>

            {/* Current Active Key Display */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Current Master Passcode in Production:
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                    {showMasterPasscode ? masterPasscode : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMasterPasscode(!showMasterPasscode)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                    title={showMasterPasscode ? 'Hide Passcode' : 'Reveal Passcode'}
                  >
                    {showMasterPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(masterPasscode);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                    title="Copy to Clipboard"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 max-w-sm">
                Saved in server environment variables (<code className="font-mono text-purple-900">ADMIN_REGISTRATION_KEY</code>) and verified dynamically during registration.
              </div>
            </div>

            {/* Change Passcode Form */}
            <form onSubmit={handleSaveMasterKey} className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-900">
                Update Master Authorization Passcode:
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={newMasterPasscode}
                  onChange={(e) => setNewMasterPasscode(e.target.value)}
                  placeholder="Enter new master key (min. 6 characters)"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                />

                <button
                  type="button"
                  onClick={generateRandomKey}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>

                <button
                  type="submit"
                  disabled={updatingPasscode || !newMasterPasscode}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs"
                >
                  {updatingPasscode ? 'Saving...' : 'Save New Master Key'}
                </button>
              </div>

              {passcodeSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passcodeSuccessMsg}</span>
                </div>
              )}

              {passcodeErrorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passcodeErrorMsg}</span>
                </div>
              )}
            </form>

            {/* Governance Information Notice */}
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Security Policy & Passcode Guidelines</span>
              </div>
              <ul className="list-disc pl-4 text-[11px] space-y-1 text-blue-800">
                <li>Rotate this key periodically or immediately if an administrator leaves the organization.</li>
                <li>Never share this passcode over unencrypted email or public channels.</li>
                <li>Candidates registering without this key will remain in the <strong>Pending Approvals</strong> queue until manually reviewed.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALGORITHM PRESETS & POLICY */}
      {adminTab === 'algorithm' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Optimization Scoring Presets</h3>
                <p className="text-xs text-slate-500">
                  Select a standardized operational profile to calibrate allocation behavior
                </p>
              </div>
              <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Active Weights: S:{currentWeights.wSkill} | P:{currentWeights.wProximity} | W:{currentWeights.wWorkload}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPTIMIZATION_PRESETS.map((preset) => {
                const isActive =
                  currentWeights.wSkill === preset.weights.wSkill &&
                  currentWeights.wProximity === preset.weights.wProximity &&
                  currentWeights.wWorkload === preset.weights.wWorkload;

                return (
                  <div
                    key={preset.id}
                    className={`bg-white border rounded-xl p-4 transition-all shadow-xs space-y-3 ${
                      isActive
                        ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900">{preset.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">w₁ Skill</span>
                        <strong className="text-blue-700 font-mono">
                          {(preset.weights.wSkill * 100).toFixed(0)}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">w₂ Proximity</span>
                        <strong className="text-emerald-700 font-mono">
                          {(preset.weights.wProximity * 100).toFixed(0)}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">w₃ Workload</span>
                        <strong className="text-slate-800 font-mono">
                          {(preset.weights.wWorkload * 100).toFixed(0)}%
                        </strong>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onApplyPreset(preset)}
                        disabled={isActive}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Apply Preset</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5">
              Operational Constraints & Dispatch Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <label className="font-semibold text-slate-800 block">
                  Max Dispatch Radius
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={policy.maxProximityRadiusKm}
                    onChange={(e) =>
                      onUpdatePolicy({
                        ...policy,
                        maxProximityRadiusKm: parseInt(e.target.value) || 25,
                      })
                    }
                    className="w-20 bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-bold font-mono"
                  />
                  <span className="text-slate-500">kilometers</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <label className="font-semibold text-slate-800 block">
                  Max Tasks Per Agent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={policy.maxActiveTasksPerAgent}
                    onChange={(e) =>
                      onUpdatePolicy({
                        ...policy,
                        maxActiveTasksPerAgent: parseInt(e.target.value) || 3,
                      })
                    }
                    className="w-20 bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-bold font-mono"
                  />
                  <span className="text-slate-500">concurrent jobs</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <label className="font-semibold text-slate-800 block">
                  GPS Broadcast Interval
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={policy.gpsPingIntervalSec}
                    onChange={(e) =>
                      onUpdatePolicy({
                        ...policy,
                        gpsPingIntervalSec: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-20 bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-bold font-mono"
                  />
                  <span className="text-slate-500">seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MASTER SKILLS TAXONOMY */}
      {adminTab === 'taxonomy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Domain & Competency Master Dictionary
              </h3>
              <p className="text-xs text-slate-500">
                Core skill tags and verified credentials recognized by the NLP extraction engine
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MASTER_DOMAINS.map((domain, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-xs text-slate-900">{domain.domain}</h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {domain.skills.length} skills • {domain.certifications.length} certs
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Standard Skills
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {domain.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Recognized Certifications & Licenses
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {domain.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Modal 1: Password Reset Modal */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900">Reset User Password</h3>
              </div>
              <button
                onClick={() => setSelectedUserForReset(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="p-4 space-y-3.5">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <span className="text-slate-500">Account: </span>
                  <strong className="text-slate-900">{selectedUserForReset.fullName}</strong>
                </div>
                <div className="font-mono text-slate-600 text-[11px]">{selectedUserForReset.email}</div>
                <div>
                  <span className="text-slate-500">Role: </span>
                  <span className="font-bold text-blue-700 uppercase">{selectedUserForReset.role}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(`GeoPass#${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Generate Temporary
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 font-mono focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unlockCheckbox"
                  checked={unlockOnReset}
                  onChange={(e) => setUnlockOnReset(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <label htmlFor="unlockCheckbox" className="text-slate-700 cursor-pointer">
                  Unlock account immediately if currently locked or suspended
                </label>
              </div>

              {resetSuccessMessage && (
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPasswordInput}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  {resettingPassword ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Deny Registration Modal */}
      {selectedUserForDeny && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold">Deny Registration Application</h3>
              </div>
              <button
                onClick={() => setSelectedUserForDeny(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <p className="text-slate-600">
                You are rejecting the registration request for{' '}
                <strong className="text-slate-900">{selectedUserForDeny.fullName}</strong> ({selectedUserForDeny.email}).
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rejection Reason</label>
                <input
                  type="text"
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deletePermanently"
                  checked={deletePermanently}
                  onChange={(e) => setDeletePermanently(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <label htmlFor="deletePermanently" className="text-slate-700 cursor-pointer font-semibold text-rose-700">
                  Permanently purge / delete application from database
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDeny(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDenyUser}
                  disabled={denyingUser}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
                >
                  {denyingUser ? 'Processing...' : deletePermanently ? 'Purge Record' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Update Shift Modal */}
      {selectedAgentForShift && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Assign Working Shift</h3>
              </div>
              <button
                onClick={() => setSelectedAgentForShift(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteSaveShift} className="p-4 space-y-3.5">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <span className="text-slate-500">Technician: </span>
                  <strong className="text-slate-900">{selectedAgentForShift.name}</strong>
                </div>
                <div className="text-slate-600 font-medium">{selectedAgentForShift.domain}</div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Shift Schedule</label>
                <select
                  value={shiftPresetChoice}
                  onChange={(e) => setShiftPresetChoice(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  {SHIFT_PRESETS.map((p, idx) => (
                    <option key={idx} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="Custom Hours">Custom Working Hours</option>
                </select>
              </div>

              {shiftPresetChoice === 'Custom Hours' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Shift Start</label>
                    <input
                      type="time"
                      value={customShiftStart}
                      onChange={(e) => setCustomShiftStart(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Shift End</label>
                    <input
                      type="time"
                      value={customShiftEnd}
                      onChange={(e) => setCustomShiftEnd(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="onCallToggle"
                  checked={isShiftOnCall}
                  onChange={(e) => setIsShiftOnCall(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="onCallToggle" className="text-slate-700 cursor-pointer font-semibold">
                  Designate as Night Emergency On-Call Standby
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAgentForShift(null)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShift}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 shadow-xs"
                >
                  {savingShift ? 'Saving...' : 'Save Shift Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Add System User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Mary Atieno"
                  className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. mary.atieno@geotask.ke"
                  className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="administrator">Administrator</option>
                    <option value="agent">Field Agent</option>
                    <option value="requester">Task Requester</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
