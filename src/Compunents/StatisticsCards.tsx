import React from "react";

interface StatsData {
  total: number;
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
    return(
        <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Tổng giao dịch</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Đang chờ</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Hoàn thành</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>

        <div className="stat-card stat-thu">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">Tổng thu</div>
            <div className="stat-value">{formatCurrency(stats.totalThu)}</div>
          </div>
        </div>

        <div className="stat-card stat-chi">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <div className="stat-label">Tổng chi</div>
            <div className="stat-value">{formatCurrency(stats.totalChi)}</div>
          </div>
        </div>

        <div className="stat-card stat-balance">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Chênh lệch</div>
            <div className="stat-value">{formatCurrency(stats.totalThu - stats.totalChi)}</div>
          </div>
        </div>
      </div>
    );
}

export default StatisticsCards;