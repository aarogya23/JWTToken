import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import s from './shared.module.css';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await apiFetch('/api/profile');
        if (cancelled) return;
        setFullName(u.fullName || '');
        setBio(u.bio || '');
        setLocation(u.location || '');
      } catch (e) {
        setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        json: { fullName, bio, location },
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <p className={s.muted}>Loading profile…</p>;
  }

  return (
    <div className={`${s.card} ${s.wide}`}>
      <h1 className={s.title}>Profile</h1>
      <p className={s.subtitle}>Updates your user record via PUT /api/profile.</p>

      {error ? <div className={s.error}>{error}</div> : null}
      {saved ? <div className={s.success}>Saved.</div> : null}

      <form onSubmit={handleSubmit}>
        <div className={s.field}>
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button type="submit" className={s.btn}>
          Save
        </button>
      </form>
    </div>
  );
}
