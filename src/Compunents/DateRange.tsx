// import React, { useState, useRef, useEffect } from 'react';

// const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }:
//     { startDate: string; endDate: string; onStartDateChange: (date: string) => void; onEndDateChange: (date: string) => void }
// ) => {
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [selectingStart, setSelectingStart] = useState(true);
//   const [tempStartDate, setTempStartDate] = useState(startDate || '');
//   const [tempEndDate, setTempEndDate] = useState(endDate || '');
//   const calendarRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: { target: any; }) => {
//       if (calendarRef.current && !calendarRef.current.contains(event.target)) {
//         setShowCalendar(false);
//       }
//     };

//     if (showCalendar) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [showCalendar]);

//   const getDaysInMonth = (date: Date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const daysInMonth = lastDay.getDate();
//     const startingDayOfWeek = firstDay.getDay();

//     return { daysInMonth, startingDayOfWeek, year, month };
//   };

//   const formatDate = (dateString: string | number | Date) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('vi-VN');
//   };

//   const formatDateToISO = (date: Date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const handleDateClick = (day: number) => {
//     const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
//     const isoDate = formatDateToISO(selectedDate);

//     if (selectingStart) {
//       setTempStartDate(isoDate);
//       setTempEndDate('');
//       setSelectingStart(false);
//     } else {
//       const startDateObj = new Date(tempStartDate);
//       if (selectedDate < startDateObj) {
//         setTempStartDate(isoDate);
//         setTempEndDate(tempStartDate);
//       } else {
//         setTempEndDate(isoDate);
//       }
//     }
//   };

//   const handleConfirm = () => {
//     onStartDateChange(tempStartDate);
//     onEndDateChange(tempEndDate);
//     setShowCalendar(false);
//     setSelectingStart(true);
//   };

//   const handleCancel = () => {
//     setTempStartDate(startDate || '');
//     setTempEndDate(endDate || '');
//     setShowCalendar(false);
//     setSelectingStart(true);
//   };

//   const isDateInRange = (day: number) => {
//     if (!tempStartDate || !tempEndDate) return false;
//     const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
//     const start = new Date(tempStartDate);
//     const end = new Date(tempEndDate);
//     return date >= start && date <= end;
//   };

//   const isDateSelected = (day: number) => {
//     const date = formatDateToISO(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
//     return date === tempStartDate || date === tempEndDate;
//   };

//   const previousMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
//   };

//   const nextMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
//   };

//   const renderCalendar = () => {
//     const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
//     const days = [];
//     const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
//                         'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

//     // Days of the month
//     for (let day = 1; day <= daysInMonth; day++) {
//       const isSelected = isDateSelected(day);
//       const isInRange = isDateInRange(day);
//       const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

//       days.push(
//         <div
//           key={day}
//           className={`calendar-day ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''} ${isToday ? 'today' : ''}`}
//           onClick={() => handleDateClick(day)}
//           style={{ gridColumnStart: day === 1 ? startingDayOfWeek + 1 : 'auto' }}
//         >
//           {day}
//         </div>
//       );
//     }

//     return (
//       <div className="calendar-popup">
//         <div className="calendar-header">
//           <button className="calendar-nav" onClick={previousMonth} type="button">‹</button>
//           <div className="calendar-month">{`${monthNames[month]}, ${year}`}</div>
//           <button className="calendar-nav" onClick={nextMonth} type="button">›</button>
//         </div>

//         <div className="calendar-weekdays">
//           {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
//             <div key={day} className="calendar-weekday">{day}</div>
//           ))}
//         </div>

//         <div className="calendar-grid">{days}</div>

//         <div className="calendar-footer">
//           <button className="btn-cancel" onClick={handleCancel} type="button">Hủy</button>
//           <button className="btn-confirm" onClick={handleConfirm} type="button">Xác nhận</button>
//         </div>
//       </div>
//     );
//   };

//   const displayText = tempStartDate && tempEndDate 
//     ? `${formatDate(tempStartDate)} → ${formatDate(tempEndDate)}`
//     : startDate && endDate
//     ? `${formatDate(startDate)} → ${formatDate(endDate)}`
//     : 'Chọn khoảng thời gian';

//   return (
//     <div className="date-range-picker" ref={calendarRef}>
//       <div className="date-range-input" onClick={() => setShowCalendar(!showCalendar)}>
//         <span className="input-icon">📅</span>
//         <span className="input-text">{displayText}</span>
//         <span className="input-arrow">{showCalendar ? '▲' : '▼'}</span>
//       </div>

//       {showCalendar && renderCalendar()}
//     </div>
//   );
// };

// export default DateRangePicker;