import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import QuyPhong from './Pages/QuyPhong';
import ManagePersons from './Pages/ManagePersons';
import AdminLayout from './Pages/AdminLayout';
import ManageTransactions from './Pages/ManageTransaction';
import Login from './Pages/Login';

// Protected Route Component - CHỈ cho admin routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* Route mặc định - Vào Quỹ Phòng (KHÔNG cần login) */}
        <Route path="/" element={<QuyPhong />} />
        
        {/* Route login công khai */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - CHỈ ADMIN routes yêu cầu đăng nhập */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/persons" 
          element={
            <ProtectedRoute>
              <ManagePersons />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/transactions" 
          element={
            <ProtectedRoute>
              <ManageTransactions />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);