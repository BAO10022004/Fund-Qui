import React, { useState, useEffect } from 'react';
import {
  getAllPersons,
  addPerson,
  updatePerson,
  deletePerson,
  type Person
} from '../services/firestoreService';

const ManagePersons: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const data = await getAllPersons();
      setPersons(data);
    } catch (error) {
      alert('Không thể tải danh sách người!');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name,
        code: person.code
      });
    } else {
      setEditingPerson(null);
      setFormData({ name: '', code: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      setLoading(true);
      
      if (editingPerson && editingPerson.id) {
        await updatePerson(editingPerson.id, formData);
        alert('✅ Cập nhật thành công!');
      } else {
        await addPerson(formData);
        alert('✅ Thêm người thành công!');
      }
      
      await loadPersons();
      setShowModal(false);
    } catch (error) {
      alert('❌ Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    if (window.confirm('Bạn có chắc muốn xóa người này?\n⚠️ Cảnh báo: Các giao dịch liên quan sẽ không bị xóa nhưng có thể bị lỗi hiển thị!')) {
      try {
        setLoading(true);
        await deletePerson(id);
        await loadPersons();
        alert('✅ Xóa thành công!');
      } catch (error) {
        alert('❌ Không thể xóa!');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && persons.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Đang tải...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px' 
      }}>
        <h1>👥 Quản lý Người</h1>
        <button 
          className="btn btn-primary"
          onClick={() => openModal()}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          ➕ Thêm người mới
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Tên</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Mã</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {persons.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  color: '#999'
                }}>
                  Chưa có người nào
                </td>
              </tr>
            ) : (
              persons.map(person => (
                <tr key={person.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>
                    <strong>{person.name}</strong>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      background: '#e3f2fd',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}>
                      {person.code}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => openModal(person)}
                      style={{ marginRight: '10px' }}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(person.id)}
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPerson ? '✏️ Sửa người' : '➕ Thêm người mới'}</h2>
            </div>

            <div className="form-group">
              <label>Tên</label>
              <input
                type="text"
                placeholder="Nhập tên..."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Mã</label>
              <input
                type="text"
                placeholder="Nhập mã (VD: NVA001)..."
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
              >
                {editingPerson ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '10px',
          zIndex: 9999
        }}>
          ⏳ Đang xử lý...
        </div>
      )}
    </div>
  );
};

export default ManagePersons;