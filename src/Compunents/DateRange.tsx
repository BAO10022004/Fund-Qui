import React, { useState, useRef, useEffect } from 'react';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }:
    { startDate: string; endDate: string; onStartDateChange: (date: string) => void; onEndDateChange: (date: string) => void }
) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStartDate, setTempStartDate] = useState(startDate || '');
  const [tempEndDate, setTempEndDate] = useState(endDate || '');
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: { target: any; }) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
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

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day: number | undefined) => {
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

  const isDateInRange = (day: number | undefined) => {
    if (!tempStartDate || !tempEndDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    return date >= start && date <= end;
  };

  const isDateSelected = (day: number | undefined) => {
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
    const days = [];
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
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
      <div className="calendar-popup">
        <div className="calendar-header">
          <button className="calendar-nav" onClick={previousMonth}>‹</button>
          <div className="calendar-month">{`${monthNames[month]}, ${year}`}</div>
          <button className="calendar-nav" onClick={nextMonth}>›</button>
        </div>

        <div className="calendar-weekdays">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">{days}</div>

        <div className="calendar-footer">
          <button className="btn-cancel" onClick={handleCancel}>Hủy</button>
          <button className="btn-confirm" onClick={handleConfirm}>Xác nhận</button>
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
        <span className="input-arrow">▼</span>
      </div>

      {showCalendar && renderCalendar()}

      <style>{`
        .date-range-picker {
          position: relative;
          width: 100%;
        }

        .date-range-input {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 15px;
          font-weight: 600;
          color: #333;
        }

        .date-range-input:hover {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.02);
        }

        .date-range-input:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
        }

        .input-icon {
          font-size: 18px;
        }

        .input-text {
          flex: 1;
        }

        .input-arrow {
          font-size: 10px;
          color: #6b7280;
          transition: transform 0.3s ease;
        }

        .date-range-input:hover .input-arrow {
          color: #2563eb;
          transform: translateY(2px);
        }

        .calendar-popup {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 20px;
          z-index: 1000;
          min-width: 320px;
          animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .calendar-nav {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #2563eb;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .calendar-nav:hover {
          background: rgba(37, 99, 235, 0.1);
          transform: scale(1.1);
        }

        .calendar-month {
          font-size: 16px;
          font-weight: 700;
          color: #1e40af;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          padding: 8px 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 20px;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          color: #333;
        }

        .calendar-day.empty {
          cursor: default;
        }

        .calendar-day:not(.empty):hover {
          background: rgba(37, 99, 235, 0.1);
          transform: scale(1.1);
        }

        .calendar-day.today {
          color: #2563eb;
          font-weight: 700;
          border: 2px solid #2563eb;
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          transform: scale(1.05);
        }

        .calendar-day.in-range {
          background: rgba(37, 99, 235, 0.15);
          color: #1e40af;
        }

        .calendar-day.selected.in-range {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
        }

        .calendar-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 2px solid #f3f4f6;
        }

        .btn-cancel,
        .btn-confirm {
          padding: 10px 24px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #6b7280;
        }

        .btn-cancel:hover {
          background: #e5e7eb;
          color: #333;
          transform: translateY(-2px);
        }

        .btn-confirm {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
      `}</style>
    </div>
  );
};
export default DateRangePicker;