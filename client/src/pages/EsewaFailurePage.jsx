import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const EsewaFailurePage = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Payment was cancelled or failed.');

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) return;

    api.post(`/api/orders/${orderId}/cancel`)
      .then(() => setMessage('The eSewa payment was cancelled and the product has been released back to the marketplace.'))
      .catch(() => setMessage('Payment failed. If an order was created, please review it in My Orders.'));
  }, [searchParams]);

  return (
    <div className="empty-state">
      <h2>eSewa payment not completed</h2>
      <p className="text-muted mb-6">{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary">Back to Market</Link>
        <Link to="/my-orders" className="btn btn-outline">My Orders</Link>
      </div>
    </div>
  );
};

export default EsewaFailurePage;
