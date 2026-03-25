import { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Package, CheckCircle, Navigation, DollarSign, Radio } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import FullScreenDeliveryMap from '../components/FullScreenDeliveryMap';
import './DeliveryDashboard.css';

// Create a custom robust truck icon
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/6124/6124231.png',
  iconSize: [45, 45],
  iconAnchor: [22, 22]
});

// Helper component to smoothly pan the map whenever the driver moves
function MapPanController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [fullScreenMapJob, setFullScreenMapJob] = useState(null);
  
  // Real-time tracking states
  const [broadcastingJobId, setBroadcastingJobId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const stompClientRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const [availableRes, activeRes] = await Promise.all([
        api.get('/api/deliveries/available'),
        api.get('/api/deliveries/active')
      ]);
      setAvailableJobs(availableRes.data);
      setMyDeliveries(activeRes.data);
    } catch (err) {
      setError('Failed to fetch delivery jobs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const acceptJob = async (orderId) => {
    if (!window.confirm('Accept this delivery job? You will be responsible for transporting it.')) return;
    try {
      await api.post(`/api/deliveries/${orderId}/accept`);
      alert('Job accepted perfectly! Safe travels!');
      fetchJobs();
      setActiveTab('active');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept job.');
      console.error(err);
    }
  };

  const markDelivered = async (orderId) => {
    if (!window.confirm('Confirm that you have successfully handed the item over to the buyer?')) return;
    try {
      await api.put(`/api/deliveries/${orderId}/status`, { status: 'DELIVERED' });
      alert('Delivery completed! Great job!');
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
      console.error(err);
    }
  };

  const startBroadcasting = (orderId) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    // Connect WebSocket
    const socket = new SockJS(`http://localhost:8080/ws?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to GPS Tracking Stream');
      setBroadcastingJobId(orderId);

      // Start watching GPS
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const payload = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCurrentLocation([payload.lat, payload.lng]);
          
          if (client.active) {
            client.publish({
              destination: `/app/delivery/${orderId}/location`,
              body: JSON.stringify(payload)
            });
            console.log('Broadcasted:', payload);
          }
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      watchIdRef.current = watchId;
    };

    client.activate();
    stompClientRef.current = client;
  };

  const stopBroadcasting = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
    setBroadcastingJobId(null);
    setCurrentLocation(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopBroadcasting();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading the dispatch center...</div>;

  return (
    <div className="delivery-page-container">
      <div className="delivery-header">
        <h1><Truck size={36} color="#4f46e5" /> Courier Dispatch Center</h1>
        <p className="text-muted text-lg">Pick up items from sellers and deliver them to buyers to earn revenue!</p>
      </div>

      <div className="tabs-container" style={{ borderBottom: '2px solid var(--border)', marginBottom: '2rem' }}>
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Jobs ({availableJobs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          My Active Deliveries ({myDeliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length})
        </button>
      </div>

      {error && <div className="auth-error text-center mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTab === 'available' ? (
          availableJobs.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Navigation size={64} className="text-muted mb-4 opacity-50" />
              <h3 className="mb-2">No jobs available</h3>
              <p className="text-muted mb-6">Check back later for new delivery requests in your area.</p>
            </div>
          ) : (
            availableJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <span className="job-id">Delivery #{job.id}</span>
                  <span className="text-muted text-sm font-bold">{job.status}</span>
                </div>
                <div className="job-body">
                  <div className="logistics-route">
                    <div className="route-connector"></div>
                    <div className="logistics-step">
                      <div className="step-icon"><Package size={20} /></div>
                      <div className="step-content">
                        <span className="step-label">Pick up from:</span>
                        <span className="step-address">{job.sellerLocation || 'Location not provided'}</span>
                        <span className="step-person">Seller: {job.sellerName || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="logistics-step mt-4">
                      <div className="step-icon"><MapPin size={20} /></div>
                      <div className="step-content">
                        <span className="step-label">Drop off at:</span>
                        <span className="step-address">{job.buyerLocation || 'Location not provided'}</span>
                        <span className="step-person">Buyer: {job.buyerName || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="job-footer">
                  <div className="job-earnings">
                    <span className="job-earnings-label">COURIER FEE</span>
                    {/* Hardcoding 15% courier fee based on standard gig economy patterns */}
                    <span className="job-earnings-amount"><DollarSign size={20} className="inline -mt-1"/>{((job.price || 0) * 0.15).toFixed(2)}</span>
                  </div>
                  <button className="btn-accept" onClick={() => acceptJob(job.id)}>
                    <CheckCircle size={20} /> Accept Job
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          myDeliveries.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Truck size={64} className="text-muted mb-4 opacity-50" />
              <h3 className="mb-2">No active deliveries</h3>
              <p className="text-muted mb-6">You aren't delivering anything right now. Go to Available Jobs to start earning.</p>
            </div>
          ) : (
            myDeliveries.map(job => (
              <div key={job.id} className="job-card" style={{ borderLeft: job.status === 'DELIVERED' || job.status === 'COMPLETED' ? '4px solid #10b981' : '4px solid #4f46e5' }}>
                <div className="job-header" style={{ background: job.status === 'DELIVERED' || job.status === 'COMPLETED' ? '#dcfce7' : '#e0e7ff' }}>
                  <span className="job-id" style={{ color: job.status === 'DELIVERED' || job.status === 'COMPLETED' ? '#166534' : '#3730a3' }}>Job #{job.id}</span>
                  <span className="text-muted text-sm font-bold">{job.status}</span>
                </div>
                <div className="job-body">
                  <div className="logistics-route">
                    <div className="route-connector"></div>
                    <div className="logistics-step">
                      <div className="step-icon"><Package size={20} /></div>
                      <div className="step-content">
                        <span className="step-label">Pick up from:</span>
                        <span className="step-address">{job.sellerLocation || 'Location not provided'}</span>
                        <span className="step-person">{job.sellerName || 'Unknown Seller'}</span>
                      </div>
                    </div>
                    <div className="logistics-step mt-4">
                      <div className="step-icon"><MapPin size={20} /></div>
                      <div className="step-content">
                        <span className="step-label">Drop off at:</span>
                        <span className="step-address">{job.buyerLocation || 'Location not provided'}</span>
                        <span className="step-person">{job.buyerName || 'Unknown Buyer'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Map View when Tracking is Active */}
                  {broadcastingJobId === job.id && currentLocation && (
                    <div className="mt-4" style={{ height: '220px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid #cbd5e1' }}>
                      <MapContainer center={currentLocation} zoom={16} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={currentLocation} icon={truckIcon}>
                          <Popup>
                            <b>You are here!</b><br/>
                            Broadcasting location to buyer.
                          </Popup>
                        </Marker>
                        <MapPanController position={currentLocation} />
                      </MapContainer>
                    </div>
                  )}
                </div>
                <div className="job-footer">
                  <div className="job-earnings">
                    <span className="job-earnings-label">PAYOUT</span>
                    <span className="job-earnings-amount"><DollarSign size={20} className="inline -mt-1"/>{((job.price || 0) * 0.15).toFixed(2)}</span>
                  </div>
                  {job.status === 'OUT_FOR_DELIVERY' ? (
                    <div className="flex flex-col gap-2 w-full">
                       <button 
                          className="btn flex items-center justify-center gap-2 mb-2" 
                          style={{ background: '#4f46e5', color: 'white', border: 'none', width: '100%', padding: '0.75rem' }}
                          onClick={() => setFullScreenMapJob(job)}>
                          <Navigation size={18} /> View Detailed Delivery Route Map
                       </button>
                       <div className="flex gap-2 w-full">
                         {broadcastingJobId === job.id ? (
                            <button className="btn font-bold flex items-center justify-center gap-2 flex-1" 
                                    style={{ background: '#ef4444', color: 'white', border: 'none' }} 
                                    onClick={stopBroadcasting}>
                              <Radio size={18} className="animate-pulse" /> Stop GPS Track
                            </button>
                         ) : (
                            <button className="btn font-bold flex items-center justify-center gap-2 flex-1" 
                                    style={{ background: '#3b82f6', color: 'white', border: 'none' }} 
                                    onClick={() => startBroadcasting(job.id)}>
                              <Radio size={18} /> Broadcast GPS
                            </button>
                         )}
                        <button className="btn-deliver flex-1" onClick={() => markDelivered(job.id)}>
                          <CheckCircle size={20} /> Mark Delivered
                        </button>
                       </div>
                    </div>
                  ) : (
                    <span className="text-success font-bold flex items-center gap-2">
                       <CheckCircle size={20}/> Done
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {fullScreenMapJob && (
        <FullScreenDeliveryMap 
          job={fullScreenMapJob} 
          driverLocation={broadcastingJobId === fullScreenMapJob.id ? currentLocation : null}
          onClose={() => setFullScreenMapJob(null)} 
        />
      )}
    </div>
  );
};

export default DeliveryDashboard;
