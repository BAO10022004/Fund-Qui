// EditAccount.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAccountById, updateAccount } from '../services/AccountService';
import { getAllPersons } from '../services/PersonService';
import type { Account } from '../models/Account';
import type { Person } from '../models/Person';
import '../assets/EditAccount.css';

const EditAccount: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [persons, setPersons] = useState<Person[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user',
    codePerson: ''
  });

  const [originalAccount, setOriginalAccount] = useState<Account | null>(null);

  useEffect(() => {
    loadData();
  }, [accountId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!accountId) {
        setError('Không tìm thấy ID tài khoản');
        return;
      }

      const account = await getAccountById(accountId);
      if (!account) {
        setError('Không tìm thấy tài khoản');
        return;
      }

      setOriginalAccount(account);
      setFormData({
        username: account.username,
        password: '',
        confirmPassword: '',
        role: account.role,
        codePerson: account.codePerson
      });

      const personsList = await getAllPersons();
      setPersons(personsList);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('Vui lòng nhập username');
      return false;
    }

    if (!formData.codePerson) {
      setError('Vui lòng chọn người');
      return false;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !accountId) return;

    try {
      setSaving(true);
      setError('');

      const updateData: Partial<Account> = {
        username: formData.username,
        role: formData.role,
        codePerson: formData.codePerson
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateAccount(accountId, updateData);

      setSuccess('Cập nhật tài khoản thành công!');
      
      setTimeout(() => {
        navigate('/accounts');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounts');
  };

  if (loading) {
    return (
      <div className="edit-account-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="edit-account-container">
      <div className="edit-account-card">
        <div className="edit-account-header">
          <h1>Chỉnh Sửa Tài Khoản</h1>
          <p>Cập nhật thông tin tài khoản</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <p>{success}</p>
          </div>
        )}

        <div className="edit-account-form">
          {/* Username */}
          <div className="form-group">
            <label>
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Nhập username"
              required
            />
          </div>

          {/* Chọn Person */}
          <div className="form-group">
            <label>
              Người <span className="required">*</span>
            </label>
            <select
              name="codePerson"
              value={formData.codePerson}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Chọn người --</option>
              {persons.map(person => (
                <option key={person.code} value={person.code}>
                  {person.code} - {person.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="form-group">
            <label>
              Vai trò <span className="required">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Đổi mật khẩu */}
          <div className="password-section">
            <h3>Đổi Mật Khẩu (Tùy chọn)</h3>
            <p className="password-note">
              Để trống nếu không muốn thay đổi mật khẩu
            </p>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Đang lưu...' : 'Cập Nhật'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>

        {/* Info */}
        {originalAccount && (
          <div className="account-info">
            <h4>Thông tin</h4>
            <div className="info-details">
              <p>Tên hiện tại: {originalAccount.personName}</p>
              <p>Ngày tạo: {originalAccount.createdAt?.toDate().toLocaleString('vi-VN')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditAccount;