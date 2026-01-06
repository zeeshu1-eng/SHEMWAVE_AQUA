
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, onAuthStateChanged, dbGet, dbSet, dbUpdate } from './firebase';
import { UserProfile, AppNotification, Schedule } from './types';
import { alertAudio } from './audioService';
import { 
  Home as HomeIcon, 
  PlusSquare, 
  Calendar, 
  User, 
  Zap
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddAppliance from './pages/AddAppliance';
import ApplianceSchedule from './pages/ApplianceSchedule';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lights, setLights] = useState<Record<string, { status: boolean; name?: string }>>({});
  const [motors, setMotors] = useState<Record<string, { status: boolean; working: boolean; name?: string }>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
        alertAudio.stopBeep();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Database Listeners
  useEffect(() => {
    if (!user) return;

    const unsubLights = dbGet(`${user.uid}/Light`, (data) => setLights(data || {}));
    const unsubMotors = dbGet(`${user.uid}/Motor`, (data) => setMotors(data || {}));
    const unsubNotifs = dbGet(`${user.uid}/Notifications`, (data) => {
      const list = Object.entries(data || {}).map(([id, val]: [string, any]) => ({ id, ...val }));
      setNotifications(list.sort((a, b) => b.timestamp - a.timestamp));
    });
    const unsubSchedules = dbGet(`${user.uid}/Schedules`, (data) => {
      const list = Object.entries(data || {}).map(([id, val]: [string, any]) => ({ id, ...val }));
      setSchedules(list);
    });

    return () => {
      unsubLights();
      unsubMotors();
      unsubNotifs();
      unsubSchedules();
    };
  }, [user]);

  // Motor Failure Alert System Logic
  useEffect(() => {
    if (!user) {
      alertAudio.stopBeep();
      return;
    }

    const motorFailures = Object.entries(motors).filter(([_, m]: [string, any]) => m.status === true && m.working === false);
    const hasFailure = motorFailures.length > 0;
    
    if (hasFailure) {
      alertAudio.startBeep();
    } else {
      alertAudio.stopBeep();
    }
  }, [motors, user]);

  // Global Scheduler Runner
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      const currentDateStr = now.toISOString().split('T')[0];

      schedules.forEach(schedule => {
        if (!schedule.executed && schedule.date === currentDateStr && schedule.time === currentTimeStr) {
          const path = `${user.uid}/${schedule.applianceType}/${schedule.applianceId}`;
          dbUpdate(path, { status: schedule.action === 'ON' });
          dbUpdate(`${user.uid}/Schedules/${schedule.id}`, { executed: true });
          
          const notifId = `sched_exec_${Date.now()}`;
          dbSet(`${user.uid}/Notifications/${notifId}`, {
            title: 'Schedule Executed',
            message: `${schedule.applianceName} turned ${schedule.action}`,
            timestamp: Date.now(),
            type: 'success'
          });
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [schedules, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-black font-black uppercase tracking-widest text-[9px]">SHEMWAVE SYSTEMS</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col relative overflow-hidden shadow-2xl">
        {user && (
          <div className="flex justify-center pt-4 pb-2 border-b border-gray-50 bg-white">
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M50 15 L85 75 L68 75 L50 45 L32 75 L15 75 Z" fill="#E11D48" />
              </svg>
              <h1 className="text-[9px] font-black tracking-[0.3em] mt-1 uppercase">SHEMWAVE</h1>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto px-4 pt-4">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route 
              path="/" 
              element={user ? <Dashboard lights={lights} motors={motors} notifications={notifications} user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/add" 
              element={user ? <AddAppliance user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/schedule" 
              element={user ? <ApplianceSchedule user={user} schedules={schedules} lights={lights} motors={motors} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <Profile user={user} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>

        {user && <Navigation />}
      </div>
    </Router>
  );
};

const Navigation: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-50 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-20 px-4">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${isActive('/') ? 'text-black' : 'text-gray-300'}`}>
          <HomeIcon size={24} strokeWidth={isActive('/') ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span>
        </Link>
        <Link to="/add" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${isActive('/add') ? 'text-black' : 'text-gray-300'}`}>
          <PlusSquare size={24} strokeWidth={isActive('/add') ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Unit</span>
        </Link>
        <Link to="/schedule" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${isActive('/schedule') ? 'text-black' : 'text-gray-300'}`}>
          <Calendar size={24} strokeWidth={isActive('/schedule') ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Tasks</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${isActive('/profile') ? 'text-black' : 'text-gray-300'}`}>
          <User size={24} strokeWidth={isActive('/profile') ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Account</span>
        </Link>
      </div>
    </nav>
  );
};

export default App;
