import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Tag } from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './Products.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);

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

  if (loading) return <div className="text-center mt-8">Loading details...</div>;
  if (error) return <div className="auth-error text-center mt-8">{error}</div>;
  if (!product) return <div className="text-center mt-8">Product not found</div>;

  const isOwner = user && product.user && user.email === product.user.email;

  return (
    <div className="product-details-container">
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-outline mb-6"
        style={{ padding: '0.4rem 0.8rem' }}
      >
        <ArrowLeft size={16} /> Back
      </button>
      
      <div className="card">
        <div className="card-body detail-grid">
          <div className="detail-image" style={{ overflow: 'hidden' }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Tag size={80} className="text-muted opacity-50" />
            )}
          </div>
          
          <div className="detail-info">
            <div>
              <h1 className="mb-2">{product.name}</h1>
              <p className="product-price" style={{ fontSize: '2rem' }}>${product.price.toFixed(2)}</p>
            </div>
            
            <div className="bg-background p-4 rounded-lg" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="mb-2">Description</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
            </div>
            
            <div>
              <p className="text-muted">Seller: <span className="font-bold">{product.user?.fullName || 'Unknown User'}</span></p>
              <p className="text-muted">Status: <span className={`font-bold ${product.sold ? 'text-danger' : 'text-secondary'}`}>{product.sold ? 'Sold' : 'Available'}</span></p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              {!isOwner && !product.sold ? (
                <button 
                  className="btn btn-primary w-full" 
                  onClick={handleBuy}
                  disabled={buying}
                  style={{ padding: '1rem', fontSize: '1.1rem' }}
                >
                  <ShoppingCart size={20} className="inline-block mr-2" /> 
                  {buying ? 'Processing...' : 'Buy - Cash on Delivery'}
                </button>
              ) : isOwner ? (
                <div className="text-center text-muted p-3 bg-background" style={{ borderRadius: 'var(--radius)' }}>
                  This is your own listing
                </div>
              ) : (
                <div className="text-center text-danger p-3 bg-red-50" style={{ backgroundColor: '#FEE2E2', borderRadius: 'var(--radius)' }}>
                  This item has already been sold
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
