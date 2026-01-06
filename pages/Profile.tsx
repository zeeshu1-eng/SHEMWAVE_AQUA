
import React, { useState } from 'react';
import { logout, auth } from '../firebase';
import { UserProfile } from '../types';
import { updateProfile } from 'firebase/auth';
import { LogOut, Mail, Shield, MessageSquare, ChevronRight, Camera, Edit3, Save, X, Loader2, User } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.displayName || '');
  const [updating, setUpdating] = useState(false);

  // Standard high-quality placeholder image for aqua farming context
  const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1590633440733-4f938222b403?auto=format&fit=crop&q=80&w=200&h=200";

  const handleReport = () => {
    const recipient = "shemwave@gmail.com";
    const subject = `Problem Report: SHEMWAVE App`;
    const body = `User: ${user.displayName}\nEmail: ${user.email}\nIssue details: \n\n[Please describe your problem here]`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser || !newName.trim()) return;
    setUpdating(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const reader = new FileReader();
    reader.onloadstart = () => setUpdating(true);
    reader.onloadend = async () => {
      try {
        await updateProfile(auth.currentUser!, { photoURL: reader.result as string });
      } catch (err) {
        alert("Failed to update photo");
      } finally {
        setUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 bg-white pb-24">
      <header className="text-center pt-8">
        <div className="relative inline-block group">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-xl overflow-hidden flex items-center justify-center">
            {updating ? (
              <Loader2 className="animate-spin text-black" size={32} />
            ) : (
              <img 
                src={user.photoURL || DEFAULT_PHOTO} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PHOTO;
                }}
              />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 bg-black text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all">
            <Camera size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={updating} />
          </label>
        </div>

        <div className="mt-6 px-6">
          {isEditing ? (
            <div className="flex flex-col items-center space-y-3">
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full max-w-[200px] text-lg font-black text-center border-b-2 border-black outline-none px-2 uppercase tracking-tight"
                autoFocus
              />
              <div className="flex space-x-4">
                <button onClick={handleUpdateProfile} className="text-black font-black uppercase text-[10px] tracking-widest flex items-center space-x-1">
                  <Save size={14} /> <span>Save</span>
                </button>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 font-black uppercase text-[10px] tracking-widest flex items-center space-x-1">
                  <X size={14} /> <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">{user.displayName || 'Unnamed User'}</h2>
              <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-black transition-colors">
                <Edit3 size={18} />
              </button>
            </div>
          )}
          <p className="text-[10px] font-black text-gray-400 flex items-center justify-center space-x-1 mt-2 uppercase tracking-[0.2em]">
            <Mail size={12} />
            <span>{user.email}</span>
          </p>
        </div>
      </header>

      <section className="px-4 space-y-4">
        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] ml-2">Administration</h3>
        
        <div className="bg-white rounded-[2rem] border border-gray-50 overflow-hidden shadow-sm">
          <button 
            onClick={handleReport}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-50 text-black rounded-2xl">
                <MessageSquare size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider text-black">Report Problem</p>
                <p className="text-[10px] font-bold text-gray-400">Direct mail: shemwave@gmail.com</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-200" />
          </button>

          <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-50 text-black rounded-2xl">
                <Shield size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider text-black">Security Settings</p>
                <p className="text-[10px] font-bold text-gray-400">Credentials & Access</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-200" />
          </div>
        </div>
      </section>

      <div className="px-4">
        <button 
          onClick={() => logout()}
          className="w-full p-5 flex items-center justify-center space-x-3 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-xl active:scale-95 transition-all"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="text-center pt-8 opacity-10">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black">Precision Aquaculture Platform</p>
      </div>
    </div>
  );
};

export default Profile;
