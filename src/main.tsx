// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Pages/Dashboard';
import QuyPhong from './Pages/QuyPhong';
import ManagePersons from './Pages/ManagePersons';
import AdminLayout from './Pages/AdminLayout';
import ManageTransactions from './Pages/ManageTransaction';
import ManageAccounts from './Pages/ManageAccount';
import EditAccount from './Pages/EditAccount';
import ManageAction from './Pages/ManageAction';
import { Auth } from './Auth';
import DiaryPage from './Pages/ManageDiary';
import ManageHistory from './Pages/ManageHistory';

// Global auth instance
export const auth = new Auth();

// Admin Protected Route - Chỉ admin routes mới cần đăng nhập
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = auth.isAuthenticated();

  if (!isAuthenticated) {
    // Lưu lại URL muốn truy cập để redirect sau khi login
    return <Navigate to="/" replace state={{ requireLogin: true }} />;
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
        {/* ===== PUBLIC ROUTES - Không cần đăng nhập ===== */}
        {/* Dashboard - Trang chủ công khai */}
        <Route path="/" element={<Dashboard />} />

        {/* Quỹ Phòng - Công khai */}
        <Route path="/quy-phong" element={<QuyPhong />} />

        {/* Nhật ký - Công khai
        <Route path="/diary" element={<DiaryPage />} /> */}

        {/* ===== ADMIN ROUTES - Yêu cầu đăng nhập ===== */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/persons"
          element={
            <AdminRoute>
              <ManagePersons />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/transactions"
          element={
            <AdminRoute>
              <ManageTransactions />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/action"
          element={
            <AdminRoute>
              <ManageAction />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/diary"
          element={
            <AdminRoute>
              <DiaryPage />
            </AdminRoute>
          }
        />

        <Route
          path="/history"
          element={
            <AdminRoute>
              <ManageHistory />
            </AdminRoute>
          }
        />

        <Route
          path="/accounts"
          element={
            <AdminRoute>
              <ManageAccounts />
            </AdminRoute>
          }
        />

        <Route
          path="/accounts/edit"
          element={
            <AdminRoute>
              <EditAccount />
            </AdminRoute>
          }
        />

        {/* Catch all: Redirect mọi route không tồn tại về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);