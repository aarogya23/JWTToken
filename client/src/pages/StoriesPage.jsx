import { useCallback, useEffect, useState } from 'react';
import StoryViewer from '../components/StoryViewer';
import { apiFetch, apiUpload } from '../api/client';
import { getStoryDataUrl, storyMediaKind } from '../utils/storyMedia';
import s from './shared.module.css';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = useCallback(
    (st) => {
      const i = stories.findIndex((s) => s.id === st.id);
      if (i >= 0) {
        setViewerIndex(i);
        setViewerOpen(true);
      }
    },
    [stories],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiFetch('/api/stories/all');
      setStories(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a file.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caption', caption);
      await apiUpload('/api/stories/upload', fd);
      setCaption('');
      setFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeStory(id) {
    if (!window.confirm('Delete this story?')) return;
    setError('');
    try {
      await apiFetch(`/api/stories/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <p className={s.muted}>Loading stories…</p>;
  }

  return (
    <div className={`${s.card} ${s.wide}`}>
      <h1 className={s.title}>Stories</h1>
      <p className={s.subtitle}>
        Upload media (POST /api/stories/upload) and browse active stories.
      </p>
      {error ? <div className={s.error}>{error}</div> : null}

      <form onSubmit={handleUpload} style={{ marginBottom: '2rem' }}>
        <div className={s.field}>
          <label>Media file</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className={s.field}>
          <label>Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <button type="submit" className={s.btn} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload story'}
        </button>
      </form>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {stories.length === 0 ? (
          <p className={s.muted}>No stories yet.</p>
        ) : (
          stories.map((st) => {
            const src = getStoryDataUrl(st);
            const kind = storyMediaKind(st);
            return (
            <article
              key={st.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (e.target.closest('button, video, audio')) return;
                openViewer(st);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openViewer(st);
                }
              }}
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            >
              {kind === 'image' && src ? (
                <img
                  src={src}
                  alt=""
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
              ) : kind === 'unknown' && src ? (
                <img
                  src={src}
                  alt=""
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
              ) : kind === 'video' && src ? (
                <video
                  src={src}
                  controls
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
              ) : kind === 'audio' && src ? (
                <div style={{ padding: 12 }}>
                  <audio src={src} controls style={{ width: '100%' }} />
                </div>
              ) : (
                <div
                  style={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                  }}
                  className={s.muted}
                >
                  Unsupported preview
                </div>
              )}
              <div style={{ padding: '0.65rem 0.75rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600 }}>{st.userFullName}</div>
                <div className={s.muted}>{st.caption}</div>
                <button
                  type="button"
                  className={`${s.btn} ${s.btnSecondary}`}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.75rem',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStory(st.id);
                  }}
                >
                  Delete (owner only)
                </button>
              </div>
            </article>
            );
          })
        )}
      </div>

      <StoryViewer
        stories={stories}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </div>
  );
}
