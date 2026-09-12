import React from "react";
import type { Transaction, TransactionStatus } from "../models/Transaction";
import type { Person } from "../models/Person";

function AddTransaction({ setShowModal, formData, setFormData, editingTransaction, handleSubmit, persons }:
    { setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
        formData: {
            date: string;
            amount: string;
            type: 'thu' | 'chi';
            description: string;
            personId: string;
            status: TransactionStatus;
        };
        setFormData: React.Dispatch<React.SetStateAction<{
            date: string;
            amount: string; 
            type: 'thu' | 'chi';
            description: string;
            personId: string;
            status: TransactionStatus;
        }>>;
        editingTransaction: Transaction | null;
        handleSubmit: () => void;
        persons: Person[];
    }
) {
    return (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTransaction ? '✏️ Sửa giao dịch' : '➕ Thêm giao dịch mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>📅 Ngày</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>💳 Loại giao dịch</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'thu' | 'chi' })}
                  >
                    <option value="thu">💵 Thu</option>
                    <option value="chi">💸 Chi</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>👤 Người</label>
                  <select
                    value={formData.personId}
                    onChange={e => setFormData({ ...formData, personId: e.target.value })}
                  >
                    <option value="">-- Chọn người --</option>
                    {persons.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name} ({person.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>💰 Số tiền</label>
                  <input
                    type="number"
                    placeholder="Nhập số tiền..."
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>📋 Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                >
                  <option value="completed">✅ Hoàn thành</option>
                  <option value="waiting">🕒 Chờ xác nhận</option>
                  <option value="pending">⏳ Chưa hoàn thành</option>
                </select>
              </div>

              <div className="form-group">
                <label>📝 Mô tả</label>
                <textarea
                  placeholder="Nhập mô tả (tùy chọn)..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingTransaction ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
    );
}
export default AddTransaction;