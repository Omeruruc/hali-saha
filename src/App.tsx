import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import FieldsList from './pages/fields/FieldsList';
import FieldDetail from './pages/fields/FieldDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AddField from './pages/admin/AddField';
import CustomerDashboard from './pages/customer/Dashboard';
import { useAuth } from './contexts/AuthContext';
import EditField from './pages/admin/EditField';
import FieldAvailability from './pages/admin/FieldAvailability';

// Rol tabanlı erişim koruması için özel bileşen
type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRole: 'admin' | 'customer' | null;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }
  
  if (!user || userRole !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  
  return <Fragment>{children}</Fragment>;
};

function AppRoutes() {
  const { user, userRole } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Müşteri Rotaları */}
      <Route path="/customer/dashboard" element={
        <ProtectedRoute allowedRole="customer">
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/fields" element={<FieldsList />} />
      <Route path="/fields/:id" element={<FieldDetail />} />
      
      {/* Halısaha Sahibi Rotaları */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/fields/new" element={
        <ProtectedRoute allowedRole="admin">
          <AddField />
        </ProtectedRoute>
      } />
      <Route path="/admin/fields/:id/edit" element={
        <ProtectedRoute allowedRole="admin">
          <EditField />
        </ProtectedRoute>
      } />
      <Route path="/admin/fields/:id/availability" element={
        <ProtectedRoute allowedRole="admin">
          <FieldAvailability />
        </ProtectedRoute>
      } />
      
      {/* Giriş sonrası otomatik yönlendirme */}
      <Route path="/dashboard" element={
        user ? (
          userRole === 'admin' ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <Navigate to="/customer/dashboard" replace />
        ) : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;