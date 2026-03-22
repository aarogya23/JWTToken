import { useCallback, useEffect, useState } from 'react';
import { getStoryDataUrl, storyMediaKind } from '../utils/storyMedia';

function StoryMedia({ src, kind }) {
  const [fallback, setFallback] = useState(0);

  if (!src) {
    return <p className="story-viewer-fallback">No media</p>;
  }

  if (kind === 'image') {
    return <img src={src} alt="" className="story-viewer-img" />;
  }
  if (kind === 'video') {
    return (
      <video src={src} controls autoPlay className="story-viewer-vid" playsInline />
    );
  }
  if (kind === 'audio') {
    return (
      <div className="story-viewer-audio-wrap">
        <span className="story-viewer-audio-ico">🎵</span>
        <audio src={src} controls autoPlay className="story-viewer-audio" />
      </div>
    );
  }

  if (fallback === 0) {
    return (
      <img
        src={src}
        alt=""
        className="story-viewer-img"
        onError={() => setFallback(1)}
      />
    );
  }
  if (fallback === 1) {
    return (
      <video
        src={src}
        controls
        autoPlay
        className="story-viewer-vid"
        playsInline
        onError={() => setFallback(2)}
      />
    );
  }
  if (fallback === 2) {
    return (
      <div className="story-viewer-audio-wrap">
        <audio src={src} controls autoPlay className="story-viewer-audio" />
      </div>
    );
  }
  return <p className="story-viewer-fallback">Unsupported media</p>;
}

function formatStoryTime(createdAt) {
  if (!createdAt) return '';
  if (Array.isArray(createdAt)) {
    const [y, mo, d, h, mi] = createdAt;
    const date = new Date(y, mo - 1, d, h, mi);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export default function StoryViewer({ stories, index, open, onClose, onIndexChange }) {
  const safeStories = Array.isArray(stories) ? stories : [];
  const idx = Math.max(0, Math.min(index, safeStories.length - 1));
  const story = safeStories[idx];
  const hasMany = safeStories.length > 1;

  const go = useCallback(
    (delta) => {
      const next = idx + delta;
      if (next < 0 || next >= safeStories.length) {
        if (next >= safeStories.length) onClose();
        return;
      }
      onIndexChange(next);
    },
    [idx, safeStories.length, onClose, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go, onClose]);

  if (!open || !story) return null;

  const src = getStoryDataUrl(story);
  const kind = storyMediaKind(story);

  return (
    <div
      className="story-viewer-root"
      role="dialog"
      aria-modal="true"
      aria-label="Story"
    >
      <div className="story-viewer-top">
        <div className="story-viewer-bars">
          {safeStories.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`story-viewer-bar ${i < idx ? 'past' : ''} ${i === idx ? 'now' : ''}`}
              aria-label={`Story ${i + 1}`}
              onClick={() => onIndexChange(i)}
            />
          ))}
        </div>
        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <div className="story-viewer-uav">
              {(story.userFullName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="story-viewer-uname">{story.userFullName || 'User'}</div>
              <div className="story-viewer-utime">{formatStoryTime(story.createdAt)}</div>
            </div>
          </div>
          <button type="button" className="story-viewer-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="story-viewer-stage">
        <div className="story-viewer-media">
          <StoryMedia key={story.id} src={src} kind={kind} />
        </div>
        {hasMany ? (
          <>
            <button
              type="button"
              className="story-viewer-tap story-viewer-tap-left"
              aria-label="Previous story"
              onClick={() => go(-1)}
            />
            <button
              type="button"
              className="story-viewer-tap story-viewer-tap-right"
              aria-label="Next story"
              onClick={() => go(1)}
            />
            <button
              type="button"
              className="story-viewer-arrow story-viewer-arrow-left"
              onClick={() => go(-1)}
            >
              ❮
            </button>
            <button
              type="button"
              className="story-viewer-arrow story-viewer-arrow-right"
              onClick={() => go(1)}
            >
              ❯
            </button>
          </>
        ) : null}
      </div>

      {story.caption ? (
        <div className="story-viewer-caption">{story.caption}</div>
      ) : null}
    </div>
  );
}
