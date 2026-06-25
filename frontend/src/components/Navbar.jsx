import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Award, Menu, X, LogOut, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  
  const linkClasses = (path) => `
    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'bg-emerald-950/40 text-brand-400 border border-emerald-800/30' 
      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'}
  `;

  return (
    <nav className="sticky top-0 z-[600] bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-brand-400 border border-brand-500/20 group-hover:bg-brand-500/20 group-hover:text-brand-300 transition-all duration-300">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg leading-tight bg-gradient-to-r from-white via-slate-100 to-brand-400 bg-clip-text text-transparent">
                EcoGuardian
              </span>
              <span className="text-[10px] text-brand-400 tracking-wider uppercase font-semibold">
                IBM & Gemini AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/map" className={linkClasses('/map')}>
              Interactive Map
            </Link>
            <Link to="/reports" className={linkClasses('/reports')}>
              Issues Feed
            </Link>
            <Link to="/dashboard" className={linkClasses('/dashboard')}>
              Sustainability Dashboard
            </Link>
            <Link to="/rewards" className={linkClasses('/rewards')}>
              Community Rewards
            </Link>
          </div>

          {/* Actions & User State */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Green Points Badge */}
                <Link to="/rewards" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold hover:border-brand-500/30 transition-all">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Green Points:</span>
                  <span className="text-brand-400 font-bold">{user.points}</span>
                </Link>

                {/* Report Action Button */}
                <Link to="/report-issue" className="btn-primary py-2 px-4 text-xs font-bold leading-normal">
                  <ShieldAlert className="w-4 h-4" />
                  Report Issue
                </Link>

                {/* Profile Link or User Display */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-200">{user.full_name}</span>
                    <span className="text-[10px] text-slate-400">Citizen Reporter</span>
                  </div>
                  <button 
                    onClick={logout} 
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="btn-secondary py-2 px-4 text-xs font-bold">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-850 px-2 pt-2 pb-4 space-y-1 sm:px-3">
          <Link 
            to="/map" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Interactive Map
          </Link>
          <Link 
            to="/reports" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Issues Feed
          </Link>
          <Link 
            to="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Sustainability Dashboard
          </Link>
          <Link 
            to="/rewards" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Community Rewards
          </Link>
          
          <div className="pt-4 pb-2 border-t border-slate-850 mt-4 space-y-3 px-3">
            {user ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200">{user.full_name}</span>
                    <span className="text-xs text-slate-400">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-brand-400 font-bold">{user.points} pts</span>
                  </div>
                </div>
                
                <Link 
                  to="/report-issue" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Report Issue
                </Link>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="btn-secondary w-full py-2.5 text-sm border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary w-full py-2.5 text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
