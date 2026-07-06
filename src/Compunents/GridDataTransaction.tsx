import React, { useState, useEffect } from "react";
import type { Transaction } from "../models/Transaction";

const getInitials = (name: string): string => {
  if (!name) return '👤';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
            <th>User</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Amount</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
                Không có giao dịch nào
              </td>
            </tr>
          ) : (
            currentItems.map(transaction => {
              const initials = getInitials(transaction.personName);
              const isCompleted = transaction.status === 'completed';
              const isThu = transaction.type === 'thu';
              
              // Formatting transaction date nicely
              const formattedDate = new Date(transaction.date).toLocaleDateString('vi-VN');
              const dateDisplay = `${transaction.dayOfWeek || ''}, ${formattedDate}`;

              return (
                <tr key={transaction.id}>
                  {/* Column 1: User */}
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

                  {/* Column 2: Type */}
                  <td>
                    <span className="role-text">
                      {isThu ? 'Khoản thu' : 'Khoản chi'}
                    </span>
                  </td>

                  {/* Column 3: Status */}
                  <td>
                    <span className={`status-pill ${isCompleted ? 'active' : 'pending'}`}>
                      {isCompleted ? 'Active' : 'Pending'}
                    </span>
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
                      {isThu ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>

                  {/* Column 6: Actions */}
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        className="action-btn-mock edit-btn"
                        onClick={() => openModal(transaction)}
                        title="Sửa"
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
                        title="Xóa"
                      >
                        <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
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