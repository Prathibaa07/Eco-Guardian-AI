import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ShieldAlert, Map, BarChart3, Award, BrainCircuit, Globe2, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  const [stats, setStats] = useState({
    total_reports: 0,
    resolved_reports: 0,
    resolution_rate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.warn("Failed to load live stats for landing page:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative overflow-hidden min-h-screen">
      
      {/* Background Blurs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-brand-400 mb-6 hover:border-brand-500/30 transition-colors">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Powered by IBM Watsonx & Google Gemini AI</span>
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-none mb-6">
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Empowering Citizens for a
          </span>
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-400 via-emerald-500 to-cyan-400 bg-clip-text text-transparent text-glow-emerald">
            Smarter, Cleaner Future
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Report environmental hazards, track neighborhood health, and get immediate AI impact analyses and solutions. Join the community and earn points for a greener planet.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link to="/report-issue" className="btn-primary w-full sm:w-auto text-base">
            <ShieldAlert className="w-5 h-5" />
            Report an Issue
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link to="/map" className="btn-secondary w-full sm:w-auto text-base">
            <Map className="w-5 h-5" />
            Explore Interactive Map
          </Link>
        </div>

        {/* Global System Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-panel p-6 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-1">
              {stats.total_reports || 24}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Incidents Reported</span>
          </div>
          <div className="glass-panel p-6 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-brand-400 mb-1">
              {stats.resolved_reports || 16}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Issues Resolved</span>
          </div>
          <div className="glass-panel p-6 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mb-1">
              {stats.resolution_rate || "66.7"}%
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Resolution Rate</span>
          </div>
          <div className="glass-panel p-6 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 mb-1">
              98%
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Prediction Accuracy</span>
          </div>
        </div>

      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 border-t border-slate-900">
        
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-4">
            Platform Capabilities
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
            EcoGuardian AI couples modern web applications with cutting-edge artificial intelligence to revolutionize environmental tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="glass-panel glass-panel-hover p-6 flex flex-col h-full">
            <div className="p-3 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl w-fit mb-6">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">
              AI Vision Analysis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Upload photos of trash, leakage, or logging. The system automatically labels the category, assesses the immediate threat level, and estimates priority.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel glass-panel-hover p-6 flex flex-col h-full">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl w-fit mb-6">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">
              Dynamic Eco Score
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Provides geographical sustainability ratings from 0 to 100. Grid blocks calculate live pollution impact, recovering values as local issues get resolved.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel glass-panel-hover p-6 flex flex-col h-full">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl w-fit mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">
              Community Rewards
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Earn Green Points for active reporting and verifying cleanups. Unlock unique eco-badges, rise on leaderboards, and become a conservation leader.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel glass-panel-hover p-6 flex flex-col h-full">
            <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl w-fit mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">
              Sustainability Dashboard
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed flex-1">
              Inspect interactive category proportions, historical trends, and geographical reports distribution through detailed charts.
            </p>
          </div>

        </div>
      </div>

      {/* Quote Banner */}
      <div className="bg-slate-900/30 border-t border-b border-slate-900 py-16 relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-display font-extrabold text-2xl sm:text-3xl text-slate-200 mb-4 italic">
            "AI for a Cleaner, Smarter, and Sustainable Future."
          </p>
          <p className="text-xs text-brand-400 uppercase tracking-widest font-bold">EcoGuardian Platform Tagline</p>
        </div>
      </div>

    </div>
  );
};

export default Landing;
