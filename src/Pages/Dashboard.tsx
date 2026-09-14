import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../Auth';
import { getAllTransactions } from '../services/TransactionsService';
import type { Transaction } from '../models/Transaction';
import {
  subscribeNotifications,
  type PaymentNotification,
  approvePaymentRequest,
  rejectPaymentRequest
} from '../services/NotificationService';
import '../assets/nasaniDashboard.css';
import cuteChatbotGif from '../assets/cute_chatbot.gif';
import AnimatedCounter from '../Compunents/AnimatedCounter';

interface DailyFundData {
  day: number;
  label: string;
  income: number;
  expense: number;
  totalVolume: number;
}

const Dashboard: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredBar, setHoveredBar] = useState<DailyFundData | null>(null);

  // Thông báo mới nhất
  const [latestNotif, setLatestNotif] = useState<PaymentNotification | null>(null);
  const [processingNotifId, setProcessingNotifId] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const isAdmin = auth.isAdmin();

  // Cute chatbot greeting state
  const userName = currentUser?.name || currentUser?.displayName || 'bạn';
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const [botMessage, setBotMessage] = useState<string>(
    `Xin chào ${userName}! Chúc bạn một ngày làm việc thật vui vẻ và ngập tràn năng lượng! 💻✨`
  );

  const handleBotAction = (type: 'greet' | 'tip' | 'quote') => {
    if (type === 'greet') {
      setBotMessage(`Hê lố ${userName}! Rất vui được gặp bạn trên Quỹ Phòng! Cần gì cứ ấn các nút bên dưới nhé! 🎉`);
    } else if (type === 'tip') {
      const tips = [
        '💡 Mẹo nhỏ: Bấm "Nộp Quỹ" ở góc trên để quét mã QR chuyển khoản siêu nhanh và tiện lợi!',
        '💡 Số dư quỹ và biến động thu chi được tự động cập nhật ngay khi giao dịch hoàn tất.',
        '💡 Theo dõi biểu đồ D1 - D30 ở bên cạnh để nắm bắt dòng tiền quỹ phòng theo từng ngày!'
      ];
      setBotMessage(tips[Math.floor(Math.random() * tips.length)]);
    } else if (type === 'quote') {
      const quotes = [
        '✨ "Làm hết sức, quẩy hết mình! Quỹ rủng rỉnh, anh em đồng lòng!" 🥳🚀',
        '✨ "Mỗi đóng góp của bạn là niềm vui chung cho mọi buổi liên hoan của team!" 🍕🍻',
        '✨ "Hôm nay là một ngày tuyệt vời để hoàn thành xuất sắc mọi mục tiêu!" 🌟'
      ];
      setBotMessage(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(auth.getCurrentUser());
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  // Lắng nghe thông báo thời gian thực từ Firestore để lấy thông báo mới nhất
  useEffect(() => {
    const unsubscribe = subscribeNotifications((notifs) => {
      if (notifs && notifs.length > 0) {
        setLatestNotif(notifs[0]);
      } else {
        setLatestNotif(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Tải danh sách giao dịch từ Firestore
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await getAllTransactions();
        setTransactions(data);
      } catch (err) {
        console.error('Lỗi khi tải giao dịch quỹ:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Format tiền tệ VNĐ
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Tính số ngày trong tháng được chọn
  const daysInSelectedMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // Lọc các giao dịch theo tháng & năm được chọn
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return false;
      return tDate.getMonth() + 1 === month && tDate.getFullYear() === year;
    });
  }, [transactions, month, year]);

  // Tính toán 4 chỉ số tổng quan quỹ
  const fundStats = useMemo(() => {
    // 1. Toàn bộ quỹ tích lũy (tất cả các thời điểm)
    const allCompleted = transactions.filter(t => t.status === 'completed');
    const allIncome = allCompleted.filter(t => t.type === 'thu').reduce((sum, t) => sum + (t.amount || 0), 0);
    const allExpense = allCompleted.filter(t => t.type === 'chi').reduce((sum, t) => sum + (t.amount || 0), 0);
    const currentBalance = allIncome - allExpense;

    // 2. Thu trong tháng được chọn
    const monthIncome = monthlyTransactions
      .filter(t => t.type === 'thu' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 3. Chi trong tháng được chọn
    const monthExpense = monthlyTransactions
      .filter(t => t.type === 'chi' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 4. Các khoản chờ thu / chưa hoàn thành trong tháng
    const monthPending = monthlyTransactions
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      currentBalance,
      monthIncome,
      monthExpense,
      monthPending
    };
  }, [transactions, monthlyTransactions]);

  // Tính dữ liệu biểu đồ D1 đến D30/D31 theo từng ngày
  const dailyChartData: DailyFundData[] = useMemo(() => {
    const result: DailyFundData[] = [];

    for (let day = 1; day <= daysInSelectedMonth; day++) {
      const dayTrans = monthlyTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === day;
      });

      const income = dayTrans
        .filter(t => t.type === 'thu')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const expense = dayTrans
        .filter(t => t.type === 'chi')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      result.push({
        day,
        label: `D${day}`,
        income,
        expense,
        totalVolume: income + expense
      });
    }

    return result;
  }, [monthlyTransactions, daysInSelectedMonth]);

  // Tìm giá trị lớn nhất của cột biểu đồ để chuẩn hóa chiều cao
  const maxDailyVolume = useMemo(() => {
    const maxVal = Math.max(...dailyChartData.map(d => d.totalVolume), 0);
    return maxVal > 0 ? maxVal : 500000;
  }, [dailyChartData]);


  // Phân loại nguồn mục đích quỹ
  const fundCategories = useMemo(() => {
    return [
      { name: 'Đóng quỹ định kỳ tháng', percent: 65, color: '#10b981' },
      { name: 'Đóng góp hoạt động / Tiệc', percent: 20, color: '#3b82f6' },
      { name: 'Tài trợ / Ủng hộ đặc biệt', percent: 10, color: '#f59e0b' },
      { name: 'Khoản thu khác', percent: 5, color: '#8b5cf6' },
    ];
  }, []);

  // Trạng thái thu chi trong tháng
  const transactionStatusBreakdown = useMemo(() => {
    const totalCount = monthlyTransactions.length || 1;
    const completedCount = monthlyTransactions.filter(t => t.status === 'completed').length;
    const pendingCount = monthlyTransactions.filter(t => t.status !== 'completed').length;

    const completedPercent = Math.round((completedCount / totalCount) * 100) || (monthlyTransactions.length === 0 ? 100 : 0);
    const pendingPercent = monthlyTransactions.length > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;

    return [
      { name: 'Giao dịch đã hoàn thành', percent: completedPercent, color: '#16a34a' },
      { name: 'Giao dịch đang chờ thu/duyệt', percent: pendingPercent, color: '#ef4444' },
    ];
  }, [monthlyTransactions]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Định dạng thời gian thông báo
  const formatNotifTime = (ts: any) => {
    if (!ts) return '';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        ' ' + date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const getRelativeTime = (ts: any) => {
    if (!ts) return '';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  // Xử lý Admin Duyệt / Hủy thông báo ngay tại Bảng thống kê
  const handleApproveNotif = async (e: React.MouseEvent, notif: PaymentNotification) => {
    e.stopPropagation();
    if (!notif.id || processingNotifId) return;
    try {
      setProcessingNotifId(notif.id);
      const adminName = currentUser?.displayName || currentUser?.username || 'Admin';
      await approvePaymentRequest(notif.id, notif.transactionIds || [], adminName);
      alert(`✅ Đã DUYỆT thành công khoản đóng quỹ ${formatCurrency(notif.amount)} của ${notif.senderName}!`);
      setShowNotifModal(false);
    } catch (err: any) {
      console.error('Lỗi khi duyệt:', err);
      alert('❌ Lỗi khi duyệt: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setProcessingNotifId(null);
    }
  };

  const handleRejectNotif = async (e: React.MouseEvent, notif: PaymentNotification) => {
    e.stopPropagation();
    if (!notif.id || processingNotifId) return;
    const confirmReject = window.confirm(
      `Bạn có chắc chắn muốn HỦY yêu cầu thanh toán ${formatCurrency(notif.amount)} của ${notif.senderName} không? (Khoản tiền sẽ chuyển lại trạng thái Chưa hoàn thành)`
    );
    if (!confirmReject) return;

    try {
      setProcessingNotifId(notif.id);
      const adminName = currentUser?.displayName || currentUser?.username || 'Admin';
      await rejectPaymentRequest(notif.id, notif.transactionIds || [], adminName);
      alert(`❌ Đã HỦY yêu cầu thanh toán của ${notif.senderName}!`);
      setShowNotifModal(false);
    } catch (err: any) {
      console.error('Lỗi khi hủy:', err);
      alert('❌ Lỗi khi hủy: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setProcessingNotifId(null);
    }
  };

  return (
    <div className="nasani-dashboard">
      {/* Banner tổng quan số dư Quỹ */}
      <div className="nasani-fund-banner">
        <div className="nasani-fund-info">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName || currentUser.username || ''}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid #10b981',
                boxShadow: '0 3px 10px rgba(16,185,129,0.3)',
                flexShrink: 0
              }}
            />
          ) : currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || currentUser.username || ''}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white',
                boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                flexShrink: 0
              }}
            />
          ) : (
            <span className="nasani-fund-icon">🏛️</span>
          )}
          <div>
            <div className="nasani-fund-title">
              Tổng Quỹ Phòng Nasani: {loading ? 'Đang tải...' : formatCurrency(fundStats.currentBalance)}
            </div>
            <div className="nasani-fund-sub">
              Tài khoản: <strong>{currentUser?.displayName || currentUser?.username}</strong> — Vai trò:{' '}
              <strong style={{ color: isAdmin ? '#dc2626' : '#0284c7' }}>
                {isAdmin ? '👑 Quản trị viên (Admin)' : '👤 Thành viên (User)'}
              </strong>
            </div>
          </div>
        </div>

        <Link to="/quy-phong" className="nasani-fund-btn">
          <span>Xem chi tiết sổ quỹ</span>
          <span>→</span>
        </Link>
      </div>

      {/* 1 Dòng thông báo mới nhất */}
      <div
        className={`nasani-latest-notif-bar ${latestNotif ? `status-${latestNotif.status}` : 'status-empty'
          }`}
        onClick={() => latestNotif && setShowNotifModal(true)}
        title={latestNotif ? 'Nhấn để xem chi tiết thông báo' : undefined}
      >
        <div className="notif-bar-left">
          <div className="notif-bar-badge">
            <span className="notif-bar-pulse-dot"></span>
            <span className="notif-bar-icon">🔔</span>
            <span className="notif-bar-badge-text">Thông báo mới nhất</span>
          </div>

          <div className="notif-bar-divider"></div>

          {latestNotif ? (
            <div className="notif-bar-content">
              {latestNotif.status === 'waiting' && (
                <span className="notif-badge-status waiting">🕒 Chờ duyệt</span>
              )}
              {latestNotif.status === 'approved' && (
                <span className="notif-badge-status approved">✅ Đã duyệt</span>
              )}
              {latestNotif.status === 'rejected' && (
                <span className="notif-badge-status rejected">❌ Đã từ chối</span>
              )}

              <span className="notif-bar-message">
                <strong>{latestNotif.senderName}</strong>
                {latestNotif.senderCode ? ` (${latestNotif.senderCode})` : ''}:{' '}
                {latestNotif.status === 'waiting' ? 'gửi yêu cầu đóng quỹ ' : 'khoản đóng quỹ '}
                <span className="notif-bar-amount">+{formatCurrency(latestNotif.amount)}</span>
                {latestNotif.description ? ` — "${latestNotif.description}"` : ''}
              </span>

              <span className="notif-bar-time" title={formatNotifTime(latestNotif.createdAt)}>
                • {getRelativeTime(latestNotif.createdAt)}
              </span>
            </div>
          ) : (
            <div className="notif-bar-content notif-bar-empty">
              <span>Hệ thống chưa có thông báo mới nào.</span>
            </div>
          )}
        </div>

        <div className="notif-bar-right" onClick={(e) => e.stopPropagation()}>
          {latestNotif && latestNotif.status === 'waiting' && isAdmin && (
            <div className="notif-bar-admin-actions">
              <button
                className="btn-notif-bar-approve"
                onClick={(e) => handleApproveNotif(e, latestNotif)}
                disabled={processingNotifId === latestNotif.id}
                title="Duyệt nhanh yêu cầu"
              >
                {processingNotifId === latestNotif.id ? '⏳' : '✅ Duyệt'}
              </button>
              <button
                className="btn-notif-bar-reject"
                onClick={(e) => handleRejectNotif(e, latestNotif)}
                disabled={processingNotifId === latestNotif.id}
                title="Hủy/Từ chối yêu cầu"
              >
                ❌ Từ chối
              </button>
            </div>
          )}

          {latestNotif && (
            <button
              className="btn-notif-bar-detail"
              onClick={() => setShowNotifModal(true)}
              title="Xem chi tiết"
            >
              Chi tiết →
            </button>
          )}
        </div>
      </div>

      {/* Hàng chính: Thống kê tổng quan Quỹ (Trái) & Top đóng góp (Phải) */}
      <div className="nasani-dash-grid-top">
        {/* Card Trái: Biểu đồ và 4 thẻ chỉ số Quỹ */}
        <div className="nasani-card">
          <div className="nasani-card-header">
            <h2 className="nasani-card-title">Tổng quan Quỹ Phòng</h2>
            <span className="nasani-card-meta">
              Tháng {month.toString().padStart(2, '0')}/{year}
            </span>
          </div>

          {/* 4 Thẻ chỉ số tài chính của Quỹ */}
          <div className="nasani-stats-row">
            <div className="nasani-stat-box">
              <div className="nasani-stat-circle pink">💰</div>
              <div className="nasani-stat-info">
                <span className="nasani-stat-val" style={{ color: fundStats.currentBalance >= 0 ? '#16a34a' : '#dc2626' }}>
                  {formatCurrency(fundStats.currentBalance)}
                </span>
                <span className="nasani-stat-lbl">Số dư hiện tại</span>
              </div>
            </div>

            <div className="nasani-stat-box">
              <div className="nasani-stat-circle cyan">📈</div>
              <div className="nasani-stat-info">
                <span className="nasani-stat-val" style={{ color: '#0284c7' }}>
                  {formatCurrency(fundStats.monthIncome)}
                </span>
                <span className="nasani-stat-lbl">Tổng thu tháng {month}</span>
              </div>
            </div>

            <div className="nasani-stat-box">
              <div className="nasani-stat-circle coral">📉</div>
              <div className="nasani-stat-info">
                <span className="nasani-stat-val" style={{ color: '#f43f5e' }}>
                  {formatCurrency(fundStats.monthExpense)}
                </span>
                <span className="nasani-stat-lbl">Tổng chi tháng {month}</span>
              </div>
            </div>

            <div className="nasani-stat-box">
              <div className="nasani-stat-circle green">⏳</div>
              <div className="nasani-stat-info">
                <span className="nasani-stat-val" style={{ color: '#ca8a04' }}>
                  {formatCurrency(fundStats.monthPending)}
                </span>
                <span className="nasani-stat-lbl">Chờ thu tháng {month}</span>
              </div>
            </div>
          </div>

          {/* Bộ lọc Tháng & Năm */}
          <form className="nasani-filter-bar" onSubmit={handleFilterSubmit}>
            <select
              className="nasani-input-filter"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              title="Chọn tháng"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>

            <select
              className="nasani-input-filter"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              title="Chọn năm"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>

            <button type="submit" className="nasani-btn-submit-filter">
              Thống kê
            </button>
          </form>

          {/* Biểu đồ hoạt động thu chi theo ngày (D1 - D30) */}
          <div className="nasani-chart-container">
            {/* Đường lưới ngang */}
            <div className="nasani-chart-grid-line" style={{ top: '0%' }}></div>
            <div className="nasani-chart-grid-line" style={{ top: '25%' }}></div>
            <div className="nasani-chart-grid-line" style={{ top: '50%' }}></div>
            <div className="nasani-chart-grid-line" style={{ top: '75%' }}></div>

            {/* Trục Tung (Y-Axis) */}
            <div className="nasani-chart-axis-y">
              <span>{Math.round(maxDailyVolume / 1000)}k</span>
              <span>{Math.round((maxDailyVolume * 0.75) / 1000)}k</span>
              <span>{Math.round((maxDailyVolume * 0.5) / 1000)}k</span>
              <span>{Math.round((maxDailyVolume * 0.25) / 1000)}k</span>
              <span>0</span>
            </div>

            {/* Cột các ngày */}
            <div className="nasani-chart-bars-wrap">
              {dailyChartData.map((d) => {
                const heightPercent = (d.totalVolume / maxDailyVolume) * 100;
                return (
                  <div
                    key={d.day}
                    className="nasani-bar-col"
                    onMouseEnter={() => setHoveredBar(d)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {hoveredBar?.day === d.day && (
                      <div className="nasani-bar-tooltip">
                        <strong>Ngày {d.label}</strong>:
                        {d.income > 0 && <div>Thu: +{formatCurrency(d.income)}</div>}
                        {d.expense > 0 && <div>Chi: -{formatCurrency(d.expense)}</div>}
                        {d.income === 0 && d.expense === 0 && <div>Không có giao dịch</div>}
                      </div>
                    )}
                    <div
                      className="nasani-bar-pill"
                      style={{
                        height: `${Math.max(heightPercent, 3)}%`,
                        backgroundColor: d.income > 0 ? '#e86161' : d.expense > 0 ? '#f59e0b' : '#e5e7eb'
                      }}
                    ></div>
                    <span className="nasani-bar-lbl">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Phải: Cute chatbot greeting people with computer */}
        <div className="nasani-card nasani-chatbot-card">
          <div className="nasani-chatbot-card-header">
            <div className="nasani-chatbot-title-group">
              <span className="nasani-chatbot-badge">🤖 Trợ lý ảo</span>
              <span className="nasani-chatbot-name">Fund-Qui Bot</span>
            </div>
            <span className="nasani-bot-status-tag">
              <span className="nasani-bot-status-dot"></span> Online
            </span>
          </div>

          <div className="nasani-chatbot-content">
            <div className="nasani-chatbot-img-wrap">
              <div className="nasani-chatbot-showcase">
                <img
                  src={cuteChatbotGif}
                  alt="Cute chatbot greeting people with computer"
                  className="nasani-chatbot-gif"
                  width="129"
                  height="150"
                />
              </div>
            </div>

            {/* Khung lời chào tương tác / Speech bubble */}
            <div className="nasani-chatbot-bubble">
              <div className="nasani-chatbot-bubble-tag">
                <span>💬 {timeGreeting}!</span>
              </div>
              <p className="nasani-chatbot-speech-text">
                {botMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hàng Dưới: 2 Card Phân loại Quỹ & Trạng thái */}
      <div className="nasani-dash-grid-bottom">
        {/* Card: Phân loại cơ cấu Quỹ */}
        <div className="nasani-card">
          <div className="nasani-card-header">
            <div>
              <h2 className="nasani-card-title">Cơ cấu nguồn thu Quỹ</h2>
              <span className="nasani-card-meta">Theo tỷ lệ phân bổ tháng {month}</span>
            </div>
          </div>

          <div className="nasani-metric-progress-list">
            {fundCategories.map((c, idx) => (
              <div key={idx} className="nasani-metric-row">
                <div className="nasani-metric-header">
                  <span>{c.name}</span>
                  <strong>{c.percent}%</strong>
                </div>
                <div className="nasani-metric-track">
                  <div
                    className="nasani-metric-fill"
                    style={{ width: `${c.percent}%`, backgroundColor: c.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Trạng thái giao dịch Quỹ */}
        <div className="nasani-card">
          <div className="nasani-card-header">
            <div>
              <h2 className="nasani-card-title">Tình trạng nộp quỹ</h2>
              <span className="nasani-card-meta">Tiến độ thu nộp tháng {month}</span>
            </div>
          </div>

          <div className="nasani-metric-progress-list">
            {transactionStatusBreakdown.map((item, idx) => (
              <div key={idx} className="nasani-metric-row">
                <div className="nasani-metric-header">
                  <span>{item.name}</span>
                  <strong>{item.percent}%</strong>
                </div>
                <div className="nasani-metric-track">
                  <div
                    className="nasani-metric-fill"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal chi tiết thông báo */}
      {
        showNotifModal && latestNotif && (
          <div className="nasani-notif-modal-overlay" onClick={() => setShowNotifModal(false)}>
            <div className="nasani-notif-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="nasani-notif-modal-header">
                <div className="nasani-notif-modal-title">
                  <span>🔔 Chi tiết thông báo</span>
                  {latestNotif.status === 'waiting' && (
                    <span className="notif-badge-status waiting">🕒 Chờ duyệt</span>
                  )}
                  {latestNotif.status === 'approved' && (
                    <span className="notif-badge-status approved">✅ Đã duyệt</span>
                  )}
                  {latestNotif.status === 'rejected' && (
                    <span className="notif-badge-status rejected">❌ Đã từ chối</span>
                  )}
                </div>
                <button
                  className="nasani-notif-modal-close"
                  onClick={() => setShowNotifModal(false)}
                  title="Đóng"
                >
                  ✕
                </button>
              </div>

              <div className="nasani-notif-modal-body">
                <div className="notif-detail-grid">
                  <div className="notif-detail-item">
                    <span className="notif-detail-label">Người gửi:</span>
                    <span className="notif-detail-val">
                      <strong>{latestNotif.senderName}</strong>
                      {latestNotif.senderCode && ` (${latestNotif.senderCode})`}
                    </span>
                  </div>

                  <div className="notif-detail-item">
                    <span className="notif-detail-label">Số tiền:</span>
                    <span className="notif-detail-val notif-detail-amount">
                      +{formatCurrency(latestNotif.amount)}
                    </span>
                  </div>

                  <div className="notif-detail-item">
                    <span className="notif-detail-label">Nội dung:</span>
                    <span className="notif-detail-val">{latestNotif.description || 'Đóng quỹ phòng'}</span>
                  </div>

                  <div className="notif-detail-item">
                    <span className="notif-detail-label">Thời gian tạo:</span>
                    <span className="notif-detail-val">{formatNotifTime(latestNotif.createdAt)}</span>
                  </div>

                  {latestNotif.reviewedBy && (
                    <div className="notif-detail-item">
                      <span className="notif-detail-label">Người xử lý:</span>
                      <span className="notif-detail-val">
                        {latestNotif.reviewedBy}{' '}
                        {latestNotif.reviewedAt && `(${formatNotifTime(latestNotif.reviewedAt)})`}
                      </span>
                    </div>
                  )}

                  {latestNotif.transactionIds && latestNotif.transactionIds.length > 0 && (
                    <div className="notif-detail-item">
                      <span className="notif-detail-label">Mã giao dịch:</span>
                      <span className="notif-detail-val code">
                        {latestNotif.transactionIds.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="nasani-notif-modal-footer">
                {latestNotif.status === 'waiting' && isAdmin && (
                  <div className="notif-modal-admin-actions">
                    <button
                      className="btn-notif-bar-approve"
                      onClick={(e) => handleApproveNotif(e, latestNotif)}
                      disabled={processingNotifId === latestNotif.id}
                    >
                      {processingNotifId === latestNotif.id ? '⏳ Đang xử lý...' : '✅ Duyệt yêu cầu'}
                    </button>
                    <button
                      className="btn-notif-bar-reject"
                      onClick={(e) => handleRejectNotif(e, latestNotif)}
                      disabled={processingNotifId === latestNotif.id}
                    >
                      ❌ Từ chối
                    </button>
                  </div>
                )}
                <button
                  className="btn-notif-modal-close"
                  onClick={() => setShowNotifModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Dashboard;