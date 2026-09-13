import React, { useState, useEffect } from 'react';
import HeaderManageTransaction from '../Compunents/HeaderManageTransaction';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAllPersons } from '../services/PersonService';
import { getAllAccounts } from '../services/AccountService';
import { getAllActions } from '../services/ActionService';
import type { Person } from '../models/Person';
import type { Account } from '../models/Account';
import type { Action } from '../models/Action';
import '../assets/QuyPhong.css';
import '../assets/ManageTransactions.css';
import Loader from '../Compunents/Loading';
import StatisticsCards from '../Compunents/StatisticsCards';
import Fillter from '../Compunents/Fillter';
import LoadingSpinner from '../Compunents/LoadingSpinner';
import GripData from '../Compunents/GridData';
import AddTransaction from '../Compunents/AddTransaction';
import type { Transaction, TransactionStatus } from '../models/Transaction';
import { logCreate, logUpdate, logDelete } from '../services/HistoryService';
import { Auth } from '../Auth';

const ManageTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const auth = new Auth();

  // Filters - đồng bộ hoàn toàn với Quỹ Phòng (+ loại giao dịch cho Admin)
  const [personFilter, setPersonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'thu' as 'thu' | 'chi',
    description: '',
    personId: '',
    status: 'pending' as TransactionStatus,
    actionId: '',
    actionName: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, personsData, accountsData, actionsData] = await Promise.all([
        loadTransactions(),
        getAllPersons(),
        getAllAccounts().catch(err => {
          console.warn('Lỗi khi tải accounts:', err);
          return [] as Account[];
        }),
        getAllActions().catch(err => {
          console.warn('Lỗi khi tải actions:', err);
          return [] as Action[];
        })
      ]);
      setTransactions(transactionsData);
      setPersons(personsData);
      setAccounts(accountsData);
      setActions(actionsData);
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
      // Format số tiền với dấu chấm khi mở modal chỉnh sửa
      const formattedAmount = transaction.amount
        ? transaction.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        : '';

      setFormData({
        date: transaction.date,
        amount: formattedAmount,
        type: transaction.type,
        description: transaction.description,
        personId: transaction.personId,
        status: transaction.status,
        actionId: transaction.actionId || '',
        actionName: transaction.actionName || ''
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'thu',
        description: '',
        personId: '',
        status: 'completed',
        actionId: '',
        actionName: ''
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
      // Xóa tất cả dấu chấm để lấy số nguyên chính xác khi lưu
      const cleanAmount = parseFloat(formData.amount.toString().replace(/\./g, '')) || 0;

      const transactionData: any = {
        date: formData.date,
        dayOfWeek: getDayOfWeek(formData.date),
        amount: cleanAmount,
        type: formData.type,
        description: formData.description,
        personId: formData.personId,
        personName: selectedPerson?.name || '',
        status: formData.status,
        createdAt: Timestamp.now()
      };

      if (formData.actionId) {
        transactionData.actionId = formData.actionId;
      }
      if (formData.actionName) {
        transactionData.actionName = formData.actionName;
      }

      if (editingTransaction && editingTransaction.id) {
        logUpdate(auth.getUsername()!, `Cập nhật giao dịch có id: ${editingTransaction.id}`);
        await updateDoc(doc(db, 'transactions', editingTransaction.id), transactionData);
        alert('✅ Cập nhật giao dịch thành công!');
      } else {
        logCreate(auth.getUsername()!, `Thêm giao dịch mới cho người: ${selectedPerson?.name || ''} với số tiền: ${formData.amount}`);
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

    if (await (window as any).customConfirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'transactions', id));
        await loadData();
        logDelete(auth.getUsername()!, `Xóa giao dịch có id: ${id}`);
        alert('✅ Xóa thành công!');
      } catch (error) {
        alert('❌ Không thể xóa!');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter transactions theo chuẩn logic của Quỹ Phòng
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
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.personName || '').toLowerCase().includes(q) ||
        (t.amount || '').toString().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredTransactions = getFilteredTransactions();

  // Statistics
  const stats = {
    total: filteredTransactions.length,
    pending: filteredTransactions.filter(t => t.status !== 'completed').length,
    completed: filteredTransactions.filter(t => t.status === 'completed').length,
    totalThu: filteredTransactions.filter(t => t.type === 'thu').reduce((sum, t) => sum + t.amount, 0),
    totalChi: filteredTransactions.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0)
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN').format(amount) + '\u00A0đ';

  if (loading && transactions.length === 0) {
    return <Loader />;
  }

  return (
    <div className="qp-page">
      <div className="qp-content">
        <HeaderManageTransaction openModal={openModal} loadData={loadData} />

        {/* Thẻ thống kê số liệu */}
        <div>
          <p className="qp-section-title">Tổng quan quỹ</p>
          <StatisticsCards stats={stats} formatCurrency={formatCurrency} />
        </div>

        {/* Bộ lọc chuẩn Quỹ Phòng */}
        <div style={{ position: 'relative', zIndex: 100 }}>
          <p className="qp-section-title">Bộ lọc</p>
          <Fillter
            persons={persons}
            accounts={accounts}
            personFilter={personFilter}
            setPersonFilter={setPersonFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={filterType}
            setTypeFilter={setFilterType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* Bảng Lịch sử giao dịch chuẩn Quỹ Phòng */}
        <div>
          <p className="qp-section-title">Lịch sử giao dịch</p>
          {loading && <LoadingSpinner />}
          <GripData
            filteredTransactions={filteredTransactions}
            formatCurrency={formatCurrency}
            searchQuery={searchQuery}
            openModal={openModal}
            handleDelete={handleDelete}
            accounts={accounts}
            persons={persons}
          />
        </div>

        {/* Modal Thêm / Sửa giao dịch */}
        {showModal && (
          <AddTransaction
            setShowModal={setShowModal}
            formData={formData}
            setFormData={setFormData}
            editingTransaction={editingTransaction}
            handleSubmit={handleSubmit}
            persons={persons}
            actions={actions}
          />
        )}
      </div>
    </div>
  );
};

export default ManageTransactions;