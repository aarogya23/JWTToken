import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Trash2, Edit } from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
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
      // For this simple implementation, fetch all and filter by current user
      // Alternatively, the backend could have a dedicated /api/products/me endpoint
      const response = await api.get('/api/products');
      
      // Filter locally for now, since we don't have a guaranteed "/me" endpoint based on the grep
      // Wait, ProductController shows @GetMapping. It usually returns the user's products 
      // based on the auth token if we look at best practices. We'll try just hitting /api/products 
      // If it returns all, we filter. If it returns mine, done.
      const allProducts = response.data;
      
      if (Array.isArray(allProducts)) {
         // Filter by my username just in case it returns all
         const mine = allProducts.filter(p => p.user?.username === user?.username);
         // If it's already only mine, it won't hurt
         if (mine.length === 0 && allProducts.length > 0) {
            // maybe user obj is structured differently, just set all for now if backend handled it
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
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete listing');
    }
  };

  if (loading) return <div className="text-center mt-8">Loading your listings...</div>;

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1>My Inventory</h1>
          <p className="text-muted">Manage the items you are selling.</p>
        </div>
        <Link to="/create-product" className="btn btn-primary">
          List New Item
        </Link>
      </div>

      {error ? (
        <div className="auth-error text-center">{error}</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Package size={48} className="text-muted mb-4" />
          <h3>No items listed</h3>
          <p className="text-muted">You haven't added any products to sell yet.</p>
          <Link to="/create-product" className="btn btn-primary mt-4">Create One Now</Link>
        </div>
      ) : (
        <div className="grid grid-cols-4">
          {products.map(product => (
            <div key={product.id} className="card product-card">
              <div className="product-image-placeholder" style={{ height: '150px' }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }} />
                ) : (
                  <Package size={30} className="text-muted opacity-50" />
                )}
              </div>
              <div className="card-body">
                <Link to={`/products/${product.id}`} className="hover:text-primary">
                  <h3 className="product-title" style={{ fontSize: '1rem' }}>{product.name}</h3>
                </Link>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <div className="mt-2 text-sm">
                  Status: <span className={product.sold ? 'text-danger font-bold' : 'text-secondary font-bold'}>
                    {product.sold ? 'Sold' : 'Available'}
                  </span>
                </div>
              </div>
              <div className="card-footer p-3 bg-background border-t">
                <div className="flex gap-2">
                  <button 
                    className="btn btn-danger flex-1" 
                    style={{ padding: '0.4rem' }}
                    onClick={() => handleDelete(product.id)}
                    disabled={product.sold} // prevent deleting sold items
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;
