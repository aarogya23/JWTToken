import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Tag } from 'lucide-react';
import api from '../api/axiosConfig';
import StoriesBar from '../components/StoriesBar';
import './Products.css';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/browse');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center mt-8">Loading products...</div>;

  return (
    <div className="dashboard-container">
      <StoriesBar />

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1>Marketplace</h1>
          <p className="text-muted">Discover products from other users.</p>
        </div>
        <Link to="/create-product" className="btn btn-primary">
          <Plus size={18} /> Sell an Item
        </Link>
      </div>

      <div className="search-bar mb-8">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="form-input search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="auth-error text-center">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Tag size={48} className="text-muted mb-4" />
          <h3>No products found</h3>
          <p className="text-muted">Be the first to list an item!</p>
        </div>
      ) : (
        <div className="grid grid-cols-4">
          {filteredProducts.map(product => (
            <Link to={`/products/${product.id}`} key={product.id} className="card product-card">
              <div className="product-image-placeholder">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Tag size={40} className="text-muted opacity-50" />
                )}
              </div>
              <div className="card-body">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <p className="product-desc line-clamp-2">{product.description}</p>
              </div>
              <div className="card-footer flex justify-between items-center p-3 text-sm">
                <span className="text-muted">Seller: {product.user?.fullName || 'Unknown'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
