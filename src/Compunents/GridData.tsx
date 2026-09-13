import React, { useState, useEffect, useMemo } from 'react';
import type { Account } from '../models/Account';
import type { Person } from '../models/Person';
import '../assets/GripData.css';

// Clean neutral default avatar for users who do not have an account or avatar
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%23334155'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%2394a3b8'/%3E%3Cpath d='M14 52c0-9.94 8.06-18 18-18s18 8.06 18 18' fill='%2394a3b8'/%3E%3C/svg%3E";

interface GripDataProps {
  filteredTransactions: any[];
  formatCurrency: (amount: number) => string;
  searchQuery?: string;
  openModal?: (transaction: any) => void;
  handleDelete?: (id: string | undefined) => void;
  accounts?: Account[];
  persons?: Person[];
}

function GripData({
  filteredTransactions,
  formatCurrency,
  searchQuery = '',
  openModal,
  handleDelete,
  accounts = [],
  persons = []
}: GripDataProps) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to first page when transactions length changes (due to filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTransactions.length]);

  // Lookup maps for fast and accurate account & person linking
  const { personById, personByName, accountByCode, accountByName, accountByUsername } = useMemo(() => {
    const pById = new Map<string, Person>();
    const pByName = new Map<string, Person>();
    for (const p of persons) {
      if (p.id) pById.set(p.id, p);
      if (p.name) pByName.set(p.name.trim().toLowerCase(), p);
    }

    const aByCode = new Map<string, Account>();
    const aByName = new Map<string, Account>();
    const aByUsername = new Map<string, Account>();
    for (const a of accounts) {
      if (a.codePerson) aByCode.set(a.codePerson.trim().toLowerCase(), a);
      if (a.personName) aByName.set(a.personName.trim().toLowerCase(), a);
      if (a.userName) aByUsername.set(a.userName.trim().toLowerCase(), a);
      if (a.username) aByUsername.set(a.username.trim().toLowerCase(), a);
    }

    return {
      personById: pById,
      personByName: pByName,
      accountByCode: aByCode,
      accountByName: aByName,
      accountByUsername: aByUsername
    };
  }, [accounts, persons]);

  // Helper to find linked account avatar for each transaction
  const getAvatarInfo = (transaction: any) => {
    // 1. Find Person
    const person = 
      (transaction.personId && personById.get(transaction.personId)) ||
      (transaction.personName && personByName.get(transaction.personName.trim().toLowerCase()));

    // 2. Find Account
    let account: Account | undefined;
    if (person?.code) {
      account = accountByCode.get(person.code.trim().toLowerCase());
    }
    if (!account && transaction.personName) {
      const normalizedName = transaction.personName.trim().toLowerCase();
      account = accountByName.get(normalizedName) || accountByUsername.get(normalizedName);
    }

    // Avatar priority: account.avatar -> person.avatar -> null (default)
    const avatarUrl = account?.avatar || person?.avatar || null;
    const hasAccount = !!account;

    return {
      avatarUrl: avatarUrl || DEFAULT_AVATAR,
      hasAccount,
      accountUsername: account?.userName || account?.username || null
    };
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
            {openModal && <th style={{ textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody key={`${currentPage}-${filteredTransactions.map(t => t.id).join('-')}`}>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={openModal ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                {searchQuery ? '🔍 Không tìm thấy kết quả phù hợp' : '📝 Chưa có giao dịch nào'}
              </td>
            </tr>
          ) : (
            currentItems.map((transaction) => {
              const isThu = transaction.type === 'thu';
              const { avatarUrl, hasAccount, accountUsername } = getAvatarInfo(transaction);
              
              // Formatting transaction date nicely
              let dateDisplay = '';
              try {
                const formattedDate = new Date(transaction.date).toLocaleDateString('vi-VN');
                dateDisplay = `${transaction.dayOfWeek || ''}${transaction.dayOfWeek ? ', ' : ''}${formattedDate}`;
              } catch {
                dateDisplay = transaction.date;
              }

              return (
                <tr key={transaction.id}>
                  {/* Column 1: User details */}
                  <td>
                    <div className="user-cell">
                      <div 
                        className={`user-avatar ${!hasAccount ? 'no-account' : ''}`}
                        title={hasAccount ? `Tài khoản: @${accountUsername || 'linked'}` : 'Chưa có tài khoản (Hiển thị ảnh mặc định)'}
                      >
                        <img
                          src={avatarUrl}
                          alt={transaction.personName || 'User avatar'}
                          className="user-avatar-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>
                      <div className="user-info">
                        <span className="user-name">{transaction.personName || 'Không rõ'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'nowrap' }}>
                          {transaction.actionName && (
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              title={`Loại phạt / lỗi: ${transaction.actionName}`}
                            >
                              ⚡ {transaction.actionName}
                            </span>
                          )}
                          <span className="user-subtext" title={transaction.description}>
                            {transaction.description || 'Không có mô tả'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Type (Phân loại: Thu/Chi) */}
                  <td>
                    <span className={`role-text ${isThu ? 'type-thu' : 'type-chi'}`}>
                      {isThu ? 'Khoản thu' : 'Khoản chi'}
                    </span>
                  </td>

                  {/* Column 3: Status (Trạng thái) */}
                  <td>
                    {transaction.status === 'completed' ? (
                      <span className="status-pill completed">Hoàn thành</span>
                    ) : transaction.status === 'waiting' ? (
                      <span className="status-pill waiting">Chờ xác nhận</span>
                    ) : (
                      <span className="status-pill pending">Chưa hoàn thành</span>
                    )}
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

                  {/* Column 6: Actions (Dành cho Quản lý giao dịch) */}
                  {openModal && (
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'center' }}>
                        <button
                          className="action-btn-mock edit-btn"
                          onClick={() => openModal(transaction)}
                          title="Sửa giao dịch"
                        >
                          <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </button>
                        {handleDelete && (
                          <button
                            className="action-btn-mock delete-btn"
                            onClick={() => handleDelete(transaction.id)}
                            title="Xóa giao dịch"
                          >
                            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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