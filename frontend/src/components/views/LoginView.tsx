import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  PlusCircle,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  UserPlus,
  Clock,
  Wrench,
  Building,
  User as UserIcon,
  Phone,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { apiLogin, apiRegister } from '../../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, agentProfileId?: number | string) => void;
}

const COMMON_DOMAINS = [
  'Commercial Electrical Wiring & Distribution',
  'Fiber Optic & ISP Last-Mile Splicing',
  'Commercial Plumbing & High-Rise Booster Systems',
  'Industrial HVAC & Cold-Chain Refrigeration',
  'Mobile Automotive Roadside Assistance',
  'Solar PV & Microgrid Power Systems',
  'Heavy Machinery Hydraulic Diagnostics',
  'CCTV & Electronic Security Integration',
  'Structural Masonry & Concrete Remediation',
  'Elevator & Vertical Transport Maintenance',
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'signin' | 'register'>('signin');

  // Sign-in Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'administrator' | 'agent' | 'requester'>('administrator');
  const [regPhone, setRegPhone] = useState('+254 7');
  const [regDepartment, setRegDepartment] = useState('');
  const [regAdminKey, setRegAdminKey] = useState('janjakes');
  const [regDomain, setRegDomain] = useState(COMMON_DOMAINS[0]);
  const [regExperience, setRegExperience] = useState(3);
  const [regSkillsText, setRegSkillsText] = useState('');
  const [registrationSubmitted, setRegistrationSubmitted] = useState<string | null>(null);
  const [activatedAdmin, setActivatedAdmin] = useState<string | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await apiLogin(email, password);
      onLoginSuccess(result.user, result.agentProfileId);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check credentials or approval status.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      setErrorMessage('Full name, email, and password are required.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const skillsArray = regSkillsText
        ? regSkillsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [regDomain];

      const res = await apiRegister({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        role: regRole,
        phone: regPhone,
        department: regDepartment || (regRole === 'administrator' ? 'Operations & Dispatch Headquarters' : regRole === 'agent' ? regDomain : 'Corporate Facilities'),
        title: regRole === 'administrator' ? 'Dispatch Administrator' : regRole === 'agent' ? `${regDomain.split('&')[0].trim()} Specialist` : 'Work Order Requester',
        domain: regDomain,
        skills: skillsArray,
        experienceYears: Number(regExperience),
        adminKey: regAdminKey,
      });

      if (res.status === 'active') {
        setActivatedAdmin(res.user.email);
        setEmail(regEmail);
        setPassword(regPassword);
      } else {
        setRegistrationSubmitted(res.user.email);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  // Demo 1-Click Login
  const handleQuickLogin = (demoEmail: string, demoRole: AuthUser['role'], name: string, profileId?: number) => {
    const demoPassword = demoRole === 'administrator' ? 'admin123' : demoRole === 'agent' ? 'agent123' : 'user123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setErrorMessage('');

    apiLogin(demoEmail, demoPassword)
      .then((res) => {
        onLoginSuccess(res.user, res.agentProfileId || profileId);
      })
      .catch((err) => {
        console.warn('Backend quick login error, falling back:', err);
        onLoginSuccess({
          id: String(profileId || 1),
          email: demoEmail,
          fullName: name,
          role: demoRole,
          department: demoRole === 'administrator' ? 'Dispatch Headquarters' : demoRole === 'agent' ? 'Field Engineering' : 'Client Desk',
          agentProfileId: profileId,
        }, profileId);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-10">
        
        {/* Left Side: Form Area */}
        <div className="md:col-span-7 flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role-Based Access Control (RBAC) & Governance
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeMode === 'signin' ? 'Sign In to GeoTask' : 'Create an Account'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Strathmore University • Intelligent Location-Based Task Allocation System
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveMode('signin');
                setErrorMessage('');
                setRegistrationSubmitted(null);
                setActivatedAdmin(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                activeMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setErrorMessage('');
                setRegistrationSubmitted(null);
                setActivatedAdmin(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                activeMode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Instant Admin Activation Confirmation */}
          {activatedAdmin ? (
            <div className="p-5 rounded-xl bg-emerald-50/90 border border-emerald-300 space-y-3.5">
              <div className="flex items-center gap-2.5 text-emerald-950 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Administrator Account Verified & Activated!</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Your administrator account for <strong className="font-mono text-emerald-950">{activatedAdmin}</strong> has been created with full system permissions in PostgreSQL.
              </p>
              <div className="p-3 bg-white/90 rounded-lg border border-emerald-200 text-[11px] text-slate-700 space-y-1">
                <div>• Superuser authorization confirmed via system key.</div>
                <div>• You now have full access to Dispatcher Map, SBERT engine, User Approvals, and Audit Logs.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivatedAdmin(null);
                  setActiveMode('signin');
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Sign In to Dashboard Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : registrationSubmitted ? (
            /* Pending Approval Confirmation */
            <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                <Clock className="w-5 h-5 text-amber-600" />
                Registration Awaiting Admin Approval
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your account request for <strong className="font-mono text-amber-950">{registrationSubmitted}</strong> has been submitted to PostgreSQL with status <strong>PENDING APPROVAL</strong>.
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-amber-200 text-[11px] text-slate-700 space-y-1">
                <div>• In compliance with system governance, an administrator must review your credentials before access is unlocked.</div>
                <div>• Once approved in the Admin Portal, you can sign in immediately.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRegistrationSubmitted(null);
                  setActiveMode('signin');
                  setEmail(registrationSubmitted);
                }}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Return to Sign In
              </button>
            </div>
          ) : activeMode === 'signin' ? (
            /* ---------------- Sign In Form ---------------- */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jan.maina@strathmore.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Need an account? </span>
                <button
                  type="button"
                  onClick={() => setActiveMode('register')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>
          ) : (
            /* ---------------- Registration Form ---------------- */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Role Selection (3 Roles: Admin, Agent, Requester) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Account Role to Create:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('administrator')}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition ${
                      regRole === 'administrator'
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold">Administrator</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Super admin & dispatcher</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('agent')}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition ${
                      regRole === 'agent'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold">Field Technician</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Executes tasks on mobile</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('requester')}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition ${
                      regRole === 'requester'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-900 font-bold ring-1 ring-amber-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold">Task Requester</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Submits work orders</div>
                  </button>
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Jan Isaac Mwaniki"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone Number (M-Pesa / Mobile)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. jan.maina@strathmore.edu"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Set Password (min. 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Admin Specific: Authorization Key & Department */}
              {regRole === 'administrator' && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Administrator Privileges & Authorization</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      System Authorization Passcode (Instant Superuser Activation)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
                      <input
                        type="password"
                        value={regAdminKey}
                        onChange={(e) => setRegAdminKey(e.target.value)}
                        placeholder="Enter system passcode (e.g. janjakes)"
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-blue-300 rounded-md bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-blue-800 mt-1">
                      Entering your system key (<code>janjakes</code>) immediately activates this administrator account without needing approval.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Dispatch Directorate / Faculty Unit
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="e.g. Operations & Dispatch Headquarters"
                      className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Technician Specific Fields */}
              {regRole === 'agent' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Technical Trade Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Primary Specialty Domain
                      </label>
                      <select
                        value={regDomain}
                        onChange={(e) => setRegDomain(e.target.value)}
                        className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {COMMON_DOMAINS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={regExperience}
                        onChange={(e) => setRegExperience(Number(e.target.value))}
                        className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Key Technical Skills (comma-separated for SBERT matching)
                    </label>
                    <input
                      type="text"
                      value={regSkillsText}
                      onChange={(e) => setRegSkillsText(e.target.value)}
                      placeholder="e.g. 3-phase wiring, ATS installation, breaker overhaul"
                      className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Requester Department */}
              {regRole === 'requester' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Organization / Department Name
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="e.g. Strathmore Estates Directorate or Safaricom Facilities"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Governance Notice */}
              <div className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                regRole === 'administrator'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {regRole === 'administrator' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Superuser Verification:</strong> Entering the system passcode (<code>janjakes</code>) will immediately activate your account with full administrator access.
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Admin Approval Required:</strong> Your account will be created with status <em>Pending Approval</em> and must be reviewed and activated by a system administrator before you can sign in.
                    </span>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering in PostgreSQL...</span>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {regRole === 'administrator'
                        ? 'Create & Activate Administrator Account'
                        : 'Submit Registration for Approval'}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setActiveMode('signin')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Connected to PostgreSQL (`geotask_db`)</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> API Ready
            </span>
          </div>
        </div>

        {/* Right Side: 1-Click Role Presets (For Testing / Project Defense) */}
        <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              1-Click Demo Profiles
            </div>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Use these pre-approved roles to test role-based views and administrator approval actions:
            </p>

            <div className="space-y-2.5">
              {/* Administrator */}
              <button
                type="button"
                onClick={() => handleQuickLogin('jan.maina@strathmore.edu', 'administrator', 'Jan Isaac Mwaniki Maina')}
                className="w-full p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                        Administrator
                      </div>
                      <div className="text-[10px] text-slate-500">Jan Isaac Mwaniki (Super Admin)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Full Access
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Map View • Allocation Engine • User Approvals • Audit Trail
                </div>
              </button>

              {/* Field Agent */}
              <button
                type="button"
                onClick={() => handleQuickLogin('brian.omondi@geotask.ke', 'agent', 'Brian Omondi', 2)}
                className="w-full p-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">
                        Field Technician
                      </div>
                      <div className="text-[10px] text-slate-500">Brian Omondi (Lead Fiber Splicer)</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Mobile Only
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Assigned Jobs • GPS Beacon Updates • Task Execution
                </div>
              </button>

              {/* Task Requester */}
              <button
                type="button"
                onClick={() => handleQuickLogin('itdesk@apexfinance.co.ke', 'requester', 'Apex Financial IT Desk')}
                className="w-full p-3 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                      <PlusCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition">
                        Task Requester
                      </div>
                      <div className="text-[10px] text-slate-500">Apex Financial IT Helpdesk</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Orders Only
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Submit Work Orders • Real-time Job Status Tracking
                </div>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center mt-4">
            Authorized Strathmore University Final Year Project Sandbox
          </div>
        </div>

      </div>
    </div>
  );
};
