import React from "react";


function HeaderManageTransaction({ openModal }: { openModal: () => void }) {
    return (
        <div className="page-header">
        <h1>💰 Quản lý Giao dịch</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          ➕ Thêm giao dịch mới
        </button>
      </div>
    );
}
export default HeaderManageTransaction;