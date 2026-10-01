import React, { useState } from 'react';
import { Task, TaskPriority } from '../../types';
import { Send, MapPin, CheckCircle2, PlusCircle, ArrowRight } from 'lucide-react';

const NAIROBI_LOCATIONS = [
  { name: 'Strathmore University / Madaraka', lat: -1.3090, lng: 36.8123 },
  { name: 'Westlands Commercial Hub (Parklands)', lat: -1.2650, lng: 36.8040 },
  { name: 'Kilimani / Yaya Centre Area', lat: -1.2985, lng: 36.7830 },
  { name: 'Upper Hill Financial District', lat: -1.3005, lng: 36.8180 },
  { name: 'Nairobi CBD (Kenyatta Avenue)', lat: -1.2921, lng: 36.8219 },
  { name: 'Industrial Area (Enterprise Rd)', lat: -1.3150, lng: 36.8550 },
  { name: 'Karen Shopping Centre', lat: -1.3200, lng: 36.7050 },
];

interface TaskRequesterViewProps {
  onCreateTask: (task: Task) => void;
  onNavigateToAdmin: () => void;
}

export const TaskRequesterView: React.FC<TaskRequesterViewProps> = ({
  onCreateTask,
  onNavigateToAdmin,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Task['category']>('Telecommunications');
  const [requiredSkillsText, setRequiredSkillsText] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [requesterName, setRequesterName] = useState('Facilities Directorate - Strathmore');
  const [requesterPhone, setRequesterPhone] = useState('+254 722 123 456');
  const [submittedTask, setSubmittedTask] = useState<Task | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const loc = NAIROBI_LOCATIONS[selectedLocationIndex];

    const newTask: Task = {
      id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      category,
      requiredSkills: requiredSkillsText
        ? requiredSkillsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [category],
      location: {
        lat: loc.lat,
        lng: loc.lng,
        addressName: loc.name,
      },
      priority,
      status: 'pending',
      requesterName,
      requesterPhone,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deadline: '2026-08-19 16:00',
      estimatedHours: 2.0,
    };

    onCreateTask(newTask);
    setSubmittedTask(newTask);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Field Work Order</h2>
              <p className="text-xs text-slate-500">
                Log a task request to be routed and assigned to available field agents
              </p>
            </div>
          </div>
        </div>

        {submittedTask ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Work Order Created Successfully
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Order <strong className="font-mono text-slate-900">{submittedTask.id}</strong> has been logged in the dispatch queue.
              </p>
            </div>

            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  setSubmittedTask(null);
                  setTitle('');
                  setDescription('');
                  setRequiredSkillsText('');
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Create Another Order
              </button>
              <button
                onClick={onNavigateToAdmin}
                className="px-4 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <span>View in Dispatcher</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Task Title */}
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">
                Work Order Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fiber link severed during road maintenance near junction"
                className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">
                Problem Description (Free Text)
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, symptoms, and required equipment. The system will match this with technician profiles..."
                className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Service Domain</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="Telecommunications">Telecommunications (Fiber / Radio / LAN)</option>
                  <option value="Electrical">Electrical (3-Phase / Breakers / Generators)</option>
                  <option value="HVAC">HVAC & Climate Systems</option>
                  <option value="Plumbing">Plumbing & Hydraulic Pumps</option>
                  <option value="IT Support">IT Hardware & Structured Cabling</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  <option value="critical">Critical (Immediate Emergency)</option>
                  <option value="high">High (Service Disruption)</option>
                  <option value="medium">Medium (Standard Routine)</option>
                  <option value="low">Low (Preventive Scheduled)</option>
                </select>
              </div>
            </div>

            {/* Skills & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">
                  Required Competencies (comma-separated)
                </label>
                <input
                  type="text"
                  value={requiredSkillsText}
                  onChange={(e) => setRequiredSkillsText(e.target.value)}
                  placeholder="e.g. Fiber optic splicing, OTDR testing"
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Site Location (Nairobi)</label>
                <select
                  value={selectedLocationIndex}
                  onChange={(e) => setSelectedLocationIndex(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                >
                  {NAIROBI_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={idx}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Requester Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">On-Site Contact Person</label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Contact Phone</label>
                <input
                  type="text"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-md font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Work Order</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
