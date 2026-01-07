import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import '../assets/adminLayout.css';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    
    {
      path: '/admin/transactions',
      icon: '💰',
      label: 'Giao dịch',
      description: 'Quản lý giao dịch'
    },
    {
      path: '/admin/persons',
      icon: '👥',
      label: 'Người',
      description: 'Quản lý người'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">💼</div>
            {isSidebarOpen && (
              <div className="logo-text">
                <h2>Admin Panel</h2>
                <p>Quản trị hệ thống</p>
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
      </aside>

      {/* Main Content */}
      <main className="main-content">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-item">Admin</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item active">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </span>
            </div>
          </div>
        <div className="content-wrapper">
          <Outlet />
        </div>

        
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;