import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeDollarSign,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react';
import api from '../api/axiosConfig';
import StoriesBar from '../components/StoriesBar';
import { useAuth } from '../context/AuthContext';
import { formatNPR } from '../utils/currency';
import './Products.css';

const getInitials = (name) =>
  (name || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const Dashboard = () => {
  const { user } = useAuth();
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
      setProducts(response.data || []);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    });
  }, [products, searchTerm]);

  const featuredProducts = filteredProducts.slice(0, 6);
  const sellers = useMemo(() => {
    const sellerMap = new Map();

    filteredProducts.forEach((product) => {
      const sellerName = product.user?.fullName || 'Unknown seller';
      if (!sellerMap.has(sellerName)) {
        sellerMap.set(sellerName, {
          id: product.user?.id,
          name: sellerName,
          profileImage: product.user?.profileImage || '',
        });
      }
    });

    return Array.from(sellerMap.values()).slice(0, 5);
  }, [filteredProducts]);
  const averagePrice = filteredProducts.length
    ? filteredProducts.reduce((sum, product) => sum + Number(product.price || 0), 0) /
      filteredProducts.length
    : 0;

  const displayName = user?.fullName || user?.username || 'Creator';
  const userInitial = getInitials(displayName);
  const marketSegment = user?.marketSegment || 'B2C';

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="social-dashboard">
      <section className="social-hero">
        <div className="social-hero-copy">
          <span className="social-pill">
            <Sparkles size={14} /> Social marketplace
          </span>
          <h1>Your network is now your storefront.</h1>
          <p>
            A feed-first dashboard for stories, trending listings, and seller activity.
          </p>
        </div>
        <div className="social-hero-actions">
          <Link to="/create-product" className="btn btn-primary social-hero-btn">
            <Plus size={18} /> Post an item
          </Link>
          <Link to="/my-products" className="btn btn-outline social-hero-btn">
            <ShoppingBag size={18} /> Manage listings
          </Link>
        </div>
      </section>

      <div className="social-shell">
        <aside className="social-sidebar">
          <div className="social-panel social-profile-card">
            <div className="social-profile-banner" />
            <div className="social-profile-avatar">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={displayName} />
              ) : (
                userInitial
              )}
            </div>
            <h2>{displayName}</h2>
            <p>{user?.email || 'community@jwttoken.app'}</p>
            <p className="social-market-label">
              {marketSegment}
              {user?.businessName ? ` · ${user.businessName}` : ''}
            </p>
            <div className="social-profile-metrics">
              <div>
                <strong>{products.length}</strong>
                <span>Listings</span>
              </div>
              <div>
                <strong>{sellers.length}</strong>
                <span>Sellers</span>
              </div>
              <div>
                <strong>{filteredProducts.length}</strong>
                <span>Feed items</span>
              </div>
            </div>
            <Link to="/profile" className="social-profile-link">
              Open profile
            </Link>
          </div>

          <div className="social-panel">
            <div className="social-panel-head">
              <h3>Quick actions</h3>
            </div>
            <div className="social-action-list">
              <Link to="/create-product" className="social-action-item">
                <BadgeDollarSign size={18} />
                <span>Sell something new</span>
              </Link>
              <Link to="/my-orders" className="social-action-item">
                <ShoppingBag size={18} />
                <span>Track your orders</span>
              </Link>
              <Link to="/services" className="social-action-item">
                <Send size={18} />
                <span>Find services</span>
              </Link>
              <Link to="/profile" className="social-action-item">
                <Heart size={18} />
                <span>Refresh your profile</span>
              </Link>
            </div>
          </div>

          <div className="social-panel">
            <div className="social-panel-head">
              <h3>Market pulse</h3>
            </div>
            <div className="social-stat-stack">
              <div className="social-stat-card">
                <span>Average listing price</span>
                <strong>{formatNPR(averagePrice || 0)}</strong>
              </div>
              <div className="social-stat-card">
                <span>Search matches</span>
                <strong>{filteredProducts.length}</strong>
              </div>
            </div>
          </div>
        </aside>

        <main className="social-feed-column">
          <div className="social-panel social-search-panel">
            <div className="social-composer">
              <div className="social-composer-avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={displayName} />
                ) : (
                  userInitial
                )}
              </div>
              <div className="social-composer-box">
                <div className="social-search-input-wrap">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Search listings, sellers, or keywords..."
                    className="form-input search-input social-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="social-composer-tools">
                  <span>Feed is filtered live from marketplace products.</span>
                  <Link to="/create-product" className="social-inline-action">
                    <Send size={14} /> Share a listing
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <StoriesBar />

          {error ? <div className="auth-error text-center">{error}</div> : null}

          {featuredProducts.length === 0 ? (
            <div className="empty-state social-empty-state">
              <Tag size={48} className="text-muted mb-4" />
              <h3>No products found</h3>
              <p className="text-muted">Try another keyword or post the first item in your feed.</p>
            </div>
          ) : (
            <div className="social-feed-list">
              {featuredProducts.map((product, index) => (
                <article key={product.id} className="social-feed-card card">
                  <div className="social-feed-card-head">
                    <div className="social-feed-author">
                      <div className="social-feed-author-avatar">
                        {product.user?.profileImage ? (
                          <img
                            src={product.user.profileImage}
                            alt={product.user?.fullName || 'Seller'}
                          />
                        ) : (
                          getInitials(product.user?.fullName || 'Unknown seller')
                        )}
                      </div>
                      <div>
                        <Link to={`/owners/${product.user?.id}`} className="creator-inline-link">
                          <strong>{product.user?.fullName || 'Unknown seller'}</strong>
                        </Link>
                        <span>
                          Drop #{index + 1} in your marketplace feed
                        </span>
                      </div>
                    </div>
                    <span className="social-feed-tag">For sale</span>
                  </div>

                  <Link to={`/products/${product.id}`} className="social-feed-cover">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="product-image-placeholder social-feed-image-fallback">
                        <Tag size={44} className="text-muted opacity-50" />
                      </div>
                    )}
                  </Link>

                  <div className="card-body social-feed-body">
                    <div className="social-feed-body-top">
                      <div>
                        <h3 className="product-title">{product.name}</h3>
                        <p className="product-desc">{product.description}</p>
                        <div className="social-feed-market-meta">
                          <span className="social-feed-tag secondary">
                            {product.targetMarket || 'B2C'}
                          </span>
                          {product.minimumOrderQuantity ? (
                            <span>MOQ {product.minimumOrderQuantity}</span>
                          ) : null}
                        </div>
                        {product.logisticsSupport ? (
                          <p className="product-desc" style={{ marginTop: 8 }}>
                            Logistics: {product.logisticsSupport}
                          </p>
                        ) : null}
                      </div>
                      <span className="product-price">
                        {formatNPR(product.price || 0)}
                      </span>
                    </div>

                    <div className="social-feed-meta">
                      <span>
                        <TrendingUp size={16} /> Trending in community picks
                      </span>
                      <span>
                        <MessageCircle size={16} /> Direct seller contact available
                      </span>
                    </div>
                  </div>

                  <div className="card-footer social-feed-footer">
                    <div className="social-reaction-row">
                      <span>
                        <Heart size={16} /> 24 interested
                      </span>
                      <span>
                        <MessageCircle size={16} /> 8 comments
                      </span>
                    </div>
                    <Link to={`/products/${product.id}`} className="btn btn-outline social-card-cta">
                      View details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="social-right-rail">
          <div className="social-panel">
            <div className="social-panel-head">
              <h3>Trending sellers</h3>
            </div>
            <div className="social-trending-list">
              {sellers.length === 0 ? (
                <p className="text-muted">No sellers available.</p>
              ) : (
                sellers.map((seller, index) => (
                  <div key={seller.name} className="social-trending-item">
                    <div className="social-trending-identity">
                      <div className="social-feed-author-avatar social-feed-author-avatar--sm">
                        {seller.profileImage ? (
                          <img src={seller.profileImage} alt={seller.name} />
                        ) : (
                          getInitials(seller.name)
                        )}
                      </div>
                      <div>
                        <Link to={`/owners/${seller.id}`} className="creator-inline-link">
                          <strong>{seller.name}</strong>
                        </Link>
                        <span>{index + 2} new viewers this hour</span>
                      </div>
                    </div>
                    <span className="social-rank">#{index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="social-panel social-highlight-panel">
            <div className="social-panel-head">
              <h3>Why this works</h3>
            </div>
            <ul className="social-note-list">
              <li>Stories stay visible above the feed like a social app.</li>
              <li>Listings read like posts instead of plain store cards.</li>
              <li>Left and right rails keep profile and market context pinned.</li>
            </ul>
          </div>

          <div className="social-panel">
            <div className="social-panel-head">
              <h3>Shortcuts</h3>
            </div>
            <div className="social-shortcut-grid">
              <Link to="/my-products" className="social-shortcut-card">
                <ShoppingBag size={18} />
                <span>My products</span>
              </Link>
              <Link to="/services" className="social-shortcut-card">
                <Send size={18} />
                <span>Services</span>
              </Link>
              <Link to="/my-orders" className="social-shortcut-card">
                <Send size={18} />
                <span>Orders</span>
              </Link>
              <Link to="/profile" className="social-shortcut-card">
                <Sparkles size={18} />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
