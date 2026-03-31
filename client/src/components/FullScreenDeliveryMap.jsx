import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Navigation, Package, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import './FullScreenDeliveryMap.css';
import { createDijkstraRoute } from '../utils/dijkstraRoute';

// Custom icons for map markers
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/6124/6124231.png',
  iconSize: [45, 45],
  iconAnchor: [22, 22]
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933802.png', // Box/Package
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838912.png', // House/Destination
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

// Helper component to auto-fit map bounds
function MapBoundsController({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [markers, map]);
  return null;
}

const FullScreenDeliveryMap = ({ job, driverLocation, onClose }) => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      try {
        // Simple caching or sleep might be needed if rate-limited, but for demo:
        const geocode = async (address) => {
          if (!address) return null;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
              headers: { 'User-Agent': 'JWTToken C2C Marketplace App' }
            });
            const data = await res.json();
            if (data && data.length > 0) {
              return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
          } catch (e) {
            console.error('Geocoding error for:', address, e);
          }
          return null;
        };

        const [pLoc, dLoc] = await Promise.all([
          geocode(job.sellerLocation),
          geocode(job.buyerLocation)
        ]);

        if (pLoc) setPickupLocation(pLoc);
        if (dLoc) setDropoffLocation(dLoc);

        if (!pLoc && !dLoc) {
          setError('Could not precisely locate the pickup and dropoff addresses on the map.');
        }

      } catch (err) {
        setError('Failed to load map coordinate data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinates();
  }, [job]);

  // Determine which coordinates we successfully have to draw bounds and polylines
  const activeMarkers = [];
  if (driverLocation) activeMarkers.push(driverLocation);
  if (pickupLocation) activeMarkers.push(pickupLocation);
  if (dropoffLocation) activeMarkers.push(dropoffLocation);

  const routePlan = useMemo(() => {
    if (!pickupLocation && !dropoffLocation) {
      return null;
    }

    const toKmLabel = (distanceMeters) => `${(distanceMeters / 1000).toFixed(2)} km`;
    const legs = [];

    if (driverLocation && pickupLocation) {
      const courierToPickup = createDijkstraRoute([driverLocation, pickupLocation], {
        rows: 12,
        cols: 12,
      });
      if (courierToPickup) {
        legs.push({
          id: 'courier-pickup',
          label: 'Courier to pickup',
          color: '#f97316',
          coordinates: courierToPickup.coordinates,
          distanceLabel: toKmLabel(courierToPickup.distanceMeters),
        });
      }
    }

    if (pickupLocation && dropoffLocation) {
      const pickupToDropoff = createDijkstraRoute([pickupLocation, dropoffLocation], {
        rows: 14,
        cols: 14,
      });
      if (pickupToDropoff) {
        legs.push({
          id: 'pickup-dropoff',
          label: 'Pickup to dropoff',
          color: '#4f46e5',
          coordinates: pickupToDropoff.coordinates,
          distanceLabel: toKmLabel(pickupToDropoff.distanceMeters),
        });
      }
    } else if (driverLocation && dropoffLocation) {
      const courierToDropoff = createDijkstraRoute([driverLocation, dropoffLocation], {
        rows: 14,
        cols: 14,
      });
      if (courierToDropoff) {
        legs.push({
          id: 'courier-dropoff',
          label: 'Courier to dropoff',
          color: '#10b981',
          coordinates: courierToDropoff.coordinates,
          distanceLabel: toKmLabel(courierToDropoff.distanceMeters),
        });
      }
    }

    return legs;
  }, [driverLocation, pickupLocation, dropoffLocation]);

  // Default to a world view or a specific place if nothing exists
  const defaultCenter = driverLocation || pickupLocation || dropoffLocation || [27.7172, 85.3240]; // Kathmandu default coords

  return (
    <div className="fullscreen-map-overlay">
      <div className="fullscreen-map-container">
        <div className="map-header">
          <div className="map-title">
            <Navigation size={24} className="text-indigo-600" />
            <h2>Live Delivery Route - Order #{job.id}</h2>
          </div>
          <button className="btn-close-map" onClick={onClose} aria-label="Close Map">
            <X size={24} />
          </button>
        </div>

        <div className="map-sidebar-info">
          {loading ? (
            <div className="map-alert loading">
              <Loader2 size={18} className="animate-spin" /> Satellite Geocoding in progress...
            </div>
          ) : error ? (
            <div className="map-alert error">
              <AlertCircle size={18} /> {error}
            </div>
          ) : (
            <div className="map-addresses flex flex-col md:flex-row gap-4 w-full">
              <div className="address-badge bg-blue-50">
                <Package size={16} className="text-blue-600" /> 
                <span><b>Pickup:</b> {job.sellerLocation} {pickupLocation ? '✓' : '(!)'}</span>
              </div>
              <div className="address-badge bg-green-50">
                <MapPin size={16} className="text-green-600" /> 
                <span><b>Dropoff:</b> {job.buyerLocation} {dropoffLocation ? '✓' : '(!)'}</span>
              </div>
              {routePlan?.length ? (
                <div className="address-badge bg-indigo-50">
                  <Navigation size={16} className="text-indigo-600" />
                  <span>
                    <b>Dijkstra route:</b> {routePlan.map((leg) => `${leg.label} ${leg.distanceLabel}`).join(' | ')}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="map-body">
          <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {pickupLocation && (
              <Marker position={pickupLocation} icon={pickupIcon}>
                <Popup><b>Pickup Location</b><br/>{job.sellerLocation}</Popup>
              </Marker>
            )}

            {dropoffLocation && (
              <Marker position={dropoffLocation} icon={dropoffIcon}>
                <Popup><b>Drop-off Location</b><br/>{job.buyerLocation}</Popup>
              </Marker>
            )}

            {driverLocation && (
              <Marker position={driverLocation} icon={driverIcon}>
                <Popup><b>Courier is here!</b><br/>Live GPS Telemetry active.</Popup>
              </Marker>
            )}

            {routePlan?.map((leg) => (
              <Polyline
                key={leg.id}
                positions={leg.coordinates}
                color={leg.color}
                weight={5}
                opacity={0.85}
              />
            ))}

            <MapBoundsController markers={activeMarkers} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default FullScreenDeliveryMap;
