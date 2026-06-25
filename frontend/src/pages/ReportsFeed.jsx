import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Filter, Calendar, MapPin, Tag, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  "All",
  "Garbage Dumping", "Plastic Waste", "E-Waste", "Water Leakage",
  "Water Pollution", "Air Pollution", "Waste Burning", "Sewage Overflow",
  "Construction Waste", "Deforestation", "Chemical Waste", "Other Environmental Issues"
];

const SEVERITIES = ["All", "Low", "Medium", "High", "Critical"];
const STATUSES = ["All", "Active", "Resolved"];

const getSeverityStyles = (severity) => {
  switch (severity) {
    case 'Critical': 
      return 'bg-red-500/10 text-red-400 border border-red-500/25';
    case 'High': 
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/25';
    case 'Medium': 
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
    case 'Low': 
    default: 
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
  }
};

const ReportsFeed = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/reports', {
        params: { category: 'All', severity: 'All', status: 'All' }
      });
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    
    try {
      await axios.delete(`/api/reports/${reportId}?user_id=${user.id}`);
      setReports((prev) => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Failed to delete report. You might not have permission.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-brand-400" />
            Citizen Monitoring Feed
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse ecological reports submitted by our community and inspected by IBM AI.
          </p>
        </div>
        
        <Link to="/report-issue" className="btn-primary py-2.5 px-4 text-xs font-bold leading-normal">
          <ShieldAlert className="w-4 h-4" />
          Submit New Report
        </Link>
      </div>



      {/* Grid Content */}
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold">Updating environmental database feeds...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-xl mx-auto">
          <p className="text-slate-400 text-sm font-semibold mb-2">No active reports found</p>
          <p className="text-xs text-slate-500">
            There are no issues corresponding to your filters. Try selecting "All" or submit a new report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="relative glass-panel glass-panel-hover flex flex-col h-full overflow-hidden"
            >
              
              {/* Delete Button */}
              {user && user.id === report.user_id && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(report.id);
                  }}
                  title="Delete Report"
                  className="absolute top-3 right-3 bg-slate-900/80 hover:bg-red-500/90 text-slate-300 hover:text-white p-1.5 rounded-md backdrop-blur-md shadow-lg transition-colors z-20 border border-slate-700/50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              {/* Image Header */}
              {report.image_url && (
                <div className="relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-850">
                  <img 
                    src={report.image_url} 
                    alt={report.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  
                  {/* Status Overlay */}
                  <span className={`absolute top-3 left-3 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    report.status === 'Resolved' 
                      ? 'bg-brand-500/90 text-slate-950 shadow-lg shadow-brand-500/20' 
                      : 'bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/20'
                  }`}>
                    {report.status}
                  </span>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  
                  {/* Category & Severity Row */}
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <span className="text-[10px] font-semibold text-brand-400 leading-none bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                      {report.category}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getSeverityStyles(report.severity)}`}>
                      {report.severity}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-extrabold text-lg text-slate-100 mb-2 leading-snug line-clamp-1">
                    {report.title}
                  </h3>

                  {/* Description Excerpt */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                    {report.description}
                  </p>

                </div>

                {/* Footer details */}
                <div className="border-t border-slate-850/60 pt-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[9px]">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                      {report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}
                    </span>
                  </div>
                  
                  <Link 
                    to={`/reports/${report.id}`}
                    className="w-full btn-secondary text-xs py-2 px-3 justify-center gap-1 mt-1 group"
                  >
                    View AI Analysis
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ReportsFeed;
