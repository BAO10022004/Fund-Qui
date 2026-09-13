import React from "react";

interface StatsData {
  total?: number;
  pending: number;
  completed: number;
  totalThu: number;
  totalChi: number;
}

interface StatisticsCardsProps {
  stats: StatsData;
  formatCurrency: (value: number) => string;
}

function StatisticsCards({ stats, formatCurrency }: StatisticsCardsProps) {
  const diff = stats.totalThu - stats.totalChi;

  return (
    <div className="qp-stats">
      <div className="stat-card pending">
        <div className="stat-label">Chưa hoàn thành</div>
        <div className="stat-value warning">{stats.pending}</div>
        <div className="stat-note">Đang chờ xử lý / duyệt</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
        <div className="stat-label">Hoàn thành</div>
        <div className="stat-value positive">{stats.completed}</div>
        <div className="stat-note">Đã xác nhận thành công</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
        <div className="stat-label">Tổng thu</div>
        <div className="stat-value positive">{formatCurrency(stats.totalThu)}</div>
        <div className="stat-note">Khoản tiền thu vào</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#f43f5e' } as React.CSSProperties}>
        <div className="stat-label">Tổng chi</div>
        <div className="stat-value negative">{formatCurrency(stats.totalChi)}</div>
        <div className="stat-note">Khoản tiền chi ra</div>
      </div>

      <div className="stat-card balance">
        <div className="stat-label">Chênh lệch (Quỹ)</div>
        <div className={`stat-value ${diff >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(diff)}
        </div>
        <div className="stat-note">{diff >= 0 ? 'Số dư dương' : 'Số dư âm'}</div>
      </div>
    </div>
  );
}

export default StatisticsCards;