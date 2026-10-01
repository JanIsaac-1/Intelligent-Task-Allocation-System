import React, { useState } from 'react';
import { SystemUser, AllocationWeights, AlgorithmPolicy, Role } from '../../types';
import { OPTIMIZATION_PRESETS, MASTER_DOMAINS, PresetConfig } from '../../data/mockData';
import {
  Users,
  Shield,
  Sliders,
  Award,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  UserCheck,
  UserX,
  Zap,
  SlidersHorizontal,
  Settings,
  BookOpen,
  Filter,
  X,
  Clock,
  Radio,
} from 'lucide-react';

interface AdminPortalViewProps {
  systemUsers: SystemUser[];
  onAddUser: (user: SystemUser) => void;
  onUpdateUserStatus: (userId: string, status: SystemUser['status']) => void;
  onUpdateUserRole: (userId: string, role: Role) => void;
  currentWeights: AllocationWeights;
  onApplyPreset: (preset: PresetConfig) => void;
  policy: AlgorithmPolicy;
  onUpdatePolicy: (policy: AlgorithmPolicy) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  systemUsers,
  onAddUser,
  onUpdateUserStatus,
  onUpdateUserRole,
  currentWeights,
  onApplyPreset,
  policy,
  onUpdatePolicy,
}) => {
  const [adminTab, setAdminTab] = useState<'users' | 'algorithm' | 'taxonomy'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+254 7');
  const [newRole, setNewRole] = useState<Role>('agent');
  const [newDepartment, setNewDepartment] = useState('Field Operations');

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

  const adminCount = systemUsers.filter((u) => u.role === 'administrator').length;
  const agentCount = systemUsers.filter((u) => u.role === 'agent').length;
  const requesterCount = systemUsers.filter((u) => u.role === 'requester').length;
  const pendingApprovalsCount = systemUsers.filter((u) => u.status === 'pending').length;

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
              Role-based user management, account registration approvals, and global dispatch algorithms
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setAdminTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & RBAC ({systemUsers.length})</span>
            {pendingApprovalsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('algorithm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              adminTab === 'algorithm'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
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
            <BookOpen className="w-3.5 h-3.5" />
            <span>Skills Catalog</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS & RBAC */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Users</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{systemUsers.length}</div>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              className={`border rounded-xl p-3.5 shadow-xs cursor-pointer transition ${
                pendingApprovalsCount > 0
                  ? 'bg-amber-50/90 border-amber-300 hover:bg-amber-100/80'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase flex items-center justify-between ${
                pendingApprovalsCount > 0 ? 'text-amber-800' : 'text-slate-500'
              }`}>
                <span>Pending Approvals</span>
                <Clock className="w-3 h-3" />
              </span>
              <div className={`text-xl font-bold mt-0.5 flex items-center gap-1.5 ${
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

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-blue-700 font-semibold uppercase">Administrators</span>
              <div className="text-xl font-bold text-blue-700 mt-0.5">{adminCount}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-emerald-700 font-semibold uppercase">Field Agents</span>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">{agentCount}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-600 font-semibold uppercase">Requesters</span>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{requesterCount}</div>
            </div>
          </div>

          {/* Pending Approval Attention Banner */}
          {pendingApprovalsCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs text-amber-950">
                <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">
                    {pendingApprovalsCount} New Registration{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Approval
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Accounts cannot log in until an administrator approves their identity and roles.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('pending')}
                className="px-3 py-1.5 text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition shrink-0"
              >
                View Pending Queue
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
                  <option value="pending">Pending Review ({pendingApprovalsCount})</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add System User</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">User & Contact</th>
                    <th className="py-2.5 px-3">System Role</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created / Registered</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                        No users match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-slate-50/80 transition ${user.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{user.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
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
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {user.status === 'pending' && <Clock className="w-3 h-3" />}
                            {user.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            {user.status === 'suspended' && <UserX className="w-3 h-3" />}
                            {user.status === 'pending' ? 'Pending Approval' : user.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {user.createdAt || user.lastLogin}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => onUpdateUserStatus(user.id, 'active')}
                                  title="Approve User Registration"
                                  className="text-[11px] px-2.5 py-1 rounded font-bold border border-emerald-300 text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 shadow-xs transition"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => onUpdateUserStatus(user.id, 'suspended')}
                                  title="Reject / Deny Account"
                                  className="text-[11px] px-2 py-1 rounded font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 transition"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  onUpdateUserStatus(
                                    user.id,
                                    user.status === 'active' ? 'suspended' : 'active'
                                  )
                                }
                                className={`text-[11px] px-2.5 py-0.5 rounded font-semibold border transition ${
                                  user.status === 'active'
                                    ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                              </button>
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

      {/* TAB 2: ALGORITHM PRESETS & POLICY */}
      {adminTab === 'algorithm' && (
        <div className="space-y-6">
          {/* Preset Cards */}
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

                    {/* Weight Values Indicator */}
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

          {/* Operational Policy Thresholds */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5">
              Operational Constraints & Dispatch Rules (Proposal Section 3.5)
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
                <p className="text-[10px] text-slate-500 mt-1">
                  Technicians beyond this distance receive zero proximity credit.
                </p>
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
                <p className="text-[10px] text-slate-500 mt-1">
                  Agents reaching this cap are automatically marked as 'Busy'.
                </p>
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
                <p className="text-[10px] text-slate-500 mt-1">
                  Frequency of mobile Geolocation API telemetry updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER SKILLS TAXONOMY */}
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

      {/* Add User Modal */}
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
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
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
                  placeholder="e.g. mary.atieno@fieldops.co.ke"
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
