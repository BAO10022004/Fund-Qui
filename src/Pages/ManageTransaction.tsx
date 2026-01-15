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
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAllPersons} from '../services/PersonService';
import type { Person } from '../models/Person';
import '../assets/ManageTransactions.css';
import Loader from '../Compunents/Loading';
import StatisticsCards from '../Compunents/StatisticsCards';
import FillterManageTransaction from '../Compunents/FillterManageTransaction';
import LoadingSpinner from '../Compunents/LoadingSpinner';
import GridDataTransaction from '../Compunents/GridDataTransaction';
import AddTransaction from '../Compunents/AddTransaction';
import type { Transaction } from '../models/Transaction';
import { logCreate, logUpdate, logDelete } from '../services/HistoryService';
import { Auth } from '../Auth';
const ManageTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const auth = new Auth();
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
      <Loader/>
    );
  }

  return (
    <div className="manage-transactions">
      <HeaderManageTransaction openModal={openModal} />

      {/* Statistics Cards */}
      <StatisticsCards stats={stats} formatCurrency={formatCurrency} />

      {/* Filters */}
      <FillterManageTransaction
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterType={filterType}
        setFilterType={setFilterType}
        filterDateFrom={filterDateFrom}
        setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo}
        setFilterDateTo={setFilterDateTo}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Transactions Table */}
      <GridDataTransaction 
        filteredTransactions={filteredTransactions}
        openModal={openModal}
        setFilteredTransactions={setTransactions} 
        handleDelete={handleDelete}              
      />

      {/* Modal */}
      {showModal && (
        <AddTransaction
          setShowModal={setShowModal}
          formData={formData}
          setFormData={setFormData}
          editingTransaction={editingTransaction}
          handleSubmit={handleSubmit}
          persons={persons}
        />
      )}

      {loading && (
        <LoadingSpinner/>
      )}
    </div>
  );
};

export default ManageTransactions;