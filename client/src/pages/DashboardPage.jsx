import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GroupChatModal from '../components/GroupChatModal';
import StoryViewer from '../components/StoryViewer';
import { apiFetch } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { getStoryDataUrl, storyMediaKind } from '../utils/storyMedia';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatGroup, setChatGroup] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [stories, setStories] = useState([]);
  const [myStoryCount, setMyStoryCount] = useState(0);
  const [feedTab, setFeedTab] = useState('all');
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [detailGroup, setDetailGroup] = useState(null);
  const [detailMembers, setDetailMembers] = useState([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);
  const [availableToAdd, setAvailableToAdd] = useState([]);
  const [pickUserId, setPickUserId] = useState('');

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);

  const openStoryViewer = useCallback((story) => {
    const i = stories.findIndex((s) => s.id === story.id);
    if (i >= 0) {
      setStoryViewerIndex(i);
      setStoryViewerOpen(true);
    }
  }, [stories]);

  const onStoryCardClick = useCallback(
    (e, st) => {
      if (e.target.closest('button, a, input, select, textarea')) return;
      openStoryViewer(st);
    },
    [openStoryViewer],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const [mine, all, st] = await Promise.all([
        apiFetch('/api/groups/me'),
        apiFetch('/api/groups'),
        apiFetch('/api/stories/all'),
      ]);
      setMyGroups(Array.isArray(mine) ? mine : []);
      setAllGroups(Array.isArray(all) ? all : []);
      setStories(Array.isArray(st) ? st : []);
      if (user?.id != null) {
        try {
          const mineStories = await apiFetch(`/api/stories/user/${user.id}`);
          setMyStoryCount(Array.isArray(mineStories) ? mineStories.length : 0);
        } catch {
          setMyStoryCount(0);
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = (g) => user?.id != null && g?.createdBy?.id === user.id;

  function openChat(g) {
    if (!g?.id) return;
    setDetailGroup(null);
    setChatGroup({ id: g.id, name: g.name });
  }

  const feedGroups = useMemo(() => {
    let list = [...allGroups];
    if (feedTab === 'groups') {
      list = list.filter((g) => myGroups.some((m) => m.id === g.id));
    }
    if (sort === 'newest') {
      list.sort((a, b) => Number(b.id) - Number(a.id));
    } else {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }, [allGroups, myGroups, feedTab, sort]);

  const feedStories = useMemo(() => {
    if (feedTab !== 'stories' && feedTab !== 'all') return [];
    return [...stories];
  }, [stories, feedTab]);

  async function openDetails(g) {
    setDetailGroup(g);
    setAddMemberOpen(false);
    setAddMemberGroupId(null);
    try {
      const m = await apiFetch(`/api/groups/${g.id}/members`);
      setDetailMembers(Array.isArray(m) ? m : []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function openAddMember(g) {
    if (!isAdmin(g)) {
      setError('Only the group creator can add members.');
      return;
    }
    setError('');
    setDetailGroup(null);
    setAddMemberGroupId(g.id);
    setAddMemberOpen(true);
    setPickUserId('');
    try {
      const data = await apiFetch(`/api/groups/${g.id}/available-members`);
      setAvailableToAdd(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Could not load users to add');
      setAvailableToAdd([]);
    }
  }

  async function submitAddMember() {
    if (!addMemberGroupId || !pickUserId) return;
    setError('');
    try {
      await apiFetch(`/api/groups/${addMemberGroupId}/members`, {
        method: 'PUT',
        json: { userId: Number(pickUserId) },
      });
      setAddMemberOpen(false);
      setAddMemberGroupId(null);
      if (detailGroup?.id === addMemberGroupId) {
        const m = await apiFetch(`/api/groups/${addMemberGroupId}/members`);
        setDetailMembers(Array.isArray(m) ? m : []);
      }
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteGroup(id) {
    if (!window.confirm('Delete this group permanently?')) return;
    setError('');
    try {
      await apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
      setDetailGroup(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function createGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError('');
    try {
      await apiFetch('/api/groups', {
        method: 'POST',
        json: { name: newGroupName.trim(), memberIds: [] },
      });
      setNewGroupName('');
      setCreateOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const initials = (name) =>
    (name || '?')
      .split(/\s+/)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <div className="commune-page-single">
        <p className="commune-muted">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="commune-layout">
      <aside className="commune-sidebar">
        <div className="commune-card">
          <div className="commune-ps-banner" />
          <div className="commune-ps-inner">
            <div
              className="commune-ps-av"
              style={
                user?.profileImage
                  ? { backgroundImage: `url(${user.profileImage})` }
                  : undefined
              }
            >
              {!user?.profileImage ? initials(user?.fullName || user?.email) : null}
            </div>
            <div className="commune-ps-name">{user?.fullName || 'Member'}</div>
            <div className="commune-ps-email">{user?.email}</div>
            <div className="commune-ps-bio">{user?.bio || 'Mr Developer'}</div>
            <div className="commune-ps-stats">
              <div>
                <strong>{myGroups.length}</strong>
                Groups
              </div>
              <div>
                <strong>{myStoryCount}</strong>
                Stories
              </div>
              <div>
                <strong>—</strong>
                Reactions
              </div>
            </div>
            <Link to="/profile">
              <button type="button" className="commune-ps-edit">
                Edit Profile
              </button>
            </Link>
          </div>
        </div>

        <div className="commune-card">
          <div className="commune-mg-head">
            <span>MY GROUPS</span>
            <button
              type="button"
              className="commune-mg-add"
              title="Create group"
              onClick={() => setCreateOpen(true)}
            >
              +
            </button>
          </div>
          <div className="commune-mg-list">
            {myGroups.length === 0 ? (
              <p className="commune-muted" style={{ padding: '0 8px' }}>
                No groups yet. Create one from the feed.
              </p>
            ) : (
              myGroups.map((g) => (
                <div key={g.id} className="commune-mg-item">
                  <div className="commune-mg-ico">👥</div>
                  <div className="commune-mg-meta">
                    <div className="commune-mg-name">{g.name}</div>
                  </div>
                  <button
                    type="button"
                    className="commune-mg-chat"
                    onClick={() => openChat(g)}
                  >
                    Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <div className="commune-feed">
        {error ? <div className="commune-error">{error}</div> : null}

        <div className="commune-card commune-story-section">
          <div className="commune-story-head">
            <h3>STORIES</h3>
            <Link to="/stories" className="commune-muted" style={{ fontSize: 12 }}>
              See all
            </Link>
          </div>
          <div className="commune-story-strip">
            <Link to="/stories" className="commune-story-add">
              <div className="commune-story-add-circle">+</div>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Add Story</span>
            </Link>
            {stories.slice(0, 12).map((st) => {
              const src = getStoryDataUrl(st);
              const kind = storyMediaKind(st);
              return (
                <button
                  key={st.id}
                  type="button"
                  className="commune-story-thumb commune-story-thumb-btn"
                  aria-label={`Open story from ${st.userFullName || 'user'}`}
                  onClick={() => openStoryViewer(st)}
                >
                  {kind === 'image' && src ? (
                    <img src={src} alt="" />
                  ) : kind === 'video' && src ? (
                    <video
                      src={src}
                      muted
                      playsInline
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : kind === 'unknown' && src ? (
                    <img src={src} alt="" />
                  ) : (
                    <div
                      className="commune-story-add-circle"
                      style={{ width: 56, height: 56, fontSize: 20 }}
                    >
                      {kind === 'audio' ? '🎵' : '▶'}
                    </div>
                  )}
                  <span>{st.userFullName?.split(' ')[0] || '…'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="commune-card commune-composer">
          <div className="commune-composer-input">
            <div className="commune-composer-av">
              {initials(user?.fullName || user?.email)}
            </div>
            <input
              className="commune-composer-field"
              placeholder="What's on your mind?"
              readOnly
              onFocus={() => setCreateOpen(true)}
            />
          </div>
          <div className="commune-composer-actions">
            <button
              type="button"
              className="commune-tb-btn"
              style={{ flex: 1, justifyContent: 'center', height: 40 }}
              onClick={() => setCreateOpen(true)}
            >
              👥 Create Group
            </button>
            <button
              type="button"
              className="commune-tb-btn primary"
              style={{ flex: 1, justifyContent: 'center', height: 40 }}
              onClick={() => navigate('/stories')}
            >
              🖼 Share Story
            </button>
          </div>
        </div>

        <div className="commune-card" style={{ padding: 0 }}>
          <div className="commune-feed-tabs">
            <button
              type="button"
              className={`commune-feed-tab ${feedTab === 'all' ? 'active' : ''}`}
              onClick={() => setFeedTab('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`commune-feed-tab ${feedTab === 'groups' ? 'active' : ''}`}
              onClick={() => setFeedTab('groups')}
            >
              Groups
            </button>
            <button
              type="button"
              className={`commune-feed-tab ${feedTab === 'stories' ? 'active' : ''}`}
              onClick={() => setFeedTab('stories')}
            >
              Stories
            </button>
          </div>
          <div className="commune-feed-toolbar">
            <span style={{ fontSize: 16, opacity: 0.4 }}>🔍</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>

          {feedTab === 'stories' ? (
            <div style={{ padding: 14 }}>
              {feedStories.length === 0 ? (
                <p className="commune-muted">No stories yet.</p>
              ) : (
                feedStories.map((st) => {
                  const src = getStoryDataUrl(st);
                  const kind = storyMediaKind(st);
                  return (
                    <div
                      key={st.id}
                      role="button"
                      tabIndex={0}
                      className="commune-gcard commune-gcard--story"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onClick={(e) => onStoryCardClick(e, st)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openStoryViewer(st);
                        }
                      }}
                    >
                      <div className="commune-gcard-head">
                        <div className="commune-gcard-ico">📸</div>
                        <div className="commune-gcard-title">
                          <h4>{st.userFullName || 'Story'}</h4>
                          <span className="commune-badge">STORY</span>
                        </div>
                      </div>
                      {st.caption ? (
                        <p className="commune-gcard-desc">{st.caption}</p>
                      ) : null}
                      {kind === 'image' && src ? (
                        <div
                          style={{
                            borderRadius: 10,
                            overflow: 'hidden',
                            marginBottom: 10,
                            border: '1px solid var(--border)',
                          }}
                        >
                          <img
                            src={src}
                            alt=""
                            style={{
                              width: '100%',
                              maxHeight: 220,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      ) : null}
                      {kind === 'unknown' && src ? (
                        <div
                          style={{
                            borderRadius: 10,
                            overflow: 'hidden',
                            marginBottom: 10,
                            border: '1px solid var(--border)',
                          }}
                        >
                          <img
                            src={src}
                            alt=""
                            style={{
                              width: '100%',
                              maxHeight: 220,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      ) : null}
                      {kind === 'video' && src ? (
                        <video
                          src={src}
                          controls
                          style={{
                            width: '100%',
                            maxHeight: 220,
                            borderRadius: 10,
                            marginBottom: 10,
                          }}
                        />
                      ) : null}
                      {kind === 'audio' && src ? (
                        <audio
                          src={src}
                          controls
                          style={{ width: '100%', marginBottom: 10 }}
                        />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div>
              {feedGroups.map((g) => (
                <div
                  key={g.id}
                  className="commune-gcard"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="commune-gcard-head">
                    <div className="commune-gcard-ico">👥</div>
                    <div className="commune-gcard-title">
                      <h4>{g.name}</h4>
                      <span className="commune-badge">GROUP</span>
                    </div>
                  </div>
                  <div className="commune-gcard-links">
                    <button type="button" onClick={() => openDetails(g)}>
                      View Details
                    </button>
                    <button type="button" onClick={() => openChat(g)}>
                      Open Chat
                    </button>
                    {isAdmin(g) ? (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteGroup(g.id)}
                      >
                        Delete Group
                      </button>
                    ) : null}
                    {isAdmin(g) ? (
                      <button type="button" onClick={() => openAddMember(g)}>
                        Add people
                      </button>
                    ) : null}
                  </div>
                  <div className="commune-gcard-desc">
                    A chat group for messaging.
                  </div>
                  <div className="commune-gcard-actions">
                    <button type="button" onClick={() => openDetails(g)}>
                      Details
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => openChat(g)}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
              {feedTab === 'all'
                ? stories.map((st) => {
                    const src = getStoryDataUrl(st);
                    const kind = storyMediaKind(st);
                    return (
                      <div
                        key={`feed-story-${st.id}`}
                        role="button"
                        tabIndex={0}
                        className="commune-gcard commune-gcard--story"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onClick={(e) => onStoryCardClick(e, st)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openStoryViewer(st);
                          }
                        }}
                      >
                        <div className="commune-gcard-head">
                          <div className="commune-gcard-ico">📸</div>
                          <div className="commune-gcard-title">
                            <h4>{st.userFullName || 'Story'}</h4>
                            <span className="commune-badge">STORY</span>
                          </div>
                        </div>
                        {st.caption ? (
                          <p className="commune-gcard-desc">{st.caption}</p>
                        ) : null}
                        {kind === 'image' && src ? (
                          <img
                            src={src}
                            alt=""
                            style={{
                              width: '100%',
                              maxHeight: 200,
                              objectFit: 'cover',
                              borderRadius: 10,
                              marginBottom: 8,
                            }}
                          />
                        ) : null}
                        {kind === 'unknown' && src ? (
                          <img
                            src={src}
                            alt=""
                            style={{
                              width: '100%',
                              maxHeight: 200,
                              objectFit: 'cover',
                              borderRadius: 10,
                              marginBottom: 8,
                            }}
                          />
                        ) : null}
                        {kind === 'video' && src ? (
                          <video
                            src={src}
                            controls
                            style={{
                              width: '100%',
                              maxHeight: 200,
                              borderRadius: 10,
                              marginBottom: 8,
                            }}
                          />
                        ) : null}
                        {kind === 'audio' && src ? (
                          <audio
                            src={src}
                            controls
                            style={{ width: '100%', marginBottom: 8 }}
                          />
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
          )}
        </div>

        <p className="commune-muted" style={{ textAlign: 'center' }}>
          <Link to="/products">Products</Link>
          {' · '}
          <Link to="/services">Services</Link>
        </p>
      </div>

      {createOpen ? (
        <div
          className="commune-modal-backdrop"
          role="presentation"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="commune-modal"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create group</h3>
            <form onSubmit={createGroup}>
              <input
                className="commune-composer-field"
                style={{ width: '100%', marginBottom: 12 }}
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
              <div className="commune-modal-actions">
                <button
                  type="button"
                  className="commune-tb-btn"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="commune-tb-btn primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailGroup ? (
        <div
          className="commune-modal-backdrop"
          role="presentation"
          onClick={() => setDetailGroup(null)}
        >
          <div
            className="commune-modal"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{detailGroup.name}</h3>
            <p className="commune-muted">
              Creator: {detailGroup.createdBy?.email || '—'}
            </p>
            <p style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>
              Members
            </p>
            <ul className="commune-muted" style={{ margin: 0, paddingLeft: 18 }}>
              {detailMembers.map((m) => (
                <li key={m.id}>
                  {m.user?.fullName || m.user?.email || m.user?.id}
                </li>
              ))}
            </ul>
            {isAdmin(detailGroup) ? (
              <button
                type="button"
                className="commune-tb-btn primary"
                style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                onClick={() => openAddMember(detailGroup)}
              >
                Add people to group
              </button>
            ) : (
              <p className="commune-muted" style={{ marginTop: 12 }}>
                Only the group creator can add members.
              </p>
            )}
            <div className="commune-modal-actions">
              <button
                type="button"
                className="commune-tb-btn primary"
                onClick={() => {
                  openChat(detailGroup);
                  setDetailGroup(null);
                }}
              >
                Open Chat
              </button>
              <button
                type="button"
                className="commune-tb-btn"
                onClick={() => setDetailGroup(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <StoryViewer
        stories={stories}
        index={storyViewerIndex}
        open={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
        onIndexChange={setStoryViewerIndex}
      />

      <GroupChatModal
        key={chatGroup ? String(chatGroup.id) : 'closed'}
        groupId={chatGroup?.id ?? null}
        groupName={chatGroup?.name}
        open={chatGroup != null}
        onClose={() => setChatGroup(null)}
        user={user}
      />

      {addMemberOpen && addMemberGroupId ? (
        <div
          className="commune-modal-backdrop"
          role="presentation"
          onClick={() => {
            setAddMemberOpen(false);
            setAddMemberGroupId(null);
          }}
        >
          <div
            className="commune-modal"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add people</h3>
            <p className="commune-muted">
              Choose someone who is not already in this group. (You must be the
              group creator.)
            </p>
            <select
              className="commune-composer-field"
              style={{ width: '100%', marginTop: 12 }}
              value={pickUserId}
              onChange={(e) => setPickUserId(e.target.value)}
            >
              <option value="">Select a user…</option>
              {availableToAdd.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email} ({u.email})
                </option>
              ))}
            </select>
            {availableToAdd.length === 0 ? (
              <p className="commune-muted" style={{ marginTop: 8 }}>
                No users available to add (everyone may already be in this group).
              </p>
            ) : null}
            <div className="commune-modal-actions">
              <button
                type="button"
                className="commune-tb-btn"
                onClick={() => {
                  setAddMemberOpen(false);
                  setAddMemberGroupId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="commune-tb-btn primary"
                onClick={submitAddMember}
                disabled={!pickUserId}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
