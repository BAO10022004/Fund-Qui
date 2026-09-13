import React, { useState, useEffect } from "react";
import type { Transaction } from "../models/Transaction";

const getInitials = (name: string): string => {
  if (!name) return '👤';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (name: string): string => {
  const colors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #8b5cf6, #d946ef)'
  ];
  let sum = 0;
  for (let i = 0; i < (name || '').length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

function GridDataTransaction({ 
  openModal, 
  filteredTransactions, 
  handleDelete 
}: { 
  openModal: (transaction: Transaction) => void;
  filteredTransactions: Transaction[];
  setFilteredTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  handleDelete: (id: string | undefined) => void;
}) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to page 1 when transactions list length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTransactions.length]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + '\u00A0đ';
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="mock-table-container">
      <table className="mock-table">
        <thead>
          <tr>
            <th>Thành viên / Mô tả</th>
            <th>Phân loại</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th>Số tiền</th>
            <th style={{ textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <div>Không tìm thấy giao dịch nào phù hợp với bộ lọc</div>
              </td>
            </tr>
          ) : (
            currentItems.map(transaction => {
              const initials = getInitials(transaction.personName);
              const isThu = transaction.type === 'thu';
              
              // Formatting transaction date nicely
              let dateDisplay = '';
              try {
                const dateObj = new Date(transaction.date);
                const formattedDate = dateObj.toLocaleDateString('vi-VN');
                dateDisplay = `${transaction.dayOfWeek ? transaction.dayOfWeek + ', ' : ''}${formattedDate}`;
              } catch {
                dateDisplay = transaction.date;
              }

              return (
                <tr key={transaction.id}>
                  {/* Column 1: User & Description */}
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar" style={{ background: getAvatarBg(transaction.personName) }}>
                        {initials}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{transaction.personName || 'Chưa gán'}</span>
                        <span className="user-subtext" title={transaction.description}>
                          {transaction.description || 'Không có mô tả chi tiết'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Type */}
                  <td>
                    <span className={`trans-type-pill ${isThu ? 'thu' : 'chi'}`}>
                      {isThu ? '💵 Thu' : '💸 Chi'}
                    </span>
                  </td>

                  {/* Column 3: Status */}
                  <td>
                    {transaction.status === 'completed' ? (
                      <span className="status-pill completed">✅ Hoàn thành</span>
                    ) : transaction.status === 'waiting' ? (
                      <span className="status-pill waiting">🕒 Chờ duyệt</span>
                    ) : (
                      <span className="status-pill pending">⏳ Chưa hoàn thành</span>
                    )}
                  </td>

                  {/* Column 4: Date */}
                  <td>
                    <span className="date-text-mock">
                      {dateDisplay}
                    </span>
                  </td>

                  {/* Column 5: Amount */}
                  <td>
                    <span className={`amount-text-mock ${isThu ? 'positive' : 'negative'}`}>
                      {isThu ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </td>

                  {/* Column 6: Actions */}
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        className="action-btn-mock edit-btn"
                        onClick={() => openModal(transaction)}
                        title="Chỉnh sửa giao dịch"
                      >
                        <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>
                      <button
                        className="action-btn-mock delete-btn"
                        onClick={() => handleDelete(transaction.id!)}
                        title="Xóa giao dịch"
                      >
                        <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
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

export default GridDataTransaction;