import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/home/LandingPage';
import HubPage from './pages/home/HubPage';
import AuthPage from './pages/auth/AuthPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/dashboard/ProductsPage';
import CustomersPage from './pages/dashboard/CustomersPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Orders from './pages/dashboard/Orders';
import AbandonedCheckouts from './pages/dashboard/AbandonedCheckouts';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          
          <Route path="/hub" element={<ProtectedRoute><HubPage /></ProtectedRoute>} />
          
          {/* Nested Dashboard Routes with Layout */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
             <Route path="/orders" element={<Orders />} />
             <Route path="/checkouts" element={<AbandonedCheckouts />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}