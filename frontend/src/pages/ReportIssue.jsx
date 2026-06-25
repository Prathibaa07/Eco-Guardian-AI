import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ImageUploader from '../components/ImageUploader';
import MapComponent from '../components/MapComponent';
import { ShieldAlert, Sparkles, MapPin, Navigation, Info, Award, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  "Garbage Dumping", "Plastic Waste", "E-Waste", "Water Leakage",
  "Water Pollution", "Air Pollution", "Waste Burning", "Sewage Overflow",
  "Construction Waste", "Deforestation", "Chemical Waste", "Vegetation Waste", "Other Environmental Issues"
];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

const ReportIssue = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [image, setImage] = useState(null);
  const [coords, setCoords] = useState(null); // {lat, lng}
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  const [gpsLoading, setGpsLoading] = useState(false);
  const [addressInfo, setAddressInfo] = useState(null); // Reverse geocoded address
  const [addressLoading, setAddressLoading] = useState(false);

  // UI Flow States
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [result, setResult] = useState(null); // For submission success dialog

  // Auto-detect location on load
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not supported. Please click the map to select your location.");
      return;
    }

    setGpsLoading(true);
    setError('');

    const options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };

    const successCallback = (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      setMapCenter([latitude, longitude]);
      setGpsLoading(false);
    };

    const errorCallback = (err) => {
      // If high accuracy failed, retry with low accuracy
      if (options.enableHighAccuracy) {
        console.log("High accuracy failed or timed out, retrying with low accuracy...");
        options.enableHighAccuracy = false;
        options.timeout = 5000;
        navigator.geolocation.getCurrentPosition(successCallback, finalErrorCallback, options);
      } else {
        finalErrorCallback(err);
      }
    };

    const finalErrorCallback = (err) => {
      console.warn("Geolocation failed:", err);
      let errorMsg = "Could not access your location. Please select the coordinates manually on the map.";
      if (err.code === 1) { // PERMISSION_DENIED
        errorMsg = "Location access was denied. Please click the security lock icon in your browser address bar next to 'localhost:3000' and change Location to 'Allow', then click 'Auto GPS'.";
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errorMsg = "Your device's location is unavailable. Please verify Windows location service is active in Settings -> Privacy & security -> Location, or click the map manually.";
      } else if (err.code === 3) { // TIMEOUT
        errorMsg = "Location request timed out. Click the 'Auto GPS' button to retry, or select the coordinates manually on the map.";
      }
      setError(errorMsg);
      setGpsLoading(false);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  // Reverse geocode coordinates to a human-readable address using Nominatim
  const reverseGeocode = async (lat, lng) => {
    setAddressLoading(true);
    setAddressInfo(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const place = a.amenity || a.building || a.neighbourhood || a.suburb || a.village || a.town || a.city || '';
        const road = a.road || a.pedestrian || a.path || '';
        const city = a.city || a.town || a.village || a.county || '';
        const state = a.state || '';
        const country = a.country || '';
        setAddressInfo({
          display: data.display_name,
          place,
          road,
          city,
          state,
          country,
          short: [place, road, city, state].filter(Boolean).join(', ')
        });
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Trigger reverse geocoding whenever coordinates change
  useEffect(() => {
    if (coords) {
      reverseGeocode(coords.lat, coords.lng);
    } else {
      setAddressInfo(null);
    }
  }, [coords]);

  const handleCoordinatesSelected = (selected) => {
    setCoords(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError("Please upload an image of the environmental issue.");
    if (!coords) return setError("Please specify the location on the map.");
    if (!category) return setError("Please specify the category.");
    if (!severity) return setError("Please specify the severity.");
    if (!description.trim()) return setError("Please write a short description to guide the AI.");

    setError('');
    setSubmitting(true);
    setResult(null);

    // Dynamic loader statuses for premium feel
    const statuses = [
      "Analyzing image visual layers...",
      "Matching category with environmental databases...",
      "Evaluating severity indices and priority score...",
      "Formulating sustainable resolution suggestions...",
      "Saving details to EcoGuardian network..."
    ];

    let statusIndex = 0;
    setAnalysisStatus(statuses[statusIndex]);
    const statusTimer = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length;
      setAnalysisStatus(statuses[statusIndex]);
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("severity", severity);
      formData.append("latitude", coords.lat);
      formData.append("longitude", coords.lng);
      if (user) {
        formData.append("user_id", user.id);
      }

      const res = await axios.post('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(statusTimer);
      if (user) {
        await refreshUserProfile();
      }
      navigate(`/reports/${res.data.id}`);
    } catch (err) {
      clearInterval(statusTimer);
      console.error("Submission error:", err);
      setError(err.response?.data?.error || "Failed to submit environmental report. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 flex items-center gap-2.5">
          <ShieldAlert className="w-8 h-8 text-brand-400" />
          Report Environmental Concern
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xl">
          Upload an image, describe the situation, and specify coordinates. Our IBM & Gemini models will analyze the issue instantly.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400 max-w-4xl">
          <Info className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Submission Form */}
      {!result ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="glass-panel p-6 space-y-5">
              <h3 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2 mb-6">
                <ShieldAlert className="w-5 h-5 text-brand-400" />
                AI Incident Details
              </h3>
              
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all"
                >
                  <option value="" disabled>Select a Category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all"
                >
                  <option value="" disabled>Select Severity</option>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Describe the issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about what you see, the potential cause, how long it has been there, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-brand-500/50 transition-all"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
                  Upload Photo Evidence <span className="text-red-500">*</span>
                </label>
                <ImageUploader onImageSelected={setImage} />
              </div>
            </div>

          </div>

          {/* Right: Map Selector (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-6">
            
            <div className="glass-panel p-6 flex flex-col gap-4">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-display font-bold text-lg text-slate-200 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  Incident Location
                </h3>
                
                {/* Auto GPS Trigger */}
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={gpsLoading}
                  className="text-xs bg-slate-950 border border-slate-850 hover:border-cyan-500/30 text-slate-350 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  {gpsLoading ? "Locating..." : "Auto GPS"}
                </button>
              </div>

              {/* OSM Selector */}
              <div className="h-[300px] bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden">
                <MapComponent 
                  selectionMode={true} 
                  center={mapCenter} 
                  selectedCoords={coords} 
                  onCoordinatesSelected={handleCoordinatesSelected}
                  zoom={14}
                />
              </div>

              {coords ? (
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1.5">
                  {addressLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                      <span>Resolving address...</span>
                    </div>
                  ) : addressInfo ? (
                    <>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          {addressInfo.place && (
                            <span className="text-xs font-bold text-slate-200 leading-snug">{addressInfo.place}</span>
                          )}
                          {addressInfo.road && (
                            <span className="text-xs text-slate-350">{addressInfo.road}</span>
                          )}
                          <span className="text-xs text-cyan-400 font-semibold">
                            {[addressInfo.city, addressInfo.state, addressInfo.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60 font-mono text-[10px] text-slate-500">
                        <span>{coords.lat.toFixed(5)}°N</span>
                        <span>{coords.lng.toFixed(5)}°E</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center text-xs text-amber-500 font-semibold">
                  ⚠️ No location selected. Click on the map to place a marker.
                </div>
              )}

            </div>

            {/* Submission CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-4 text-base font-bold shadow-brand-500/20"
            >
              Analyze & Submit Report
            </button>

          </div>

        </form>
      ) : (
        
        /* Submission Success Screen */
        <div className="glass-panel max-w-2xl mx-auto p-10 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Top Success Badge */}
          <div className="w-16 h-16 bg-brand-500/10 text-brand-400 border-2 border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/5">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 mb-2">
            Report Submitted Successfully!
          </h2>
          
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            Your incident has been securely recorded on the platform and is now visible on the public monitoring map.
          </p>

          {/* Gamified Rewards Summary */}
          <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-850/80 max-w-md mx-auto mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Reward Received</span>
                <h4 className="font-display font-extrabold text-slate-200 leading-tight">Eco Sentinel</h4>
                <p className="text-[11px] text-slate-400">Green point increments awarded</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-brand-400">+50</span>
              <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Points</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/reports/${result.id}`)}
              className="btn-primary"
            >
              View Full AI Analysis
            </button>
            <button
              onClick={() => {
                setResult(null);
                setTitle('');
                setDescription('');
                setImage(null);
                setCoords(null);
                detectLocation();
              }}
              className="btn-secondary"
            >
              Report Another Issue
            </button>
          </div>

        </div>
      )}

      {/* AI Processing Screen Backdrop Loader */}
      {submitting && !result && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
            </div>
          </div>
          <h3 className="font-display font-extrabold text-xl text-slate-100 mb-2">
            IBM & Gemini AI Vision Analysis
          </h3>
          <p className="text-slate-400 text-sm max-w-sm font-medium animate-pulse">
            {analysisStatus}
          </p>
        </div>
      )}

    </div>
  );
};

export default ReportIssue;
