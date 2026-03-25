import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, MessageCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const Groups = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const response = await api.get('/api/groups/me');
      setMyGroups(response.data);
    } catch (err) {
      setError('Failed to load your groups.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const response = await api.post('/api/groups', {
        name: newGroupName,
        memberIds: [] // Currently creating an empty group, user can add members later if backend supports it
      });
      setMyGroups([...myGroups, response.data]);
      setNewGroupName('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading groups...</div>;

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1>My Groups</h1>
          <p className="text-muted">Chat and collaborate with your network.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Group Column */}
        <div className="md:col-span-1">
          <div className="card">
            <div className="card-header border-b-0 pb-2">
              <h2 className="flex items-center gap-2 text-lg">
                <Plus size={20} className="text-primary"/> Create Group
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateGroup}>
                <div className="form-group mb-4">
                  <label className="form-label" htmlFor="groupName">Group Name</label>
                  <input 
                    id="groupName"
                    type="text" 
                    className="form-input" 
                    placeholder="E.g., Tech Enthusiasts"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={creating || !newGroupName.trim()}>
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Groups List Column */}
        <div className="md:col-span-2">
          {error && <div className="auth-error mb-4">{error}</div>}
          
          {myGroups.length === 0 ? (
            <div className="empty-state bg-card text-center p-8 border rounded-lg">
              <Users size={48} className="text-muted mb-4 mx-auto" />
              <h3>No groups yet</h3>
              <p className="text-muted">Create a new group to start chatting!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {myGroups.map(group => (
                <div key={group.id} className="card p-0 flex flex-row items-center justify-between hover:shadow-md transition bg-background border rounded-lg overflow-hidden">
                  <div className="p-4 flex items-center gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/groups/${group.id}/chat`)}>
                    <div className="bg-primary text-white p-3 rounded-full flex items-center justify-center shadow-inner" style={{ width: '50px', height: '50px' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{group.name}</h3>
                      <p className="text-sm text-muted">Tap to open chat</p>
                    </div>
                  </div>
                  <div className="p-4 border-l bg-accent flex items-center justify-center">
                    <button 
                      className="btn btn-primary flex items-center gap-2"
                      onClick={() => navigate(`/groups/${group.id}/chat`)}
                    >
                      <MessageCircle size={18} /> Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Groups;
