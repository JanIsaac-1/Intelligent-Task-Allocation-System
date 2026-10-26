import React, { useState, useEffect } from 'react';
import {
  AgentProfile,
  Task,
  AllocationWeights,
  SystemLog,
  SystemUser,
  AlgorithmPolicy,
  Role,
  AuthUser,
} from './types';
import {
  DEFAULT_ALGORITHM_POLICY,
  PresetConfig,
} from './data/config';
import { Navbar, ActiveTab } from './components/Navbar';
import { AdminDashboard } from './components/views/AdminDashboard';
import { AgentMobileView } from './components/views/AgentMobileView';
import { TaskRequesterView } from './components/views/TaskRequesterView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { AdminPortalView } from './components/views/AdminPortalView';
import { LoginView } from './components/views/LoginView';
import {
  fetchTasks,
  fetchAgents,
  fetchUsers,
  fetchLogs,
  createTask,
  assignAgentToTask,
  reassignTask,
  updateTaskStatus,
  updateAgentLocation,
  toggleAgentAvailability,
  updateAgentProfile,
  updateUserStatusApi,
  approveUserApi,
  apiDenyUser,
  apiResetUserPassword,
  apiToggleUserLockout,
  apiUpdateAgentShift,
  apiFetchSecuritySettings,
  apiUpdateMasterKey,
} from './services/api';
import { reverseGeocodeLocation } from './utils/geo';

export const App: React.FC = () => {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('geotask_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('geotask_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'agent') return 'agent';
        if (parsed.role === 'requester') return 'requester';
      }
    } catch {}
    return 'admin';
  });

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weights, setWeights] = useState<AllocationWeights>({
    wSkill: 0.50,
    wProximity: 0.30,
    wWorkload: 0.20,
  });
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [policy, setPolicy] = useState<AlgorithmPolicy>(DEFAULT_ALGORITHM_POLICY);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  const addLog = (action: string, details: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      details,
      type,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Hydrate initial data from local PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    const hydrateFromBackend = async () => {
      try {
        const [backendTasks, backendAgents, backendUsers, backendLogs] = await Promise.all([
          fetchTasks(),
          fetchAgents(),
          fetchUsers(),
          fetchLogs(),
        ]);
        if (!isMounted) return;
        setTasks(backendTasks || []);
        setAgents(backendAgents || []);
        setSystemUsers(backendUsers || []);
        if (backendLogs && backendLogs.length > 0) {
          setLogs(backendLogs);
        }

        // Asynchronously resolve physical address names for technicians
        if (backendAgents && backendAgents.length > 0) {
          backendAgents.forEach(async (ag) => {
            if (ag.currentLocation?.lat && ag.currentLocation?.lng) {
              const realAddr = await reverseGeocodeLocation(
                ag.currentLocation.lat,
                ag.currentLocation.lng
              );
              if (isMounted) {
                setAgents((prev) =>
                  prev.map((a) =>
                    a.id === ag.id
                      ? {
                          ...a,
                          currentLocation: {
                            ...a.currentLocation,
                            addressName: realAddr,
                          },
                        }
                      : a
                  )
                );
              }
            }
          });
        }

        addLog(
          'Database Synchronized',
          `PostgreSQL connected: loaded ${backendTasks?.length || 0} tasks, ${backendAgents?.length || 0} technicians, and ${backendUsers?.length || 0} system users.`,
          'success'
        );
      } catch (err) {
        console.warn('Backend server offline or initializing:', err);
      }
    };

    hydrateFromBackend();

    // Background polling every 10 seconds to sync live GPS telemetry across dispatch and agents
    const pollTimer = setInterval(async () => {
      try {
        const freshAgents = await fetchAgents();
        if (isMounted && freshAgents && freshAgents.length > 0) {
          setAgents(freshAgents);
        }
      } catch (err) {
        // background poll failure is non-critical
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user: AuthUser, agentProfileId?: number | string) => {
    const userWithAgent: AuthUser = {
      ...user,
      agentProfileId: agentProfileId || user.agentProfileId,
    };
    setCurrentUser(userWithAgent);
    try {
      localStorage.setItem('geotask_user', JSON.stringify(userWithAgent));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }

    if (user.role === 'agent') {
      setActiveTab('agent');
    } else if (user.role === 'requester') {
      setActiveTab('requester');
    } else {
      setActiveTab('admin');
    }

    addLog(
      'Session Authenticated',
      `${user.fullName} signed in as '${user.role.toUpperCase()}'.`,
      'success'
    );
  };

  // Handle logout
  const handleLogout = () => {
    try {
      localStorage.removeItem('geotask_user');
    } catch {}
    setCurrentUser(null);
    setActiveTab('admin');
    addLog('Session Terminated', 'User logged out successfully.', 'info');
  };

  // Handle task assignment by allocation engine or admin override
  const handleAssignTask = (taskId: string, agentId: string, score: number) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetTask || !targetAgent) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'assigned', assignedAgentId: agentId } : t
      )
    );

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              activeTaskCount: a.activeTaskCount + 1,
              availability: a.activeTaskCount + 1 >= policy.maxActiveTasksPerAgent ? 'busy' : 'available',
            }
          : a
      )
    );

    addLog(
      'Task Dispatched',
      `${targetTask.id} (${targetTask.category}) assigned to ${targetAgent.name} (Score: ${(score * 100).toFixed(1)}%).`,
      'success'
    );

    // Sync with PostgreSQL backend
    if (!isNaN(Number(taskId)) && !isNaN(Number(agentId))) {
      assignAgentToTask(taskId, agentId, score).catch((err) =>
        console.warn('Backend assignAgentToTask sync error:', err)
      );
    }
  };

  // Handle task reassignment / unassign
  const handleReassignTask = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || !targetTask.assignedAgentId) return;

    const previousAgentId = targetTask.assignedAgentId;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'pending', assignedAgentId: undefined } : t
      )
    );

    setAgents((prev) =>
      prev.map((a) =>
        a.id === previousAgentId
          ? {
              ...a,
              activeTaskCount: Math.max(0, a.activeTaskCount - 1),
              availability: 'available',
            }
          : a
      )
    );

    addLog(
      'Task Reset',
      `${targetTask.id} moved back to pending dispatch queue by administrator.`,
      'warning'
    );

    // Sync with PostgreSQL backend
    if (!isNaN(Number(taskId))) {
      reassignTask(taskId).catch((err) =>
        console.warn('Backend reassignTask sync error:', err)
      );
    }
  };

  // Update task status from agent mobile view (e.g. In Progress, Completed)
  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    if (status === 'completed' && targetTask.assignedAgentId) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === targetTask.assignedAgentId
            ? {
                ...a,
                activeTaskCount: Math.max(0, a.activeTaskCount - 1),
                completedTasksCount: a.completedTasksCount + 1,
                availability: 'available',
              }
            : a
        )
      );

      addLog(
        'Task Resolved',
        `${targetTask.id} marked as COMPLETED by field technician.`,
        'success'
      );
    } else {
      addLog(
        'Status Updated',
        `${targetTask.id} transitioned to '${status.toUpperCase()}'.`,
        'info'
      );
    }

    // Sync with PostgreSQL backend
    if (!isNaN(Number(taskId))) {
      updateTaskStatus(taskId, status).catch((err) =>
        console.warn('Backend updateTaskStatus sync error:', err)
      );
    }
  };

  // Add new agent
  const handleAddAgent = (newAgent: AgentProfile) => {
    setAgents((prev) => [newAgent, ...prev]);
    addLog(
      'Technician Enrolled',
      `Profile registered for ${newAgent.name} (${newAgent.title}) with ${newAgent.skills.length} extracted skills.`,
      'info'
    );
  };

  // Update existing technician profile
  const handleUpdateAgent = async (updatedAgent: AgentProfile) => {
    // 1. Optimistic UI update
    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );

    addLog(
      'Technician Profile Modified',
      `Admin updated profile for ${updatedAgent.name} (${updatedAgent.title}) with ${updatedAgent.skills.length} skills and ${updatedAgent.certifications.length} licenses.`,
      'info'
    );

    // 2. Sync with PostgreSQL backend
    if (!isNaN(Number(updatedAgent.id))) {
      try {
        await updateAgentProfile(updatedAgent.id, updatedAgent);
      } catch (err) {
        console.warn('Backend updateAgentProfile sync error:', err);
      }
    }
  };

  // Toggle availability
  const handleToggleAgentAvailability = (agentId: string) => {
    let nextState: AgentProfile['availability'] = 'available';

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        nextState =
          a.availability === 'available'
            ? 'busy'
            : a.availability === 'busy'
            ? 'offline'
            : 'available';
        return { ...a, availability: nextState };
      })
    );

    // Sync with PostgreSQL backend
    if (!isNaN(Number(agentId))) {
      toggleAgentAvailability(agentId, nextState).catch((err) =>
        console.warn('Backend toggleAgentAvailability sync error:', err)
      );
    }
  };

  // Simulate GPS coordinates movement
  const handleSimulateGpsMovement = (agentId: string) => {
    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetAgent) return;

    const applyCoordinates = async (lat: number, lng: number, source: string) => {
      // 1. Immediately apply coordinates for prompt responsiveness
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                currentLocation: {
                  ...a.currentLocation,
                  lat,
                  lng,
                },
                lastUpdated: `Live ${source}`,
              }
            : a
        )
      );

      // 2. Sync with PostgreSQL backend immediately
      if (!isNaN(Number(agentId))) {
        updateAgentLocation(agentId, lat, lng).catch((err) =>
          console.warn('Backend updateAgentLocation sync error:', err)
        );
      }

      // 3. Resolve human-readable address name from Nominatim
      try {
        const resolvedAddress = await reverseGeocodeLocation(lat, lng);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  currentLocation: {
                    ...a.currentLocation,
                    lat,
                    lng,
                    addressName: resolvedAddress,
                  },
                }
              : a
          )
        );

        // Persist newly resolved physical address to PostgreSQL backend
        if (!isNaN(Number(agentId))) {
          updateAgentLocation(agentId, lat, lng, resolvedAddress).catch((err) =>
            console.warn('Backend updateAgentLocation sync error:', err)
          );
        }

        addLog(
          'GPS Beacon Transmitted',
          `Technician ${targetAgent.name} located at ${resolvedAddress} [${source}].`,
          'info'
        );
      } catch {
        addLog(
          'GPS Beacon Transmitted',
          `Technician ${targetAgent.name} updated coordinates to [${lat}, ${lng}] (${source}).`,
          'info'
        );
      }
    };

    // Attempt real browser / device geolocation first
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLat = parseFloat(pos.coords.latitude.toFixed(5));
          const liveLng = parseFloat(pos.coords.longitude.toFixed(5));
          applyCoordinates(liveLat, liveLng, 'Device GPS');
        },
        (err) => {
          console.info('Device GPS unavailable or permission declined; using simulated GPS delta:', err.message);
          const latDelta = (Math.random() - 0.5) * 0.005;
          const lngDelta = (Math.random() - 0.5) * 0.005;
          const updatedLat = parseFloat((targetAgent.currentLocation.lat + latDelta).toFixed(5));
          const updatedLng = parseFloat((targetAgent.currentLocation.lng + lngDelta).toFixed(5));
          applyCoordinates(updatedLat, updatedLng, 'Simulated Ping');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const latDelta = (Math.random() - 0.5) * 0.005;
      const lngDelta = (Math.random() - 0.5) * 0.005;
      const updatedLat = parseFloat((targetAgent.currentLocation.lat + latDelta).toFixed(5));
      const updatedLng = parseFloat((targetAgent.currentLocation.lng + lngDelta).toFixed(5));
      applyCoordinates(updatedLat, updatedLng, 'Simulated Ping');
    }
  };

  // Create new task
  const handleCreateTask = async (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    addLog(
      'Task Submitted',
      `New request ${newTask.id} (${newTask.title}) received from ${newTask.requesterName}.`,
      'info'
    );

    // Sync with PostgreSQL backend
    try {
      const saved = await createTask({
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        requiredSkills: newTask.requiredSkills,
        priority: newTask.priority,
        lat: newTask.location.lat,
        lng: newTask.location.lng,
        addressName: newTask.location.addressName,
      });

      // Update the temporary ID with PostgreSQL ID
      setTasks((prev) =>
        prev.map((t) => (t.id === newTask.id ? { ...t, id: String(saved.id) } : t))
      );
    } catch (err) {
      console.warn('Could not persist task to backend, keeping local state:', err);
    }
  };

  // Add system user
  const handleAddUser = (newUser: SystemUser) => {
    setSystemUsers((prev) => [newUser, ...prev]);
    addLog(
      'User Account Created',
      `New user ${newUser.fullName} (${newUser.role}) enrolled into ${newUser.department}.`,
      'info'
    );
  };

  // Update user status & approvals
  const handleUpdateUserStatus = (userId: string, status: SystemUser['status']) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    const user = systemUsers.find((u) => u.id === userId);
    addLog(
      status === 'active' ? 'User Registration Approved' : 'User Status Changed',
      `User ${user?.fullName || userId} status set to '${status.toUpperCase()}'.`,
      status === 'active' ? 'success' : 'warning'
    );

    // Sync with PostgreSQL backend
    if (!isNaN(Number(userId))) {
      updateUserStatusApi(userId, status)
        .then(() => {
          // If a technician was approved, re-fetch agents so they appear on dispatcher map
          fetchAgents().then(setAgents).catch(() => {});
        })
        .catch((err) => console.warn('Backend updateUserStatusApi sync error:', err));
    }
  };

  // Update user role
  const handleUpdateUserRole = (userId: string, role: Role) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
  };

  // Approve pending user registration
  const handleApproveUser = async (userId: string) => {
    try {
      await approveUserApi(userId);
      setSystemUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
      );
      const user = systemUsers.find((u) => u.id === userId);
      addLog(
        'User Registration Approved',
        `User ${user?.fullName || userId} (${user?.role}) has been approved and activated.`,
        'success'
      );
      const updatedAgents = await fetchAgents();
      setAgents(updatedAgents || []);
    } catch (err: any) {
      console.error('Failed to approve user:', err);
      alert(err.message || 'Failed to approve user');
    }
  };

  // Deny / Reject user registration
  const handleDenyUser = async (userId: string, reason?: string, deleteAccount?: boolean) => {
    try {
      const res = await apiDenyUser(userId, reason, deleteAccount);
      if (deleteAccount || res?.deleted) {
        setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
        addLog('Registration Purged', `Registration request #${userId} was deleted from database.`, 'warning');
      } else {
        setSystemUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u))
        );
        addLog('Registration Denied', `Registration request #${userId} was rejected. Reason: ${reason || 'Denied by admin'}`, 'warning');
      }
    } catch (err: any) {
      console.error('Failed to deny user:', err);
      alert(err.message || 'Failed to deny user');
    }
  };

  // Reset user password
  const handleResetPassword = async (userId: string, newPassword: string, unlock?: boolean) => {
    try {
      await apiResetUserPassword(userId, newPassword, unlock);
      if (unlock) {
        setSystemUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
        );
      }
      const user = systemUsers.find((u) => u.id === userId);
      addLog('Password Reset', `Administrator reset credentials for ${user?.fullName || userId}.`, 'info');
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      throw err;
    }
  };

  // Toggle account lockout
  const handleToggleLockout = async (userId: string, lock: boolean) => {
    try {
      await apiToggleUserLockout(userId, lock);
      const targetStatus = lock ? 'locked' : 'active';
      setSystemUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: targetStatus } : u))
      );
      const user = systemUsers.find((u) => u.id === userId);
      addLog(
        lock ? 'Account Locked' : 'Account Restored',
        `Account for ${user?.fullName || userId} is now ${targetStatus.toUpperCase()}.`,
        lock ? 'warning' : 'success'
      );
    } catch (err: any) {
      console.error('Failed to toggle lockout:', err);
      alert(err.message || 'Failed to update lockout state');
    }
  };

  // Update technician shift
  const handleUpdateAgentShift = async (
    agentId: string,
    shift: { shiftName?: string; shiftStart?: string; shiftEnd?: string; isOnCall?: boolean }
  ) => {
    try {
      const updated = await apiUpdateAgentShift(agentId, shift);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                shiftName: updated.shift_name,
                shiftStart: updated.shift_start,
                shiftEnd: updated.shift_end,
                isOnCall: Boolean(updated.is_on_call),
              }
            : a
        )
      );
      addLog(
        'Work Shift Updated',
        `Work schedule for technician #${agentId} updated to ${shift.shiftName || 'custom'}.`,
        'info'
      );
    } catch (err: any) {
      console.error('Failed to update shift:', err);
      throw err;
    }
  };

  // Apply algorithm preset
  const handleApplyPreset = (preset: PresetConfig) => {
    setWeights(preset.weights);
    addLog(
      'Optimization Preset Applied',
      `Global allocation weights updated to '${preset.name}' (S:${preset.weights.wSkill}, P:${preset.weights.wProximity}, W:${preset.weights.wWorkload}).`,
      'success'
    );
  };

  // Update policy
  const handleUpdatePolicy = (newPolicy: AlgorithmPolicy) => {
    setPolicy(newPolicy);
    addLog(
      'Policy Thresholds Updated',
      `Max Radius: ${newPolicy.maxProximityRadiusKm}km, Max Concurrent: ${newPolicy.maxActiveTasksPerAgent}, Ping: ${newPolicy.gpsPingIntervalSec}s.`,
      'info'
    );
  };

  // If user is not authenticated, render LoginView
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        agents={agents}
        tasks={tasks}
        systemUsers={systemUsers}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {activeTab === 'admin' && (
          <AdminDashboard
            agents={agents}
            tasks={tasks}
            weights={weights}
            onWeightsChange={setWeights}
            onAssignTask={handleAssignTask}
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
            onToggleAgentAvailability={handleToggleAgentAvailability}
            onReassignTask={handleReassignTask}
            onSimulateGpsMovement={handleSimulateGpsMovement}
          />
        )}

        {activeTab === 'agent' && (
          <AgentMobileView
            agents={agents}
            tasks={tasks}
            currentUser={currentUser}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSimulateGpsMovement={handleSimulateGpsMovement}
            onToggleAvailability={handleToggleAgentAvailability}
          />
        )}

        {activeTab === 'requester' && (
          <TaskRequesterView
            onCreateTask={handleCreateTask}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'admin-portal' && (
          <AdminPortalView
            systemUsers={systemUsers}
            agents={agents}
            onAddUser={handleAddUser}
            onUpdateUserStatus={handleUpdateUserStatus}
            onUpdateUserRole={handleUpdateUserRole}
            onApproveUser={handleApproveUser}
            onDenyUser={handleDenyUser}
            onResetPassword={handleResetPassword}
            onToggleLockout={handleToggleLockout}
            onUpdateAgentShift={handleUpdateAgentShift}
            currentWeights={weights}
            onApplyPreset={handleApplyPreset}
            policy={policy}
            onUpdatePolicy={handleUpdatePolicy}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            agents={agents}
            tasks={tasks}
            logs={logs}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-center text-xs text-slate-500 font-medium">
        GeoTask Intelligent Operations Platform • Field Workforce & Location-Based Task Allocation System
      </footer>
    </div>
  );
};

export default App;
