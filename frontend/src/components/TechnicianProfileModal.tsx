import React, { useState } from 'react';
import { AgentProfile, AgentAvailability } from '../types';
import {
  X,
  Check,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Briefcase,
  Award,
  Wrench,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface TechnicianProfileModalProps {
  agent: AgentProfile;
  onUpdateAgent: (updatedAgent: AgentProfile) => Promise<void> | void;
  onClose: () => void;
  onPingGps?: (agentId: string) => void;
}

export const TechnicianProfileModal: React.FC<TechnicianProfileModalProps> = ({
  agent,
  onUpdateAgent,
  onClose,
  onPingGps,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<'details' | 'skills' | 'telemetry'>('details');

  // Form State
  const [name, setName] = useState(agent.name);
  const [title, setTitle] = useState(agent.title);
  const [domain, setDomain] = useState(agent.domain);
  const [phone, setPhone] = useState(agent.phone || '+254 700 000 000');
  const [email] = useState(agent.email || '');
  const [experienceYears, setExperienceYears] = useState(agent.experienceYears || 1);
  const [availability, setAvailability] = useState<AgentAvailability>(agent.availability);
  const [bio, setBio] = useState(agent.bio || '');

  // Skills & Certifications Arrays
  const [skills, setSkills] = useState<string[]>(agent.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [certifications, setCertifications] = useState<string[]>(agent.certifications || []);
  const [newCert, setNewCert] = useState('');

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Skill Management
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (!skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Certification Management
  const handleAddCert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCert.trim();
    if (!trimmed) return;
    if (!certifications.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCertifications((prev) => [...prev, trimmed]);
    }
    setNewCert('');
  };

  const handleRemoveCert = (certToRemove: string) => {
    setCertifications((prev) => prev.filter((c) => c !== certToRemove));
  };

  // Submit Changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const updatedProfile: AgentProfile = {
      ...agent,
      name: name.trim(),
      title: title.trim(),
      domain: domain.trim(),
      phone: phone.trim(),
      experienceYears: Number(experienceYears) || 1,
      availability,
      bio: bio.trim(),
      skills,
      certifications,
    };

    try {
      await onUpdateAgent(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save technician profile:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  availability === 'available'
                    ? 'bg-emerald-500'
                    : availability === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={`Status: ${availability}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{name || 'Technician Profile'}</h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  ID: #{agent.id}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{title || 'Field Operations Specialist'}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="font-medium text-blue-700">{domain}</span>
                <span>•</span>
                <span>{experienceYears} Yrs Experience</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Bio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'skills'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Skills & Licenses ({skills.length + certifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Field Telemetry & Stats</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          
          {/* TAB 1: Profile & Details */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Kamau"
                      className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Professional Title</label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior Fiber Optic Splicer"
                      className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Service Domain / Department</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="Telecommunications">Telecommunications (Fiber / Radio)</option>
                    <option value="Electrical">Electrical (Power Systems / Generators)</option>
                    <option value="Solar PV & Hybrid Inverter Systems">Solar PV & Hybrid Inverters</option>
                    <option value="HVAC">HVAC & Climate Control</option>
                    <option value="Plumbing">Plumbing & Water Pumps</option>
                    <option value="IT Support">IT Hardware & Structured Cabling</option>
                    <option value="Security Systems">CCTV & Biometric Access Control</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Shift Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as AgentAvailability)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="available">🟢 Available (Ready on Field)</option>
                    <option value="busy">🟡 Busy (Actively on Task)</option>
                    <option value="offline">⚪ Offline (Off Shift / On Leave)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Years of Field Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {email && (
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Account Email (System Identity)</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-2 text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">
                  Professional Bio & Trade Summary
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe technician certifications, specialized equipment handling, emergency dispatch readiness..."
                  className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Skills & Competencies */}
          {activeTab === 'skills' && (
            <div className="space-y-5">
              {/* Technical Skills Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Technical Skills ({skills.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Used by SBERT to match incoming tasks
                  </span>
                </div>

                {/* Add Skill Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Type new skill (e.g. OTDR trace testing, 3-phase ATS changeover)..."
                    className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    disabled={!newSkill.trim()}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-md flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill</span>
                  </button>
                </div>

                {/* Skills Chips */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[90px] flex flex-wrap gap-1.5 items-start">
                  {skills.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px] m-auto">
                      No technical skills recorded. Add one above.
                    </span>
                  ) : (
                    skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 shadow-2xs group hover:border-red-300"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-slate-400 hover:text-red-600 transition p-0.5"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Trade Certifications & Licenses Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Certifications & Trade Licenses ({certifications.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Government & Trade accreditations</span>
                </div>

                {/* Add Cert Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCert();
                      }
                    }}
                    placeholder="Type license (e.g. EPRA Solar PV Class T3, FOA Certified Fiber Splicer)..."
                    className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCert()}
                    disabled={!newCert.trim()}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold rounded-md flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add License</span>
                  </button>
                </div>

                {/* Certifications Chips */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[70px] flex flex-wrap gap-1.5 items-start">
                  {certifications.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px] m-auto">
                      No certifications logged. Type a license above to add.
                    </span>
                  ) : (
                    certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs group hover:border-red-300"
                      >
                        <Award className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{cert}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(cert)}
                          className="text-emerald-500 hover:text-red-600 transition p-0.5 ml-0.5"
                          title={`Remove ${cert}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Field Telemetry & Stats */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              {/* Location Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Live GPS Telemetry</span>
                  </div>
                  {onPingGps && (
                    <button
                      type="button"
                      onClick={() => onPingGps(agent.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs shadow-2xs transition"
                    >
                      Ping GPS Beacon
                    </button>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800">
                    {agent.currentLocation.addressName || 'Nairobi Metro'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                    <span>
                      Latitude: {agent.currentLocation.lat.toFixed(5)} • Longitude: {agent.currentLocation.lng.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${agent.currentLocation.lat},${agent.currentLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Tasks</div>
                  <div className="text-lg font-bold text-blue-700 mt-1">
                    {agent.activeTaskCount}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Current Workload</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
                  <div className="text-lg font-bold text-emerald-700 mt-1">
                    {agent.completedTasksCount}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Resolved Orders</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {saveSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Profile updated successfully!
                </span>
              ) : (
                'Changes persist immediately to PostgreSQL & SBERT dispatch'
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || saveSuccess}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-md flex items-center gap-1.5 shadow-xs transition"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
