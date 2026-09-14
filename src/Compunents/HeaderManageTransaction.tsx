import React, { useState } from "react";
import addGif from '../assets/add.gif';
import addStatic from '../assets/add_static_clean.png';

interface HeaderManageTransactionProps {

  openModal: () => void;
  loadData?: () => void;
}

function HeaderManageTransaction({ openModal, loadData }: HeaderManageTransactionProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="qp-page-header">
      <div>
        <h1 className="qp-page-title">Quản lý Giao dịch</h1>
        <p className="qp-page-desc">Theo dõi, kiểm duyệt, thêm mới và quản lý toàn bộ giao dịch thu chi của Quỹ</p>
      </div>
      <div className="qp-header-actions">
        <button
          className={`qp-btn-add-transaction ${isHovered ? 'hovered' : ''}`}
          onClick={() => openModal()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Thêm giao dịch"
        >
          <div className="qp-btn-add-icon-wrapper">
            <img
              src={isHovered ? `${addGif}?t=${Date.now()}` : addStatic}
              alt="Add"
              className="qp-btn-add-icon"
            />
          </div>
          <span className="qp-btn-add-text">Thêm giao dịch</span>
        </button>
        {loadData && (
          <button className="qp-refresh-btn" onClick={() => loadData()} title="Tải lại dữ liệu mới nhất">
            🔄 Làm mới
          </button>
        )}
      </div>
    </div>
  );
}

export default HeaderManageTransaction;