import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { getAllActions } from '../services/ActionService';
import { 
  createDiary, 
  getAllDiaries, 
  updateDiary, 
  deleteDiary 
} from '../services/DiaryService';
import type { Action } from '../models/Action';
import type { Diary } from '../models/Diary';
import type { Session } from '../models/Session';
import '../assets/ManageDiary.css';
import { auth } from '../main';
const DiaryPage: React.FC = () => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('DiaryPage render - showModal:', showModal); // Debug log

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    morningNumber: 0,
    morningActionId: '',
    afternoonNumber: 0,
    afternoonActionId: '',
    username: 'current_user' // Replace with actual logged-in user
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [diariesData, actionsData] = await Promise.all([
        getAllDiaries(),
        getAllActions()
      ]);
      setDiaries(diariesData);
      setActions(actionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (diary?: Diary) => {
    console.log('Opening modal...'); // Debug log
    
    if (diary) {
      setEditingDiary(diary);
      const date = diary.date.toDate().toISOString().split('T')[0];
      setFormData({
        date,
        morningNumber: 0,
        morningActionId: diary.morningSessionId,
        afternoonNumber: 0,
        afternoonActionId: diary.afternoonSessionId,
        username: diary.username
      });
    } else {
      setEditingDiary(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        morningNumber: 0,
        morningActionId: '',
        afternoonNumber: 0,
        afternoonActionId: '',
        username: auth.getUsername() || 'current_user'
      });
    }
    setShowModal(true);
    console.log('Modal state set to true'); // Debug log
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiary(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.morningActionId || !formData.afternoonActionId) {
      alert('Vui lòng chọn hoạt động cho cả buổi sáng và chiều!');
      return;
    }

    try {
      setLoading(true);

      // Create sessions first (you need to implement session service)
      // For now, using mock session IDs
      const morningSessionId = `morning_${Date.now()}`;
      const afternoonSessionId = `afternoon_${Date.now()}`;

      const diaryData = {
        date: Timestamp.fromDate(new Date(formData.date)),
        morningSessionId,
        afternoonSessionId,
        username: formData.username
      };

      if (editingDiary) {
        await updateDiary(editingDiary.id!, diaryData);
        alert('Cập nhật nhật ký thành công!');
      } else {
        await createDiary(diaryData);
        alert('Thêm nhật ký thành công!');
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving diary:', error);
      alert(error.message || 'Lỗi khi lưu nhật ký!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (diaryId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhật ký này?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDiary(diaryId);
      alert('Xóa nhật ký thành công!');
      loadData();
    } catch (error) {
      console.error('Error deleting diary:', error);
      alert('Lỗi khi xóa nhật ký!');
    } finally {
      setLoading(false);
    }
  };

  const getActionName = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.name : 'N/A';
  };

  return (
    <div className="diary-page">
      <div className="container">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{padding: '10px', background: '#f0f0f0', marginBottom: '10px'}}>
            Modal visible: {showModal ? 'Yes' : 'No'}
          </div>
        )}
        
        {/* Header */}
        <div className="header">
          <h1>Quản lý Nhật ký</h1>
          <button 
            className="btn-add" 
            onClick={() => handleOpenModal()}
            disabled={loading}
          >
            <span className="icon">+</span>
            Thêm Nhật ký
          </button>
        </div>

        {/* Grid View */}
        <div className="diary-grid">
          {loading && diaries.length === 0 ? (
            <div className="loading">Đang tải...</div>
          ) : diaries.length === 0 ? (
            <div className="empty">Chưa có nhật ký nào</div>
          ) : (
            diaries.map(diary => (
              <div key={diary.id} className="diary-card">
                <div className="diary-header">
                  <h3 className="diary-date">
                    {diary.date.toDate().toLocaleDateString('vi-VN')}
                  </h3>
                  <div className="diary-actions">
                    <button 
                      className="btn-edit" 
                      onClick={() => handleOpenModal(diary)}
                      title="Cập nhật"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(diary.id!)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="diary-content">
                  <div className="session">
                    <h4>Buổi sáng</h4>
                    <p>Hoạt động: {getActionName(diary.morningSessionId)}</p>
                  </div>
                  <div className="session">
                    <h4>Buổi chiều</h4>
                    <p>Hoạt động: {getActionName(diary.afternoonSessionId)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingDiary ? 'Cập nhật Nhật ký' : 'Thêm Nhật ký'}</h2>
                <button className="btn-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Ngày tạo</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="session-group">
                  <h3>Buổi sáng</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Số cuộc gọi</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.morningNumber}
                        onChange={(e) => setFormData({...formData, morningNumber: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Hoạt động</label>
                      <select
                        value={formData.morningActionId}
                        onChange={(e) => setFormData({...formData, morningActionId: e.target.value})}
                        required
                      >
                        <option value="">-- Chọn hoạt động --</option>
                        {actions.map(action => (
                          <option key={action.id} value={action.id}>
                            {action.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="session-group">
                  <h3>Buổi chiều</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Số cuộc gọi</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.afternoonNumber}
                        onChange={(e) => setFormData({...formData, afternoonNumber: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Hoạt động</label>
                      <select
                        value={formData.afternoonActionId}
                        onChange={(e) => setFormData({...formData, afternoonActionId: e.target.value})}
                        required
                      >
                        <option value="">-- Chọn hoạt động --</option>
                        {actions.map(action => (
                          <option key={action.id} value={action.id}>
                            {action.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={handleCloseModal}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : (editingDiary ? 'Cập nhật' : 'Thêm')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryPage;