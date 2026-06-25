import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CategoryPieChart, SeverityBarChart, MonthlyAreaChart } from '../components/ChartDashboard';
import { BarChart3, ShieldAlert, CheckCircle2, TrendingUp, Award } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/monthly-trends')
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-semibold">Compiling sustainability analytics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Incidents",
      value: stats?.total_reports || 0,
      subtext: "Reported by citizens",
      icon: <ShieldAlert className="w-5 h-5 text-brand-400" />,
      color: "border-brand-500/20"
    },
    {
      title: "Resolved Issues",
      value: stats?.resolved_reports || 0,
      subtext: "Cleared from ecosystems",
      icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
      color: "border-cyan-500/20"
    },
    {
      title: "Active Concerns",
      value: stats?.active_reports || 0,
      subtext: "Pending inspect or actions",
      icon: <ShieldAlert className="w-5 h-5 text-orange-400" />,
      color: "border-orange-500/20"
    },
    {
      title: "Resolution Rate",
      value: `${stats?.resolution_rate || 0}%`,
      subtext: "Success cleanup speed",
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/20"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 flex items-center gap-2.5">
          <BarChart3 className="w-8 h-8 text-brand-400" />
          Sustainability Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time metrics measuring community cleanup efforts and pollution distributions.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`glass-panel p-6 border ${card.color} flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                {card.icon}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">
                {card.value}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                {card.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Category Breakdown (7 cols) */}
        <div className="glass-panel p-6 lg:col-span-7 flex flex-col">
          <h4 className="font-display font-bold text-slate-200 text-base border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-400" />
            Category-wise Distribution
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <CategoryPieChart data={stats?.category_distribution} />
          </div>
        </div>

        {/* Severity Metrics (5 cols) */}
        <div className="glass-panel p-6 lg:col-span-5 flex flex-col">
          <h4 className="font-display font-bold text-slate-200 text-base border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            Severity Analysis Count
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <SeverityBarChart data={stats?.severity_distribution} />
          </div>
        </div>

      </div>

      {/* Timeline Area Trend Card */}
      <div className="glass-panel p-6">
        <h4 className="font-display font-bold text-slate-200 text-base border-b border-slate-850 pb-3 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Monthly Environmental Trends
        </h4>
        <div className="w-full">
          <MonthlyAreaChart data={trends} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
