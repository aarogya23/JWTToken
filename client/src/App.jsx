import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProduct from './pages/CreateProduct';
import ProductDetails from './pages/ProductDetails';
import MyProducts from './pages/MyProducts';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import GroupChat from './pages/GroupChat';
import DeliveryDashboard from './pages/DeliveryDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<Navigate to="/" replace />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
        <Route path="/create-product" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
        <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/delivery-jobs" element={<ProtectedRoute><DeliveryDashboard /></ProtectedRoute>} />

        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/groups/:id/chat" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
