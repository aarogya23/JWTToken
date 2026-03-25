import { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './StoriesBar.css';

const formatImg = (str, isVideo = false) => {
  if (!str) return '';
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) return str;
  return `data:${isVideo ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
};

const StoriesBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await api.get('/api/stories/all');
      setStories(response.data || []);
    } catch (err) {
      console.error('Failed to fetch stories', err);
    }
  };

  const handleUploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const caption = prompt('Add a caption for your story (optional):');
    if (caption) {
      formData.append('caption', caption);
    }

    try {
      await api.post('/api/stories/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchStories();
    } catch (err) {
      alert('Failed to upload story. Max size is 15MB.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const nextStory = (e) => {
    e?.stopPropagation();
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  const prevStory = (e) => {
    e?.stopPropagation();
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedStoryIndex === null) return;
      if (e.key === 'Escape') setSelectedStoryIndex(null);
      if (e.key === 'ArrowRight') nextStory();
      if (e.key === 'ArrowLeft') prevStory();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStoryIndex, stories.length]);

  const selectedStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;

  return (
    <>
      <div className="sb-container">
        {/* Add Story Button */}
        <div 
          className="sb-story-circle"
          onClick={() => !uploading && fileInputRef.current.click()}
        >
          <div className={`sb-ring-wrap sb-ring-add ${uploading ? 'anim-pulse' : ''}`}>
             <Plus size={24} />
          </div>
          <span className="sb-user-label">{uploading ? 'Uploading...' : 'Add Story'}</span>
        </div>
        
        <input 
          type="file" 
          accept="image/*,video/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleUploadStory} 
        />

        {/* List of Stories */}
        {stories.map((story, idx) => (
          <div 
            key={story.id} 
            className="sb-story-circle"
            onClick={() => setSelectedStoryIndex(idx)}
          >
            <div className="sb-ring-wrap sb-ring-active">
              <div className="sb-img-box">
                {story.mediaUrl ? (
                  <img src={formatImg(story.mediaUrl, story.mediaType?.startsWith('video/'))} alt="Story" />
                ) : (
                  <ImageIcon size={20} />
                )}
              </div>
            </div>
            <span className="sb-user-label">
              {story.userFullName || 'User'}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer Overlay (Instagram Style) */}
      {selectedStory && (
        <div className="sb-viewer-overlay">
          
          {/* Top Progress Bars */}
          <div className="sb-progress-wrap">
            {stories.map((_, idx) => (
              <div key={idx} className="sb-progress-bar">
                <div 
                  className="sb-progress-fill" 
                  style={{ width: idx < selectedStoryIndex ? '100%' : idx === selectedStoryIndex ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Header Info */}
          <div className="sb-header">
            <div className="sb-header-left">
              <div className="sb-header-av">
                {selectedStory.userProfileImage ? (
                  <img src={formatImg(selectedStory.userProfileImage)} alt="Profile" />
                ) : (
                  <span>{(selectedStory.userFullName || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="sb-header-text">
                <span className="sb-header-name">{selectedStory.userFullName}</span>
                <span className="sb-header-time">
                  {new Date(selectedStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <button className="sb-close-btn" onClick={() => setSelectedStoryIndex(null)}>
              <X size={28} />
            </button>
          </div>
          
          {/* Media Container */}
          <div className="sb-media-container" onClick={nextStory}>
            {/* Background Blur for aesthetics */}
            {selectedStory.mediaUrl && !selectedStory.mediaType?.startsWith('video/') && (
              <div 
                className="sb-media-blur" 
                style={{ backgroundImage: `url(${formatImg(selectedStory.mediaUrl)})` }} 
              />
            )}

            {/* Actual Media */}
            <div className="sb-media-content" onClick={(e) => e.stopPropagation()}>
              
              {/* Tap Zones */}
              <div className="sb-tap-zone sb-tap-left" onClick={prevStory} />
              <div className="sb-tap-zone sb-tap-right" onClick={nextStory} />

              {/* Navigation Arrows for Desktop */}
              {selectedStoryIndex > 0 && (
                <button className="sb-nav-arrow sb-nav-left" onClick={prevStory}>
                  <ChevronLeft size={28} />
                </button>
              )}
              {selectedStoryIndex < stories.length - 1 && (
                <button className="sb-nav-arrow sb-nav-right" onClick={nextStory}>
                  <ChevronRight size={28} />
                </button>
              )}

              {selectedStory.mediaUrl ? (
                selectedStory.mediaType?.startsWith('video/') ? (
                   <video src={formatImg(selectedStory.mediaUrl, true)} controls autoPlay />
                ) : (
                   <img src={formatImg(selectedStory.mediaUrl)} alt="Story content" />
                )
              ) : null}

              {/* Caption Overlay */}
              {selectedStory.caption && (
                <div className="sb-caption-box">
                  <span className="sb-caption-text">
                    {selectedStory.caption}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoriesBar;
