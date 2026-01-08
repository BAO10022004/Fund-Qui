import React from "react";
import "../assets/header.css";

function Header({stats, setShowModal}: {
  stats: {
    currentFund: number;
    pendingFund: number;
    totalIncome: number;
    totalExpense: number;
  }, 
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="header">
      <div className="header-top">
        <h1>💰 Quản Lý Quỹ Phòng</h1>
        {/* <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Thêm giao dịch
        </button> */}
      </div>

      <div className="stats">
        <div className="stat-card balance">
          <div className="stat-label">Tổng Quỹ Hiện Tại</div>
          <div className={`stat-value ${stats.currentFund >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(stats.currentFund)}
          </div>
          <div className="stat-note">Đã hoàn thành</div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-label">Quỹ Chưa Thu</div>
          <div className="stat-value warning">{formatCurrency(stats.pendingFund)}</div>
          <div className="stat-note">Đang chờ</div>
        </div>
      </div>
    </div>
  );
}

export default Header;