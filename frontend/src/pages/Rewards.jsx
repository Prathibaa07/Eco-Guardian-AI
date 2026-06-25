import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldAlert, Trophy, ShieldCheck, Heart, User, MapPin, Sparkles, HelpCircle } from 'lucide-react';

const ALL_BADGES = [
  { name: "Eco Sentinel", description: "Submitted your very first environmental issue report.", icon: "🌱" },
  { name: "Green Inspector", description: "Submitted 5 environmental issue reports.", icon: "🔍" },
  { name: "Nature Savior", description: "Submitted 10 environmental issue reports.", icon: "🌳" },
  { name: "Plastbuster", description: "Reported a plastic waste issue.", icon: "♻️" },
  { name: "Water Defender", description: "Reported a water pollution or leakage issue.", icon: "💧" },
  { name: "Zero Waste Hero", description: "Resolved an environmental issue.", icon: "🏆" }
];

const getEcoScoreColor = (score) => {
  if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
  if (score >= 35) return 'text-orange-400 bg-orange-500/10 border-orange-500/25';
  return 'text-red-400 bg-red-500/10 border-red-500/25';
};

const Rewards = () => {
  const { user } = useAuth();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRewardsData = async () => {
    setLoading(true);
    try {
      const [leaderRes, zonesRes] = await Promise.all([
        axios.get('/api/leaderboard'),
        axios.get('/api/zones')
      ]);
      setLeaderboard(leaderRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error("Error loading rewards details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const hasBadge = (badgeName) => {
    if (!user || !user.badges) return false;
    return user.badges.some(b => b.badge_name === badgeName);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-semibold">Loading community achievements database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 flex items-center gap-2.5">
          <Award className="w-8 h-8 text-amber-400" />
          Community Rewards & Eco Scores
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Earn points by helping monitor and resolve environmental threats, and check your area's Eco Score.
        </p>
      </div>

      {/* Top Section: User achievements & Badge details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: User Points and Info (4 cols) */}
        {user && (
          <div className="lg:col-span-4 glass-panel p-6 flex flex-col justify-between border-brand-500/20 bg-brand-950/5 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-200 leading-tight">
                    {user.full_name}
                  </h3>
                  <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">Active Protector</span>
                </div>
              </div>

              {/* Total points */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Your Rewards Balance</span>
                  <span className="text-xs text-slate-400">Green Points Earned</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-brand-400 text-glow-emerald">{user.points}</span>
                </div>
              </div>
            </div>

            {/* Quick how to earn */}
            <div className="mt-8 p-3.5 bg-slate-900/50 rounded-xl border border-slate-850/80 text-[11px] text-slate-400 space-y-2">
              <span className="block font-bold text-slate-350 uppercase tracking-wider text-[9px]">How to Earn Points:</span>
              <div className="flex justify-between">
                <span>Submit hazard report</span>
                <strong className="text-brand-400">+50 pts</strong>
              </div>
              <div className="flex justify-between">
                <span>Verify resolve details</span>
                <strong className="text-brand-400">+100 pts</strong>
              </div>
            </div>

          </div>
        )}

        {/* Right: Badge Showcase Gallery (8 cols) */}
        <div className={`glass-panel p-6 ${user ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <h3 className="font-display font-bold text-slate-200 text-base border-b border-slate-850 pb-3 mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            Badges Gallery
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ALL_BADGES.map((badge, idx) => {
              const earned = hasBadge(badge.name);
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    earned 
                      ? 'bg-slate-900/60 border-brand-500/30 hover:border-brand-500/50' 
                      : 'bg-slate-900/20 border-slate-850/60 opacity-50'
                  }`}
                >
                  <span className={`text-2xl shrink-0 p-1.5 rounded-lg ${earned ? 'bg-brand-500/10' : 'bg-slate-950/40'}`}>
                    {badge.icon}
                  </span>
                  <div>
                    <h4 className={`text-xs font-bold ${earned ? 'text-slate-100' : 'text-slate-500'}`}>
                      {badge.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Lower section: Leaderboard vs Eco Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Leaderboard Table (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6">
          <h3 className="font-display font-bold text-slate-200 text-base border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Citizen Leaderboard
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 font-semibold">Rank</th>
                  <th className="py-3 font-semibold">Protector</th>
                  <th className="py-3 font-semibold text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {leaderboard.map((row, idx) => (
                  <tr key={row.id} className="text-slate-300">
                    <td className="py-3.5 font-bold flex items-center gap-1">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                    </td>
                    <td className="py-3.5 font-medium">{row.full_name}</td>
                    <td className="py-3.5 text-right font-black text-brand-400">{row.points}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500 italic">No leader rankings recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Eco Scores Grid (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6">
          <h3 className="font-display font-bold text-slate-200 text-base border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Area-wise Eco Scores
          </h3>
          
          <div className="overflow-y-auto max-h-[300px] pr-1 space-y-3">
            {zones.map((z, idx) => (
              <div 
                key={idx}
                className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-350 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    Grid Area ({z.latitude.toFixed(2)}, {z.longitude.toFixed(2)})
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Submitted: <strong className="text-slate-400">{z.total_reports}</strong></span>
                    <span>Resolved: <strong className="text-brand-400">{z.resolved_reports}</strong></span>
                  </div>
                </div>

                {/* Score badge */}
                <div className={`px-3.5 py-2 rounded-xl border text-center shrink-0 flex flex-col justify-center min-w-[70px] ${getEcoScoreColor(z.eco_score)}`}>
                  <span className="text-xs font-semibold uppercase leading-none opacity-80">Eco Score</span>
                  <strong className="text-base font-black leading-tight mt-0.5">{z.eco_score}</strong>
                </div>
              </div>
            ))}
            
            {zones.length === 0 && (
              <div className="p-10 border border-dashed border-slate-850 rounded-xl text-center text-slate-500 text-xs italic">
                No local zones mapped. Submit a report with map coordinates to calculate local scores!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Rewards;
