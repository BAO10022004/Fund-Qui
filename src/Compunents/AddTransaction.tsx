import React from "react";
import type { Transaction, TransactionStatus } from "../models/Transaction";
import type { Person } from "../models/Person";
import type { Action } from "../models/Action";

// Hàm định dạng số có dấu chấm ngăn cách hàng nghìn (ví dụ: 20000 -> 20.000)
const formatNumberWithDots = (val: string | number): string => {
  if (val === undefined || val === null || val === '') return '';
  const cleanNum = val.toString().replace(/\D/g, '');
  if (!cleanNum) return '';
  return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

function AddTransaction({
  setShowModal,
  formData,
  setFormData,
  editingTransaction,
  handleSubmit,
  persons,
  actions = []
}: {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  formData: {
    date: string;
    amount: string;
    type: 'thu' | 'chi';
    description: string;
    personId: string;
    status: TransactionStatus;
    actionId?: string;
    actionName?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    date: string;
    amount: string;
    type: 'thu' | 'chi';
    description: string;
    personId: string;
    status: TransactionStatus;
    actionId?: string;
    actionName?: string;
  }>>;
  editingTransaction: Transaction | null;
  handleSubmit: () => void;
  persons: Person[];
  actions?: Action[];
}) {
  // Khi người dùng chọn Loại phạt / Tội (Action) -> Tự động điền số tiền và gợi ý mô tả
  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedActionId = e.target.value;
    if (!selectedActionId) {
      setFormData(prev => ({
        ...prev,
        actionId: '',
        actionName: ''
      }));
      return;
    }

    const matchedAction = actions.find(a => a.id === selectedActionId);
    if (matchedAction) {
      setFormData(prev => ({
        ...prev,
        actionId: matchedAction.id || '',
        actionName: matchedAction.name,
        // Tự động điền số tiền định dạng dấu chấm nếu action có đặt số tiền
        amount: (matchedAction.amount !== undefined && matchedAction.amount > 0)
          ? formatNumberWithDots(matchedAction.amount)
          : prev.amount,
        // Tự động gợi ý mô tả nếu mô tả đang trống
        description: prev.description ? prev.description : `Phạt lỗi: ${matchedAction.name}`
      }));
    }
  };

  // Xử lý khi người dùng nhập số tiền: tự động thêm dấu chấm ngăn cách hàng nghìn
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatNumberWithDots(rawVal);
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  return (
    <div className="qp-modal-overlay" onClick={() => setShowModal(false)}>
      <div className="qp-modal-card" onClick={e => e.stopPropagation()}>
        <div className="qp-modal-header">
          <h2 className="qp-modal-title">
            {editingTransaction ? '✏️ Cập nhật giao dịch' : '➕ Thêm giao dịch mới'}
          </h2>
          <button className="qp-modal-close-btn" onClick={() => setShowModal(false)} title="Đóng">
            ✕
          </button>
        </div>

        <div className="qp-modal-body">
          <div className="qp-form-grid">
            <div className="qp-form-group">
              <label className="qp-form-label"> Ngày giao dịch</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="qp-form-input"
              />
            </div>

            <div className="qp-form-group">
              <label className="qp-form-label"> Loại giao dịch</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'thu' | 'chi' })}
                className="qp-form-select"
              >
                <option value="thu"> Khoản thu</option>
                <option value="chi"> Khoản chi</option>
              </select>
            </div>

            <div className="qp-form-group">
              <label className="qp-form-label"> Thành viên liên quan</label>
              <select
                value={formData.personId}
                onChange={e => setFormData({ ...formData, personId: e.target.value })}
                className="qp-form-select"
              >
                <option value="">-- Chọn thành viên --</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trường Loại Phạt / Tội (Action) */}
            <div className="qp-form-group">
              <label className="qp-form-label">
                Loại Hoạt động
              </label>
              <select
                value={formData.actionId || ''}
                onChange={handleActionChange}
                className="qp-form-select"
              >
                <option value="">Khác</option>
                {actions.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="qp-form-group">
              <label className="qp-form-label"> Số tiền (VNĐ)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ví dụ: 20.000, 50.000..."
                value={formData.amount}
                onChange={handleAmountChange}
                className="qp-form-input"
              />
            </div>

            <div className="qp-form-group">
              <label className="qp-form-label"> Trạng thái thanh toán</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                className="qp-form-select"
              >
                <option value="completed"> Hoàn thành</option>
                <option value="pending"> Chưa hoàn thành</option>
                {editingTransaction && editingTransaction.status === 'waiting' && (
                  <option value="waiting"> Chờ xác nhận (Hiện tại)</option>
                )}
              </select>
            </div>

            <div className="qp-form-group full-width">
              <label className="qp-form-label"> Mô tả chi tiết</label>
              <textarea
                placeholder="Nhập nội dung hoặc ghi chú giao dịch..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="qp-form-textarea"
              />
            </div>
          </div>
        </div>

        <div className="qp-modal-footer">
          <button className="qp-btn-cancel" onClick={() => setShowModal(false)}>
            Hủy bỏ
          </button>
          <button className="qp-btn-submit" onClick={handleSubmit}>
            {editingTransaction ? '💾 Lưu thay đổi' : '➕ Thêm giao dịch'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTransaction;