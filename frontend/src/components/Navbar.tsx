import React from 'react';
import { ShieldCheck, Smartphone, PlusCircle, BarChart3, MapPin, Users, Settings, LogOut } from 'lucide-react';
import { AgentProfile, Task, AuthUser } from '../types';

export type ActiveTab = 'admin' | 'agent' | 'requester' | 'analytics' | 'admin-portal';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  agents: AgentProfile[];
  tasks: Task[];
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  agents,
  tasks,
  currentUser,
  onLogout,
}) => {
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;
  const availableAgentsCount = agents.filter((a) => a.availability === 'available').length;

  const isAdmin = !currentUser || currentUser.role === 'administrator';
  const isAgent = currentUser?.role === 'agent';
  const isRequester = currentUser?.role === 'requester';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 lg:px-8 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <MapPin className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">GeoTask</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                ICS Project
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Location-Based Task Allocation & Dispatch System
            </p>
          </div>
        </div>

        {/* Navigation Tabs based on Role */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          {/* Dispatcher Map - Admin */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Dispatcher Map</span>
              {pendingTasksCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-[10px] text-white font-semibold">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          )}

          {/* Field Agent View - Admin or Agent */}
          {(isAdmin || isAgent) && (
            <button
              onClick={() => onTabChange('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'agent'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-700" />
              <span>Field Agent View</span>
            </button>
          )}

          {/* New Work Order - Admin or Requester */}
          {(isAdmin || isRequester) && (
            <button
              onClick={() => onTabChange('requester')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'requester'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-700" />
              <span>New Work Order</span>
            </button>
          )}

          {/* Admin Portal - Admin only */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin-portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'admin-portal'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Reports & Audit - Admin only */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-700" />
              <span>Reports & Audit</span>
            </button>
          )}
        </nav>

        {/* Status Indicators & User Profile */}
        <div className="flex items-center gap-3 text-xs">
          {isAdmin && (
            <div className="hidden xl:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  <strong>{availableAgentsCount}</strong> / {agents.length} Online
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>GPS Active</span>
              </div>
            </div>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 pl-2 md:border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {currentUser.fullName}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                      currentUser.role === 'administrator'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : currentUser.role === 'agent'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {currentUser.role === 'administrator'
                      ? 'Admin'
                      : currentUser.role === 'agent'
                      ? 'Field Technician'
                      : 'Requester'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
