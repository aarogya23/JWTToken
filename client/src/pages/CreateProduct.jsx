import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, Image as ImageIcon } from 'lucide-react';
import api from '../api/axiosConfig';

const CreateProduct = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/api/products', {
        name,
        description,
        price: parseFloat(price),
        imageUrl
      });
      navigate('/');
    } catch (err) {
      setError('Failed to create product. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.fileUrl) {
        setImageUrl(response.data.fileUrl);
      }
    } catch (err) {
      alert('Failed to upload image. Max size is 15MB.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex justify-center mt-8 px-4">
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="card-header border-b-0 pb-2">
          <h2 className="flex items-center gap-2">
            <PackagePlus className="text-primary" size={24} />
            List a New Product
          </h2>
          <p className="text-muted mt-1">Fill out the details to sell your item.</p>
        </div>
        
        <div className="card-body">
          {error && <div className="auth-error mb-4">{error}</div>}
          
          <div className="mb-6 flex flex-col items-center">
            <div className="relative w-full" style={{ height: '200px', backgroundColor: 'var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {imageUrl ? (
                <img src={imageUrl} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                  <ImageIcon size={48} className="mb-2 opacity-50" />
                  <span>No Image Selected</span>
                </div>
              )}
            </div>
            <button 
              type="button" 
              className="btn btn-outline mt-4"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Product Image'}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Product Title <span className="text-danger">*</span></label>
              <input 
                id="name"
                type="text" 
                className="form-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Leather Jacket"
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="price">Price ($)</label>
              <input 
                id="price"
                type="number" 
                step="0.01"
                min="0"
                className="form-input" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 49.99"
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea 
                id="description"
                className="form-input" 
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item's condition, features, etc."
                required 
              ></textarea>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button 
                type="button" 
                className="btn btn-outline flex-1"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? 'Listing...' : 'List Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
