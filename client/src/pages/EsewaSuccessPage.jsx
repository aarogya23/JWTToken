import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const EsewaSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: '', order: null });

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const data = searchParams.get('data');

    if (!orderId || !data) {
      setState({ loading: false, error: 'Missing eSewa callback data.', order: null });
      return;
    }

    api.post('/api/orders/esewa/verify', { orderId: Number(orderId), data })
      .then((response) => {
        setState({ loading: false, error: '', order: response.data.order });
      })
      .catch((error) => {
        setState({
          loading: false,
          error: error.response?.data?.message || 'Failed to verify eSewa payment.',
          order: null,
        });
      });
  }, [searchParams]);

  if (state.loading) {
    return <div className="text-center mt-8">Verifying eSewa payment...</div>;
  }

  if (state.error) {
    return (
      <div className="empty-state">
        <h2>Payment verification failed</h2>
        <p className="text-muted mb-6">{state.error}</p>
        <Link to="/my-orders" className="btn btn-primary">Go to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <h2>Payment completed successfully</h2>
      <p className="text-muted mb-4">
        Your eSewa payment has been verified for order #{state.order?.id}.
      </p>
      <div className="order-chip-row mb-6">
        <span className="order-chip">{state.order?.paymentMethod?.replaceAll('_', ' ')}</span>
        <span className="order-chip">{state.order?.paymentStatus?.replaceAll('_', ' ')}</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => navigate('/my-orders')}>
          View My Orders
        </button>
        <Link to="/" className="btn btn-outline">Back to Market</Link>
      </div>
    </div>
  );
};

export default EsewaSuccessPage;
