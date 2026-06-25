import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import { Map, Tag, ShieldAlert, Layers, Navigation, MapPin, X, Locate } from 'lucide-react';

const CATEGORIES = [
  "All",
  "Garbage Dumping", "Plastic Waste", "E-Waste", "Water Leakage",
  "Water Pollution", "Air Pollution", "Waste Burning", "Sewage Overflow",
  "Construction Waste", "Deforestation", "Chemical Waste", "Other Environmental Issues"
];

const SEVERITIES = ["All", "Low", "Medium", "High", "Critical"];

const InteractiveMap = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center default
  const [mapZoom, setMapZoom] = useState(5);

  // User location state
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, address, area, city, state }
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [showLocCard, setShowLocCard] = useState(true);

  // Reverse geocode using Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const area = a.neighbourhood || a.suburb || a.quarter || a.village || a.town || '';
        const road = a.road || a.pedestrian || a.path || '';
        const city = a.city || a.town || a.village || a.county || '';
        const state = a.state || '';
        const country = a.country || '';
        const shortAddress = [road, area, city].filter(Boolean).join(', ');
        return { area, road, city, state, country, shortAddress, full: data.display_name };
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
    return null;
  };

  // Detect user location
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError('');

    const options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 };

    const onSuccess = async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const geo = await reverseGeocode(lat, lng);
      setUserLocation({
        lat, lng,
        address: geo?.shortAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        area: geo?.area || '',
        city: geo?.city || '',
        state: geo?.state || '',
        country: geo?.country || '',
        road: geo?.road || '',
      });
      setMapCenter([lat, lng]);
      setMapZoom(14);
      setLocating(false);
      setShowLocCard(true);
    };

    const onError = (err) => {
      if (err.code === 1) {
        setLocError('Location access denied. Please allow location in your browser settings.');
      } else {
        // retry with low accuracy
        navigator.geolocation.getCurrentPosition(onSuccess, (e) => {
          setLocError('Could not detect location. Try clicking "Center on Me" again.');
          setLocating(false);
        }, { enableHighAccuracy: false, timeout: 6000 });
        return;
      }
      setLocating(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, []);

  // Fetch reports
  const fetchMapReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/reports', { params: { category, severity } });
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching map reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapReports();
  }, [category, severity]);

  // Auto-detect location on page load
  useEffect(() => {
    detectUserLocation();
  }, []);

  // Count nearby reports (within ~5km radius)
  const nearbyReports = userLocation
    ? reports.filter((r) => {
        const dLat = r.latitude - userLocation.lat;
        const dLng = r.longitude - userLocation.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        return dist < 0.05; // ~5.5km at equator
      })
    : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col relative">

      {/* ── Top Filter Toolbar ── */}
      <div className="absolute top-4 left-4 right-4 z-[400] max-w-5xl mx-auto flex flex-col sm:flex-row gap-3
                      bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-2xl
                      items-center justify-between">

        {/* Title */}
        <div className="hidden lg:flex items-center gap-2 text-brand-400 font-semibold text-sm shrink-0">
          <Map className="w-5 h-5" />
          <span>Interactive Hazards Map</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 flex-1 sm:flex-initial">
            <Tag className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-950 text-slate-200">{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 flex-1 sm:flex-initial">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s} className="bg-slate-950 text-slate-200">{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 leading-none">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <strong className="text-brand-400">{reports.length}</strong> nodes
          </div>

          {/* Center on Me button */}
          <button
            onClick={detectUserLocation}
            disabled={locating}
            className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/20
                       text-blue-400 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <Locate className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Locating...' : 'Center on Me'}
          </button>
        </div>
      </div>

      {/* ── Map Canvas ── */}
      <div className="flex-1 bg-slate-950 relative">
        {loading && (
          <div className="absolute inset-0 z-[500] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-semibold">Updating environmental markers...</p>
          </div>
        )}
        <MapComponent
          reports={reports}
          center={mapCenter}
          zoom={mapZoom}
          userLocation={userLocation}
        />
      </div>

      {/* ── Floating Location Info Card (bottom-left) ── */}
      {showLocCard && (
        <div className="absolute bottom-6 left-4 z-[400] w-[290px]
                        bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl
                        shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50 animate-pulse"></div>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Your Location</span>
            </div>
            <button
              onClick={() => setShowLocCard(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card body */}
          <div className="px-4 py-3 space-y-3">
            {locating ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
                Detecting your location...
              </div>
            ) : locError ? (
              <p className="text-[11px] text-red-400 leading-relaxed">{locError}</p>
            ) : userLocation ? (
              <>
                {/* Area name large */}
                {(userLocation.area || userLocation.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-100 leading-snug">
                        {userLocation.area || userLocation.city}
                      </p>
                      {userLocation.road && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{userLocation.road}</p>
                      )}
                      <p className="text-[11px] text-blue-400 font-semibold mt-0.5">
                        {[userLocation.city, userLocation.state, userLocation.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Nearby reports badge */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-semibold
                  ${nearbyReports.length > 0
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                    : 'bg-brand-500/10 border-brand-500/20 text-brand-400'}`}>
                  <span>
                    {nearbyReports.length > 0
                      ? `⚠️ ${nearbyReports.length} reported issue${nearbyReports.length > 1 ? 's' : ''} nearby`
                      : '✅ No active issues near you'}
                  </span>
                  <span className="text-[9px] opacity-60">~5km radius</span>
                </div>

                {/* Coords row */}
                <div className="font-mono text-[9px] text-slate-600 flex gap-3 pt-1 border-t border-slate-800/60">
                  <span>{userLocation.lat.toFixed(5)}°N</span>
                  <span>{userLocation.lng.toFixed(5)}°E</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-slate-400">Location not detected yet.</p>
                <button
                  onClick={detectUserLocation}
                  className="btn-primary py-2 text-xs font-bold"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Detect My Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show card again if dismissed */}
      {!showLocCard && userLocation && (
        <button
          onClick={() => setShowLocCard(true)}
          className="absolute bottom-6 left-4 z-[400] flex items-center gap-2 bg-slate-950/90 backdrop-blur-md
                     border border-blue-500/30 text-blue-400 px-3 py-2 rounded-xl text-xs font-bold
                     shadow-xl hover:bg-blue-500/10 transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          {userLocation.area || userLocation.city || 'My Location'}
        </button>
      )}

    </div>
  );
};

export default InteractiveMap;
