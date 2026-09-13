import React, { useState, useEffect } from 'react';
import {
  createAction,
  getAllActions,
  updateAction,
  deleteAction,
} from '../services/ActionService';
import type { Action } from '../models/Action';
import '../assets/ManageAction.css';

const ActionManagement: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [filteredActions, setFilteredActions] = useState<Action[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deletingAction, setDeletingAction] = useState<Action | null>(null);
  const [formData, setFormData] = useState({ name: '', amount: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  // Helper định dạng số với dấu chấm ngăn cách
  const formatNumberWithDots = (val: string | number): string => {
    if (val === undefined || val === null || val === '') return '';
    const cleanNum = val.toString().replace(/\D/g, '');
    if (!cleanNum) return '';
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Load actions on mount
  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await getAllActions();
      console.log('📊 Loaded actions:', data);
      setActions(data);
      setFilteredActions(data);
    } catch (err: any) {
      console.error('❌ Load error:', err);
      showError('Không thể tải danh sách actions');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAction(null);
    setFormData({ name: '', amount: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (action: Action) => {
    setEditingAction(action);
    setFormData({ 
      name: action.name, 
      amount: action.amount !== undefined ? formatNumberWithDots(action.amount) : '' 
    });
    setError('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (action: Action) => {
    setDeletingAction(action);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  // ✅ FIX: Hàm submit đúng cách - XỬ LÝ CẢ CREATE VÀ UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    
    if (!trimmedName) {
      setError('Vui lòng nhập tên action!');
      return;
    }

    // Xóa dấu chấm khi chuyển đổi sang số
    const cleanAmountStr = formData.amount.toString().replace(/\./g, '').trim();
    const parsedAmount = cleanAmountStr ? parseFloat(cleanAmountStr) : undefined;

    try {
      setLoading(true);
      
      if (editingAction) {
        // ✏️ Update existing action
        console.log('📝 Updating action:', editingAction.id);
        await updateAction(editingAction.id!, { 
          name: trimmedName,
          amount: parsedAmount !== undefined && !isNaN(parsedAmount) ? parsedAmount : 0 
        });
        showSuccess('Cập nhật loại phạt thành công!');
      } else {
        // ➕ Create new action
        console.log('➕ Creating new action:', trimmedName);
        const newId = await createAction({
          name: trimmedName,
          amount: parsedAmount !== undefined && !isNaN(parsedAmount) ? parsedAmount : 0
        });
        console.log('✅ Created with ID:', newId);
        showSuccess('Tạo loại phạt mới thành công!');
      }
      
      closeModal();
      await loadActions(); // ♻️ Reload danh sách
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      setError(err.message || 'Có lỗi xảy ra khi lưu action');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAction) return;

    try {
      setLoading(true);
      console.log('🗑️ Deleting action:', deletingAction.id);
      await deleteAction(deletingAction.id!);
      showSuccess('Xóa action thành công!');
      closeDeleteModal();
      await loadActions();
    } catch (err) {
      console.error('❌ Delete error:', err);
      showError('Không thể xóa action');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredActions.length / itemsPerPage);

  const changePage = (delta: number) => {
    setCurrentPage((prev) => Math.max(1, Math.min(prev + delta, totalPages)));
  };

  return (
    <div className="action-management">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-top">
            <div className="header-info">
              <h1>⚡ Quản Lý Actions</h1>
              <p>
                Tổng số: <span>{actions.length}</span> actions
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreateModal} disabled={loading}>
              ➕ Tạo Mới
            </button>
          </div>

          {/* Alert Messages */}
          {success && (
            <div className="alert alert-success">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}
          {error && !isModalOpen && (
            <div className="alert alert-error">
              <span>❌</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card">
          {loading && <div className="loading-overlay">Đang tải...</div>}
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên Loại Phạt / Action</th>
                <th>Mức Tiền Mặc Định</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((action, index) => (
                  <tr key={action.id}>
                    <td>
                      <strong style={{ color: '#0f172a', fontWeight: 700 }}>{indexOfFirstItem + index + 1}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontWeight: 600 }}>{action.name}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: action.amount ? '#059669' : '#64748b' }}>
                        {action.amount ? new Intl.NumberFormat('vi-VN').format(action.amount) + ' ₫' : 'Chưa đặt'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openEditModal(action)}
                          title="Sửa"
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => openDeleteModal(action)}
                          title="Xóa"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="empty-state">
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <p>Không tìm thấy action nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => changePage(-1)} disabled={currentPage === 1 || loading}>
                ⬅ Trước
              </button>
              <span className="current-page">
                {currentPage} / {totalPages}
              </span>
              <button onClick={() => changePage(1)} disabled={currentPage === totalPages || loading}>
                Sau ➡
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="action-modal-overlay" onClick={closeModal}>
            <div className="action-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingAction ? 'Chỉnh Sửa Action' : 'Tạo Action Mới'}</h2>
                <button className="btn-close" onClick={closeModal} disabled={loading}>
                  &times;
                </button>
              </div>
              {/* ✅ FIX: Chỉ dùng onSubmit, KHÔNG dùng onClick trên button submit */}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="actionName">
                    Tên Loại Phạt / Action <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="actionName"
                    placeholder="Ví dụ: Đi trễ, Không dọn phòng, Vắng họp..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="actionAmount">
                    Số Tiền Phạt Mặc Định (VNĐ)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="actionAmount"
                    placeholder="Ví dụ: 10.000, 20.000, 50.000..."
                    value={formData.amount}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      amount: formatNumberWithDots(e.target.value) 
                    })}
                    disabled={loading}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    💡 Khi thêm giao dịch mới chọn loại phạt này, hệ thống sẽ tự động điền số tiền tương ứng.
                  </small>
                </div>
                {error && (
                  <div className="alert alert-error">
                    <span>❌</span>
                    <span>{error}</span>
                  </div>
                )}
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={closeModal} 
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  {/* ✅ FIX: CHỈ dùng type="submit", KHÔNG dùng onClick */}
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    💾 {loading ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && deletingAction && (
          <div className="action-modal-overlay" onClick={closeDeleteModal}>
            <div className="action-modal-card delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="icon">
                <span style={{ fontSize: '40px' }}>🗑️</span>
              </div>
              <h2>Xác Nhận Xóa</h2>
              <p>
                Bạn có chắc chắn muốn xóa action{' '}
                <span className="action-name">{deletingAction.name}</span>?
              </p>
              <p style={{ color: '#f44336', fontSize: '14px' }}>Hành động này không thể hoàn tác!</p>
              <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button className="btn btn-cancel" onClick={closeDeleteModal} disabled={loading}>
                  Hủy
                </button>
                <button className="btn btn-delete" onClick={handleDelete} disabled={loading}>
                  🗑️ {loading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionManagement;