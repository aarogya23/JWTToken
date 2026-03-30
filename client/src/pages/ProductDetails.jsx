import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  PackageCheck,
  Search,
  ShoppingCart,
  Tag,
  Truck,
} from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { formatNPR } from '../utils/currency';
import './Products.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);
  const [payingEsewa, setPayingEsewa] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError('Product not found or failed to load');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!window.confirm('Do you want to confirm this Cash on Delivery purchase?')) return;

    setBuying(true);
    try {
      await api.post(`/api/orders/${id}`);
      alert('Order placed successfully! The seller will contact you for delivery.');
      navigate('/my-orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete purchase');
      console.error(err);
    } finally {
      setBuying(false);
    }
  };

  const handleEsewaPay = async () => {
    if (!window.confirm('Continue to eSewa sandbox for this payment?')) return;

    setPayingEsewa(true);
    try {
      const response = await api.post(`/api/orders/${id}/esewa/initiate`);
      const { action, fields } = response.data;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = action;
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start eSewa payment');
      console.error(err);
      setPayingEsewa(false);
    }
  };

  const handleImageMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  if (loading) return <div className="text-center mt-8">Loading details...</div>;
  if (error) return <div className="auth-error text-center mt-8">{error}</div>;
  if (!product) return <div className="text-center mt-8">Product not found</div>;

  const isOwner = user && product.user && user.email === product.user.email;
  const stockQuantity = Number(product.stockQuantity || 0);
  const isOutOfStock = stockQuantity <= 0 || product.sold;

  return (
    <div className="product-detail-page">
      <div className="product-detail-topbar">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline product-detail-back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="social-pill">
          <Search size={14} /> Hover image to zoom
        </span>
      </div>

      <section className="product-detail-shell">
        <div className="product-detail-gallery-column">
          <div
            className="product-detail-gallery"
            onMouseMove={product.imageUrl ? handleImageMove : undefined}
            onMouseEnter={() => product.imageUrl && setZoomActive(true)}
            onMouseLeave={() => setZoomActive(false)}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="product-detail-main-image"
              />
            ) : (
              <div className="product-detail-empty-image">
                <Tag size={88} className="text-muted opacity-50" />
              </div>
            )}
            {product.imageUrl && zoomActive ? (
              <div
                className="product-detail-zoom-lens"
                style={{
                  left: `calc(${zoomPosition.x}% - 70px)`,
                  top: `calc(${zoomPosition.y}% - 70px)`,
                }}
              />
            ) : null}
          </div>

          {product.imageUrl ? (
            <div
              className={`product-detail-zoom-panel ${zoomActive ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${product.imageUrl})`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            />
          ) : null}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-card">
            <div className="product-detail-heading">
              <div>
                <div className="product-detail-badges">
                  <span className="inventory-badge active">{product.targetMarket || 'B2C'}</span>
                  <span className="social-feed-tag secondary">{product.category || 'General'}</span>
                </div>
                <h1>{product.name}</h1>
                <p className="product-detail-price">{formatNPR(product.price || 0)}</p>
              </div>
            </div>

            <div className="product-detail-meta-grid">
              <div className="product-detail-meta-card">
                <PackageCheck size={18} />
                <div>
                  <strong>Stock</strong>
                  <span>
                    {isOutOfStock ? 'Out of stock' : `${stockQuantity} units ready`}
                  </span>
                </div>
              </div>
              <div className="product-detail-meta-card">
                <Tag size={18} />
                <div>
                  <strong>MOQ</strong>
                  <span>{product.minimumOrderQuantity || 1} units</span>
                </div>
              </div>
              <div className="product-detail-meta-card">
                <Building2 size={18} />
                <div>
                  <strong>Seller Type</strong>
                  <span>{product.user?.marketSegment || 'B2C'}</span>
                </div>
              </div>
              <div className="product-detail-meta-card">
                <MapPin size={18} />
                <div>
                  <strong>Location</strong>
                  <span>{product.user?.location || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="product-detail-section">
              <h3>Product overview</h3>
              <p>{product.description || 'No description available for this product yet.'}</p>
            </div>

            {product.logisticsSupport ? (
              <div className="product-detail-section product-detail-section-soft">
                <h3>
                  <Truck size={18} /> Logistics support
                </h3>
                <p>{product.logisticsSupport}</p>
              </div>
            ) : null}

            <div className="product-detail-seller">
              <div className="product-detail-seller-avatar">
                {product.user?.profileImage ? (
                  <img src={product.user.profileImage} alt={product.user?.fullName || 'Seller'} />
                ) : (
                  (product.user?.fullName || 'S').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <Link to={`/owners/${product.user?.id}`} className="creator-inline-link">
                  <strong>{product.user?.fullName || 'Unknown seller'}</strong>
                </Link>
                <p>{product.user?.businessName || 'Independent retailer'}</p>
              </div>
            </div>

            <div className="product-detail-cta">
              {!isOwner && !isOutOfStock ? (
                <div className="product-detail-payment-options">
                  <button
                    className="btn btn-primary product-detail-buy"
                    onClick={handleBuy}
                    disabled={buying || payingEsewa}
                  >
                    <ShoppingCart size={20} />
                    {buying ? 'Processing...' : 'Buy with COD'}
                  </button>
                  <button
                    className="btn btn-outline product-detail-buy esewa-pay-btn"
                    onClick={handleEsewaPay}
                    disabled={buying || payingEsewa}
                  >
                    <ShoppingCart size={20} />
                    {payingEsewa ? 'Redirecting...' : 'Pay with eSewa'}
                  </button>
                </div>
              ) : isOwner ? (
                <div className="product-detail-banner muted">
                  This is your own listing.
                </div>
              ) : (
                <div className="product-detail-banner danger">
                  This item is currently out of stock.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
