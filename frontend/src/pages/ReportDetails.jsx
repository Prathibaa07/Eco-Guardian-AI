import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';
import ImageUploader from '../components/ImageUploader';
import {
  Calendar, MapPin, Sparkles, CheckSquare, Award, AlertTriangle,
  ArrowLeft, CheckCircle, ShieldCheck, ClipboardList, Info
} from 'lucide-react';

const getSeverityStyles = (severity) => {
  switch (severity) {
    case 'Critical': return 'bg-red-500/10 text-red-400 border border-red-500/25';
    case 'High': return 'bg-orange-500/10 text-orange-400 border border-orange-500/25';
    case 'Medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
    case 'Low': default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
  }
};

const getPriorityText = (priority) => {
  switch (priority) {
    case 'Critical': return 'Immediate Response Required';
    case 'High': return 'High Attention Required';
    case 'Medium': return 'Standard Inspection Required';
    case 'Low': default: return 'Low Risk Inspector Alert';
  }
};

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolution Form States
  const [resolving, setResolving] = useState(false);
  const [resDescription, setResDescription] = useState('');
  const [resImage, setResImage] = useState(null);
  const [submittingRes, setSubmittingRes] = useState(false);
  const [resError, setResError] = useState('');

  const fetchReportDetails = async () => {
    try {
      const res = await axios.get(`/api/reports/${id}`);
      setReport(res.data);
      setError('');
    } catch (err) {
      console.error("Error loading report details:", err);
      setError("Report not found or server database query failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resDescription.trim()) return setResError("Please write a description explaining how the issue was resolved.");

    setSubmittingRes(true);
    setResError('');

    try {
      const formData = new FormData();
      formData.append("description", resDescription);
      if (resImage) {
        formData.append("image", resImage);
      }
      if (user) {
        formData.append("user_id", user.id);
      }

      await axios.post(`/api/reports/${id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResolving(false);
      setResDescription('');
      setResImage(null);

      // Refresh details
      await fetchReportDetails();
      if (user) {
        await refreshUserProfile();
      }
    } catch (err) {
      console.error("Resolution submit error:", err);
      setResError(err.response?.data?.error || "Failed to submit resolution. Please try again.");
    } finally {
      setSubmittingRes(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-semibold">Running IBM AI Vision parsing models...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="glass-panel p-8">
          <p className="text-red-400 text-sm font-semibold mb-4">⚠️ {error || "Incident Report Not Found"}</p>
          <Link to="/reports" className="btn-primary w-full text-xs">
            <ArrowLeft className="w-4 h-4" />
            Back to Public Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back navigation */}
      <Link
        to="/reports"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Public Feed
      </Link>

      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className="text-xs font-semibold text-brand-400 leading-none bg-slate-900 border border-slate-850 px-2 py-1 rounded">
              {report.category}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getSeverityStyles(report.severity)}`}>
              {report.severity} Severity
            </span>
            {report.status === 'Resolved' && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Resolved
              </span>
            )}
          </div>

          <h1 className="font-display font-extrabold text-3xl text-slate-100 leading-tight">
            {report.title}
          </h1>

          <div className="flex flex-wrap gap-4 items-center text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Reported on {new Date(report.created_at).toLocaleDateString()}
            </span>
            {report.reporter_name && (
              <span className="flex items-center gap-1">
                Reporter: <strong className="text-slate-400 font-semibold">{report.reporter_name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Resolve CTA */}
        {report.status !== 'Resolved' && (
          <button
            onClick={() => setResolving(!resolving)}
            className="btn-primary py-2.5 px-4 text-xs font-bold leading-normal"
          >
            <CheckCircle className="w-4 h-4" />
            Resolve This Issue
          </button>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Image and Description (7 cols) */}
        <div className="lg:col-span-7 space-y-8">

          {/* Main Photo Card */}
          <div className="glass-panel p-4 flex flex-col items-center justify-center bg-slate-900/40">
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
              <img
                src={report.image_url}
                alt={report.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {report.description && (
              <div className="w-full mt-4 p-4 bg-slate-950/40 rounded-xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reporter's Comments</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </div>
            )}
          </div>

          {/* Location Map Card */}
          <div className="glass-panel p-5 flex flex-col h-[280px]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Incident Location coordinates
            </h4>
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden">
              <MapComponent
                center={[report.latitude, report.longitude]}
                reports={[report]}
                zoom={14}
              />
            </div>
          </div>

          {/* Resolved Showcase (If Resolved) */}
          {report.status === 'Resolved' && (
            <div className="glass-panel p-6 border-brand-500/20 bg-brand-950/5 space-y-4">
              <h3 className="font-display font-bold text-lg text-brand-400 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Resolution Details
              </h3>

              {report.resolution_image_url && (
                <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850 mx-auto">
                  <img
                    src={report.resolution_image_url}
                    alt="Resolution Evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                <span className="block font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Resolution Explanation
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{report.resolution_description || "Issue marked as resolved by community inspectors."}</p>
                {report.resolved_at && (
                  <span className="block text-[10px] text-slate-500 mt-3 font-mono">
                    Timestamp: {new Date(report.resolved_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: AI Analysis Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* AI Analysis Findings Card */}
          <div className="glass-panel p-6 space-y-6 border-brand-500/20 bg-brand-950/5">

            <div className="border-b border-slate-800/80 pb-4 flex justify-between items-center">
              <h3 className="font-display font-extrabold text-lg text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                IBM & Gemini AI Insights
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 leading-none bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-full flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-brand-400" />
                Report Summary
              </span>
            </div>

            {/* Severity Card info */}
            <div className="grid grid-cols-2 gap-4">

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Severity Score
                </span>
                <strong
                  className="text-lg font-black"
                  style={{ color: report.severity === 'Critical' ? '#EF4444' : report.severity === 'High' ? '#F97316' : report.severity === 'Medium' ? '#F59E0B' : '#10B981' }}
                >
                  {report.severity}
                </strong>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Priority Rating
                </span>
                <strong
                  className="text-lg font-black"
                  style={{ color: report.priority_score === 'Critical' ? '#EF4444' : report.priority_score === 'High' ? '#F97316' : report.priority_score === 'Medium' ? '#F59E0B' : '#10B981' }}
                >
                  {report.priority_score}
                </strong>
              </div>

            </div>

            {/* Impact Text */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Ecological Impact Assessment
              </span>
              <p className="text-slate-350 text-xs leading-relaxed font-medium">
                {report.environmental_impact || "No impact assessment recorded."}
              </p>
            </div>

            {/* Recommended Solutions */}
            <div className="space-y-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-brand-400" />
                Actionable Resolution Steps
              </span>
              <ul className="space-y-2.5">
                {report.recommended_solutions && report.recommended_solutions.length > 0 ? (
                  report.recommended_solutions.map((sol, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/80 flex items-start gap-2.5 hover:border-brand-500/30 transition-colors"
                    >
                      <span className="w-5 h-5 shrink-0 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 text-xs leading-relaxed">{sol}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500 italic">No recommended steps found.</li>
                )}
              </ul>
            </div>

          </div>

          {/* Resolution Drawer Panel */}
          {resolving && report.status !== 'Resolved' && (
            <div className="glass-panel p-6 border-cyan-500/25 bg-cyan-950/5 space-y-4 animate-in slide-in-from-top-5 duration-300">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-2">
                <h4 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-400" />
                  Resolve Hazard
                </h4>
                <button
                  onClick={() => setResolving(false)}
                  className="text-xs text-slate-500 hover:text-slate-350"
                >
                  Cancel
                </button>
              </div>

              {resError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-1.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resError}</span>
                </div>
              )}

              <form onSubmit={handleResolveSubmit} className="space-y-4">

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    How was this resolved?
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={resDescription}
                    onChange={(e) => setResDescription(e.target.value)}
                    placeholder="Describe what cleanup or repair was completed (e.g. municipal crew cleared the trash pile)."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>

                {/* Optional Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Resolution Photo (Optional)
                  </label>
                  <ImageUploader onImageSelected={setResImage} />
                </div>

                {/* Points incentive notice */}
                <div className="p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl flex items-center gap-2.5 text-[11px] text-brand-400 font-semibold">
                  <Award className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                  <span>Submitting a resolution awards +100 Green Points!</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingRes}
                  className="btn-primary w-full py-2.5 text-xs font-bold"
                >
                  {submittingRes ? "Saving Resolution..." : "Complete Resolution"}
                </button>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ReportDetails;
