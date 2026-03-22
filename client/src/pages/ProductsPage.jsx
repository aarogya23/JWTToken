import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import s from './shared.module.css';

const emptyForm = { name: '', description: '', price: '' };

function sellerLabel(p) {
  return p.user?.fullName || p.user?.email || 'Member';
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [marketItems, setMarketItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const [mine, market] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/products/browse'),
      ]);
      setItems(Array.isArray(mine) ? mine : []);
      setMarketItems(Array.isArray(market) ? market : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name,
      description: form.description || '',
      price: Number(form.price),
    };
    try {
      if (editingId != null) {
        await apiFetch(`/api/products/${editingId}`, {
          method: 'PUT',
          json: payload,
        });
      } else {
        await apiFetch('/api/products', { method: 'POST', json: payload });
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price != null ? String(p.price) : '',
    });
  }

  async function remove(id) {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  if (loading) {
    return <p className={s.muted}>Loading products…</p>;
  }

  return (
    <div className={`${s.card} ${s.wide}`}>
      <h1 className={s.title}>Products</h1>
      <p className={s.subtitle}>
        C2C marketplace: browse what others sell, and list items you want to share or
        sell. Only you can edit or delete your own listings.
      </p>
      {error ? <div className={s.error}>{error}</div> : null}

      <h2 className={s.sectionTitle}>From the community</h2>
      {marketItems.length === 0 ? (
        <p className={s.muted} style={{ marginBottom: '2rem' }}>
          No product listings yet — be the first to add one below.
        </p>
      ) : (
        <div className={s.marketGrid}>
          {marketItems.map((p) => (
            <article key={p.id} className={s.marketCard}>
              <h3>{p.name}</h3>
              <div className={s.marketPrice}>
                {p.price != null ? `$${Number(p.price).toFixed(2)}` : '—'}
              </div>
              {p.description ? <p className={s.marketDesc}>{p.description}</p> : null}
              <div className={s.marketSeller}>
                Seller: {sellerLabel(p)}
                {user?.id != null && p.user?.id === user.id ? (
                  <span> · You</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <h2 className={s.sectionTitle}>Your listings</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <div className={s.row}>
          <div className={s.field} style={{ flex: '1 1 160px' }}>
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className={s.field} style={{ flex: '1 1 100px' }}>
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
        </div>
        <div className={s.field}>
          <label>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className={s.row}>
          <button type="submit" className={s.btn}>
            {editingId != null ? 'Update' : 'Create'}
          </button>
          {editingId != null ? (
            <button
              type="button"
              className={`${s.btn} ${s.btnSecondary}`}
              onClick={cancelEdit}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <table className={s.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className={s.muted}>
                You have not listed any products yet.
              </td>
            </tr>
          ) : (
            items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.price}</td>
                <td>{p.description}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnSecondary}`}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>{' '}
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnSecondary}`}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => remove(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
