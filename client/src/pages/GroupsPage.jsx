import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [members, setMembers] = useState({});
  const [available, setAvailable] = useState([]);
  const [pickForGroup, setPickForGroup] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadGroups = useCallback(async () => {
    setError('');
    try {
      const data = await apiFetch('/api/groups');
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const isAdmin = (g) => user?.id != null && g?.createdBy?.id === user.id;

  async function loadAvailableForGroup(groupId) {
    setError('');
    try {
      const data = await apiFetch(
        `/api/groups/${groupId}/available-members`,
      );
      setAvailable(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setAvailable([]);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/api/groups', {
        method: 'POST',
        json: { name: name.trim(), memberIds: [] },
      });
      setName('');
      loadGroups();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleMembers(groupId) {
    if (expandedId === groupId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(groupId);
    setPickForGroup(null);
    if (!members[groupId]) {
      try {
        const data = await apiFetch(`/api/groups/${groupId}/members`);
        setMembers((prev) => ({ ...prev, [groupId]: Array.isArray(data) ? data : [] }));
      } catch (e) {
        setError(e.message);
      }
    }
  }

  async function startAddMember(groupId) {
    const g = groups.find((x) => x.id === groupId);
    if (!isAdmin(g)) {
      setError('Only the group creator can add members.');
      return;
    }
    setPickForGroup(groupId);
    setSelectedUserId('');
    await loadAvailableForGroup(groupId);
  }

  async function addMember(groupId) {
    if (!selectedUserId) return;
    setError('');
    try {
      await apiFetch(`/api/groups/${groupId}/members`, {
        method: 'PUT',
        json: { userId: Number(selectedUserId) },
      });
      const data = await apiFetch(`/api/groups/${groupId}/members`);
      setMembers((prev) => ({
        ...prev,
        [groupId]: Array.isArray(data) ? data : [],
      }));
      await loadAvailableForGroup(groupId);
      setPickForGroup(null);
      setSelectedUserId('');
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="commune-page-single">
        <p className="commune-muted">Loading groups…</p>
      </div>
    );
  }

  return (
    <div className="commune-page-single">
      <h1
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '1.5rem',
          marginBottom: 8,
        }}
      >
        Groups
      </h1>
      <p className="commune-muted" style={{ marginBottom: 16 }}>
        Use{' '}
        <strong>GET /api/groups/&#123;id&#125;/available-members</strong> so only
        the group creator sees users who are not already members.
      </p>
      {error ? <div className="commune-error">{error}</div> : null}

      <form
        onSubmit={handleCreate}
        style={{ marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}
      >
        <input
          className="commune-composer-field"
          style={{ flex: '1 1 200px' }}
          placeholder="New group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" className="commune-tb-btn primary">
          Create
        </button>
      </form>

      <div className="commune-card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>ID</th>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }} />
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={3} className="commune-muted" style={{ padding: 16 }}>
                  No groups yet.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>{g.id}</td>
                  <td style={{ padding: 12 }}>{g.name}</td>
                  <td style={{ padding: 12 }}>
                    <button
                      type="button"
                      className="commune-tb-btn"
                      onClick={() => toggleMembers(g.id)}
                    >
                      {expandedId === g.id ? 'Hide' : 'Members'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {expandedId != null ? (
        <div
          className="commune-card"
          style={{ marginTop: 20, padding: 16 }}
        >
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>
            Members — group {expandedId}
          </h3>
          <ul className="commune-muted" style={{ margin: '0 0 12px', paddingLeft: 18 }}>
            {(members[expandedId] || []).length === 0 ? (
              <li>None.</li>
            ) : (
              members[expandedId].map((m) => (
                <li key={m.id}>
                  {m.user?.fullName || m.user?.email || m.user?.id}
                </li>
              ))
            )}
          </ul>
          {isAdmin(groups.find((x) => x.id === expandedId)) ? (
            <>
              <button
                type="button"
                className="commune-tb-btn"
                style={{ marginBottom: 12 }}
                onClick={() =>
                  pickForGroup === expandedId
                    ? setPickForGroup(null)
                    : startAddMember(expandedId)
                }
              >
                {pickForGroup === expandedId ? 'Cancel add' : 'Add member'}
              </button>
              {pickForGroup === expandedId ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select
                    className="commune-composer-field"
                    style={{ flex: '1 1 220px' }}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {available.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email} ({u.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="commune-tb-btn primary"
                    onClick={() => addMember(expandedId)}
                  >
                    Add
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="commune-muted">Only the group creator can add members.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
