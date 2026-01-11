import React, { useState, useEffect } from 'react';
import '../assets/QuyPhong.css';
import Header from '../Compunents/Header';
import Fillter from '../Compunents/Fillter';
import Loader from '../Compunents/Loading';
import GripData from '../Compunents/GridData';
import LoadingSpinner from '../Compunents/LoadingSpinner';
import { getAllPersons } from '../services/PersonService';
import type { Person } from '../models/Person';
import type { Transaction } from '../models/Transaction';
import { getAllTransactions } from '../services/TransactionsService';
import {auth} from '../main'
import { Navigate } from 'react-router-dom';
const QuyPhong: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [personFilter, setPersonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
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
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const completedIncome = completedTransactions.filter(t => t.type === 'thu').reduce((sum, t) => sum + t.amount, 0);
    const completedExpense = completedTransactions.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0);
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
      <Loader />
    );
  }

  if(auth.isAuthenticated()===false){
    return (<Navigate to="/login" replace />);
  }
  return (
    <div className="container">
      <Header stats={stats}  />

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
        <LoadingSpinner />
      )}
      <GripData
        filteredTransactions={filteredTransactions}
        formatCurrency={formatCurrency}
        searchQuery={searchQuery}
      />
      
    </div>
  );
};

export default QuyPhong;