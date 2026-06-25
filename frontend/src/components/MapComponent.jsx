import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, MapPin } from 'lucide-react';

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'Critical': return '#EF4444'; // Red
    case 'High': return '#F97316';     // Orange
    case 'Medium': return '#F59E0B';   // Amber/Yellow
    case 'Low': default: return '#10B981'; // Green
  }
};

// Sub-component to adjust map focus dynamically
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Sub-component to capture click events for selecting coordinates
const MapEventsHandler = ({ onMapClick, active }) => {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapComponent = ({ 
  reports = [], 
  center = [40.7128, -74.0060], // Default NYC
  zoom = 13, 
  selectionMode = false, 
  selectedCoords = null, 
  onCoordinatesSelected,
  userLocation = null,   // { lat, lng, address }
}) => {
  
  const handleMapClick = (lat, lng) => {
    if (onCoordinatesSelected) {
      onCoordinatesSelected({ lat, lng });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Premium Dark carto tiles
        />
        
        {/* Dynamic map centering */}
        <ChangeView center={selectedCoords ? [selectedCoords.lat, selectedCoords.lng] : center} zoom={zoom} />
        
        {/* Click listener */}
        <MapEventsHandler onMapClick={handleMapClick} active={selectionMode} />

        {/* Selected Coordinates Pin (in selection mode) */}
        {selectionMode && selectedCoords && (
          <CircleMarker
            center={[selectedCoords.lat, selectedCoords.lng]}
            radius={8}
            pathOptions={{
              color: '#06B6D4',
              fillColor: '#22D3EE',
              fillOpacity: 0.9,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-xs font-semibold p-1">
                <span className="text-cyan-400 block mb-1">Selected Location</span>
                Lat: {selectedCoords.lat.toFixed(5)} <br />
                Lng: {selectedCoords.lng.toFixed(5)}
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* "You are here" User Location Marker */}
        {userLocation && (
          <>
            {/* Outer pulse ring */}
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={22}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4 4',
              }}
            />
            {/* Inner solid dot */}
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={10}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#3B82F6',
                fillOpacity: 1,
                weight: 2.5,
              }}
            >
              <Popup>
                <div className="w-[200px] p-1.5 flex flex-col gap-2 text-slate-100">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                    📍 Your Current Location
                  </span>
                  {userLocation.address ? (
                    <p className="text-xs text-slate-200 leading-snug font-medium">
                      {userLocation.address}
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-slate-300">
                      {userLocation.lat.toFixed(5)}°N, {userLocation.lng.toFixed(5)}°E
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Public Reports Pins */}
        {!selectionMode && reports.map((report) => {
          const color = getSeverityColor(report.severity);
          return (
            <React.Fragment key={report.id}>
              {/* Pulse Outer Aura for critical issues */}
              {report.severity === 'Critical' && (
                <CircleMarker
                  center={[report.latitude, report.longitude]}
                  radius={20}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 0,
                  }}
                />
              )}
              
              {/* Main Pin */}
              <CircleMarker
                center={[report.latitude, report.longitude]}
                radius={9}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="w-[200px] flex flex-col gap-2 p-1.5 text-slate-100">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-semibold text-slate-300 uppercase leading-none bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                        {report.category}
                      </span>
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                        style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
                      >
                        {report.severity}
                      </span>
                    </div>
                    
                    <h5 className="font-display font-extrabold text-sm text-slate-200 mt-1 leading-snug">
                      {report.title}
                    </h5>
                    
                    {report.image_url && (
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                        <img 
                          src={report.image_url} 
                          alt={report.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850/60">
                      <span className="text-[10px] text-slate-400">
                        Status: <strong className={report.status === 'Resolved' ? 'text-brand-400' : 'text-amber-400'}>{report.status}</strong>
                      </span>
                      <Link 
                        to={`/reports/${report.id}`}
                        className="text-[10px] text-brand-400 font-semibold hover:text-brand-300 flex items-center gap-0.5 transition-colors"
                      >
                        Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {selectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-slate-950/90 backdrop-blur-md px-4 py-2 border border-slate-800 rounded-full shadow-lg flex items-center gap-2 pointer-events-none">
          <MapPin className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span className="text-xs font-semibold text-slate-300">
            Click on the map to place coordinates marker
          </span>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
