import { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Camera, Save, Truck } from 'lucide-react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './Auth.css'; // Reuse some standard card CSS

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState({ fullName: '', bio: '', location: '', profileImage: '', deliveryPerson: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/profile');
      setProfile({
        fullName: response.data.fullName || '',
        bio: response.data.bio || '',
        location: response.data.location || '',
        profileImage: response.data.profileImage || '',
        deliveryPerson: response.data.deliveryPerson || false
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.id]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: show local preview or directly upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.fileUrl) {
        setProfile({ ...profile, profileImage: response.data.fileUrl });
      }
    } catch (err) {
      alert('Failed to upload image. Max size is 15MB.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/api/profile', profile);
      setSuccess('Profile updated successfully!');
      // Update AuthContext user if needed
      if (refreshProfile) refreshProfile(); 
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading profile...</div>;

  return (
    <div className="flex justify-center mt-8 px-4">
      <div className="card w-full" style={{ maxWidth: '600px' }}>
        <div className="card-header text-center pb-8 border-b-0">
          <div className="relative inline-block mt-4 mb-2">
            {profile.profileImage ? (
              <img 
                src={profile.profileImage} 
                alt="Profile" 
                className="rounded-full shadow-lg"
                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
              />
            ) : (
              <div className="rounded-full bg-border flex items-center justify-center shadow-lg" style={{ width: '120px', height: '120px' }}>
                <UserIcon size={60} className="text-muted" />
              </div>
            )}
            <button 
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-hover shadow"
              style={{ border: 'none' }}
              onClick={() => fileInputRef.current.click()}
              title="Change Profile Picture"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
          </div>
          <h2>My Profile</h2>
          <p className="text-muted">Manage your public information</p>
        </div>

        <div className="card-body border-t">
          {error && <div className="auth-error text-center mb-4">{error}</div>}
          {success && <div className="text-secondary font-bold text-center mb-4 bg-green-50 p-3 rounded" style={{ backgroundColor: '#ecfdf5' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input 
                id="fullName" 
                type="text" 
                className="form-input" 
                value={profile.fullName} 
                onChange={handleChange} 
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Location</label>
              <input 
                id="location" 
                type="text" 
                className="form-input" 
                value={profile.location} 
                onChange={handleChange} 
                placeholder="e.g. New York, USA"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bio">Bio</label>
              <textarea 
                id="bio" 
                className="form-input" 
                rows="4" 
                value={profile.bio} 
                onChange={handleChange} 
                placeholder="Tell others a bit about yourself"
              />
            </div>

            <div className="form-group flex items-center justify-between mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <h4 className="flex items-center gap-2 m-0 text-primary" style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                  <Truck size={20}/> Delivery Driver Enrollment
                </h4>
                <p className="text-sm text-muted m-0">
                  Enable this to instantly unlock the Delivery Dashboard, allowing you to view and accept active jobs to earn revenue.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input 
                  id="deliveryPerson"
                  type="checkbox" 
                  checked={profile.deliveryPerson} 
                  onChange={(e) => setProfile({...profile, deliveryPerson: e.target.checked})}
                  style={{ width: '28px', height: '28px', accentColor: '#4f46e5', cursor: 'pointer', margin: 0 }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
