import React, { useState, useEffect } from 'react';
import { getAllHistory } from '../services/HistoryService';
import type { History } from '../models/history';
import '../assets/ManageHistory.css';

// Header Component
const HeaderManageHistory = () => (
  <div className="header-history-container">
    <div className="header-history-title-wrapper">
      <div className="header-history-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <h1 className="header-history-title">Lịch sử hoạt động</h1>
    </div>
  </div>
);

// Filter Component
const FilterHistory = ({
  filterType,
  setFilterType,
  filterUsername,
  setFilterUsername,
  searchDate,
  setSearchDate
}: {
  filterType: string;
  setFilterType: (type: string) => void;
  filterUsername: string;
  setFilterUsername: (username: string) => void;
  searchDate: string;
  setSearchDate: (date: string) => void;
}) => (
  <div className="filter-history-container">
    <div className="filter-group-history">
      <label className="filter-label-history">Loại hành động:</label>
      <select
        className="filter-select-history"
        value={filterType}
        onChange={e => setFilterType(e.target.value)}
      >
        <option value="">Tất cả</option>
        <option value="LOGIN">🔑 Đăng nhập</option>
        <option value="CREATE">➕ Tạo mới</option>
        <option value="UPDATE">✏️ Cập nhật</option>
        <option value="DELETE">🗑️ Xóa</option>
      </select>
    </div>

    <div className="filter-group-history">
      <label className="filter-label-history">Người dùng:</label>
      <input
        className="filter-input-history"
        type="text"
        placeholder="Tìm theo username..."
        value={filterUsername}
        onChange={e => setFilterUsername(e.target.value)}
      />
    </div>

    <div className="filter-group-history">
      <label className="filter-label-history">Ngày:</label>
      <input
        className="filter-input-history"
        type="date"
        value={searchDate}
        onChange={e => setSearchDate(e.target.value)}
      />
    </div>
  </div>
);

// Grid Component
const GridHistory = ({ 
  histories
}: {
  histories: History[];
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LOGIN': return '🔑';
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'LOGIN': return 'type-login';
      case 'CREATE': return 'type-create';
      case 'UPDATE': return 'type-update';
      case 'DELETE': return 'type-delete';
      default: return '';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="grid-history-container">
      <table className="history-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người dùng</th>
            <th>Hành động</th>
            <th>Nội dung</th>
          </tr>
        </thead>
        <tbody>
          {histories.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty-state-history">
                <div className="empty-icon-history">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <p className="empty-text-history">Chưa có lịch sử nào</p>
                <p className="empty-subtext-history">Các hoạt động sẽ được ghi lại ở đây</p>
              </td>
            </tr>
          ) : (
            histories.map(history => (
              <tr key={history.id}>
                <td>
                  <div className="history-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{formatDate(history.updatedAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="history-username">
                    <div className="history-avatar">
                      {history.username.charAt(0).toUpperCase()}
                    </div>
                    <strong>{history.username}</strong>
                  </div>
                </td>
                <td>
                  <span className={`history-type ${getTypeClass(history.type)}`}>
                    {getTypeIcon(history.type)} {history.type}
                  </span>
                </td>
                <td>
                  <span className="history-content">{history.content || '—'}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Main Page Component
const ManageHistory: React.FC = () => {
  const [histories, setHistories] = useState<History[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterHistories();
  }, [histories, filterType, filterUsername, searchDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllHistory();
      setHistories(data);
    } catch (error) {
      alert('Không thể tải dữ liệu lịch sử!');
    } finally {
      setLoading(false);
    }
  };

  const filterHistories = () => {
    let filtered = [...histories];

    // Lọc theo loại hành động
    if (filterType) {
      filtered = filtered.filter(h => h.type === filterType);
    }

    // Lọc theo username
    if (filterUsername) {
      filtered = filtered.filter(h => 
        h.username.toLowerCase().includes(filterUsername.toLowerCase())
      );
    }

    // Lọc theo ngày
    if (searchDate) {
      filtered = filtered.filter(h => {
        if (!h.updatedAt) return false;
        const historyDate = h.updatedAt.toDate();
        const searchDateObj = new Date(searchDate);
        return historyDate.toDateString() === searchDateObj.toDateString();
      });
    }

    setFilteredHistories(filtered);
  };

  if (loading) {
    return (
      <div className="page-loader-history">
        <div className="loader-spinner-history"></div>
        <p>Đang tải lịch sử...</p>
      </div>
    );
  }

  return (
    <div className="manage-history-page">
      <div className="page-content-history">
        <HeaderManageHistory />
        <FilterHistory
          filterType={filterType}
          setFilterType={setFilterType}
          filterUsername={filterUsername}
          setFilterUsername={setFilterUsername}
          searchDate={searchDate}
          setSearchDate={setSearchDate}
        />
        <GridHistory histories={filteredHistories} />
      </div>
    </div>
  );
};

export default ManageHistory;