import React from "react";

interface FillterManageTransactionProps {
  filterStatus: string;
  setFilterStatus: React.Dispatch<React.SetStateAction<string>>;
  filterType: string;
  setFilterType: React.Dispatch<React.SetStateAction<string>>;
  filterDateFrom: string;
  setFilterDateFrom: React.Dispatch<React.SetStateAction<string>>;
  filterDateTo: string;
  setFilterDateTo: React.Dispatch<React.SetStateAction<string>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

function FillterManageTransaction({
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  searchTerm,
  setSearchTerm,
}: FillterManageTransactionProps) {
  return (
    <div className="manage-trans-filter-card">
      <div className="filter-row-top">
        <div className="filter-search-box">
          <span className="filter-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo mô tả, tên người nộp, số tiền..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="filter-clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn-filter-reset"
          onClick={() => {
            setFilterStatus('all');
            setFilterType('all');
            setFilterDateFrom('');
            setFilterDateTo('');
            setSearchTerm('');
          }}
          title="Đặt lại bộ lọc về mặc định"
        >
          <span>🔄</span>
          <span>Đặt lại</span>
        </button>
      </div>

      <div className="filter-row-bottom">
        <div className="filter-field">
          <label className="filter-field-label">Trạng thái</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="filter-select-input"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">✅ Hoàn thành</option>
            <option value="waiting">🕒 Chờ xác nhận</option>
            <option value="pending">⏳ Chưa hoàn thành</option>
          </select>
        </div>

        <div className="filter-field">
          <label className="filter-field-label">Loại giao dịch</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="filter-select-input"
          >
            <option value="all">Tất cả loại (Thu & Chi)</option>
            <option value="thu">💵 Khoản thu</option>
            <option value="chi">💸 Khoản chi</option>
          </select>
        </div>

        <div className="filter-field">
          <label className="filter-field-label">Từ ngày</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="filter-date-input"
          />
        </div>

        <div className="filter-field">
          <label className="filter-field-label">Đến ngày</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="filter-date-input"
          />
        </div>
      </div>
    </div>
  );
}

export default FillterManageTransaction;