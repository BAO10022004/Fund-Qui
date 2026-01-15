import React from "react";
import type { Transaction } from "../models/Transaction";

function GridDataTransaction({ openModal,filteredTransactions , setFilteredTransactions,handleDelete  }: { openModal: (transaction: Transaction) => void } & { filteredTransactions: Transaction[] } & { setFilteredTransactions: React.Dispatch<React.SetStateAction<Transaction[]>> } & { handleDelete: (id: string | undefined) => void }) {

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

  

    return (
        <div className="table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Người</th>
              <th>Loại</th>
              <th>Số tiền</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  Không có giao dịch nào
                </td>
              </tr>
            ) : (
              filteredTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>
                    <div className="date-cell">
                      <div className="date-main">{transaction.date}</div>
                      <div className="date-sub">{transaction.dayOfWeek}</div>
                    </div>
                  </td>
                  <td>
                    <span className="person-badge">{transaction.personName}</span>
                  </td>
                  <td>
                    <span className={`type-badge type-${transaction.type}`}>
                      {transaction.type === 'thu' ? '💵 Thu' : '💸 Chi'}
                    </span>
                  </td>
                  <td>
                    <span className={`amount amount-${transaction.type}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="description-cell">{transaction.description || '—'}</td>
                  <td>
                    <span className={`status-badge status-${transaction.status}`}>
                      {transaction.status === 'pending' ? '⏳ Đang chờ' : '✅ Hoàn thành'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => openModal(transaction)}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(transaction.id!)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
}

export default GridDataTransaction;