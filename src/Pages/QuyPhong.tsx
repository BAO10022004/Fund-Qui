import React, { useState, useEffect } from 'react';
import '../assets/QuyPhong.css';
import '../assets/header.css';
import Fillter from '../Compunents/Fillter';
import Loader from '../Compunents/Loading';
import GripData from '../Compunents/GridData';
import LoadingSpinner from '../Compunents/LoadingSpinner';
import { getAllPersons } from '../services/PersonService';
import type { Person } from '../models/Person';
import type { Transaction } from '../models/Transaction';
import { getAllTransactions } from '../services/TransactionsService';
import { useNavigate } from 'react-router-dom';

const QuyPhong: React.FC = () => {
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [personFilter, setPersonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [personsData, transactionsData] = await Promise.all([
        getAllPersons(),
        getAllTransactions()
      ]);
      setPersons(personsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      alert('Không thể tải dữ liệu từ Firebase. Vui lòng kiểm tra kết nối!');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

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
    const income  = completed.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
    const expense = completed.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter(t => t.type === 'thu' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);
    return { currentFund: income - expense, pendingFund: pending, totalIncome: income, totalExpense: expense };
  };

  const stats = calculateStats();
  const filteredTransactions = getFilteredTransactions();

  if (loading && transactions.length === 0) return <Loader />;

  return (
    <div className="qp-page">
      {/* ===== NAVBAR ===== */}
      <nav className="qp-navbar">
        <div className="qp-nav-left">
          <button className="qp-back-btn" onClick={() => navigate('/')}>
            ← Trang chủ
          </button>
          <div className="qp-nav-title">
            <span className="qp-nav-icon">💰</span>
            <span>Quỹ Phòng</span>
          </div>
        </div>
        <button
          className="qp-back-btn"
          onClick={loadInitialData}
          style={{ gap: '0.35rem' }}
          title="Tải lại dữ liệu"
        >
          🔄 Làm mới
        </button>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="qp-content">

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

      </div>
    </div>
  );
};

export default QuyPhong;