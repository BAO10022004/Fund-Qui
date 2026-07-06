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
import './style.css';

// Override global window.alert with premium liquid glass alert
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