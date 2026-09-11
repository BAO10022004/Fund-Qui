import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../Auth';
import { uploadAvatarToFirebase } from '../services/ImageService';
import { findAccountByGoogleEmail, updateAccount } from '../services/AccountService';
import '../assets/nasaniLayout.css';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

interface MenuGroup {
  groupTitle: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    groupTitle: 'QUẢN LÝ QUỸ & TÀI CHÍNH',
    items: [
      { id: 'dashboard', label: 'Bảng thống kê', path: '/', icon: '📊' },
      { id: 'quy-phong', label: 'Quỹ phòng', path: '/quy-phong', icon: '💰' },
      { id: 'transactions', label: 'Quản lý giao dịch', path: '/admin/transactions', icon: '💳', adminOnly: true },
    ]
  },
  {
    groupTitle: 'QUẢN LÝ THÀNH VIÊN',
    adminOnly: true,
    items: [
      { id: 'persons', label: 'Người dùng', path: '/admin/persons', icon: '👥', adminOnly: true },
      { id: 'accounts', label: 'Tài khoản', path: '/accounts', icon: '🔑', adminOnly: true },
    ]
  },
  {
    groupTitle: 'QUẢN LÝ HOẠT ĐỘNG & NHẬT KÝ',
    items: [
      { id: 'action', label: 'Hoạt động', path: '/admin/action', icon: '⚡', adminOnly: true },
      { id: 'diary', label: 'Nhật ký chi tiêu', path: '/admin/diary', icon: '📝' },
      { id: 'history', label: 'Lịch sử thay đổi', path: '/history', icon: '🕐', adminOnly: true },
    ]
  },

];

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const isAdmin = auth.isAdmin();

  // Lắng nghe thay đổi avatar hoặc tài khoản từ bất cứ đâu trong hệ thống
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(auth.getCurrentUser());
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  const handleItemClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.path.startsWith('#')) {
      e.preventDefault();
      alert(`Tính năng "${item.label}" thuộc hệ thống quản trị Nasani.`);
    }
  };

  const handleProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const username = currentUser?.username || currentUser?.email || 'user';
      const uploadedUrl = await uploadAvatarToFirebase(file, username);

      // Cập nhật tài khoản trong Firestore nếu tìm thấy
      const acc = await findAccountByGoogleEmail(currentUser?.email || username);
      if (acc && acc.id) {
        await updateAccount(acc.id, { avatar: uploadedUrl });
      }

      // Cập nhật auth state và dispatch event
      auth.updateUser({ avatar: uploadedUrl });
      alert('✅ Đã tải lên và cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      alert(`❌ Lỗi tải avatar: ${err.message || 'Không thể nén ảnh'}`);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const displayName = currentUser?.displayName || currentUser?.personName || (isAdmin ? 'Administrator' : 'Thành viên');

  return (
    <div className="nasani-admin-wrapper">
      {/* ===== SIDEBAR ===== */}
      <aside className={`nasani-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <Link to="/" className="nasani-brand-header">
          <h1 className="nasani-brand-logo-text">NASANI</h1>
          <span className="nasani-brand-sub-text">NASANI XIN CHÀO! ⎯</span>
        </Link>

        {/* Sidebar Nav */}
        <div className="nasani-sidebar-scroll">
          {MENU_GROUPS.map((group, gIdx) => {
            if (group.adminOnly && !isAdmin) return null;

            const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;

            const filteredItems = searchQuery.trim()
              ? visibleItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
              : visibleItems;

            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="nasani-menu-group">
                <h3 className="nasani-group-title">
                  {group.groupTitle}
                </h3>
                <ul className="nasani-nav-list">
                  {filteredItems.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.path}
                          className={`nasani-nav-link ${isActive ? 'active' : ''}`}
                          onClick={(e) => handleItemClick(e, item)}
                          title={item.label}
                        >
                          <span className="nasani-nav-icon">{item.icon}</span>
                          {!collapsed && <span className="nasani-nav-label">{item.label}</span>}
                          {!collapsed && item.adminOnly && (
                            <span className="nasani-badge-role admin">Admin</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="nasani-sidebar-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#64748b' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '6px' }}></span>
          <span>Hệ thống Quỹ trực tuyến</span>
        </div>
      </aside>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="nasani-main-container">
        {/* Top Navbar */}
        <header className="nasani-top-navbar">
          {/* Left: Toggle & Greeting & Search */}
          <div className="nasani-top-left">
            <button
              className="nasani-toggle-sidebar-btn"
              onClick={() => setCollapsed(!collapsed)}
              title="Đóng / Mở menu"
            >
              ☰
            </button>

            <div className="nasani-greeting">
              <span className="moon-icon">🌙</span>
              <span>Xin chào: <strong>{displayName}</strong></span>
            </div>

            <div className="nasani-search-box">
              <span className="nasani-search-icon">🔍</span>
              <input
                type="text"
                className="nasani-search-input"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="nasani-top-right">
            <button
              className="nasani-action-icon-btn"
              title="Quỹ phòng"
              onClick={() => navigate('/quy-phong')}
            >
              💰
            </button>

            {isAdmin && (
              <button
                className="nasani-action-icon-btn"
                title="Quản lý tài khoản"
                onClick={() => navigate('/accounts')}
              >
                🔑
              </button>
            )}

            <button
              className="nasani-action-icon-btn"
              title="Thông báo hệ thống"
              onClick={() => alert('Hiện tại chưa có thông báo mới.')}
            >
              🔔
              <span className="nasani-bell-badge">0</span>
            </button>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="nasani-user-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={displayName}
                    className="nasani-user-avatar"
                  />
                ) : currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={displayName}
                    className="nasani-user-avatar"
                  />
                ) : (
                  <div className="nasani-user-avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="nasani-profile-dropdown">
                  <div className="nasani-profile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={displayName}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}
                        />
                      ) : currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={displayName}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                        />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="nasani-profile-name">{displayName}</div>
                        <div className="nasani-profile-email">
                          {currentUser?.email || currentUser?.username}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`nasani-badge-role ${isAdmin ? 'admin' : ''}`}>
                        {isAdmin ? 'Quản trị viên' : 'Thành viên Quỹ'}
                      </span>
                    </div>
                  </div>

                  {/* Tùy chọn đổi ảnh đại diện cá nhân */}
                  <label
                    className="nasani-dropdown-item"
                    style={{
                      cursor: uploadingAvatar ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#0284c7',
                      fontWeight: 600
                    }}
                  >
                    <span>📷</span>
                    <span>{uploadingAvatar ? '⚡ Đang nén & lưu avatar...' : 'Đổi ảnh đại diện'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingAvatar}
                      onChange={handleProfileAvatarUpload}
                    />
                  </label>

                  <button
                    className="nasani-dropdown-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/quy-phong');
                    }}
                  >
                    💰 Xem Quỹ phòng
                  </button>

                  {isAdmin && (
                    <button
                      className="nasani-dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/accounts');
                      }}
                    >
                      🔑 Quản lý tài khoản
                    </button>
                  )}

                  <button
                    className="nasani-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="nasani-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
