import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Building2,
  ImagePlus,
  MapPin,
  MessageSquareText,
  Package,
  Plus,
  Send,
  Trash2,
  Truck,
} from 'lucide-react';
import api from '../api/axiosConfig';
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

export default function CreatorPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPost, setSavingPost] = useState(false);
  const [error, setError] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });

  const isOwner = Number(user?.id) === Number(userId);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/creator-pages/${userId}`);
        setPageData(res.data);
      } catch (err) {
        setError('Failed to load creator page');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const stats = useMemo(() => {
    const products = pageData?.products || [];
    return {
      totalListings: products.length,
      categories: new Set(products.map((product) => product.category || 'General')).size,
      totalValue: products.reduce((sum, product) => sum + Number(product.price || 0), 0),
    };
  }, [pageData]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.fileUrl) {
        setPostForm((current) => ({ ...current, imageUrl: response.data.fileUrl }));
      }
    } catch (err) {
      alert('Failed to upload post image.');
      console.error(err);
    }
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert('Post title and content are required.');
      return;
    }

    setSavingPost(true);
    try {
      const res = await api.post(`/api/creator-pages/${userId}/posts`, postForm);
      setPageData((current) => ({
        ...current,
        posts: [res.data, ...(current?.posts || [])],
      }));
      setPostForm({ title: '', content: '', imageUrl: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish post.');
      console.error(err);
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post from your page?')) return;

    try {
      await api.delete(`/api/creator-pages/${userId}/posts/${postId}`);
      setPageData((current) => ({
        ...current,
        posts: (current?.posts || []).filter((post) => post.id !== postId),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading creator page...</div>;
  if (error || !pageData) return <div className="auth-error text-center mt-8">{error || 'Page not found'}</div>;

  const ownerName = pageData.fullName || pageData.businessName || 'Creator';

  return (
    <div className="creator-page">
      <section className="creator-hero">
        <div className="creator-hero-main">
          <div className="creator-avatar">
            {pageData.profileImage ? (
              <img src={pageData.profileImage} alt={ownerName} />
            ) : (
              getInitials(ownerName)
            )}
          </div>

          <div className="creator-hero-copy">
            <div className="creator-pill-row">
              <span className="social-pill">
                <MessageSquareText size={14} /> Owner page
              </span>
              <span className="inventory-badge active">{pageData.marketSegment || 'B2C'}</span>
            </div>
            <h1>{ownerName}</h1>
            <p>
              {pageData.bio || 'This owner has not added a public intro yet, but their listings and updates are live here.'}
            </p>
            <div className="creator-meta">
              {pageData.businessName ? (
                <span><Building2 size={16} /> {pageData.businessName}</span>
              ) : null}
              {pageData.location ? (
                <span><MapPin size={16} /> {pageData.location}</span>
              ) : null}
              {pageData.logisticsSupport ? (
                <span><Truck size={16} /> Logistics available</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="creator-stats">
          <div className="creator-stat-card">
            <span>Active listings</span>
            <strong>{stats.totalListings}</strong>
          </div>
          <div className="creator-stat-card">
            <span>Categories</span>
            <strong>{stats.categories}</strong>
          </div>
          <div className="creator-stat-card">
            <span>Live value</span>
            <strong>{formatNPR(stats.totalValue)}</strong>
          </div>
        </div>
      </section>

      <div className="creator-shell">
        <main className="creator-main">
          {isOwner ? (
            <section className="creator-panel creator-composer-panel">
              <div className="social-panel-head">
                <h3>Post on your page</h3>
              </div>
              <form className="creator-post-form" onSubmit={handleCreatePost}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Post title"
                  value={postForm.title}
                  onChange={(e) => setPostForm((current) => ({ ...current, title: e.target.value }))}
                />
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Share what you do, what is new in your business, upcoming stock, special offers, or anything customers should know."
                  value={postForm.content}
                  onChange={(e) => setPostForm((current) => ({ ...current, content: e.target.value }))}
                />
                {postForm.imageUrl ? (
                  <div className="creator-upload-preview">
                    <img src={postForm.imageUrl} alt="Post preview" />
                  </div>
                ) : null}
                <div className="creator-form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus size={16} /> Add image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={savingPost}>
                    <Plus size={16} /> {savingPost ? 'Publishing...' : 'Publish post'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="creator-panel">
            <div className="social-panel-head">
              <h3>Posts & updates</h3>
            </div>

            {pageData.posts?.length ? (
              <div className="creator-post-list">
                {pageData.posts.map((post) => (
                  <article key={post.id} className="creator-post-card">
                    <div className="creator-post-head">
                      <div>
                        <h3>{post.title}</h3>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      {isOwner ? (
                        <button
                          className="btn btn-danger creator-post-delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>
                    <p>{post.content}</p>
                    {post.imageUrl ? (
                      <div className="creator-post-image">
                        <img src={post.imageUrl} alt={post.title} />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state social-empty-state">
                <MessageSquareText size={42} className="text-muted mb-4" />
                <h3>No posts yet</h3>
                <p className="text-muted">
                  {isOwner
                    ? 'Use the composer above to introduce your work and keep customers updated.'
                    : 'This owner has not published page updates yet.'}
                </p>
              </div>
            )}
          </section>
        </main>

        <aside className="creator-sidebar">
          <section className="creator-panel">
            <div className="social-panel-head">
              <h3>What they offer</h3>
            </div>
            {pageData.products?.length ? (
              <div className="creator-product-list">
                {pageData.products.map((product) => (
                  <Link key={product.id} to={`/products/${product.id}`} className="creator-product-card">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="creator-product-fallback">
                        <Package size={24} />
                      </div>
                    )}
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category || 'General'}</span>
                      <p>{formatNPR(product.price || 0)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ padding: '0 1.15rem 1.15rem' }}>
                No active listings right now.
              </p>
            )}
          </section>

          <section className="creator-panel creator-contact-panel">
            <div className="social-panel-head">
              <h3>Quick actions</h3>
            </div>
            <div className="creator-contact-actions">
              <Link to="/services" className="btn btn-outline">
                <Truck size={16} /> Request logistics
              </Link>
              <Link to="/groups" className="btn btn-primary">
                <Send size={16} /> Open chat space
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
