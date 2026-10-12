import React, { useState } from 'react';
import { AgentProfile } from '../types';
import { uploadCvPdf } from '../services/api';
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

  // Handle PDF / Document Upload to auto-fill form using real backend NLP
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsing(true);

    try {
      const parsed = await uploadCvPdf(file);
      if (parsed.detected_domain) {
        setDomain(parsed.detected_domain as AgentProfile['domain']);
      }
      if (parsed.extracted_skills && parsed.extracted_skills.length > 0) {
        setSkillsText(parsed.extracted_skills.join(', '));
      }
      if (parsed.detected_certifications && parsed.detected_certifications.length > 0) {
        setCertificationsText(parsed.detected_certifications.join(', '));
      }
      if (parsed.text_preview) {
        setBio(parsed.text_preview.slice(0, 300));
      }
    } catch (err) {
      console.warn('Backend CV parser error:', err);
    } finally {
      setIsParsing(false);
    }
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
        addressName: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
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
                <label className="text-slate-700 font-semibold mb-1 block">Live GPS Telemetry</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || -1.2921)}
                    placeholder="Latitude"
                    title="GPS Latitude"
                    className="w-1/2 bg-white border border-slate-300 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 36.8219)}
                    placeholder="Longitude"
                    title="GPS Longitude"
                    className="w-1/2 bg-white border border-slate-300 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
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
