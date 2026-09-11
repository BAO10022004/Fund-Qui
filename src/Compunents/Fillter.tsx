import React, { useState, useEffect, type JSX } from 'react';
import { createPortal } from 'react-dom';
import type { Person } from '../models/Person';
import type { Account } from '../models/Account';
import PersonSelectModal from './PersonSelectModal';
import '../assets/fillter.css';

interface FilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  personFilter: string;
  setPersonFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  persons: Person[];
  accounts?: Account[];
  startDate?: string;
  setStartDate?: (value: string) => void;
  endDate?: string;
  setEndDate?: (value: string) => void;
}

// Date Range Picker Component
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStartDate, setTempStartDate] = useState(startDate || '');
  const [tempEndDate, setTempEndDate] = useState(endDate || '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCalendar) {
        handleCancel();
      }
    };

    if (showCalendar) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showCalendar]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const isDateInRange = (day: number) => {
    if (!tempStartDate || !tempEndDate) return false;
    const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    return current >= start && current <= end;
  };

  const isDateSelected = (day: number) => {
    const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const currentDateStr = current.toISOString().split('T')[0];
    return currentDateStr === tempStartDate || currentDateStr === tempEndDate;
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (selectingStart || !tempStartDate) {
      setTempStartDate(dateStr);
      setTempEndDate('');
      setSelectingStart(false);
    } else {
      if (new Date(dateStr) < new Date(tempStartDate)) {
        setTempStartDate(dateStr);
        setTempEndDate('');
        setSelectingStart(false);
      } else {
        setTempEndDate(dateStr);
        setSelectingStart(true);
      }
    }
  };

  const handleConfirm = () => {
    if (tempStartDate && tempEndDate) {
      onStartDateChange(tempStartDate);
      onEndDateChange(tempEndDate);
      setShowCalendar(false);
    }
  };

  const handleCancel = () => {
    setTempStartDate(startDate || '');
    setTempEndDate(endDate || '');
    setSelectingStart(true);
    setShowCalendar(false);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days: JSX.Element[] = [];
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    // Empty slots before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day cal-day-empty" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day);
      const isInRange = isDateInRange(day);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="calendar-modal-backdrop" onClick={handleCancel}>
        <div className="calendar-popup" onClick={e => e.stopPropagation()}>
          <div className="calendar-header">
            <button className="calendar-nav" onClick={previousMonth} type="button">‹</button>
            <div className="calendar-month">{`${monthNames[month]}, ${year}`}</div>
            <button className="calendar-nav" onClick={nextMonth} type="button">›</button>
          </div>

          <div className="calendar-weekdays">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">{days}</div>

          <div className="calendar-footer">
            <button className="btn-cancel" onClick={handleCancel} type="button">Hủy</button>
            <button className="btn-confirm" onClick={handleConfirm} type="button">Xác nhận</button>
          </div>
        </div>
      </div>
    );
  };

  const displayText = tempStartDate && tempEndDate
    ? `${formatDate(tempStartDate)} → ${formatDate(tempEndDate)}`
    : startDate && endDate
    ? `${formatDate(startDate)} → ${formatDate(endDate)}`
    : 'Chọn khoảng thời gian';

  return (
    <div className="date-range-picker">
      <div className="date-range-input" onClick={() => setShowCalendar(!showCalendar)}>
        <span className="input-icon">📅</span>
        <span className="input-text">{displayText}</span>
        <span className="input-arrow">{showCalendar ? '▲' : '▼'}</span>
      </div>

      {showCalendar && createPortal(renderCalendar(), document.body)}
    </div>
  );
};

// Main Filter Component
function Filter({
  searchQuery,
  setSearchQuery,
  personFilter,
  setPersonFilter,
  statusFilter,
  setStatusFilter,
  persons,
  accounts = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: FilterProps) {
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Tìm người đang được chọn
  const selectedPerson = persons.find(p => p.id === personFilter);
  const selectedAccount = accounts.find(
    a => a.codePerson && selectedPerson && a.codePerson.trim().toLowerCase() === selectedPerson.code.trim().toLowerCase()
  );
  const selectedAvatar = selectedPerson?.avatar || selectedAccount?.avatar;

  return (
    <div className="filters-container">
      {/* Search bar */}
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
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters row in glass wrapper */}
      <div className="filters-row-wrapper">
        <div className="filters-row">
          <div className="filter-group">
            <label>📅 Khoảng thời gian</label>
            <DateRangePicker
              startDate={startDate || ''}
              endDate={endDate || ''}
              onStartDateChange={setStartDate || (() => {})}
              onEndDateChange={setEndDate || (() => {})}
            />
          </div>

          <div className="filter-group">
            <label>👤 Người</label>
            <div
              className="person-select-trigger"
              onClick={() => setIsPersonModalOpen(true)}
              role="button"
              tabIndex={0}
            >
              <div className="person-trigger-left">
                {personFilter === 'all' ? (
                  <>
                    <span className="person-trigger-icon">👥</span>
                    <span className="person-trigger-name">Tất cả</span>
                  </>
                ) : (
                  <>
                    {selectedAvatar ? (
                      <img
                        src={selectedAvatar}
                        alt=""
                        className="person-trigger-avatar"
                      />
                    ) : (
                      <span className="person-trigger-icon">👤</span>
                    )}
                    <span className="person-trigger-name" title={selectedPerson ? `${selectedPerson.name} (${selectedPerson.code})` : ''}>
                      {selectedPerson ? (selectedPerson.code || selectedPerson.name) : 'Chọn người'}
                    </span>
                  </>
                )}
              </div>
              <div className="person-trigger-actions">
                {personFilter !== 'all' && (
                  <span
                    className="person-trigger-clear"
                    title="Bỏ lọc người"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPersonFilter('all');
                    }}
                  >
                    ✕
                  </span>
                )}
                <span className="person-trigger-arrow">▼</span>
              </div>
            </div>

            {/* Modal hiển thị dạng ảnh lưới chọn người như ảnh mẫu */}
            <PersonSelectModal
              isOpen={isPersonModalOpen}
              onClose={() => setIsPersonModalOpen(false)}
              persons={persons}
              selectedPersonId={personFilter}
              onSelectPerson={setPersonFilter}
              accounts={accounts}
            />
          </div>

          <div className="filter-group">
            <label>📊 Trạng thái</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="pending">Chưa thu</option>
              <option value="completed">Đã thu</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Filter;