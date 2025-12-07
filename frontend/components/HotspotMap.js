import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';

// Fix for default Leaflet icon issues in Next.js
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper function to format relative time
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

const HotspotMap = () => {
  const [hotspots, setHotspots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          console.log('📍 User location detected:', { latitude, longitude });
        },
        (error) => {
          console.log('⚠️ Geolocation denied or unavailable, using complaint data center');
        }
      );
    }
    
    fetchHotspots();
  }, [selectedCategory]);

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all'
        ? '/api/complaints/hotspots?clustering=true'
        : `/api/complaints/hotspots?clustering=true&category=${selectedCategory}`;
      
      console.log('🗺️ Fetching hotspots from:', url);
      const res = await api.get(url);
      console.log('✅ Hotspots data received:', {
        features: res.data.features?.length || 0,
        clusters: res.data.clusters?.length || 0,
        heatmap: res.data.heatmap?.length || 0,
        sampleFeature: res.data.features?.[0]
      });
      
      setHotspots(res.data);
    } catch (error) {
      console.error("❌ Failed to load hotspots:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getClusterColor = (severity) => {
    if (severity >= 0.8) return '#dc2626';
    if (severity >= 0.5) return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading geospatial data...</p>
        </div>
      </div>
    );
  }

  // Calculate map center with priority: User Location > Complaint Data > Default
  let center = [12.9716, 77.5946]; // Default: Bangalore
  
  if (userLocation) {
    // Priority 1: Use user's current device location
    center = userLocation;
    console.log('📍 Map centered on user location:', center);
  } else if (hotspots?.features?.length > 0) {
    // Priority 2: Use average of complaint locations
    const lats = hotspots.features.map(f => f.geometry.coordinates[1]);
    const lngs = hotspots.features.map(f => f.geometry.coordinates[0]);
    const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const avgLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    center = [avgLat, avgLng];
    console.log('📍 Map centered on complaint data:', { center, totalPoints: hotspots.features.length });
  } else {
    console.log('⚠️ Using default center (Bangalore):', center);
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowClusters(!showClusters)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showClusters
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showClusters ? '✓' : ''} Clusters ({hotspots?.clusters?.length || 0})
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showHeatmap
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showHeatmap ? '✓' : ''} Heatmap
          </button>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg font-medium focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="water">Water</option>
          <option value="electricity">Electricity</option>
          <option value="roads">Roads</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">High Priority</div>
          <div className="text-2xl font-bold">
            {hotspots?.features?.filter(f => f.properties.priority === 'high').length || 0}
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-4 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Medium Priority</div>
          <div className="text-2xl font-bold">
            {hotspots?.features?.filter(f => f.properties.priority === 'medium').length || 0}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Low Priority</div>
          <div className="text-2xl font-bold">
            {hotspots?.features?.filter(f => f.properties.priority === 'low').length || 0}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Hotspot Clusters</div>
          <div className="text-2xl font-bold">{hotspots?.clusters?.length || 0}</div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-100">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Heatmap Layer (KDE points) */}
          {showHeatmap && hotspots?.heatmap?.map((point, idx) => (
            <Circle
              key={`heat-${idx}`}
              center={[point.coordinates[1], point.coordinates[0]]}
              radius={150}
              pathOptions={{
                fillColor: '#f59e0b',
                fillOpacity: point.intensity * 0.3,
                color: 'transparent',
              }}
            />
          ))}

          {/* User Location Marker */}
          {userLocation && (
            <CircleMarker
              center={userLocation}
              radius={10}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.8,
                weight: 3,
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-blue-600 mb-1">📍 Your Location</h3>
                  <p className="text-xs text-gray-600">
                    Lat: {userLocation[0].toFixed(4)}, Lng: {userLocation[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {/* Cluster Circles with Enhanced Popups */}
          {showClusters && hotspots?.clusters?.map((cluster) => (
            <Circle
              key={`cluster-${cluster.clusterId}`}
              center={[cluster.center[1], cluster.center[0]]}
              radius={cluster.radius * 1000}
              pathOptions={{
                color: getClusterColor(cluster.severity),
                fillColor: getClusterColor(cluster.severity),
                fillOpacity: 0.15,
                weight: 3,
                dashArray: '10, 10',
              }}
            >
              <Popup maxWidth={400}>
                <div className="p-3 min-w-[350px] max-h-[500px] overflow-y-auto">
                  {/* Hotspot Name */}
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {cluster.name || `Cluster #${cluster.clusterId}`}
                  </h3>
                  
                  {/* Description */}
                  {cluster.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {cluster.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {cluster.size} complaints
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs text-white capitalize font-medium`}
                          style={{ backgroundColor: getColor(cluster.dominantPriority) }}>
                      {cluster.dominantPriority} priority
                    </span>
                  </div>

                  {/* Keywords */}
                  {cluster.keywords && cluster.keywords.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {cluster.keywords.map((keyword, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Range */}
                  {cluster.timeRange && (
                    <div className="mb-3 text-xs text-gray-600">
                      <span className="font-semibold">Time Range: </span>
                      {new Date(cluster.timeRange.earliest).toLocaleDateString()} - {new Date(cluster.timeRange.latest).toLocaleDateString()}
                    </div>
                  )}

                  {/* Complaint List */}
                  <div className="mt-3 border-t pt-3">
                    <h4 className="font-semibold text-sm mb-2 text-gray-800">
                      All Complaints ({cluster.complaints?.length || 0}):
                    </h4>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {cluster.complaints?.map((complaint, idx) => (
                        <div key={complaint._id || idx} className="bg-gray-50 p-2 rounded text-xs border border-gray-200">
                          {/* Complaint Title and Status */}
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-gray-900 flex-1">
                              {complaint.title}
                            </p>
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs capitalize ${
                              complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              complaint.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              complaint.status === 'escalated' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {complaint.status}
                            </span>
                          </div>
                          
                          {/* Citizen Info */}
                          {complaint.citizen && (
                            <p className="text-gray-600 mb-1">
                              👤 {complaint.citizen.name || complaint.citizen.email || 'Unknown'}
                            </p>
                          )}
                          
                          {/* Timestamp */}
                          {complaint.createdAt && (
                            <p className="text-gray-500">
                              🕒 {formatRelativeTime(complaint.createdAt)}
                            </p>
                          )}
                          
                          {/* Priority Badge */}
                          <div className="mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs capitalize font-medium`}
                                  style={{ backgroundColor: getColor(complaint.priority), color: 'white' }}>
                              {complaint.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                    Dominant Category: <span className="font-medium capitalize text-gray-700">{cluster.dominantCategory}</span>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Individual Complaints */}
          {hotspots?.features?.map((feature) => (
            <CircleMarker
              key={feature.properties.id}
              center={[
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0]
              ]}
              radius={6}
              pathOptions={{
                color: '#fff',
                fillColor: getColor(feature.properties.priority),
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-gray-900 mb-1">{feature.properties.title}</h3>
                  <p className="text-sm text-gray-600 capitalize mb-2">
                    {feature.properties.category}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs text-white capitalize font-medium"
                      style={{ backgroundColor: getColor(feature.properties.priority) }}
                    >
                      {feature.properties.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {feature.properties.priorityScore}
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h4 className="font-bold text-gray-800 mb-3">Map Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500"></span>
            <span>High Priority Complaint</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500"></span>
            <span>Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-600" style={{ borderStyle: 'dashed' }}></div>
            <span>Hotspot Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotMap;
