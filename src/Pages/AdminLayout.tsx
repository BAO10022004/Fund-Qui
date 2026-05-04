import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../main';
import '../assets/adminLayout.css';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/transactions', icon: '💰', label: 'Giao dịch', description: 'Quản lý giao dịch' },
    { path: '/admin/persons', icon: '👥', label: 'Người dùng', description: 'Quản lý người' },
    { path: '/admin/action', icon: '⚡', label: 'Hoạt động', description: 'Quản lý hoạt động' },
    { path: '/admin/diary', icon: '📝', label: 'Nhật ký', description: 'Quản lý nhật ký' },
    { path: '/accounts', icon: '🔑', label: 'Tài khoản', description: 'Quản lý tài khoản' },
    { path: '/history', icon: '🕐', label: 'Lịch sử', description: 'Lịch sử thay đổi' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🛡️</div>
            {isSidebarOpen && (
              <div className="logo-text">
                <h2>Admin Panel</h2>
                <p>{auth.getUsername() || 'Quản trị'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {isSidebarOpen && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                  {isActive(item.path) && <div className="active-indicator"></div>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom actions */}
        {isSidebarOpen && (
          <div className="sidebar-footer">
            <button className="btn-back-home" onClick={() => navigate('/')}>
              🏠 Trang chủ
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="header-left">
          <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰
          </button>
          <div className="breadcrumb">
            <span className="breadcrumb-item" style={{cursor:'pointer'}} onClick={() => navigate('/')}>🏠 Trang chủ</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {menuItems.find(item => isActive(item.path))?.label || 'Admin'}
            </span>
          </div>
        </div>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default AdminLayout;