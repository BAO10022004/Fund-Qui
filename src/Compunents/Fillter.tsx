import React from 'react';
import type { Person } from '../services/firestoreService';
import '../assets/fillter.css';
interface FilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  timeFilter: string;
  setTimeFilter: (value: string) => void;
  personFilter: string;
  setPersonFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  persons: Person[];
}

function Fillter({ 
  searchQuery, 
  setSearchQuery, 
  timeFilter, 
  setTimeFilter, 
  personFilter, 
  setPersonFilter, 
  statusFilter, 
  setStatusFilter, 
  persons 
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
        <div className="filter-group">
          <label>⏰ Khoảng thời gian</label>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này</option>
          </select>
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
        {(timeFilter !== 'all' || personFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              className="btn-reset-filter"
              onClick={() => {
                setTimeFilter('all');
                setPersonFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
            >
              🔄 Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Hiển thị các bộ lọc đang active */}
      {(timeFilter !== 'all' || personFilter !== 'all' || statusFilter !== 'all') && (
        <div className="active-filters">
          <span className="active-filters-label">Đang lọc:</span>
          {timeFilter !== 'all' && (
            <span className="filter-tag">
              ⏰ {timeFilter === 'week' ? '7 ngày qua' : 'Tháng này'}
              <button onClick={() => setTimeFilter('all')}>✕</button>
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