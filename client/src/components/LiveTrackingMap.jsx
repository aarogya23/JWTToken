import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

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
    map.flyTo(position, 16, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
}

const LiveTrackingMap = ({ orderId, driverName }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const socket = new SockJS(`http://localhost:8080/ws?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      client.subscribe(`/topic/delivery/${orderId}`, (message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          setDriverLocation([payload.lat, payload.lng]);
        }
      });
    };

    client.onDisconnect = () => setIsConnected(false);
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [orderId]);

  if (!driverLocation) {
    return (
      <div style={{ padding: '1.5rem', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px dashed #4f46e5' }}>
        <div className="flex items-center justify-center gap-2">
           <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
           WAITING FOR COURIER SATELLITE UPLINK...
        </div>
        <p className="text-sm mt-2 opacity-80" style={{ fontWeight: 'normal' }}>
          {driverName} has not shared their navigation telemetry yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
      <div className="flex justify-between items-center mb-2 px-1">
         <span className="text-xs font-bold text-green-600 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> LIVE TRACKING ENGAGED
         </span>
         <span className="text-xs text-muted font-mono">{driverLocation[0].toFixed(5)}, {driverLocation[1].toFixed(5)}</span>
      </div>
      <div style={{ height: '280px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid #cbd5e1' }}>
        <MapContainer center={driverLocation} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={driverLocation} icon={truckIcon}>
            <Popup>
              <b>{driverName || 'Courier'}</b> is here!<br/>
              Delivering your order rapidly.
            </Popup>
          </Marker>
          <MapPanController position={driverLocation} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
