
import React, { useState } from 'react';
import { dbSet, dbRemove } from '../firebase';
import { UserProfile, Schedule } from '../types';
import { Calendar, Clock, Trash2, Plus, Power, Zap, Fan } from 'lucide-react';

interface ApplianceScheduleProps {
  user: UserProfile;
  schedules: Schedule[];
  lights: Record<string, { status: boolean; name?: string }>;
  motors: Record<string, { status: boolean; working: boolean; name?: string }>;
}

const ApplianceSchedule: React.FC<ApplianceScheduleProps> = ({ user, schedules, lights, motors }) => {
  const [showForm, setShowForm] = useState(false);
  const [applianceId, setApplianceId] = useState('');
  const [applianceType, setApplianceType] = useState<'Light' | 'Motor'>('Motor');
  const [action, setAction] = useState<'ON' | 'OFF'>('ON');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const allAppliances = [
    // Explicitly type m and l as any to avoid 'unknown' property access errors
    ...Object.entries(motors).map(([id, m]: [string, any]) => ({ id, name: m.name || `Motor ${id}`, type: 'Motor' as const })),
    ...Object.entries(lights).map(([id, l]: [string, any]) => ({ id, name: l.name || `Light ${id}`, type: 'Light' as const })),
  ];

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applianceId || !date || !time) return;

    const selectedApp = allAppliances.find(a => a.id === applianceId);
    if (!selectedApp) return;

    const id = Date.now().toString();
    const newSchedule: Schedule = {
      id,
      applianceId,
      applianceType: selectedApp.type,
      applianceName: selectedApp.name,
      action,
      date,
      time,
      executed: false
    };

    try {
      await dbSet(`${user.uid}/Schedules/${id}`, newSchedule);
      
      // Log notification
      await dbSet(`${user.uid}/Notifications/${Date.now()}`, {
        title: 'Task Scheduled',
        message: `${selectedApp.name} set to ${action} on ${date} at ${time}`,
        timestamp: Date.now(),
        type: 'info'
      });

      setShowForm(false);
      setApplianceId('');
      setDate('');
      setTime('');
    } catch (err) {
      alert("Error scheduling task");
    }
  };

  const deleteSchedule = async (id: string) => {
    await dbRemove(`${user.uid}/Schedules/${id}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Automation</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      {showForm && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-sky-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-gray-800 flex items-center space-x-2">
            <Plus size={18} className="text-sky-600" />
            <span>Create New Schedule</span>
          </h3>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Appliance</label>
              <select 
                value={applianceId}
                onChange={(e) => setApplianceId(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                required
              >
                <option value="">Select an appliance...</option>
                {allAppliances.map(app => (
                  <option key={app.id} value={app.id}>{app.name} ({app.type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Action</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAction('ON')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${action === 'ON' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('OFF')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${action === 'OFF' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    OFF
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
              <input 
                type="date" 
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 text-gray-500 font-bold hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
              >
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {schedules.length === 0 && !showForm && (
          <div className="text-center py-20 px-8">
            <div className="bg-sky-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-300">
              <Calendar size={40} />
            </div>
            <h3 className="text-gray-400 font-medium">No active schedules</h3>
            <p className="text-gray-400 text-xs mt-1">Tap the plus icon to automate your farm</p>
          </div>
        )}

        {schedules.map((schedule) => (
          <div 
            key={schedule.id} 
            className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
              schedule.executed ? 'bg-gray-100 border-transparent opacity-60' : 'bg-white border-sky-100 shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${schedule.executed ? 'bg-gray-200 text-gray-500' : 'bg-sky-50 text-sky-600'}`}>
                {schedule.applianceType === 'Motor' ? <Fan size={20} /> : <Zap size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 leading-none mb-1">
                  {schedule.applianceName} <span className={`text-[10px] ml-1 uppercase px-1.5 py-0.5 rounded ${schedule.action === 'ON' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{schedule.action}</span>
                </h4>
                <div className="flex items-center text-xs text-gray-500 font-medium space-x-3">
                  <span className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{schedule.date === new Date().toISOString().split('T')[0] ? 'Today' : schedule.date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{schedule.time}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {schedule.executed ? (
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Done</span>
              ) : (
                <button 
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-2 text-red-400 hover:text-red-600 active:scale-90 transition-transform"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplianceSchedule;
