import React from "react";
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
}: {
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
}) {
    return (
        <div className="filters-container">
        <div className="filter-group">
          <label>🔍 Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo mô tả hoặc người..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>📋 Trạng thái</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="pending">Đang chờ</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>

        <div className="filter-group">
          <label>💳 Loại</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="thu">Thu</option>
            <option value="chi">Chi</option>
          </select>
        </div>

        <div className="filter-group">
          <label>📅 Từ ngày</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>📅 Đến ngày</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFilterStatus('all');
              setFilterType('all');
              setFilterDateFrom('');
              setFilterDateTo('');
              setSearchTerm('');
            }}
          >
            🔄 Đặt lại
          </button>
        </div>
      </div>
    )
}
export default FillterManageTransaction;