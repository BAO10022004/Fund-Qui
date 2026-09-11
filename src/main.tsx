// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './Pages/Dashboard';
import QuyPhong from './Pages/QuyPhong';
import ManagePersons from './Pages/ManagePersons';
import ManageTransactions from './Pages/ManageTransaction';
import ManageAccounts from './Pages/ManageAccount';
import EditAccount from './Pages/EditAccount';
import ManageAction from './Pages/ManageAction';
import DiaryPage from './Pages/ManageDiary';
import ManageHistory from './Pages/ManageHistory';
import Login from './Pages/Login';
import AppLayout from './Compunents/AppLayout';
import { auth } from './Auth';
export { auth } from './Auth';
import './style.css';

// Override global window.alert with liquid glass alert
const customAlert = (message: string) => {
  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';

  const box = document.createElement('div');
  box.className = 'custom-alert-box';

  let emoji = 'ℹ️';
  let cleanMessage = message;

  if (message.includes('✅') || message.includes('thành công')) {
    emoji = '🎉';
    cleanMessage = message.replace('✅', '').trim();
  } else if (message.includes('❌') || message.includes('lỗi') || message.includes('Không thể')) {
    emoji = '💥';
    cleanMessage = message.replace('❌', '').trim();
  } else if (message.includes('⚠️') || message.includes('Cảnh báo') || message.includes('Vui lòng')) {
    emoji = '⚠️';
    cleanMessage = message.replace('⚠️', '').trim();
  } else if (message.includes('⏳') || message.includes('⏰') || message.includes('Đang')) {
    emoji = '⏳';
    cleanMessage = message.replace(/[⏳⏰]/g, '').trim();
  }

  box.innerHTML = `
    <div class="custom-alert-icon">${emoji}</div>
    <div class="custom-alert-message">${cleanMessage}</div>
    <button class="custom-alert-btn">Đồng ý</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const btn = box.querySelector('.custom-alert-btn') as HTMLButtonElement;
  btn?.focus();

  const closeAlert = () => {
    overlay.classList.add('fade-out');
    box.classList.add('scale-down');
    setTimeout(() => {
      overlay.remove();
    }, 250);
  };

  btn.addEventListener('click', closeAlert);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAlert();
  });

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      closeAlert();
      window.removeEventListener('keydown', handleKey);
    }
  };
  window.addEventListener('keydown', handleKey);
};

const customConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';

    const box = document.createElement('div');
    box.className = 'custom-alert-box';

    let emoji = '❓';
    let cleanMessage = message;

    if (message.includes('Cảnh báo') || message.includes('⚠️')) {
      emoji = '⚠️';
      cleanMessage = message.replace('⚠️', '').trim();
    }

    box.innerHTML = `
      <div class="custom-alert-icon">${emoji}</div>
      <div class="custom-alert-message">${cleanMessage.replace(/\n/g, '<br/>')}</div>
      <div class="custom-confirm-btn-group">
        <button class="custom-confirm-btn-cancel">Hủy</button>
        <button class="custom-confirm-btn-ok">Xác nhận</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const okBtn = box.querySelector('.custom-confirm-btn-ok') as HTMLButtonElement;
    const cancelBtn = box.querySelector('.custom-confirm-btn-cancel') as HTMLButtonElement;
    okBtn?.focus();

    const closeConfirm = (result: boolean) => {
      overlay.classList.add('fade-out');
      box.classList.add('scale-down');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 250);
    };

    okBtn.addEventListener('click', () => closeConfirm(true));
    cancelBtn.addEventListener('click', () => closeConfirm(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeConfirm(false);
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeConfirm(false);
        window.removeEventListener('keydown', handleKey);
      }
    };
    window.addEventListener('keydown', handleKey);
  });
};

if (typeof window !== 'undefined') {
  window.alert = customAlert;
  (window as any).customConfirm = customConfirm;
}

// Bắt buộc phải đăng nhập (mọi người dùng khi vào trang đều phải qua bước này)
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

// Route chỉ dành cho quản trị viên (Admin-only)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!auth.isAdmin()) {
    alert('⚠️ Bạn không có quyền truy cập vào chức năng quản trị này!');
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Route trang đăng nhập công khai (nếu đã đăng nhập rồi thì vào thẳng Dashboard)
const PublicLoginRoute = () => {
  if (auth.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* Route Đăng nhập */}
        <Route path="/login" element={<PublicLoginRoute />} />

        {/* Mọi route chính đều được bảo vệ và nằm trong AppLayout chuẩn Nasani */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Dashboard chính - Trang chủ sau khi đăng nhập */}
          <Route index element={<Dashboard />} />

          {/* Quỹ Phòng - Thành viên & Admin đều xem được */}
          <Route path="quy-phong" element={<QuyPhong />} />

          {/* Nhật ký chi tiêu */}
          <Route path="admin/diary" element={<DiaryPage />} />

          {/* ===== Các chức năng CHỈ ADMIN mới được truy cập ===== */}
          <Route
            path="admin/transactions"
            element={
              <AdminRoute>
                <ManageTransactions />
              </AdminRoute>
            }
          />

          <Route
            path="admin/persons"
            element={
              <AdminRoute>
                <ManagePersons />
              </AdminRoute>
            }
          />

          <Route
            path="admin/action"
            element={
              <AdminRoute>
                <ManageAction />
              </AdminRoute>
            }
          />

          <Route
            path="admin"
            element={<Navigate to="/admin/transactions" replace />}
          />

          <Route
            path="accounts"
            element={
              <AdminRoute>
                <ManageAccounts />
              </AdminRoute>
            }
          />

          <Route
            path="accounts/edit"
            element={
              <AdminRoute>
                <EditAccount />
              </AdminRoute>
            }
          />

          <Route
            path="history"
            element={
              <AdminRoute>
                <ManageHistory />
              </AdminRoute>
            }
          />
        </Route>

        {/* Catch all: Redirect về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);