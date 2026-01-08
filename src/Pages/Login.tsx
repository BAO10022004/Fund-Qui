import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Kiểm tra nếu đã đăng nhập thì redirect
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = () => {
    if (username === 'admin' && password === '123') {
      // Lưu trạng thái đăng nhập
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', username);
      
      // Chuyển hướng đến trang admin (với HashRouter)
      navigate('/admin');
    } else {
      setError('❌ Tài khoản hoặc mật khẩu không đúng!');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Boxes */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '400px',
        height: '400px',
        border: '3px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50px',
        animation: 'rotate 20s linear infinite',
        zIndex: 0
      }}></div>

      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '40px',
        animation: 'rotateReverse 15s linear infinite',
        zIndex: 0
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '500px',
        height: '500px',
        border: '3px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '60px',
        animation: 'rotate 25s linear infinite',
        zIndex: 0
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '350px',
        height: '350px',
        border: '3px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '45px',
        animation: 'rotateReverse 18s linear infinite',
        zIndex: 0
      }}></div>

      {/* Login Box */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeInUp 0.8s ease-out'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px',
            animation: 'float 3s ease-in-out infinite'
          }}>🔐</div>
          <h1 style={{
            fontSize: '32px',
            color: 'white',
            fontWeight: '800',
            marginBottom: '8px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>Đăng nhập</h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px'
          }}>Vui lòng nhập thông tin tài khoản</p>
        </div>

        {/* Username Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}>👤 Tài khoản</label>
          <input
            type="text"
            placeholder="Nhập tài khoản..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              fontSize: '15px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              outline: 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateY(0)';
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}>🔒 Mật khẩu</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                width: '100%',
                padding: '14px 50px 14px 18px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                fontSize: '15px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(0)';
              }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
            animation: 'shake 0.5s ease',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
          }}>
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#667eea',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            marginBottom: '20px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.background = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
          }}
        >
          Đăng nhập
        </button>

        {/* Forgot Password */}
        <div style={{ textAlign: 'center' }}>
          <span
            onClick={() => alert('Vui lòng liên hệ admin để lấy lại mật khẩu!')}
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
          >
            Quên mật khẩu?
          </span>
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotateReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.15) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        @media (max-width: 768px) {
          div[style*="400px"] {
            width: 250px !important;
            height: 250px !important;
          }
          div[style*="300px"] {
            width: 200px !important;
            height: 200px !important;
          }
          div[style*="500px"] {
            width: 300px !important;
            height: 300px !important;
          }
          div[style*="350px"] {
            width: 220px !important;
            height: 220px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;