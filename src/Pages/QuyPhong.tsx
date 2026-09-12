import React, { useState, useEffect } from 'react';
import '../assets/QuyPhong.css';
import '../assets/header.css';
import Fillter from '../Compunents/Fillter';
import Loader from '../Compunents/Loading';
import GripData from '../Compunents/GridData';
import LoadingSpinner from '../Compunents/LoadingSpinner';
import PaymentModal from '../Compunents/PaymentModal';
import { auth } from '../Auth';
import { getAllPersons } from '../services/PersonService';
import { getAllAccounts } from '../services/AccountService';
import type { Person } from '../models/Person';
import type { Account } from '../models/Account';
import type { Transaction } from '../models/Transaction';
import { getAllTransactions } from '../services/TransactionsService';

const QuyPhong: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());

  const [personFilter, setPersonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadInitialData();
    const handleAuth = () => setCurrentUser(auth.getCurrentUser());
    window.addEventListener('auth_state_changed', handleAuth);
    return () => window.removeEventListener('auth_state_changed', handleAuth);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [personsData, transactionsData, accountsData] = await Promise.all([
        getAllPersons(),
        getAllTransactions(),
        getAllAccounts().catch(err => {
          console.warn('Lỗi khi tải accounts:', err);
          return [] as Account[];
        })
      ]);
      setPersons(personsData);
      setTransactions(transactionsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      alert('Không thể tải dữ liệu từ Firebase. Vui lòng kiểm tra kết nối!');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN').format(amount) + '\u00A0đ';

  const getFilteredTransactions = (): Transaction[] => {
    let filtered = [...transactions];
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return transDate >= start && transDate <= end;
      });
    }
    if (personFilter !== 'all') filtered = filtered.filter(t => t.personId === personFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.personName.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateStats = () => {
    const completed = transactions.filter(t => t.status === 'completed');
    const income = completed.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
    const expense = completed.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter(t => t.type === 'thu' && t.status !== 'completed').reduce((s, t) => s + t.amount, 0);
    return { currentFund: income - expense, pendingFund: pending, totalIncome: income, totalExpense: expense };
  };

  const stats = calculateStats();
  const filteredTransactions = getFilteredTransactions();

  // Tìm thành viên tương ứng với tài khoản đăng nhập (chỉ cho phép đóng tiền của bản thân)
  const loggedInPerson = persons.find(
    p =>
      (p.code && currentUser?.codePerson && p.code === currentUser.codePerson) ||
      (p.name && (p.name === currentUser?.personName || p.name === currentUser?.displayName))
  );

  // Các khoản nợ chưa hoàn thành hoặc chờ xác nhận của riêng tài khoản đang đăng nhập
  const userPendingTransactions = transactions.filter(t => {
    const isUncompletedThu = t.type === 'thu' && t.status !== 'completed';
    if (!isUncompletedThu) return false;
    const matchId = loggedInPerson?.id && t.personId === loggedInPerson.id;
    const matchName =
      (loggedInPerson?.name && t.personName === loggedInPerson.name) ||
      (currentUser?.personName && t.personName === currentUser.personName);
    return matchId || matchName;
  });

  const userPendingTotal = userPendingTransactions.reduce((s, t) => s + (t.amount || 0), 0);

  if (loading && transactions.length === 0) return <Loader />;

  return (
    <div className="qp-page">
      {/* ===== MAIN CONTENT ===== */}
      <div className="qp-content">
        {/* Header Hành động */}
        <div className="qp-page-header">
          <div>
            <h1 className="qp-page-title">Sổ Quỹ Phòng Nasani</h1>
            <p className="qp-page-desc">Theo dõi thu chi, số dư quỹ và thanh toán quỹ trực tuyến</p>
          </div>
          <div className="qp-header-actions">
            <button
              className="qp-btn-payment"
              onClick={() => setShowPaymentModal(true)}
              title="Thanh toán nợ quỹ của bản thân qua mã QR ngân hàng"
            >
              <span className="qp-btn-payment-icon">💳</span>
              <span>Thanh toán quỹ / Quét mã QR</span>
            </button>
            <button
              className="qp-refresh-btn"
              onClick={() => loadInitialData()}
              title="Tải lại dữ liệu mới nhất"
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Banner nhắc nợ cho riêng tài khoản đang đăng nhập */}
        {userPendingTotal > 0 && (
          <div className="qp-reminder-card">
            <div className="qp-reminder-content">
              <span className="qp-reminder-icon">⚡</span>
              <div>
                <div className="qp-reminder-title">
                  Tài khoản <strong>{loggedInPerson?.name || currentUser?.displayName || currentUser?.personName}</strong> có{' '}
                  <span className="qp-reminder-highlight">{formatCurrency(userPendingTotal)}</span> tiền quỹ cần đóng
                </div>
                <div className="qp-reminder-sub">
                  Bạn có {userPendingTransactions.length} khoản đang chờ xử lý. Vui lòng quét mã QR hoặc chuyển khoản để hoàn tất nhé!
                </div>
              </div>
            </div>
            <button className="qp-reminder-btn" onClick={() => setShowPaymentModal(true)}>
              Thanh toán ngay →
            </button>
          </div>
        )}

        {/* Stats */}
        <div>
          <p className="qp-section-title">Tổng quan quỹ</p>
          <div className="qp-stats">
            <div className="stat-card balance">
              <div className="stat-label">Quỹ hiện tại</div>
              <div className={`stat-value ${stats.currentFund >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(stats.currentFund)}
              </div>
              <div className="stat-note">Đã hoàn thành</div>
            </div>

            <div className="stat-card pending">
              <div className="stat-label">Chưa thu</div>
              <div className="stat-value warning">{formatCurrency(stats.pendingFund)}</div>
              <div className="stat-note">Đang chờ xử lý</div>
            </div>

            <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
              <div className="stat-label">Tổng thu</div>
              <div className="stat-value positive">{formatCurrency(stats.totalIncome)}</div>
              <div className="stat-note">Đã hoàn thành</div>
            </div>

            <div className="stat-card" style={{ '--card-accent': '#f43f5e' } as React.CSSProperties}>
              <div className="stat-label">Tổng chi</div>
              <div className="stat-value negative">{formatCurrency(stats.totalExpense)}</div>
              <div className="stat-note">Đã hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ position: 'relative', zIndex: 100 }}>
          <p className="qp-section-title">Bộ lọc</p>
          <Fillter
            persons={persons}
            accounts={accounts}
            personFilter={personFilter}
            setPersonFilter={setPersonFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* Table */}
        <div>
          <p className="qp-section-title">Lịch sử giao dịch</p>
          {loading && <LoadingSpinner />}
          <GripData
            filteredTransactions={filteredTransactions}
            formatCurrency={formatCurrency}
            searchQuery={searchQuery}
          />
        </div>

        {/* Modal Thanh toán Quỹ trực tuyến */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          currentUser={currentUser}
          persons={persons}
          transactions={transactions}
          formatCurrency={formatCurrency}
          onSuccess={loadInitialData}
        />

      </div>
    </div>
  );
};

export default QuyPhong;