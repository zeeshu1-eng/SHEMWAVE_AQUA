
import React, { useState } from 'react';
import { UserProfile, AppNotification } from '../types';
import { dbUpdate, dbRemove, dbSet } from '../firebase';
import { AlertCircle, Power, Zap, Fan, Trash2, CheckCircle2, Info, Bell, X, Eraser } from 'lucide-react';

interface DashboardProps {
  lights: Record<string, { status: boolean; name?: string }>;
  motors: Record<string, { status: boolean; working: boolean; name?: string }>;
  notifications: AppNotification[];
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ lights, motors, notifications, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleStatus = (type: 'Light' | 'Motor', id: string, currentStatus: boolean) => {
    dbUpdate(`${user.uid}/${type}/${id}`, { status: !currentStatus });
  };

  const deleteAppliance = async (type: 'Light' | 'Motor', id: string, name: string) => {
    if (window.confirm(`Delete ${name}?`)) {
      try {
        await dbRemove(`${user.uid}/${type}/${id}`);
        const notifId = `del_${Date.now()}`;
        await dbSet(`${user.uid}/Notifications/${notifId}`, {
          title: 'Appliance Deleted',
          message: `${name} removed.`,
          timestamp: Date.now(),
          type: 'info'
        });
      } catch (err) {
        alert("Error deleting appliance");
      }
    }
  };

  const clearNotificationHistory = async () => {
    if (window.confirm("Are you sure you want to clear all notification history?")) {
      try {
        // Correctly removes the entire Notifications node for the current user
        await dbRemove(`${user.uid}/Notifications`);
      } catch (err) {
        alert("Error clearing history");
      }
    }
  };

  const hasMotorAlert = Object.values(motors).some((m: any) => m.status && m.working === false);

  // Filtered notifications for specific events (Add, Delete, Schedule)
  const filteredNotifications = notifications.filter(notif => 
    notif.title.includes('Added') || 
    notif.title.includes('Deleted') || 
    notif.title.includes('Scheduled') ||
    notif.title.includes('Executed')
  );

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Top Header with Notification Bell */}
      <header className="flex justify-between items-center mb-6 px-1 pt-2">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Farm Control</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{user.displayName}</p>
        </div>
        
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative p-2.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm active:scale-90 transition-all"
        >
          <Bell size={20} className="text-black" />
          {filteredNotifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          )}
        </button>
      </header>

      {/* Notification Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm px-4 pt-20 flex justify-center">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
              <div className="flex items-center space-x-3">
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">System Alerts</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notif => (
                  <div key={notif.id} className="bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm mt-0.5">
                        {notif.type === 'success' ? <CheckCircle2 size={14} className="text-green-500" /> : <Info size={14} className="text-sky-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black uppercase tracking-widest text-black mb-1 truncate">{notif.title}</p>
                          <span className="text-[7px] font-bold text-gray-300 uppercase whitespace-nowrap ml-2">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-gray-500 leading-tight">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 opacity-30 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Bell size={32} className="text-gray-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">History is Empty</p>
                </div>
              )}
            </div>

            {filteredNotifications.length > 0 && (
              <div className="p-6 border-t border-gray-50 bg-gray-50/50 rounded-b-[2.5rem]">
                <button 
                  onClick={clearNotificationHistory}
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-white border border-red-100 text-red-500 rounded-2xl shadow-sm active:scale-[0.98] transition-all"
                >
                  <Eraser size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clear All Notifications</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Critical Motor Failure Alert Bar */}
      {hasMotorAlert && (
        <div className="bg-red-600 text-white p-4 rounded-3xl flex items-center space-x-3 animate-pulse shadow-lg ring-4 ring-red-100 mx-1">
          <AlertCircle size={24} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm uppercase tracking-tight">CRITICAL FAILURE</p>
            <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest truncate">Motor active but stall detected</p>
          </div>
        </div>
      )}

      {/* Motors Section - Grid of Squares */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center space-x-2">
            <Fan size={12} />
            <span>Motors</span>
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(motors).map(([id, motor]: [string, any]) => (
            <div 
              key={id} 
              className={`aspect-square p-5 rounded-[2rem] border-2 transition-all duration-300 flex flex-col justify-between ${
                motor.status 
                  ? (motor.working ? 'bg-white border-black shadow-md' : 'bg-red-50 border-red-500 shadow-md') 
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${motor.status ? (motor.working ? 'bg-black text-white' : 'bg-red-600 text-white') : 'bg-gray-100 text-gray-400'}`}>
                  <Fan size={20} className={motor.status && motor.working ? 'animate-spin' : ''} />
                </div>
                <button 
                  onClick={() => deleteAppliance('Motor', id, motor.name || id)}
                  className="p-1 text-gray-200 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-black text-[10px] uppercase tracking-wider truncate">{motor.name || `Motor ${id}`}</h4>
                <div className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${motor.status ? (motor.working ? 'bg-green-500' : 'bg-red-500 animate-pulse') : 'bg-gray-200'}`}></span>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 truncate">
                    {motor.status ? (motor.working ? 'Working' : 'Failure') : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => toggleStatus('Motor', id, motor.status)}
                  className={`p-2 rounded-xl transition-all active:scale-90 ${
                    motor.status ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-300 shadow-sm'
                  }`}
                >
                  <Power size={18} />
                </button>
              </div>
            </div>
          ))}
          {Object.keys(motors).length === 0 && (
            <div className="col-span-2 text-center py-10 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem]">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Add a motor to start</p>
            </div>
          )}
        </div>
      </section>

      {/* Lights Section - Grid of Squares */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center space-x-2">
            <Zap size={12} />
            <span>Lights</span>
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(lights).map(([id, light]: [string, any]) => (
            <div 
              key={id} 
              className={`aspect-square p-5 rounded-[2rem] border-2 transition-all duration-300 flex flex-col justify-between ${
                light.status ? 'bg-white border-yellow-400 shadow-md' : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${light.status ? 'bg-yellow-400 text-black shadow-inner' : 'bg-gray-100 text-gray-400'}`}>
                  <Zap size={20} fill={light.status ? "currentColor" : "none"} />
                </div>
                <button 
                  onClick={() => deleteAppliance('Light', id, light.name || id)}
                  className="p-1 text-gray-200 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-black text-[10px] uppercase tracking-wider truncate">{light.name || `Light ${id}`}</h4>
                <div className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${light.status ? 'bg-yellow-400' : 'bg-gray-200'}`}></span>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                    {light.status ? 'Active' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => toggleStatus('Light', id, light.status)}
                  className={`p-2 rounded-xl transition-all active:scale-90 ${
                    light.status ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-300 shadow-sm'
                  }`}
                >
                  <Power size={18} />
                </button>
              </div>
            </div>
          ))}
          {Object.keys(lights).length === 0 && (
            <div className="col-span-2 text-center py-10 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem]">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Add a light to start</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
