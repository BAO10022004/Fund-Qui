// AdminLoginModal.tsx - Modal đăng nhập admin với Liquid Glass effect
import React, { useState, useEffect } from 'react';
import { getAccountByUsername } from '../services/AccountService';
import { auth } from '../main';
import type { Account } from '../models/Account';
import { logLogin } from '../services/HistoryService';
import { signInWithPopup } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../firebase';
import '../assets/AdminLoginModal.css';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetPath?: string;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      setError('');
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const email = result.user.email;

      if (!email) {
        throw new Error('Không thể lấy email từ tài khoản Google của bạn.');
      }

      // Tìm tài khoản trong database
      const account: Account | null = await getAccountByUsername(email);

      if (account) {
        if (account.role !== 'admin') {
          setError('Không có quyền truy cập!');
          setTimeout(() => setError(''), 4000);
          return;
        }
        auth.login(account.username, account.role, account.codePerson);
        logLogin(account.username);
        onSuccess();
        onClose();
      } else {
        setError('Tài khoản Google chưa được đăng ký trong hệ thống!');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show general error
        return;
      }
      setError(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Google.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`admin-modal-overlay ${isVisible ? 'visible' : ''}`}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyPress}
    >
      <div className={`admin-modal-glass ${isVisible ? 'visible' : ''}`}>
        {/* Liquid glass orbs */}
        <div className="modal-orb modal-orb-1"></div>
        <div className="modal-orb modal-orb-2"></div>

        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="Đóng">
          <span>✕</span>
        </button>

        {/* Header */}
        <div className="modal-header-section">
          <div className="modal-shield-icon">
            <span>🛡️</span>
            <div className="shield-ring"></div>
          </div>
          <h2 className="modal-title">Khu vực Quản trị</h2>
          <p className="modal-subtitle">Chỉ dành cho quản trị viên</p>
        </div>

        {/* Form */}
        <div className="modal-form">
          {/* Notice for Email Nasani */}
          <div className="modal-notice">
            <span className="modal-notice-icon">📧</span>
            <span className="modal-notice-text">
              Hệ thống đã chuyển sang chế độ đăng nhập bằng <strong>Email Nasani (Google)</strong>. Vui lòng bấm nút bên dưới để thực hiện đăng nhập.
            </span>
          </div>

          {error && (
            <div className="modal-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="button"
            className="modal-google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="loading-ring"></span>
                Đang xử lý...
              </span>
            ) : (
              <>
                <svg className="google-icon-svg" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.327 2.745 1.5 6.75l3.766 3.015z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.04 15.34c-1.073.71-2.437 1.17-4.04 1.17a6.994 6.994 0 0 1-6.734-4.91L1.5 14.614C3.327 18.62 7.336 21.36 12 21.36c2.945 0 5.618-.98 7.582-2.673l-3.542-3.346z"
                  />
                  <path
                    fill="#4285F4"
                    d="M22.545 10.227H12v3.818h6.073A5.205 5.205 0 0 1 15.82 17.51l3.541 3.345C21.436 18.964 24 15.055 24 10.227a13.3 13.3 0 0 0-.164-2H22.545z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.266 14.235A6.974 6.974 0 0 1 4.909 12c0-.79.136-1.545.357-2.235L1.5 6.75A11.964 11.964 0 0 0 0 12c0 1.92.455 3.736 1.255 5.364l4.011-3.129z"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </>
            )}
          </button>

          <p className="modal-hint">
            Nhấn <kbd>Esc</kbd> để hủy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
