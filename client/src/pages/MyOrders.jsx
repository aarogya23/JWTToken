import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  MapPin,
  Edit2,
  Check,
  X,
  Box,
  User as UserIcon,
  Truck,
  FileText,
  Download,
  CalendarDays,
  BadgeCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { formatNPR } from '../utils/currency';
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

  const downloadReceipt = (order) => {
    const purchaseDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : 'Not available';
    const deliveryDate = order.deliveredAt
      ? new Date(order.deliveredAt).toLocaleString()
      : 'Not delivered yet';
    const issuedDate = order.receiptIssuedAt
      ? new Date(order.receiptIssuedAt).toLocaleString()
      : new Date().toLocaleString();

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${order.receiptNumber || order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            .shell { max-width: 760px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; }
            .head { padding: 24px; background: linear-gradient(135deg, #eef2ff, #fff7ed); }
            .head h1 { margin: 0 0 8px; font-size: 28px; }
            .head p { margin: 0; color: #475569; }
            .body { padding: 24px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .card { padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
            .label { display: block; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; }
            .value { font-size: 16px; font-weight: 700; }
            .summary { padding: 18px; border-radius: 16px; background: #111827; color: #fff; }
            .summary strong { font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="shell">
            <div class="head">
              <h1>Digital Receipt</h1>
              <p>Receipt No: ${order.receiptNumber || `ORDER-${order.id}`}</p>
            </div>
            <div class="body">
              <div class="grid">
                <div class="card">
                  <span class="label">Product</span>
                  <div class="value">${order.productName || 'Unknown Item'}</div>
                </div>
                <div class="card">
                  <span class="label">Category</span>
                  <div class="value">${order.productCategory || 'General'}</div>
                </div>
                <div class="card">
                  <span class="label">Buyer</span>
                  <div class="value">${order.buyerName || 'Unknown Buyer'}</div>
                </div>
                <div class="card">
                  <span class="label">Seller</span>
                  <div class="value">${order.sellerBusinessName || order.sellerName || 'Unknown Seller'}</div>
                </div>
                <div class="card">
                  <span class="label">Purchased On</span>
                  <div class="value">${purchaseDate}</div>
                </div>
                <div class="card">
                  <span class="label">Delivered On</span>
                  <div class="value">${deliveryDate}</div>
                </div>
              </div>
              <div class="summary">
                <span class="label" style="color:#cbd5e1;">Total Paid</span>
                <strong>${formatNPR(order.price || 0)}</strong>
                <p style="margin:10px 0 0;color:#cbd5e1;">Issued: ${issuedDate}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${order.receiptNumber || order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
                  <div className="order-media">
                    {order.productImageUrl ? (
                      <img src={order.productImageUrl} alt={order.productName || 'Product'} className="order-product-image" />
                    ) : (
                      <div className="order-product-image order-product-image--placeholder">
                        <ShoppingBag size={28} />
                      </div>
                    )}
                  </div>
                  <div className="order-details">
                    <h3 className="order-product-name">{order.productName || 'Unknown Item'}</h3>
                    {order.productCategory && (
                      <div className="order-chip-row">
                        <span className="order-chip">{order.productCategory}</span>
                      </div>
                    )}
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
                    {(order.receiptAvailable || order.receiptNumber) && (
                      <div className="receipt-card">
                        <div className="receipt-card-head">
                          <div className="receipt-card-icon">
                            <FileText size={18} />
                          </div>
                          <div>
                            <strong>Digital receipt ready</strong>
                            <p>Receipt #{order.receiptNumber}</p>
                          </div>
                        </div>
                        <div className="receipt-grid">
                          <div className="receipt-grid-item">
                            <span><CalendarDays size={14} /> Purchased</span>
                            <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                          </div>
                          <div className="receipt-grid-item">
                            <span><BadgeCheck size={14} /> Delivered</span>
                            <strong>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'Recorded'}</strong>
                          </div>
                        </div>
                        <button className="btn btn-outline receipt-download-btn" onClick={() => downloadReceipt(order)}>
                          <Download size={16} /> Download receipt
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Live Tracking for Delivery */}
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <div className="mt-4 pb-2 border-t pt-4">
                      <LiveTrackingMap order={order} />
                    </div>
                  )}

                  <div className="order-price-container mt-4">
                    <p className="order-price">{formatNPR(order.price || 0)}</p>
                    <div className="order-chip-row">
                      <span className={`order-status ${order.status === 'PENDING' ? 'status-pending' : 'status-completed'}`}>
                        {order.status || 'PROCESSING'}
                      </span>
                      {order.paymentMethod && (
                        <span className="order-chip">{order.paymentMethod.replaceAll('_', ' ')}</span>
                      )}
                      {order.paymentStatus && (
                        <span className="order-chip">{order.paymentStatus.replaceAll('_', ' ')}</span>
                      )}
                    </div>
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
                  <div className="order-media">
                    {order.productImageUrl ? (
                      <img src={order.productImageUrl} alt={order.productName || 'Product'} className="order-product-image" />
                    ) : (
                      <div className="order-product-image order-product-image--placeholder">
                        <Box size={28} />
                      </div>
                    )}
                  </div>
                  <div className="order-details">
                    <h3 className="order-product-name">{order.productName || 'Unknown Item'}</h3>
                    {order.productCategory && (
                      <div className="order-chip-row">
                        <span className="order-chip">{order.productCategory}</span>
                      </div>
                    )}
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
                    <p className="order-price">{formatNPR(order.price || 0)}</p>
                    <div className="order-chip-row">
                      <span className="order-status status-pending" style={{ backgroundColor: '#2563eb', color: 'white' }}>
                        {order.paymentMethod ? order.paymentMethod.replaceAll('_', ' ') : 'CASH ON DELIVERY'}
                      </span>
                      {order.paymentStatus && (
                        <span className="order-chip">{order.paymentStatus.replaceAll('_', ' ')}</span>
                      )}
                    </div>
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
