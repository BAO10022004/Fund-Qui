// Dashboard.tsx - Liquid Glass UI với phân tách User/Admin
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../main';
import AdminLoginModal from '../Compunents/AdminLoginModal';
import '../assets/Dashboard.css';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  gradient: string;
  description: string;
  adminOnly: boolean;
}

const ALL_MENU_ITEMS: MenuItem[] = [
  // ===== USER SECTION =====
  {
    id: 'quy-phong',
    title: 'Quỹ Phòng',
    icon: '💰',
    path: '/quy-phong',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    description: 'Xem số dư & giao dịch quỹ chung',
    adminOnly: false,
  },
  // ===== ADMIN SECTION =====
  {
    id: 'accounts',
    title: 'Tài Khoản',
    icon: '👥',
    path: '/accounts',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    description: 'Quản lý tài khoản người dùng',
    adminOnly: true,
  },
  {
    id: 'persons',
    title: 'Người Dùng',
    icon: '👤',
    path: '/admin/persons',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    description: 'Quản lý thông tin cá nhân',
    adminOnly: true,
  },
  {
    id: 'transactions',
    title: 'Giao Dịch',
    icon: '📊',
    path: '/admin/transactions',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    description: 'Xem & quản lý lịch sử giao dịch',
    adminOnly: true,
  },
  {
    id: 'diary-admin',
    title: 'Q.Lý Nhật Ký',
    icon: '📝',
    path: '/admin/diary',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    description: 'Thêm, sửa, xóa nhật ký',
    adminOnly: true,
  },
  {
    id: 'action',
    title: 'Hoạt Động',
    icon: '⚡',
    path: '/admin/action',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    description: 'Quản lý danh sách hoạt động',
    adminOnly: true,
  },
  {
    id: 'history',
    title: 'Lịch Sử',
    icon: '🕐',
    path: '/history',
    gradient: 'linear-gradient(135deg, #64748b, #475569)',
    description: 'Xem lịch sử thay đổi hệ thống',
    adminOnly: true,
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(auth.isAdmin());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiểm tra state từ AdminRoute redirect
  useEffect(() => {
    const state = location.state as { requireLogin?: boolean } | null;
    if (state?.requireLogin) {
      setShowLoginModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const userItems = ALL_MENU_ITEMS.filter(item => !item.adminOnly);
  const adminItems = ALL_MENU_ITEMS.filter(item => item.adminOnly);

  const handleNavigate = (item: MenuItem) => {
    if (item.adminOnly && !isAdmin) {
      setPendingPath(item.path);
      setShowLoginModal(true);
    } else {
      navigate(item.path);
    }
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      // Đã login: logout
      auth.logout();
      setIsAdmin(false);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdmin(auth.isAdmin());
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const handleModalClose = () => {
    setShowLoginModal(false);
    setPendingPath(null);
  };

  const currentUser = auth.getCurrentUser();

  return (
    <div className="dash-root">
      {/* ===== ANIMATED BACKGROUND ===== */}
      <div className="dash-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-orb bg-orb-4"></div>
        <div className="bg-mesh"></div>
      </div>

      {/* ===== FLOATING PARTICLES ===== */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="dash-particle"
          style={{
            left: `${(i * 8.33) % 100}%`,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${12 + (i % 5) * 3}s`,
            width: `${3 + (i % 4)}px`,
            height: `${3 + (i % 4)}px`,
          }}
        />
      ))}

      {/* ===== HEADER ===== */}
      <header className="dash-header">
        <div className="dash-header-inner">
          {/* Logo / Brand */}
          <div className="dash-brand">
            <div className="brand-icon">🏠</div>
            <div className="brand-text">
              <span className="brand-name">Quỹ Phòng</span>
              <span className="brand-sub">Hệ thống quản lý</span>
            </div>
          </div>

          {/* Clock */}
          <div className="dash-clock">
            <div className="clock-time">
              {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="clock-date">
              {time.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>

          {/* Admin Status + Button */}
          <div className="dash-admin-status">
            {isAdmin && currentUser && (
              <div className="admin-badge">
                <span className="admin-avatar">{currentUser.username.charAt(0).toUpperCase()}</span>
                <div className="admin-info">
                  <span className="admin-name">{currentUser.username}</span>
                  <span className="admin-role">⭐ Quản trị viên</span>
                </div>
              </div>
            )}
            <button
              className={`btn-admin-toggle ${isAdmin ? 'is-admin' : ''}`}
              onClick={handleAdminClick}
              id="btn-admin-toggle"
            >
              {isAdmin ? (
                <><span>🚪</span> Đăng xuất</>
              ) : (
                <><span>🔑</span> Admin</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="dash-main">

        {/* ===== WELCOME SECTION ===== */}
        <section className="dash-welcome">
          <div className="welcome-glass">
            <div className="welcome-glass-shine"></div>
            <div className="welcome-content">
              <div className="welcome-emoji">👋</div>
              <div>
                <h1 className="welcome-title">
                  {isAdmin && currentUser
                    ? `Chào, ${currentUser.username}!`
                    : 'Chào mừng đến với Quỹ Phòng!'}
                </h1>
                <p className="welcome-desc">
                  {isAdmin
                    ? 'Bạn đang truy cập với quyền quản trị viên.'
                    : 'Chọn chức năng bên dưới để bắt đầu.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== USER SECTION ===== */}
        <section className="dash-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2 className="section-title">
              <span className="section-icon">🌟</span>
              Chức năng chung
            </h2>
            <div className="section-line"></div>
          </div>
          <div className="cards-grid cards-grid-user">
            {userItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                isHovered={hoveredId === item.id}
                onHover={setHoveredId}
                onClick={handleNavigate}
                locked={false}
              />
            ))}
          </div>
        </section>

        {/* ===== ADMIN SECTION ===== */}
        <section className="dash-section dash-section-admin">
          <div className="section-header">
            <div className="section-line admin-line"></div>
            <h2 className="section-title admin-title">
              <span className="section-icon">🛡️</span>
              Khu vực Quản trị
              {!isAdmin && <span className="lock-badge">🔒</span>}
            </h2>
            <div className="section-line admin-line"></div>
          </div>

          {!isAdmin && (
            <div className="admin-locked-hint">
              <div className="hint-glass">
                <div className="hint-glass-shine"></div>
                <span>🔐</span>
                <p>Nhấn vào bất kỳ chức năng nào bên dưới để đăng nhập với tài khoản quản trị viên</p>
              </div>
            </div>
          )}

          <div className="cards-grid cards-grid-admin">
            {adminItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                isHovered={hoveredId === item.id}
                onHover={setHoveredId}
                onClick={handleNavigate}
                locked={!isAdmin}
              />
            ))}
          </div>
        </section>
      </main>

      {/* ===== ADMIN LOGIN MODAL ===== */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={handleModalClose}
        onSuccess={handleLoginSuccess}
        targetPath={pendingPath || undefined}
      />
    </div>
  );
};

// ===== MENU CARD COMPONENT =====
interface MenuCardProps {
  item: MenuItem;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (item: MenuItem) => void;
  locked: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, isHovered, onHover, onClick, locked }) => {
  return (
    <div
      className={`menu-card ${locked ? 'menu-card-locked' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={() => onClick(item)}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      id={`card-${item.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(item)}
      aria-label={`${item.title}: ${item.description}`}
    >
      {/* Glass layers */}
      <div className="card-glass-base"></div>
      <div className="card-glass-shine"></div>
      <div className="card-glass-border"></div>

      {/* Color accent blob */}
      <div
        className="card-color-blob"
        style={{ background: item.gradient }}
      ></div>

      {/* Lock indicator */}
      {locked && (
        <div className="card-lock-overlay">
          <span className="lock-icon">🔒</span>
        </div>
      )}

      {/* Card content */}
      <div className="card-content">
        <div
          className="card-icon-wrap"
          style={{ background: item.gradient }}
        >
          <span className="card-icon">{item.icon}</span>
          <div className="icon-glow" style={{ background: item.gradient }}></div>
        </div>
        <div className="card-info">
          <h3 className="card-title">{item.title}</h3>
          <p className="card-desc">{item.description}</p>
        </div>
        <div className="card-arrow">
          {locked ? '🔐' : '›'}
        </div>
      </div>

      {/* Hover ripple */}
      <div className="card-ripple"></div>
    </div>
  );
};

export default Dashboard;