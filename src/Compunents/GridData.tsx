import React from 'react';
import '../assets/GripData.css';
function GripData(
    { filteredTransactions, formatCurrency, searchQuery }: 
    { filteredTransactions: any[]; formatCurrency: (amount: number) => string; searchQuery: string }
) {
    return (
        <div className="transactions">
        <div>
          <div>
            <strong>📊 Tổng số giao dịch:</strong> {filteredTransactions.length}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số tiền</th>
              <th>Loại</th>
              <th>Nội dung</th>
              <th>Người</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {searchQuery ? '🔍 Không tìm thấy kết quả phù hợp' : '📝 Chưa có giao dịch nào'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>
                    <div className="date-info">
                      <span className="day-of-week">{transaction.dayOfWeek}</span>
                      <span className="date-text">
                        {new Date(transaction.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`amount ${transaction.type === 'thu' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'thu' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${transaction.type === 'thu' ? 'income' : 'expense'}`}>
                      {transaction.type === 'thu' ? 'Thu' : 'Chi'}
                    </span>
                  </td>
                  <td>{transaction.description}</td>
                  <td>👤 {transaction.personName}</td>
                  <td>
                    <span className={`badge ${transaction.status}`}>
                      {transaction.status === 'completed' ? '✓ Đã thu' : '⏰ Chưa thu'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
}

export default GripData;