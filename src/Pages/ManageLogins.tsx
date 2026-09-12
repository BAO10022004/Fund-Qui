import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeLoginLogs,
  deleteLoginLog,
  clearAllLoginLogs,
  toggleAccountBlock,
  type LoginLog
} from '../services/LoginService';
import { getAllAccounts } from '../services/AccountService';
import type { Account } from '../models/Account';
import '../assets/ManageLogins.css';

// Helper tính khoảng thời gian tương đối
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

// Helper lấy Icon hệ điều hành
const getOsIcon = (os: string) => {
  if (os.includes('Windows')) return '🪟';
  if (os.includes('macOS') || os.includes('iOS') || os.includes('Apple')) return '🍎';
  if (os.includes('Android')) return '🤖';
  if (os.includes('Linux')) return '🐧';
  return '💻';
};

// Helper lấy Icon trình duyệt
const getBrowserIcon = (browser: string) => {
  if (browser.includes('Chrome')) return '🌐';
  if (browser.includes('Safari')) return '🧭';
  if (browser.includes('Edge')) return '🌀';
  if (browser.includes('Firefox')) return '🦊';
  if (browser.includes('Cốc Cốc')) return '🌱';
  if (browser.includes('Opera')) return '🔴';
  return '🖥️';
};

const ManageLogins: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'accounts'>('logs');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'blocked'>('all');
  const [filterDevice, setFilterDevice] = useState<'all' | 'Desktop' | 'Mobile' | 'Tablet'>('all');

  // Lắng nghe realtime danh sách login logs
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeLoginLogs((data) => {
      setLogs(data);
      setLoading(false);
    });

    loadAccounts();

    return () => unsubscribe();
  }, []);

  const loadAccounts = async () => {
    try {
      const accList = await getAllAccounts();
      setAccounts(accList);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tài khoản:', err);
    }
  };

  // Thao tác xóa 1 log
  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi nhật ký đăng nhập này?')) {
      try {
        await deleteLoginLog(logId);
      } catch (err: any) {
        alert('❌ Không thể xóa log: ' + err.message);
      }
    }
  };

  // Thao tác dọn dẹp toàn bộ log
  const handleClearAll = async () => {
    if (window.confirm('⚠️ Cảnh báo: Thao tác này sẽ xóa toàn bộ lịch sử đăng nhập hiện có trong hệ thống. Bạn có chắc chắn không?')) {
      try {
        await clearAllLoginLogs();
        alert('✅ Đã dọn dẹp toàn bộ nhật ký đăng nhập!');
      } catch (err: any) {
        alert('❌ Lỗi khi dọn dẹp: ' + err.message);
      }
    }
  };

  // Thao tác Bật/Tắt khóa tài khoản
  const handleToggleBlock = async (account: Account) => {
    if (!account.id) return;
    const willBlock = !account.isBlocked;
    const actionText = willBlock ? 'KHÓA quyền đăng nhập' : 'MỞ KHÓA quyền đăng nhập';

    if (window.confirm(`Xác nhận ${actionText} cho tài khoản "${account.userName || account.username}"?`)) {
      try {
        await toggleAccountBlock(account.id, willBlock);
        setAccounts(prev =>
          prev.map(a => (a.id === account.id ? { ...a, isBlocked: willBlock } : a))
        );
        alert(`✅ Đã ${actionText} thành công cho tài khoản "${account.userName || account.username}"!`);
      } catch (err: any) {
        alert('❌ Thất bại: ' + err.message);
      }
    }
  };

  // Số liệu thống kê
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let todayCount = 0;
    let desktopCount = 0;
    let mobileCount = 0;

    logs.forEach(log => {
      const d = log.loginTime ? (log.loginTime as any).toDate() : null;
      if (d && d.toDateString() === todayStr) {
        todayCount++;
      }
      if (log.deviceType === 'Mobile') mobileCount++;
      else desktopCount++;
    });

    const blockedAccountsCount = accounts.filter(a => a.isBlocked).length;

    return {
      totalLogs: logs.length,
      todayLogs: todayCount,
      blockedAccounts: blockedAccountsCount,
      activeAccounts: accounts.length - blockedAccountsCount,
      desktopPercent: logs.length > 0 ? Math.round((desktopCount / logs.length) * 100) : 100,
      mobilePercent: logs.length > 0 ? Math.round((mobileCount / logs.length) * 100) : 0
    };
  }, [logs, accounts]);

  // Danh sách log sau lọc
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (log.displayName || '').toLowerCase().includes(q) ||
        (log.email || '').toLowerCase().includes(q) ||
        (log.username || '').toLowerCase().includes(q) ||
        (log.browser || '').toLowerCase().includes(q) ||
        (log.os || '').toLowerCase().includes(q);

      const matchRole = filterRole === 'all' || log.role === filterRole;
      const matchStatus = filterStatus === 'all' || log.status === filterStatus;
      const matchDevice = filterDevice === 'all' || log.deviceType === filterDevice;

      return matchSearch && matchRole && matchStatus && matchDevice;
    });
  }, [logs, searchQuery, filterRole, filterStatus, filterDevice]);

  // Danh sách account sau lọc
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (acc.userName || '').toLowerCase().includes(q) ||
        (acc.personName || '').toLowerCase().includes(q) ||
        (acc.username || '').toLowerCase().includes(q);

      const matchRole = filterRole === 'all' || acc.role === filterRole;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'blocked' && acc.isBlocked) ||
        (filterStatus === 'success' && !acc.isBlocked);

      return matchSearch && matchRole && matchStatus;
    });
  }, [accounts, searchQuery, filterRole, filterStatus]);

  return (
    <div className="manage-logins-page">
      {/* 1. Header */}
      <div className="logins-header-container">
        <div className="logins-header-title-box">
          <div className="logins-header-icon">🛡️</div>
          <div>
            <h1 className="logins-header-title">Quản Lý Đăng Nhập & An Ninh</h1>
            <p className="logins-header-subtitle">
              Giám sát phiên đăng nhập thời gian thực, thiết bị & kiểm soát khóa/mở tài khoản (Dành riêng cho Admin)
            </p>
          </div>
        </div>

        <div className="logins-header-actions">
          <button className="btn-logins-action" onClick={loadAccounts} title="Tải lại danh sách">
            <span>🔄 Làm mới</span>
          </button>
          {logs.length > 0 && (
            <button className="btn-logins-action danger" onClick={handleClearAll} title="Xóa toàn bộ lịch sử">
              <span>🗑️ Dọn dẹp log</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Thẻ số liệu thống kê */}
      <div className="logins-stats-grid">
        <div className="login-stat-card">
          <div className="stat-icon-wrap blue">📈</div>
          <div className="stat-info">
            <div className="stat-info-label">Tổng lượt đăng nhập</div>
            <div className="stat-info-value">{stats.totalLogs}</div>
            <div className="stat-info-sub">Ghi nhận trong cơ sở dữ liệu</div>
          </div>
        </div>

        <div className="login-stat-card">
          <div className="stat-icon-wrap green">⚡</div>
          <div className="stat-info">
            <div className="stat-info-label">Đăng nhập hôm nay</div>
            <div className="stat-info-value">{stats.todayLogs}</div>
            <div className="stat-info-sub">Phiên truy cập trong ngày</div>
          </div>
        </div>

        <div className="login-stat-card">
          <div className="stat-icon-wrap amber">🔒</div>
          <div className="stat-info">
            <div className="stat-info-label">Tài khoản bị khóa</div>
            <div className="stat-info-value" style={{ color: stats.blockedAccounts > 0 ? '#dc2626' : '#0f172a' }}>
              {stats.blockedAccounts}
            </div>
            <div className="stat-info-sub">{stats.activeAccounts} tài khoản đang hoạt động</div>
          </div>
        </div>

        <div className="login-stat-card">
          <div className="stat-icon-wrap purple">📱</div>
          <div className="stat-info">
            <div className="stat-info-label">Thiết bị truy cập</div>
            <div className="stat-info-value">{stats.mobilePercent}% Mobile</div>
            <div className="stat-info-sub">{stats.desktopPercent}% Desktop / Laptop</div>
          </div>
        </div>
      </div>

      {/* 3. Thanh Tab chọn chế độ */}
      <div className="logins-tabs-bar">
        <button
          className={`login-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <span>📜 Nhật ký đăng nhập</span>
          <span className="tab-badge">{logs.length}</span>
        </button>
        <button
          className={`login-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <span>🔐 Kiểm soát tài khoản</span>
          <span className="tab-badge">{accounts.length}</span>
        </button>
      </div>

      {/* 4. Thanh lọc & Tìm kiếm */}
      <div className="logins-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={activeTab === 'logs' ? 'Tìm theo tên, email, trình duyệt, OS...' : 'Tìm theo tên, username, email...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <label>Vai trò:</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="user">Thành viên (User)</option>
          </select>
        </div>

        <div className="filter-select-group">
          <label>Trạng thái:</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="success">{activeTab === 'logs' ? 'Đăng nhập thành công' : 'Đang hoạt động'}</option>
            <option value="blocked">{activeTab === 'logs' ? 'Bị chặn / Khóa' : 'Đã bị khóa'}</option>
          </select>
        </div>

        {activeTab === 'logs' && (
          <div className="filter-select-group">
            <label>Thiết bị:</label>
            <select value={filterDevice} onChange={e => setFilterDevice(e.target.value as any)}>
              <option value="all">Tất cả thiết bị</option>
              <option value="Desktop">💻 Máy tính (Desktop)</option>
              <option value="Mobile">📱 Điện thoại (Mobile)</option>
              <option value="Tablet">📟 Máy tính bảng (Tablet)</option>
            </select>
          </div>
        )}
      </div>

      {/* 5. Nội dung Bảng */}
      <div className="logins-table-card">
        {activeTab === 'logs' ? (
          /* TAB 1: NHẬT KÝ ĐĂNG NHẬP */
          <div className="logins-table-responsive">
            <table className="logins-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Thiết bị & Trình duyệt</th>
                  <th>Thời gian đăng nhập</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-logins-state">
                        <div className="empty-logins-icon">📭</div>
                        <div className="empty-logins-title">Chưa có nhật ký đăng nhập nào</div>
                        <div className="empty-logins-desc">Các phiên đăng nhập từ thành viên sẽ hiển thị tự động tại đây.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const dateObj = log.loginTime ? (log.loginTime as any).toDate() : new Date();
                    return (
                      <tr key={log.id}>
                        <td>
                          <div className="user-info-cell">
                            {log.avatar ? (
                              <img
                                src={log.avatar}
                                alt={log.displayName}
                                className="user-avatar-img"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="user-avatar-placeholder">
                                {(log.displayName || log.email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="user-names-col">
                              <span className="user-display-name">{log.displayName || log.email}</span>
                              <span className="user-email-text">{log.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {log.role === 'admin' ? (
                            <span className="badge-role-admin">👑 Admin</span>
                          ) : (
                            <span className="badge-role-user">👤 Thành viên</span>
                          )}
                        </td>

                        <td>
                          <div className="device-pill">
                            <span className="device-icon-os">{getOsIcon(log.os)}</span>
                            <div>
                              <div className="device-details-text">{log.os} • {log.deviceType}</div>
                              <div className="device-browser-sub">
                                {getBrowserIcon(log.browser)} {log.browser}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <div className="time-cell-main">{dateObj.toLocaleString('vi-VN')}</div>
                            <div className="time-cell-relative">{formatTimeAgo(dateObj)}</div>
                          </div>
                        </td>

                        <td>
                          {log.status === 'success' ? (
                            <span className="badge-status-success">✓ Thành công</span>
                          ) : (
                            <span className="badge-status-blocked" title={log.reason || 'Bị chặn'}>
                              ✕ Bị khóa ({log.reason || 'Bị chặn'})
                            </span>
                          )}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-delete-log"
                            onClick={() => log.id && handleDeleteLog(log.id)}
                            title="Xóa bản ghi này"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: KIỂM SOÁT QUYỀN ĐĂNG NHẬP TÀI KHOẢN */
          <div className="logins-table-responsive">
            <table className="logins-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Username / Email</th>
                  <th>Vai trò</th>
                  <th>Lần đăng nhập gần nhất</th>
                  <th>Trạng thái đăng nhập</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-logins-state">
                        <div className="empty-logins-icon">👥</div>
                        <div className="empty-logins-title">Không tìm thấy tài khoản phù hợp</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(acc => {
                    const lastLogin = acc.lastLoginAt ? (acc.lastLoginAt as any).toDate() : null;
                    return (
                      <tr key={acc.id}>
                        <td>
                          <div className="user-info-cell">
                            {acc.avatar ? (
                              <img src={acc.avatar} alt={acc.userName || acc.username} className="user-avatar-img" />
                            ) : (
                              <div className="user-avatar-placeholder">
                                {(acc.userName || acc.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="user-names-col">
                              <span className="user-display-name">{acc.userName || acc.personName || 'Chưa đặt tên'}</span>
                              <span className="user-email-text">{acc.codePerson || 'Chưa liên kết mã'}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{acc.username}</span>
                        </td>

                        <td>
                          {acc.role === 'admin' ? (
                            <span className="badge-role-admin">👑 Admin</span>
                          ) : (
                            <span className="badge-role-user">👤 Thành viên</span>
                          )}
                        </td>

                        <td>
                          {lastLogin ? (
                            <div>
                              <div className="time-cell-main">{lastLogin.toLocaleString('vi-VN')}</div>
                              <div className="time-cell-relative">{formatTimeAgo(lastLogin)}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>Chưa có phiên</span>
                          )}
                        </td>

                        <td>
                          {acc.isBlocked ? (
                            <span className="badge-status-blocked">🚫 Đã bị khóa</span>
                          ) : (
                            <span className="badge-status-success">✓ Đang hoạt động</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            className={`btn-toggle-block ${acc.isBlocked ? 'blocked-mode' : 'active-mode'}`}
                            onClick={() => handleToggleBlock(acc)}
                          >
                            {acc.isBlocked ? '🔓 Mở khóa' : '🔒 Khóa đăng nhập'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLogins;
