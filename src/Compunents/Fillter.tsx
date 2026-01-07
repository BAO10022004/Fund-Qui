import React from 'react';
import type { Person } from '../services/firestoreService';
import '../assets/fillter.css';
interface FilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  personFilter: string;
  setPersonFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  persons: Person[];
  startDate?: string;
  setStartDate?: (value: string) => void;
  endDate?: string;
  setEndDate?: (value: string) => void;
}

function Fillter({ 
  searchQuery, 
  setSearchQuery, 
  personFilter, 
  setPersonFilter, 
  statusFilter, 
  setStatusFilter, 
  persons,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: FilterProps) {
  return (
    <div className="filters-container">
      {/* Thanh tìm kiếm chính ở trên */}
      <div className="search-bar-main">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo nội dung, số tiền, người..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input-main"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Các bộ lọc ở dưới */}
      <div className="filters-row">
        <div className="filter-group date-range-group">
          <label>📅 Khoảng thời gian</label>
          <div className="date-range-inputs">
            <input
              type="date"
              value={startDate || ''}
              onChange={e => setStartDate?.(e.target.value)}
              className="date-input-filter"
              placeholder="Từ ngày"
            />
            <span className="date-separator">→</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={e => setEndDate?.(e.target.value)}
              className="date-input-filter"
              placeholder="Đến ngày"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>👤 Người</label>
          <select value={personFilter} onChange={e => setPersonFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            {persons.map(person => (
              <option key={person.id} value={person.id}>
                {person.name} - {person.code}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>📊 Trạng thái</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="pending">Chưa thu</option>
            <option value="completed">Đã thu</option>
          </select>
        </div>

        {/* Hiển thị bộ lọc đang áp dụng */}
        {(startDate || endDate || personFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              className="btn-reset-filter"
              onClick={() => {
                setPersonFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
                setStartDate?.('');
                setEndDate?.('');
              }}
            >
              🔄 Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Hiển thị các bộ lọc đang active */}
      {((startDate && endDate) || personFilter !== 'all' || statusFilter !== 'all') && (
        <div className="active-filters">
          <span className="active-filters-label">Đang lọc:</span>
          {startDate && endDate && (
            <span className="filter-tag">
              📅 {new Date(startDate).toLocaleDateString('vi-VN')} → {new Date(endDate).toLocaleDateString('vi-VN')}
              <button onClick={() => {
                setStartDate?.('');
                setEndDate?.('');
              }}>✕</button>
            </span>
          )}
          {personFilter !== 'all' && (
            <span className="filter-tag">
              👤 {persons.find(p => p.id === personFilter)?.name}
              <button onClick={() => setPersonFilter('all')}>✕</button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="filter-tag">
              📊 {statusFilter === 'pending' ? 'Chưa thu' : 'Đã thu'}
              <button onClick={() => setStatusFilter('all')}>✕</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Fillter;