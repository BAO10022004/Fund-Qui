// AdminLoginModal.tsx - Modal đăng nhập admin với Liquid Glass effect
import React, { useState, useEffect } from 'react';
import { authenticateAccount } from '../services/AccountService';
import { auth } from '../main';
import type { Account } from '../models/Account';
import { logLogin } from '../services/HistoryService';
import '../assets/AdminLoginModal.css';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetPath?: string;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      setUsername('');
      setPassword('');
      setError('');
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Vui lòng nhập tài khoản!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const account: Account | null = await authenticateAccount(username, password);

      if (account) {
        if (account.role !== 'admin') {
          setError('Tài khoản không có quyền quản trị!');
          setTimeout(() => setError(''), 3000);
          return;
        }
        auth.login(account.username, account.role, account.codePerson);
        logLogin(account.username);
        onSuccess();
        onClose();
      } else {
        setError('Tài khoản hoặc mật khẩu không đúng!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Có lỗi xảy ra! Vui lòng thử lại.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleLogin();
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
          <div className="modal-input-group">
            <label className="modal-label">
              <span className="label-icon">👤</span>
              Tài khoản
            </label>
            <div className="modal-input-wrapper">
              <input
                id="admin-username"
                type="text"
                className="modal-input"
                placeholder="Nhập tên tài khoản..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
              <div className="input-glass-shine"></div>
            </div>
          </div>

          <div className="modal-input-group">
            <label className="modal-label">
              <span className="label-icon">🔒</span>
              Mật khẩu
            </label>
            <div className="modal-input-wrapper password-wrapper-modal">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="modal-input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="modal-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <div className="input-glass-shine"></div>
            </div>
          </div>

          {error && (
            <div className="modal-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            className="modal-login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="loading-ring"></span>
                Đang xác thực...
              </span>
            ) : (
              <span>🔓 Đăng nhập quản trị</span>
            )}
          </button>

          <p className="modal-hint">
            Nhấn <kbd>Enter</kbd> để đăng nhập, <kbd>Esc</kbd> để hủy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
