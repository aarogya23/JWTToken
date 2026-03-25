import { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Edit2, Check, X, Box, User as UserIcon, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import LiveTrackingMap from '../components/LiveTrackingMap';
import './MyOrders.css';

const MyOrders = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('purchases');

  // Location Editor State
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Location not provided');

  useEffect(() => {
    fetchOrders();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile');
      if (res.data.location) {
        setCurrentLocation(res.data.location);
        setLocationValue(res.data.location);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const [purchasesRes, salesRes] = await Promise.all([
        api.get('/api/orders/purchases'),
        api.get('/api/orders/sales')
      ]);
      setPurchases(purchasesRes.data);
      setSales(salesRes.data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      await api.put('/api/profile', { location: locationValue });
      setCurrentLocation(locationValue);
      setEditingLocation(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update delivery location.');
    }
  };

  if (loading) return <div className="text-center mt-8">Loading your orders...</div>;

  return (
    <div className="orders-page-container">
      <div className="mb-8">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Order History</h1>
        <p className="text-muted text-lg">Track items you've bought and sold on the marketplace.</p>
      </div>

      {/* Premium Location Banner Component */}
      <div className="location-banner">
        <div className="location-header">
          <MapPin size={24} />
          <h3>My Delivery Address</h3>
        </div>
        
        <div className="location-content">
          {editingLocation ? (
            <>
              <input 
                type="text" 
                className="location-edit-input" 
                value={locationValue} 
                onChange={e => setLocationValue(e.target.value)}
                placeholder="e.g. 123 Main St, New York, NY"
                autoFocus
              />
              <div className="location-actions">
                <button className="btn-icon save" onClick={handleSaveLocation}>
                  <Check size={18} /> Save
                </button>
                <button className="btn-icon cancel" onClick={() => setEditingLocation(false)}>
                  <X size={18} /> Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="location-text">
                {currentLocation}
              </div>
              <button className="btn-icon edit" onClick={() => setEditingLocation(true)}>
                <Edit2 size={18} /> Update Address
              </button>
            </>
          )}
        </div>
        {currentLocation === 'Location not provided' && !editingLocation && (
          <p className="text-danger text-sm font-bold m-0 mt-2">
            ⚠️ Please set your delivery address so sellers know where to deliver your purchases!
          </p>
        )}
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          My Purchases
        </button>
        <button
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Items Sold
        </button>
      </div>

      {error && <div className="auth-error text-center mb-6">{error}</div>}

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'purchases' ? (
          purchases.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={64} className="text-muted mb-4 opacity-50" />
              <h3 className="mb-2">No purchases yet</h3>
              <p className="text-muted mb-6">You haven't bought anything from the marketplace.</p>
              <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Browse Market</Link>
            </div>
          ) : (
            purchases.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className="text-muted text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="order-body">
                  <div className="order-details">
                    <h3 className="order-product-name">{order.productName || 'Unknown Item'}</h3>
                    <div className="order-info-row mt-2">
                      <UserIcon size={16} />
                      <span>Seller: <b className="text-foreground">{order.sellerName || 'Unknown'}</b></span>
                    </div>
                    <div className="order-info-row">
                      <Box size={16} />
                      <span>Ships from: <b>{order.sellerLocation || 'Location not provided'}</b></span>
                    </div>
                    {order.deliveryPersonName && (
                      <div className="order-info-row mt-1" style={{ color: '#4f46e5' }}>
                        <Truck size={16} />
                        <span>Courier: <b>{order.deliveryPersonName}</b></span>
                      </div>
                    )}
                  </div>
                  <div className="order-price-container">
                    <p className="order-price">${(order.price || 0).toFixed(2)}</p>
                    <span className={`order-status ${order.status === 'PENDING' ? 'status-pending' : 'status-completed'}`}>
                      {order.status || 'PROCESSING'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          sales.length === 0 ? (
            <div className="empty-state">
              <Box size={64} className="text-muted mb-4 opacity-50" />
              <h3 className="mb-2">No items sold yet</h3>
              <p className="text-muted">None of your listed items have been purchased yet.</p>
            </div>
          ) : (
            sales.map(order => (
              <div key={order.id} className="order-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="order-header">
                  <span className="order-id">Sale #{order.id}</span>
                  <span className="text-muted text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="order-body">
                  <div className="order-details">
                    <h3 className="order-product-name">{order.productName || 'Unknown Item'}</h3>
                    <div className="order-info-row mt-2">
                      <UserIcon size={16} />
                      <span>Sold to: <b className="text-foreground">{order.buyerName || 'Unknown'}</b></span>
                    </div>
                    <div className="order-info-row">
                      <MapPin size={16} />
                      <span>Deliver to: <b className="text-foreground" style={{ color: '#eab308' }}>{order.buyerLocation || 'No location set'}</b></span>
                    </div>
                    {order.deliveryPersonName && (
                      <div className="order-info-row mt-1" style={{ color: '#4f46e5' }}>
                        <Truck size={16} />
                        <span>Courier: <b>{order.deliveryPersonName}</b></span>
                      </div>
                    )}
                  </div>
                  <div className="order-price-container">
                    <p className="order-price">${(order.price || 0).toFixed(2)}</p>
                    <span className="order-status status-pending" style={{ backgroundColor: '#2563eb', color: 'white' }}>
                      CASH ON DELIVERY
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default MyOrders;
