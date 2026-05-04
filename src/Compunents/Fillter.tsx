import React, { useState, useRef, useEffect, type JSX } from 'react';
import type { Person } from '../models/Person';
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
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isoDate = formatDateToISO(selectedDate);

    if (selectingStart) {
      setTempStartDate(isoDate);
      setTempEndDate('');
      setSelectingStart(false);
    } else {
      const startDateObj = new Date(tempStartDate);
      if (selectedDate < startDateObj) {
        setTempStartDate(isoDate);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(isoDate);
      }
    }
  };

  const handleConfirm = () => {
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
    setShowCalendar(false);
    setSelectingStart(true);
  };

  const handleCancel = () => {
    setTempStartDate(startDate || '');
    setTempEndDate(endDate || '');
    setShowCalendar(false);
    setSelectingStart(true);
  };

  const isDateInRange = (day: number): boolean => {
    if (!tempStartDate || !tempEndDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    return date >= start && date <= end;
  };

  const isDateSelected = (day: number): boolean => {
    const date = formatDateToISO(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    return date === tempStartDate || date === tempEndDate;
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
      <div className="calendar-popup">
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
    );
  };

  const displayText = tempStartDate && tempEndDate
    ? `${formatDate(tempStartDate)} → ${formatDate(tempEndDate)}`
    : startDate && endDate
    ? `${formatDate(startDate)} → ${formatDate(endDate)}`
    : 'Chọn khoảng thời gian';

  return (
    <div className="date-range-picker" ref={calendarRef}>
      <div className="date-range-input" onClick={() => setShowCalendar(!showCalendar)}>
        <span className="input-icon">📅</span>
        <span className="input-text">{displayText}</span>
        <span className="input-arrow">{showCalendar ? '▲' : '▼'}</span>
      </div>

      {showCalendar && renderCalendar()}
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
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: FilterProps) {
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
        </div>
      </div>
    </div>
  );

}

export default Filter;