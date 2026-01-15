import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateAccount } from '../services/AccountService';
import { auth } from '../main'; // ✅ Import auth từ main.tsx
import type { Account } from '../models/Account';
import '../assets/Login.css';
import {logLogin} from '../services/HistoryService';
const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Kiểm tra nếu đã đăng nhập thì redirect (dùng auth)
  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async () => {
    // Validate input
    if (!username.trim()) {
      setError('❌ Vui lòng nhập tài khoản!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!password.trim()) {
      setError('❌ Vui lòng nhập mật khẩu!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Xác thực với Firebase
      const account: Account | null = await authenticateAccount(username, password);

      if (account) {
          auth.login(
          account.username,
          account.role,
          account.codePerson,
        );
        console.log('Login successful:', auth.getState());
        logLogin(account.username);
        navigate('/');
      } else {
        setError('❌ Tài khoản hoặc mật khẩu không đúng!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('❌ Có lỗi xảy ra! Vui lòng thử lại.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Boxes */}
      <div className="bg-box bg-box-1"></div>
      <div className="bg-box bg-box-2"></div>
      <div className="bg-box bg-box-3"></div>
      <div className="bg-box bg-box-4"></div>

      {/* Login Box */}
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h1 className="login-title">Đăng nhập</h1>
          <p className="login-subtitle">Vui lòng nhập thông tin tài khoản</p>
        </div>

        {/* Username Input */}
        <div className="form-group">
          <label className="form-label">👤 Tài khoản</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nhập tài khoản..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoComplete="username"
          />
        </div>

        {/* Password Input */}
        <div className="form-group">
          <label className="form-label">🔒 Mật khẩu</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input password-input"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>

        {/* Forgot Password */}
        <div className="forgot-password">
          <span onClick={() => !loading && alert('Vui lòng liên hệ admin để lấy lại mật khẩu!')}>
            Quên mật khẩu?
          </span>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="login-loading-overlay">
          <div className="login-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Login;