import React, { useState, useEffect } from 'react';
import '../assets/QuyPhong.css';
import Header from '../Compunents/Header';
import Fillter from '../Compunents/Fillter';
import {
  getAllPersons,
  getAllTransactions,
  addTransaction,
  type Person,
  type Transaction
} from '../services/firestoreService';

const COMMON_DESCRIPTIONS = {
  chi: [
    'Đi trễ',
    'Không nhập báo cáo',
    'Không gửi báo cáo mail',
    'Vắng mặt không phép',
    'Quên check-in',
    'Không hoàn thành task đúng hạn',
    'Vi phạm nội quy'
  ],
  thu: [
    'Đóng quỹ tháng này',
    'Đi ăn'
  ]
};

const QuyPhong: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [personFilter, setPersonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'chi' as 'thu' | 'chi',
    description: '',
    personId: '',
    status: 'pending' as 'pending' | 'completed'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

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

  const loadTransactions = async () => {
    try {
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Lỗi khi tải giao dịch:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const getDayOfWeek = (dateString: string): string => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const openModal = () => {
    setShowModal(true);
    setModalStep(1);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'chi',
      description: '',
      personId: '',
      status: 'pending'
    });
  };

  const handleTypeSelect = (type: 'thu' | 'chi') => {
    setFormData({ ...formData, type, description: '' });
    setModalStep(2);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData({ ...formData, description: suggestion });
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description.trim() || !formData.personId) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const selectedPerson = persons.find(p => p.id === formData.personId);
    if (!selectedPerson) {
      alert('Vui lòng chọn người!');
      return;
    }

    try {
      setLoading(true);
      const newTransaction = {
        date: formData.date,
        dayOfWeek: getDayOfWeek(formData.date),
        amount: parseFloat(formData.amount),
        type: formData.type,
        description: formData.description.trim(),
        personId: selectedPerson.id!,
        personName: `${selectedPerson.name} - ${selectedPerson.code}`,
        status: formData.status
      };

      await addTransaction(newTransaction);
      await loadTransactions();
      
      setShowModal(false);
      setModalStep(1);
      setShowSuggestions(false);
      alert('✅ Thêm giao dịch thành công!');
    } catch (error) {
      console.error('Lỗi:', error);
      alert('❌ Không thể thêm giao dịch. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = (): Transaction[] => {
    let filtered = [...transactions];

    // Lọc theo khoảng thời gian
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Bao gồm cả ngày kết thúc
        return transDate >= start && transDate <= end;
      });
    }

    if (personFilter !== 'all') {
      filtered = filtered.filter(t => t.personId === personFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.personName.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateStats = () => {
    // Chỉ tính giao dịch đã hoàn thành cho quỹ hiện tại
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const completedIncome = completedTransactions.filter(t => t.type === 'thu').reduce((sum, t) => sum + t.amount, 0);
    const completedExpense = completedTransactions.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0);
    
    // Tính quỹ chưa thu (chỉ tính giao dịch THU có status pending)
    const pendingIncome = transactions.filter(t => t.type === 'thu' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      currentFund: completedIncome - completedExpense,
      pendingFund: pendingIncome,
      totalIncome: completedIncome,
      totalExpense: completedExpense
    };
  };

  const stats = calculateStats();
  const filteredTransactions = getFilteredTransactions();

  if (loading && transactions.length === 0) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          fontSize: '18px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Đang tải dữ liệu từ Firebase...</h2>
          <p style={{ color: '#666', marginTop: '10px' }}>
            Vui lòng đợi trong giây lát
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header stats={stats} setShowModal={openModal} />

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
      
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '10px',
          zIndex: 9999,
          fontSize: '16px'
        }}>
          ⏳ Đang xử lý...
        </div>
      )}

      <div className="transactions">
        <div style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div>
            <strong>📊 Tổng số giao dịch:</strong> {filteredTransactions.length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            💾 Dữ liệu được lưu tự động trên Firebase
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số tiền</th>
              <th>Loại</th>
              <th>Nội dung</th>
              <th>Người</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {searchQuery ? '🔍 Không tìm thấy kết quả phù hợp' : '📝 Chưa có giao dịch nào'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>
                    <div className="date-info">
                      <span className="day-of-week">{transaction.dayOfWeek}</span>
                      <span className="date-text">
                        {new Date(transaction.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`amount ${transaction.type === 'thu' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'thu' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${transaction.type === 'thu' ? 'income' : 'expense'}`}>
                      {transaction.type === 'thu' ? 'Thu' : 'Chi'}
                    </span>
                  </td>
                  <td>{transaction.description}</td>
                  <td>👤 {transaction.personName}</td>
                  <td>
                    <span className={`badge ${transaction.status}`}>
                      {transaction.status === 'completed' ? '✓ Đã thu' : '⏰ Chưa thu'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal active">
          <div className="modal-content">
            {modalStep === 1 && (
              <>
                <div className="modal-header">
                  <h2>Chọn hình thức giao dịch</h2>
                </div>
                <div className="type-selection">
                  <button 
                    className="type-btn income-btn"
                    onClick={() => handleTypeSelect('thu')}
                  >
                    <span className="type-icon">💰</span>
                    <span className="type-label">THU</span>
                    <span className="type-desc">Tiền vào quỹ</span>
                  </button>
                  <button 
                    className="type-btn expense-btn"
                    onClick={() => handleTypeSelect('chi')}
                  >
                    <span className="type-icon">💸</span>
                    <span className="type-label">CHI</span>
                    <span className="type-desc">Tiền phạt</span>
                  </button>
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                </div>
              </>
            )}

            {modalStep === 2 && (
              <>
                <div className="modal-header">
                  <h2>
                    Thêm giao dịch {formData.type === 'thu' ? '💰 THU' : '💸 CHI'}
                  </h2>
                  <button 
                    className="btn-back"
                    onClick={() => setModalStep(1)}
                  >
                    ← Quay lại
                  </button>
                </div>

                <div className="form-group">
                  <label>Ngày</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="date-input"
                  />
                </div>

                <div className="form-group">
                  <label>Người</label>
                  <select
                    value={formData.personId}
                    onChange={e => setFormData({ ...formData, personId: e.target.value })}
                  >
                    <option value="">-- Chọn người --</option>
                    {persons.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name} - {person.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nội dung</label>
                  <div className="input-with-suggestions">
                    <input
                      type="text"
                      placeholder="Nhập nội dung giao dịch..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && (
                      <div className="suggestions-dropdown">
                        <div className="suggestions-header">Gợi ý nội dung:</div>
                        {COMMON_DESCRIPTIONS[formData.type].map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="suggestion-close"
                          onClick={() => setShowSuggestions(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Số tiền (đ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Nhập số tiền..."
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' })
                    }
                  >
                    <option value="pending">Chưa thu</option>
                    <option value="completed">Đã thu</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmit}>
                    Thêm giao dịch
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuyPhong;