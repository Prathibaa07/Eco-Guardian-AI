import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, ArrowRight, ShieldAlert, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Message & redirect destination injected by ProtectedRoute
  const redirectMessage = location.state?.message || null;
  const redirectTo = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email");

    setLoading(true);
    setError('');
    
    const res = await login(email);
    setLoading(false);
    
    if (res.success) {
      navigate(redirectTo);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4">
      {/* Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-2xl mb-3">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-100">Welcome Back</h2>
          <p className="text-slate-400 text-xs mt-1">Sign in to your EcoGuardian citizen profile</p>
        </div>

        {/* Redirect info banner (shown when bounced from a protected page) */}
        {redirectMessage && (
          <div className="mb-5 p-4 bg-blue-500/10 border border-blue-500/25 rounded-xl flex items-start gap-2.5 text-xs text-blue-300">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <span>{redirectMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              * Note: In local demo mode, typing any email will log you in (creating a new profile if it's new).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Don't have a profile? </span>
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
