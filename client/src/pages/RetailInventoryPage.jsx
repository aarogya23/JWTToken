import { useEffect, useMemo, useState } from 'react';
import { Boxes, Package, Shirt, ShoppingBag, Sparkles } from 'lucide-react';
import api from '../api/axiosConfig';
import { formatNPR } from '../utils/currency';
import './Products.css';

const iconForCategory = (category) => {
  if (!category) return <Package size={18} />;
  const normalized = category.toLowerCase();
  if (normalized.includes('shirt')) return <Shirt size={18} />;
  if (normalized.includes('pant')) return <ShoppingBag size={18} />;
  return <Boxes size={18} />;
};

export default function RetailInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/products');
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const categorySummary = useMemo(() => {
    const summary = new Map();

    products.forEach((product) => {
      const category = product.category || 'General';
      const entry = summary.get(category) || {
        category,
        totalStock: 0,
        totalValue: 0,
        itemCount: 0,
      };

      entry.totalStock += Number(product.stockQuantity || 0);
      entry.totalValue += Number(product.stockQuantity || 0) * Number(product.price || 0);
      entry.itemCount += 1;
      summary.set(category, entry);
    });

    return Array.from(summary.values()).sort((a, b) => b.totalStock - a.totalStock);
  }, [products]);

  if (loading) return <div className="text-center mt-8">Loading inventory...</div>;

  return (
    <div className="inventory-page">
      <section className="inventory-hero">
        <div>
          <span className="social-pill">
            <Sparkles size={14} /> Retail inventory
          </span>
          <h1>Inventory management</h1>
          <p>
            Track stock by category, such as pants, t-shirts, sportswear, and other retailer inventory.
          </p>
        </div>
      </section>

      {error ? <div className="auth-error">{error}</div> : null}

      {categorySummary.length === 0 ? (
        <div className="empty-state social-empty-state">
          <Package size={48} className="text-muted mb-4" />
          <h3>No stock added yet</h3>
          <p className="text-muted">Create products with category and stock quantity to see inventory here.</p>
        </div>
      ) : (
        <section className="inventory-grid">
          {categorySummary.map((entry) => (
            <article key={entry.category} className="inventory-card">
              <div className="inventory-card-body">
                <div className="services-market-title">
                  {iconForCategory(entry.category)}
                  <h3>{entry.category}</h3>
                </div>
                <div className="inventory-market-row">
                  <span className="inventory-moq">Items {entry.itemCount}</span>
                  <span className="inventory-moq">Units {entry.totalStock}</span>
                </div>
                <p className="inventory-price">{formatNPR(entry.totalValue)}</p>
                <p className="inventory-description">
                  Current stock across all listings in this category.
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
