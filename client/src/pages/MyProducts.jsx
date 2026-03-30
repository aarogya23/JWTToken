import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Archive,
  Package,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { formatNPR } from '../utils/currency';
import './Products.css';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const response = await api.get('/api/products');
      const allProducts = response.data;

      if (Array.isArray(allProducts)) {
        const mine = allProducts.filter((product) => product.user?.username === user?.username);
        if (mine.length === 0 && allProducts.length > 0) {
          setProducts(allProducts);
        } else {
          setProducts(mine);
        }
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError('Failed to load your products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await api.delete(`/api/products/${id}`);
      setProducts(products.filter((product) => product.id !== id));
    } catch (err) {
      alert('Failed to delete listing');
    }
  };

  const stats = useMemo(() => {
    const active = products.filter((product) => Number(product.stockQuantity || 0) > 0 && !product.sold);
    const sold = products.filter((product) => Number(product.stockQuantity || 0) <= 0 || product.sold);
    const totalValue = active.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.stockQuantity || 0),
      0,
    );

    return {
      total: products.length,
      active: active.length,
      sold: sold.length,
      totalValue,
    };
  }, [products]);

  if (loading) return <div className="text-center mt-8">Loading your listings...</div>;

  return (
    <div className="inventory-page">
      <section className="inventory-hero">
        <div>
          <span className="social-pill">
            <Archive size={14} /> Seller studio
          </span>
          <h1>My inventory</h1>
          <p>
            Track everything you have listed, see what is live, and remove old items fast.
          </p>
        </div>
        <Link to="/create-product" className="btn btn-primary social-hero-btn">
          <Plus size={18} /> List new item
        </Link>
      </section>

      <section className="inventory-stats">
        <div className="inventory-stat-card">
          <span>Total listings</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="inventory-stat-card">
          <span>Active now</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="inventory-stat-card">
          <span>Out of stock</span>
          <strong>{stats.sold}</strong>
        </div>
        <div className="inventory-stat-card">
          <span>Live value</span>
          <strong>{formatNPR(stats.totalValue)}</strong>
        </div>
      </section>

      {error ? (
        <div className="auth-error text-center">{error}</div>
      ) : products.length === 0 ? (
        <div className="empty-state social-empty-state">
          <Package size={48} className="text-muted mb-4" />
          <h3>No items listed</h3>
          <p className="text-muted">You haven't added any products to sell yet.</p>
          <Link to="/create-product" className="btn btn-primary mt-4">
            Create One Now
          </Link>
        </div>
      ) : (
        <section className="inventory-grid">
          {products.map((product) => (
            <article key={product.id} className="inventory-card">
              {(() => {
                const stockQuantity = Number(product.stockQuantity || 0);
                const isOutOfStock = stockQuantity <= 0 || product.sold;
                return (
                  <>
              <div className="inventory-card-media">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="product-image-placeholder inventory-card-fallback">
                    <Package size={34} className="text-muted opacity-50" />
                  </div>
                )}
              </div>

              <div className="inventory-card-body">
                <div className="inventory-card-topline">
                  <span className={`inventory-badge ${isOutOfStock ? 'sold' : 'active'}`}>
                    {isOutOfStock ? 'Out of stock' : 'In stock'}
                  </span>
                  <span className="inventory-owner">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={user?.fullName || 'User'} />
                    ) : (
                      <Tag size={14} />
                    )}
                    {user?.fullName || user?.username || 'Seller'}
                  </span>
                </div>

                <Link to={`/products/${product.id}`} className="inventory-card-link">
                  <h3 className="product-title">{product.name}</h3>
                </Link>

                <div className="inventory-market-row">
                  <span className="inventory-moq">{product.category || 'General'}</span>
                  <span className="inventory-badge active">{product.targetMarket || 'B2C'}</span>
                  <span className="inventory-moq">
                    MOQ {product.minimumOrderQuantity || 1}
                  </span>
                  <span className="inventory-moq">
                    Stock {stockQuantity}
                  </span>
                </div>

                <p className="inventory-price">
                  <Tag size={18} />
                  {formatNPR(product.price || 0)}
                </p>

                <p className="inventory-description">
                  {product.description || 'No description added for this listing yet.'}
                </p>
                {product.logisticsSupport ? (
                  <p className="inventory-logistics">
                    Logistics: {product.logisticsSupport}
                  </p>
                ) : null}

                <div className="inventory-status-row">
                  <span>
                    <AlertCircle size={15} />
                    {isOutOfStock ? 'Hidden from marketplace until you restock it' : 'Visible in marketplace'}
                  </span>
                </div>
              </div>

              <div className="inventory-card-footer">
                <Link to={`/products/${product.id}`} className="btn btn-outline inventory-btn">
                  View details
                </Link>
                <button
                  className="btn btn-danger inventory-btn"
                  onClick={() => handleDelete(product.id)}
                  disabled={isOutOfStock}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default MyProducts;
