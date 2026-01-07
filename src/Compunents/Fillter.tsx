import React from 'react';
import type { Person } from '../services/firestoreService';

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

 function Fillter({ searchQuery, setSearchQuery, timeFilter, setTimeFilter, personFilter, setPersonFilter, statusFilter, setStatusFilter, persons }: FilterProps)
{
    return (
        <div className="filters">
        <div className="filter-group">
          <label>🔍 Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo nội dung hoặc người..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>⏰ Thời gian</label>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="week">Tuần này</option>
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
            <option value="pending">Pending</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
      </div>
    );
}
export default Fillter;