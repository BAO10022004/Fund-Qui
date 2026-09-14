import React from "react";
import AnimatedCounter from "./AnimatedCounter";

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
  refreshKey?: any;
}

function StatisticsCards({ stats, formatCurrency, refreshKey }: StatisticsCardsProps) {
  const diff = stats.totalThu - stats.totalChi;

  return (
    <div className="qp-stats">
      <div className="stat-card pending">
        <div className="stat-label">Chưa hoàn thành</div>
        <div className="stat-value warning">
          <AnimatedCounter value={stats.pending} duration={900} refreshKey={refreshKey} />
        </div>
        <div className="stat-note">Đang chờ xử lý / duyệt</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
        <div className="stat-label">Hoàn thành</div>
        <div className="stat-value positive">
          <AnimatedCounter value={stats.completed} duration={900} refreshKey={refreshKey} />
        </div>
        <div className="stat-note">Đã xác nhận thành công</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#10b981' } as React.CSSProperties}>
        <div className="stat-label">Tổng thu</div>
        <div className="stat-value positive">
          <AnimatedCounter
            value={stats.totalThu}
            formatter={formatCurrency}
            duration={1100}
            refreshKey={refreshKey}
          />
        </div>
        <div className="stat-note">Khoản tiền thu vào</div>
      </div>

      <div className="stat-card" style={{ '--card-accent': '#f43f5e' } as React.CSSProperties}>
        <div className="stat-label">Tổng chi</div>
        <div className="stat-value negative">
          <AnimatedCounter
            value={stats.totalChi}
            formatter={formatCurrency}
            duration={1100}
            refreshKey={refreshKey}
          />
        </div>
        <div className="stat-note">Khoản tiền chi ra</div>
      </div>

      <div className="stat-card balance">
        <div className="stat-label">Chênh lệch (Quỹ)</div>
        <div className={`stat-value ${diff >= 0 ? 'positive' : 'negative'}`}>
          <AnimatedCounter
            value={diff}
            formatter={formatCurrency}
            duration={1200}
            refreshKey={refreshKey}
          />
        </div>
        <div className="stat-note">{diff >= 0 ? 'Số dư dương' : 'Số dư âm'}</div>
      </div>
    </div>
  );
}

export default StatisticsCards;