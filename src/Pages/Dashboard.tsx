import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../Auth';
import { getAllTransactions } from '../services/TransactionsService';
import type { Transaction } from '../models/Transaction';
import '../assets/nasaniDashboard.css';

interface DailyFundData {
  day: number;
  label: string;
  income: number;
  expense: number;
  totalVolume: number;
}

interface TopContributor {
  name: string;
  amount: number;
  rank: number;
}

const Dashboard: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredBar, setHoveredBar] = useState<DailyFundData | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const isAdmin = auth.isAdmin();

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(auth.getCurrentUser());
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
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

  // Top thành viên đóng góp nhiều nhất
  const topContributors: TopContributor[] = useMemo(() => {
    const map = new Map<string, number>();

    // Tính tổng thu theo thành viên
    transactions
      .filter(t => t.type === 'thu' && t.status === 'completed')
      .forEach(t => {
        const name = t.personName || 'Thành viên';
        const current = map.get(name) || 0;
        map.set(name, current + (t.amount || 0));
      });

    const list: TopContributor[] = Array.from(map.entries())
      .map(([name, amount], idx) => ({ name, amount, rank: idx + 1 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Dữ liệu mẫu nếu chưa có giao dịch
    if (list.length === 0) {
      return [
        { name: 'Nguyễn Văn An', amount: 1500000, rank: 1 },
        { name: 'Trần Thị Bình', amount: 1200000, rank: 2 },
        { name: 'Lê Hoàng Long', amount: 950000, rank: 3 },
        { name: 'Phạm Minh Đức', amount: 800000, rank: 4 },
        { name: 'Vũ Quốc Bảo', amount: 650000, rank: 5 },
      ];
    }

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [transactions]);

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

        {/* Card Phải: Top thành viên đóng góp nhiều nhất */}
        <div className="nasani-card">
          <div className="nasani-card-header">
            <div>
              <h2 className="nasani-card-title">Top đóng góp quỹ nhiều nhất</h2>
              <span className="nasani-card-meta">
                Tính đến ngày {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="nasani-ip-list">
            {topContributors.map((item) => (
              <div key={item.rank} className="nasani-ip-item">
                <div className="nasani-ip-left">
                  <span className="nasani-ip-badge-pin" style={{ background: item.rank === 1 ? '#fef3c7' : '#fee2e2', borderColor: item.rank === 1 ? '#f59e0b' : '#fca5a5' }}>
                    {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `🎖️ #${item.rank}`}
                  </span>
                  <span className="nasani-ip-addr" style={{ fontFamily: 'inherit', fontWeight: 600 }}>
                    {item.name}
                  </span>
                </div>
                <span className="nasani-ip-count" style={{ color: '#16a34a' }}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
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
    </div>
  );
};

export default Dashboard;