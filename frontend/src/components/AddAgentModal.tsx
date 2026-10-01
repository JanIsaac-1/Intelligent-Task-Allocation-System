import React, { useState } from 'react';
import { AgentProfile } from '../types';
import { UploadCloud, FileText, CheckCircle2, Plus, X, Trash2, Loader2 } from 'lucide-react';

interface AddAgentModalProps {
  onAddAgent: (agent: AgentProfile) => void;
  onClose: () => void;
}

export const AddAgentModal: React.FC<AddAgentModalProps> = ({ onAddAgent, onClose }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<AgentProfile['domain']>('Telecommunications');
  const [experienceYears, setExperienceYears] = useState(3);
  const [skillsText, setSkillsText] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  const [bio, setBio] = useState('');
  const [addressName, setAddressName] = useState('Nairobi CBD');
  const [lat, setLat] = useState(-1.2921);
  const [lng, setLng] = useState(36.8219);

  // Handle PDF / Document Upload to auto-fill form
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsing(true);

    // Simulate NLP Pipeline Extraction (spaCy + SBERT)
    setTimeout(() => {
      if (file.name.toLowerCase().includes('elec') || file.name.toLowerCase().includes('power') || file.name.toLowerCase().includes('solar')) {
        setName('Alex Mwende');
        setPhone('+254 745 678 901');
        setTitle('Senior Solar & Electrical Microgrid Technician');
        setDomain('Electrical');
        setExperienceYears(5);
        setSkillsText('Solar inverter wiring, battery bank diagnostics, PV module testing, high-voltage isolators, load profiling');
        setCertificationsText('EPRA Solar PV Class T3, Certified Electrical Inspector');
        setBio('Specialist in commercial rooftop solar installations, battery energy storage systems (BESS), and hybrid electrical grid changeovers.');
        setAddressName('Upper Hill (Mara Rd)');
        setLat(-1.2980);
        setLng(36.8150);
      } else if (file.name.toLowerCase().includes('plumb') || file.name.toLowerCase().includes('water')) {
        setName('Dennis Kamau');
        setPhone('+254 718 234 890');
        setTitle('Hydraulic Systems & Water Treatment Tech');
        setDomain('Plumbing');
        setExperienceYears(6);
        setSkillsText('High-pressure booster repair, water flow metering, wastewater filtration, copper brazing, irrigation solenoid valves');
        setCertificationsText('Certified Master Plumber, Water Quality Specialist');
        setBio('Lead technician for commercial hydraulic pumping stations and municipal backup water treatment systems.');
        setAddressName('Industrial Area (Lunga Lunga Rd)');
        setLat(-1.3120);
        setLng(36.8520);
      } else {
        setName('Faith Chebet');
        setPhone('+254 703 112 334');
        setTitle('Lead Fiber Splicing & Wireless Network Engineer');
        setDomain('Telecommunications');
        setExperienceYears(4);
        setSkillsText('Fiber optic ribbon splicing, OTDR line analysis, GPON OLT configuration, Microwave radio alignment, Ethernet termination');
        setCertificationsText('FOA Certified Fiber Splicer, Ubiquiti Enterprise Wireless Admin, CCNA');
        setBio('Experienced in long-distance optical trunk maintenance, emergency backbone fiber cuts, and enterprise campus wireless networks.');
        setAddressName('Westlands (Waiyaki Way)');
        setLat(-1.2680);
        setLng(36.8020);
      }

      setIsParsing(false);
    }, 900);
  };

  const handleClearFile = () => {
    setUploadedFileName(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title) return;

    const newAgent: AgentProfile = {
      id: `agent-${Date.now()}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@fieldops.co.ke`,
      phone,
      role: 'agent',
      title,
      domain,
      experienceYears,
      skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
      certifications: certificationsText.split(',').map((c) => c.trim()).filter(Boolean),
      bio,
      availability: 'available',
      currentLocation: {
        lat,
        lng,
        addressName,
      },
      activeTaskCount: 0,
      completedTasksCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      batteryLevel: 98,
      lastUpdated: 'Just now',
    };

    onAddAgent(newAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Register Field Technician</h3>
              <p className="text-xs text-slate-500 font-medium">
                Upload job description (PDF) for automated parsing or enter profile manually
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

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs bg-white">
          {/* Integrated PDF / Document Upload Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Job Description Document (PDF / DOCX)</span>
              </label>
              <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                Auto-Extract Profile
              </span>
            </div>

            {uploadedFileName ? (
              <div className="bg-white border border-emerald-300 rounded-md p-3 flex items-center justify-between text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{uploadedFileName}</span>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Document parsed • Form auto-populated below
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  title="Remove uploaded file"
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  id="agent-pdf-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="agent-pdf-upload"
                  className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-3.5 flex items-center justify-center gap-3 transition bg-white hover:bg-slate-50"
                >
                  <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-blue-700 hover:underline">
                      Upload PDF / Word Job Description
                    </span>
                    <p className="text-[10px] text-slate-500">
                      System automatically extracts skills, certifications, and experience into the form
                    </p>
                  </div>
                </label>
              </div>
            )}

            {isParsing && (
              <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs text-blue-800 font-medium animate-pulse">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Parsing PDF text and generating profile embeddings...</span>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <form id="agent-form" onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mwende"
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Job Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Solar & Electrical Tech"
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Primary Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="IT Support">IT Support</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Experience (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Operational Base (Nairobi)</label>
                <input
                  type="text"
                  value={addressName}
                  onChange={(e) => setAddressName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold mb-1 block">
                Extracted Technical Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="e.g. Solar inverter wiring, battery bank diagnostics, PV module testing"
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold mb-1 block">
                Certifications & Licenses
              </label>
              <input
                type="text"
                value={certificationsText}
                onChange={(e) => setCertificationsText(e.target.value)}
                placeholder="e.g. EPRA Solar PV Class T3, Certified Electrical Inspector"
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Scope of Work / Profile Summary</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of duties and field scope..."
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {uploadedFileName ? 'Document parsed & ready for enrollment' : 'Standard registration mode'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="agent-form"
              className="px-4 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Technician</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
