import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAllPersons, type Person } from '../services/firestoreService';
import '../assets/ManageTransactions.css';

export interface Transaction {
  id?: string;
  date: string;
  dayOfWeek: string;
  amount: number;
  type: 'thu' | 'chi';
  description: string;
  personId: string;
  personName: string;
  status: 'pending' | 'completed';
  createdAt?: Timestamp;
}

const ManageTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'thu' as 'thu' | 'chi',
    description: '',
    personId: '',
    status: 'pending' as 'pending' | 'completed'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, personsData] = await Promise.all([
        loadTransactions(),
        getAllPersons()
      ]);
      setTransactions(transactionsData);
      setPersons(personsData);
    } catch (error) {
      alert('Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  };

  const getDayOfWeek = (dateString: string): string => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        date: transaction.date,
        amount: transaction.amount.toString(),
        type: transaction.type,
        description: transaction.description,
        personId: transaction.personId,
        status: transaction.status
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'thu',
        description: '',
        personId: '',
        status: 'pending'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.amount || !formData.personId) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      setLoading(true);
      const selectedPerson = persons.find(p => p.id === formData.personId);
      
      const transactionData = {
        date: formData.date,
        dayOfWeek: getDayOfWeek(formData.date),
        amount: parseFloat(formData.amount),
        type: formData.type,
        description: formData.description,
        personId: formData.personId,
        personName: selectedPerson?.name || '',
        status: formData.status,
        createdAt: Timestamp.now()
      };

      if (editingTransaction && editingTransaction.id) {
        await updateDoc(doc(db, 'transactions', editingTransaction.id), transactionData);
        alert('✅ Cập nhật giao dịch thành công!');
      } else {
        await addDoc(collection(db, 'transactions'), transactionData);
        alert('✅ Thêm giao dịch thành công!');
      }

      await loadData();
      setShowModal(false);
    } catch (error) {
      alert('❌ Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;

    if (window.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'transactions', id));
        await loadData();
        alert('✅ Xóa thành công!');
      } catch (error) {
        alert('❌ Không thể xóa!');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterDateFrom && t.date < filterDateFrom) return false;
    if (filterDateTo && t.date > filterDateTo) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase()) 
        && !t.personName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: filteredTransactions.length,
    pending: filteredTransactions.filter(t => t.status === 'pending').length,
    completed: filteredTransactions.filter(t => t.status === 'completed').length,
    totalThu: filteredTransactions.filter(t => t.type === 'thu').reduce((sum, t) => sum + t.amount, 0),
    totalChi: filteredTransactions.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="loading-screen">
        <h2>⏳ Đang tải...</h2>
      </div>
    );
  }

  return (
    <div className="manage-transactions">
      <div className="page-header">
        <h1>💰 Quản lý Giao dịch</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          ➕ Thêm giao dịch mới
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Tổng giao dịch</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Đang chờ</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Hoàn thành</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>

        <div className="stat-card stat-thu">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">Tổng thu</div>
            <div className="stat-value">{formatCurrency(stats.totalThu)}</div>
          </div>
        </div>

        <div className="stat-card stat-chi">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <div className="stat-label">Tổng chi</div>
            <div className="stat-value">{formatCurrency(stats.totalChi)}</div>
          </div>
        </div>

        <div className="stat-card stat-balance">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Chênh lệch</div>
            <div className="stat-value">{formatCurrency(stats.totalThu - stats.totalChi)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>🔍 Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo mô tả hoặc người..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>📋 Trạng thái</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="pending">Đang chờ</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>

        <div className="filter-group">
          <label>💳 Loại</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="thu">Thu</option>
            <option value="chi">Chi</option>
          </select>
        </div>

        <div className="filter-group">
          <label>📅 Từ ngày</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>📅 Đến ngày</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFilterStatus('all');
              setFilterType('all');
              setFilterDateFrom('');
              setFilterDateTo('');
              setSearchTerm('');
            }}
          >
            🔄 Đặt lại
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Người</th>
              <th>Loại</th>
              <th>Số tiền</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  Không có giao dịch nào
                </td>
              </tr>
            ) : (
              filteredTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>
                    <div className="date-cell">
                      <div className="date-main">{transaction.date}</div>
                      <div className="date-sub">{transaction.dayOfWeek}</div>
                    </div>
                  </td>
                  <td>
                    <span className="person-badge">{transaction.personName}</span>
                  </td>
                  <td>
                    <span className={`type-badge type-${transaction.type}`}>
                      {transaction.type === 'thu' ? '💵 Thu' : '💸 Chi'}
                    </span>
                  </td>
                  <td>
                    <span className={`amount amount-${transaction.type}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="description-cell">{transaction.description || '—'}</td>
                  <td>
                    <span className={`status-badge status-${transaction.status}`}>
                      {transaction.status === 'pending' ? '⏳ Đang chờ' : '✅ Hoàn thành'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => openModal(transaction)}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(transaction.id)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTransaction ? '✏️ Sửa giao dịch' : '➕ Thêm giao dịch mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>📅 Ngày</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>💳 Loại giao dịch</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'thu' | 'chi' })}
                  >
                    <option value="thu">💵 Thu</option>
                    <option value="chi">💸 Chi</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>👤 Người</label>
                  <select
                    value={formData.personId}
                    onChange={e => setFormData({ ...formData, personId: e.target.value })}
                  >
                    <option value="">-- Chọn người --</option>
                    {persons.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name} ({person.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>💰 Số tiền</label>
                  <input
                    type="number"
                    placeholder="Nhập số tiền..."
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>📋 Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' })}
                >
                  <option value="pending">⏳ Đang chờ</option>
                  <option value="completed">✅ Hoàn thành</option>
                </select>
              </div>

              <div className="form-group">
                <label>📝 Mô tả</label>
                <textarea
                  placeholder="Nhập mô tả (tùy chọn)..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingTransaction ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">⏳ Đang xử lý...</div>
        </div>
      )}
    </div>
  );
};

export default ManageTransactions;