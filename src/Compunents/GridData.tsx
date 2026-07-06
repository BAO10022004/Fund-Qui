import React, { useState, useEffect } from 'react';
import '../assets/GripData.css';

const getInitials = (name: string): string => {
  if (!name) return '👤';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function GripData(
  { filteredTransactions, formatCurrency, searchQuery }: 
  { filteredTransactions: any[]; formatCurrency: (amount: number) => string; searchQuery: string }
) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to first page when transactions length changes (due to filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTransactions.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="mock-table-container">
      <table className="mock-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody key={`${currentPage}-${filteredTransactions.map(t => t.id).join('-')}`}>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                {searchQuery ? '🔍 Không tìm thấy kết quả phù hợp' : '📝 Chưa có giao dịch nào'}
              </td>
            </tr>
          ) : (
            currentItems.map((transaction) => {
              const initials = getInitials(transaction.personName);
              const isCompleted = transaction.status === 'completed';
              const isThu = transaction.type === 'thu';
              
              // Formatting transaction date nicely
              const formattedDate = new Date(transaction.date).toLocaleDateString('vi-VN');
              const dateDisplay = `${transaction.dayOfWeek || ''}, ${formattedDate}`;

              return (
                <tr key={transaction.id}>
                  {/* Column 1: User details */}
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{initials}</div>
                      <div className="user-info">
                        <span className="user-name">{transaction.personName || 'Không rõ'}</span>
                        <span className="user-subtext" title={transaction.description}>
                          {transaction.description || 'Không có mô tả'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Type (Phân loại: Thu/Chi) */}
                  <td>
                    <span className="role-text">
                      {isThu ? 'Khoản thu' : 'Khoản chi'}
                    </span>
                  </td>

                  {/* Column 3: Status (Trạng thái) */}
                  <td>
                    <span className={`status-pill ${isCompleted ? 'active' : 'pending'}`}>
                      {isCompleted ? 'Active' : 'Pending'}
                    </span>
                  </td>

                  {/* Column 4: Date (Ngày giao dịch) */}
                  <td>
                    <span className="date-text-mock">
                      {dateDisplay}
                    </span>
                  </td>

                  {/* Column 5: Amount (Số tiền) */}
                  <td>
                    <span className={`amount-text-mock ${isThu ? 'positive' : 'negative'}`}>
                      {isThu ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ‹ Trước
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                className={`pagination-page-num ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Sau ›
          </button>
        </div>
      )}
    </div>
  );
}

export default GripData;