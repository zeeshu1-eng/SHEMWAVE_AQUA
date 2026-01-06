
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbSet, dbUpdate, dbGet } from '../firebase';
import { UserProfile } from '../types';
import { ChevronLeft, Zap, Fan, Check, Loader2 } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

interface AddApplianceProps {
  user: UserProfile;
}

const AddAppliance: React.FC<AddApplianceProps> = ({ user }) => {
  const navigate = useNavigate();
  const [type, setType] = useState<'Light' | 'Motor'>('Motor');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCount, setExistingCount] = useState({ Light: 0, Motor: 0 });

  useEffect(() => {
    if (!user) return;
    
    // Fetch current counts to determine next ID (l1, l2, etc)
    const unsubLights = onValue(ref(db, `${user.uid}/Light`), (snapshot) => {
      setExistingCount(prev => ({ ...prev, Light: snapshot.exists() ? Object.keys(snapshot.val()).length : 0 }));
    });
    const unsubMotors = onValue(ref(db, `${user.uid}/Motor`), (snapshot) => {
      setExistingCount(prev => ({ ...prev, Motor: snapshot.exists() ? Object.keys(snapshot.val()).length : 0 }));
    });

    return () => {
      unsubLights();
      unsubMotors();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    
    // Determine the next key (l1, l2... or m1, m2...)
    const prefix = type === 'Light' ? 'l' : 'm';
    const nextIndex = (type === 'Light' ? existingCount.Light : existingCount.Motor) + 1;
    const applianceId = `${prefix}${nextIndex}`;
    
    const data: any = { status: false, name: name.trim() };
    if (type === 'Motor') {
      data.working = true; // Initial status set to true (simulated healthy start)
    }

    try {
      await dbUpdate(`${user.uid}/${type}/${applianceId}`, data);
      
      // Log notification
      const notifId = Date.now().toString();
      await dbSet(`${user.uid}/Notifications/${notifId}`, {
        title: 'New Appliance Added',
        message: `${name} (${applianceId}) has been added to your ${type}s`,
        timestamp: Date.now(),
        type: 'success'
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      alert("Error adding appliance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Add Appliance</h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 px-1 uppercase tracking-wider">Select Category</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('Motor')}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all relative ${
                type === 'Motor' ? 'border-sky-600 bg-sky-50 text-sky-600 shadow-md' : 'border-gray-200 bg-white text-gray-400'
              }`}
            >
              <Fan size={32} className={type === 'Motor' ? 'animate-pulse' : ''} />
              <span className="mt-2 font-bold">Motor</span>
              {type === 'Motor' && (
                <div className="absolute top-3 right-3 bg-sky-600 text-white rounded-full p-0.5">
                  <Check size={12} />
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setType('Light')}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all relative ${
                type === 'Light' ? 'border-yellow-500 bg-yellow-50 text-yellow-600 shadow-md' : 'border-gray-200 bg-white text-gray-400'
              }`}
            >
              <Zap size={32} className={type === 'Light' ? 'animate-pulse' : ''} />
              <span className="mt-2 font-bold">Light</span>
              {type === 'Light' && (
                <div className="absolute top-3 right-3 bg-yellow-500 text-white rounded-full p-0.5">
                  <Check size={12} />
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="name" className="text-sm font-semibold text-gray-700 px-1 uppercase tracking-wider">Appliance Name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Aerator 1, Gate Light"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-sky-500 outline-none transition-all text-lg font-medium"
            required
            autoComplete="off"
          />
          <p className="text-[10px] text-gray-400 px-1">This will be registered as <span className="font-bold">{type === 'Light' ? 'l' : 'm'}{ (type === 'Light' ? existingCount.Light : existingCount.Motor) + 1 }</span> in the database.</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Add to Farm</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddAppliance;
