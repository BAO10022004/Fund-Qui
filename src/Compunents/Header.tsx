// Header.tsx - Chỉ export stats data, layout do QuyPhong.tsx quản lý
import React from "react";
import "../assets/header.css";

function Header({ stats }: {
  stats: {
    currentFund: number;
    pendingFund: number;
    totalIncome: number;
    totalExpense: number;
  };
}) {
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

  return (
    <div className="qp-stats">
      <div className="stat-card balance">
        <div className="stat-label">Quỹ hiện tại</div>
        <div className={`stat-value ${stats.currentFund >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(stats.currentFund)}
        </div>
        <div className="stat-note">Đã hoàn thành</div>
      </div>

      <div className="stat-card pending">
        <div className="stat-label">Chưa thu</div>
        <div className="stat-value warning">{formatCurrency(stats.pendingFund)}</div>
        <div className="stat-note">Đang chờ xử lý</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
        <div className="stat-label">Tổng thu</div>
        <div className="stat-value positive">{formatCurrency(stats.totalIncome)}</div>
        <div className="stat-note">Đã hoàn thành</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#f43f5e' } as React.CSSProperties}>
        <div className="stat-label">Tổng chi</div>
        <div className="stat-value negative">{formatCurrency(stats.totalExpense)}</div>
        <div className="stat-note">Đã hoàn thành</div>
      </div>
    </div>
  );
}

export default Header;