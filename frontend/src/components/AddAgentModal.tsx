import React, { useState, useEffect, useRef } from 'react';
import { AgentProfile } from '../types';
import { uploadCvPdf } from '../services/api';
import { MASTER_DOMAINS } from '../data/config';
import { searchPlaceSuggestions, PlaceSuggestion } from '../utils/geo';
import { UploadCloud, FileText, CheckCircle2, Plus, X, Trash2, Loader2, AlertCircle, MapPin, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface AddAgentModalProps {
  onAddAgent: (agent: AgentProfile & { password?: string }) => void;
  onClose: () => void;
}

export const AddAgentModal: React.FC<AddAgentModalProps> = ({ onAddAgent, onClose }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+254 7');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<AgentProfile['domain']>(MASTER_DOMAINS[0].domain);
  const [experienceYears, setExperienceYears] = useState(3);
  const [skillsText, setSkillsText] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  const [bio, setBio] = useState('');
  const [addressName, setAddressName] = useState('Nairobi CBD');
  const [lat, setLat] = useState(-1.2921);
  const [lng, setLng] = useState(36.8219);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [highlightedPlaceIdx, setHighlightedPlaceIdx] = useState(-1);
  const addressWrapperRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextPlaceSearchRef = useRef(true);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setShowPlaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (skipNextPlaceSearchRef.current) {
      skipNextPlaceSearchRef.current = false;
      return;
    }
    const trimmed = addressName.trim();
    if (trimmed.length < 2) {
      setPlaceSuggestions([]);
      setShowPlaceDropdown(false);
      setIsSearchingPlace(false);
      return;
    }
    const controller = new AbortController();
    setIsSearchingPlace(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaceSuggestions(trimmed, 5, controller.signal);
        if (controller.signal.aborted) return;
        setPlaceSuggestions(results);
        setShowPlaceDropdown(results.length > 0);
        setHighlightedPlaceIdx(-1);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setPlaceSuggestions([]);
          setShowPlaceDropdown(false);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearchingPlace(false);
      }
    }, 280);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressName]);

  const handleSelectBasePlace = (place: PlaceSuggestion) => {
    skipNextPlaceSearchRef.current = true;
    setAddressName(place.fullName);
    setLat(place.lat);
    setLng(place.lng);
    setPlaceSuggestions([]);
    setShowPlaceDropdown(false);
    setHighlightedPlaceIdx(-1);
  };

  const generateTechnicianPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = 'GT-';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  // Handle PDF / DOCX / TXT Upload to auto-fill form using backend SBERT NLP
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setIsParsing(true);

    try {
      const parsed = await uploadCvPdf(file);
      setUploadedFileName(file.name);
      if (parsed.candidate_name) {
        setName(parsed.candidate_name);
      }
      if (parsed.detected_email) {
        setEmail(parsed.detected_email);
      }
      if (parsed.detected_phone) {
        setPhone(parsed.detected_phone);
      }
      if (parsed.detected_experience_years) {
        setExperienceYears(parsed.detected_experience_years);
      }
      if (parsed.detected_domain) {
        setDomain(parsed.detected_domain);
      }
      if (parsed.detected_title) {
        setTitle(parsed.detected_title);
      }
      setSkillsText((parsed.extracted_skills || []).join(', '));
      setCertificationsText((parsed.detected_certifications || []).join(', '));
      const cleanSummary = parsed.detected_bio || parsed.text_preview;
      if (cleanSummary) {
        setBio(cleanSummary.slice(0, 350));
      }
    } catch (err: any) {
      console.warn('Backend CV parser error:', err);
      setUploadedFileName(null);
      setParseError(err?.message || 'Could not parse document. Ensure it is a valid text-based .pdf, .docx, or .txt file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearFile = () => {
    setUploadedFileName(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearForm = () => {
    skipNextPlaceSearchRef.current = true;
    setUploadedFileName(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setPhone('+254 7');
    setTitle('');
    setDomain(MASTER_DOMAINS[0].domain);
    setExperienceYears(3);
    setSkillsText('');
    setCertificationsText('');
    setBio('');
    setAddressName('Nairobi CBD');
    setLat(-1.2921);
    setLng(36.8219);
    setPlaceSuggestions([]);
    setShowPlaceDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title) return;

    const trimmedPass = password.trim();
    if (trimmedPass && trimmedPass.length < 6) {
      setParseError('Login password must be at least 6 characters (or leave blank to use default agent123).');
      return;
    }

    const newAgent: AgentProfile & { password?: string } = {
      id: `agent-${Date.now()}`,
      name,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@geotask.ke`,
      ...(trimmedPass ? { password: trimmedPass } : {}),
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
        addressName: addressName.trim() || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
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
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
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
                <span>Parsing document and extracting skills...</span>
              </div>
            )}

            {parseError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
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
                <label className="text-slate-700 font-semibold mb-1 block">
                  Email Address <span className="text-[10px] text-slate-400 font-normal">(for sign-in)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.mwende@geotask.ke"
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    Initial Password <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateTechnicianPassword}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defaults to agent123 if blank"
                    className="w-full bg-white border border-slate-300 rounded-md p-2 pr-8 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold block">Primary Domain</label>
                  <span className="text-[10px] text-blue-600 font-bold">22 Specialized Domains</span>
                </div>
                <select
                  value={domain}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setDomain(sel);
                    const domObj = MASTER_DOMAINS.find(d => d.domain === sel);
                    if (domObj) {
                      if (!title.trim() && domObj.titles && domObj.titles.length > 0) {
                        setTitle(domObj.titles[0]);
                      }
                      if (!skillsText.trim()) {
                        setSkillsText(domObj.skills.slice(0, 4).join(', '));
                      }
                      if (!certificationsText.trim() && domObj.certifications.length > 0) {
                        setCertificationsText(domObj.certifications.slice(0, 2).join(', '));
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 text-xs sm:text-sm"
                >
                  {!MASTER_DOMAINS.some((dom) => dom.domain === domain) && domain && (
                    <option value={domain}>[AUTO] {domain}</option>
                  )}
                  {MASTER_DOMAINS.map((dom) => (
                    <option key={dom.code} value={dom.domain}>
                      [{dom.code}] {dom.domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div ref={addressWrapperRef} className="sm:col-span-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold block">Base Station / Street Address</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={addressName}
                    onFocus={() => {
                      if (placeSuggestions.length > 0) setShowPlaceDropdown(true);
                    }}
                    onChange={(e) => setAddressName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && placeSuggestions.length > 0) {
                        e.preventDefault();
                        setShowPlaceDropdown(true);
                        setHighlightedPlaceIdx((prev) => (prev + 1) % placeSuggestions.length);
                      } else if (e.key === 'ArrowUp' && placeSuggestions.length > 0) {
                        e.preventDefault();
                        setShowPlaceDropdown(true);
                        setHighlightedPlaceIdx((prev) => (prev <= 0 ? placeSuggestions.length - 1 : prev - 1));
                      } else if (e.key === 'Enter' && showPlaceDropdown && highlightedPlaceIdx >= 0 && placeSuggestions[highlightedPlaceIdx]) {
                        e.preventDefault();
                        handleSelectBasePlace(placeSuggestions[highlightedPlaceIdx]);
                      } else if (e.key === 'Escape') {
                        setShowPlaceDropdown(false);
                      }
                    }}
                    placeholder="Type area or landmark (e.g. Westlands, Karen, Kilimani)"
                    className="w-full bg-white border border-slate-300 rounded-md p-2 pr-7 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  {isSearchingPlace && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-2.5 top-2.5" />
                  )}
                </div>

                {showPlaceDropdown && placeSuggestions.length > 0 && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 mt-1 z-[2100] bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100"
                  >
                    {placeSuggestions.map((place, idx) => (
                      <li key={place.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectBasePlace(place);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-start gap-2 text-xs transition ${
                            idx === highlightedPlaceIdx
                              ? 'bg-blue-50 text-blue-900'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{place.label}</div>
                            {place.secondaryText && (
                              <div className="text-[10px] text-slate-500 truncate">{place.secondaryText}</div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold block">
                  Extracted Technical Skills (comma-separated)
                </label>
                <span className="text-[10px] text-slate-400">Click chips to add</span>
              </div>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="e.g. Fiber optic cable fusion splicing, OTDR fault trace analysis"
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
              {/* Dynamic Domain Skills Chips */}
              {(() => {
                const domObj = MASTER_DOMAINS.find(d => d.domain === domain);
                if (!domObj) return null;
                return (
                  <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold">Suggested:</span>
                    {domObj.skills.map((skill, sIdx) => {
                      const isAdded = skillsText.toLowerCase().includes(skill.toLowerCase());
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            if (isAdded) return;
                            setSkillsText(prev => prev ? `${prev}, ${skill}` : skill);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium ${
                            isAdded
                              ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold cursor-default'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {isAdded ? `✓ ${skill}` : `+ ${skill}`}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
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
              onClick={handleClearForm}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>
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
