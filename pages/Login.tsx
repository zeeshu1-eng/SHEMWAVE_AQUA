
import React, { useState } from 'react';
import { loginEmail, signupEmail } from '../firebase';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Please enter your name.");
        await signupEmail(name, email, password);
      } else {
        await loginEmail(email, password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let message = "An error occurred. Please try again.";
      if (err.code === 'auth/user-not-found') message = "User not found. Try signing up!";
      else if (err.code === 'auth/wrong-password') message = "Incorrect password.";
      else if (err.code === 'auth/email-already-in-use') message = "This email is already registered.";
      else if (err.code === 'auth/invalid-email') message = "Please enter a valid email.";
      else if (err.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      setError(err.message || message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white py-12">
      <div className="w-full max-w-sm space-y-12">
        {/* Logo Section Recreating the Shemwave Logo from Image */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-24 h-24 z-10 drop-shadow-md">
                <path d="M50 15 L85 75 L68 75 L50 45 L32 75 L15 75 Z" fill="#E11D48" />
                <path d="M50 35 L65 65 L55 65 L50 55 L45 65 L35 65 Z" fill="white" />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-black tracking-[0.1em] uppercase">
              SHEMWAVE
            </h1>
            <p className="text-gray-400 text-xs font-light tracking-[0.4em] uppercase">
              HOME AUTOMATION
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${!isSignUp ? 'bg-black text-white shadow-xl' : 'text-gray-400'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${isSignUp ? 'bg-black text-white shadow-xl' : 'text-gray-400'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center space-x-3 text-red-700 animate-in fade-in zoom-in-95">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                placeholder="FULL NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all text-[11px] font-bold tracking-widest text-black"
                required={isSignUp}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all text-[11px] font-bold tracking-widest text-black"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all text-[11px] font-bold tracking-widest text-black"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <span>{isSignUp ? "SIGNIN" : "SIGNIN"}</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
