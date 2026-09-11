import React, { useState, useEffect } from 'react';
import {
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsWithPersonInfo
} from '../services/AccountService';
import { getAllPersons } from '../services/PersonService';
import type { Account } from '../models/Account';
import type { Person } from '../models/Person';
import '../assets/ManageAccounts.css';
import { logCreate, logUpdate, logDelete } from '../services/HistoryService';
import { auth } from '../Auth';
import { uploadAvatarToFirebase } from '../services/ImageService';
// Header Component
const HeaderManageAccounts = ({ openModal }: { openModal: () => void }) => (
  <div className="header-accounts-container">
    <div className="header-accounts-title-wrapper">
      <div className="header-accounts-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
          <path d="M16 11h6M19 8v6"></path>
        </svg>
      </div>
      <h1 className="header-accounts-title">Quản lý Tài khoản</h1>
    </div>
    
    <button className="add-accounts-button" onClick={openModal}>
      <span className="add-accounts-button-icon">+</span>
      <span className="add-accounts-button-text">Thêm tài khoản</span>
    </button>
  </div>
);

// Grid Component
const GridAccounts = ({ 
  accounts, 
  openModal, 
  handleDelete,
  handleResetPassword,
  handleQuickAvatarUpload
}: {
  accounts: (Account & { person?: Person })[];
  openModal: (account?: Account) => void;
  handleDelete: (id: string) => void;
  handleResetPassword: (id: string) => void;
  handleQuickAvatarUpload: (account: Account, file: File) => void;
}) => (
  <div className="grid-accounts-container">
    <table className="accounts-table">
      <thead>
        <tr>
          <th style={{ width: '90px', textAlign: 'center' }}>Avatar</th>
          <th>Username / Email</th>
          <th>Tên người dùng</th>
          <th>Mã nhân viên</th>
          <th>Vai trò</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {accounts.length === 0 ? (
          <tr>
            <td colSpan={6} className="empty-state-accounts">
              <div className="empty-icon-accounts">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <p className="empty-text-accounts">Chưa có tài khoản nào</p>
              <p className="empty-subtext-accounts">Nhấn "Thêm tài khoản" để bắt đầu</p>
            </td>
          </tr>
        ) : (
          accounts.map(account => (
            <tr key={account.id}>
              <td style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}>
                  {account.avatar ? (
                    <img
                      src={account.avatar}
                      alt={account.userName || account.username}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2.5px solid #10b981',
                        boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                        display: 'block'
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fb = (e.target as HTMLElement).nextElementSibling;
                        if (fb) (fb as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div
                    className="account-avatar"
                    style={{
                      margin: '0 auto',
                      width: '46px',
                      height: '46px',
                      fontSize: '17px',
                      display: account.avatar ? 'none' : 'flex'
                    }}
                  >
                    {account.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Nút tải / đổi avatar nhanh ngay tại dòng tài khoản */}
                  <label
                    title="Bấm để đổi avatar nhanh cho tài khoản này"
                    style={{
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#1e88e5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      cursor: 'pointer',
                      border: '1.5px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    📷
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQuickAvatarUpload(account, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '14px' }}>{account.username}</strong>
                  {account.avatar ? (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                      ✓ Đã có Avatar
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Chưa có Avatar riêng
                    </span>
                  )}
                </div>
              </td>
              <td>{account.personName}</td>
              <td>
                <span className="account-code">{account.codePerson}</span>
              </td>
              <td>
                <span className={`account-role ${account.role}`}>
                  {account.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
              </td>
              <td className="actions-cell-accounts">
                <button
                  className="btn-accounts btn-edit-accounts"
                  onClick={() => openModal(account)}
                  title="Sửa"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  className="btn-accounts btn-reset-accounts"
                  onClick={() => handleResetPassword(account.id!)}
                  title="Reset mật khẩu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </button>
                <button
                  className="btn-accounts btn-delete-accounts"
                  onClick={() => handleDelete(account.id!)}
                  title="Xóa"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// Modal Component
const AccountModal = ({
  editingAccount,
  formData,
  setFormData,
  persons,
  setShowModal,
  handleSubmit,
  onAvatarAutoSaved
}: {
  editingAccount: Account | null;
  formData: {
    username: string;
    password: string;
    userName: string;
    codePerson: string;
    role: 'admin' | 'user';
    avatar?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  persons: Person[];
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: () => void;
  onAvatarAutoSaved?: (accountId: string, newAvatar: string) => void;
}) => {
  const [compressing, setCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      setCompressStatus('Đang nén ảnh WebP...');
      const uploadedUrl = await uploadAvatarToFirebase(
        file,
        formData.username || 'avatar',
        (status) => setCompressStatus(status)
      );
      setFormData((prev: any) => ({ ...prev, avatar: uploadedUrl }));

      // Nếu đang sửa tài khoản, lưu ngay vào Firestore để hiển thị tức thì trên giao diện
      if (editingAccount && editingAccount.id) {
        await updateAccount(editingAccount.id, { avatar: uploadedUrl });
        onAvatarAutoSaved?.(editingAccount.id, uploadedUrl);
        const cur = auth.getCurrentUser();
        if (cur && (cur.username === editingAccount.username || cur.email === editingAccount.username)) {
          auth.updateUser({ avatar: uploadedUrl });
        }
      }
    } catch (err: any) {
      console.error('Compression/Upload error:', err);
      alert(`❌ Lỗi xử lý ảnh: ${err.message || 'Không thể nén ảnh'}`);
    } finally {
      setCompressing(false);
      setTimeout(() => setCompressStatus(null), 5000);
    }
  };

  return (
    <div className="modal-overlay-accounts" onClick={() => setShowModal(false)}>
      <div className="modal-content-accounts" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-accounts" onClick={() => setShowModal(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="modal-header-accounts">
          <div className="modal-icon-accounts">
            {editingAccount ? '✏️' : '👤'}
          </div>
          <h2 className="modal-title-accounts">
            {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
          </h2>
        </div>

        <div className="modal-body-accounts">
          {/* Trường Avatar riêng có tính năng Tự động nén & Hiển thị ngay */}
          <div className="form-group-accounts">
            <label className="form-label-accounts" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Ảnh đại diện riêng (Avatar)</span>
              {formData.avatar && (
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                  ✓ Đã tải ảnh lên thành công
                </span>
              )}
            </label>

            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              padding: '14px',
              background: formData.avatar ? '#f0fdf4' : '#f8fafc',
              border: formData.avatar ? '2px solid #86efac' : '2px dashed #cbd5e1',
              borderRadius: '12px',
              transition: 'all 0.25s ease'
            }}>
              {formData.avatar ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #10b981',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      display: 'block'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2.5px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Đã tải ảnh lên thành công"
                  >
                    ✓
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: '2px dashed #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '32px',
                    flexShrink: 0
                  }}
                >
                  👤
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.avatar && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      ⚡ ĐÃ TẢI LÊN THÀNH CÔNG
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Nén WebP siêu nhẹ (~20KB)
                    </span>
                  </div>
                )}

                <input
                  className="form-input-accounts"
                  type="text"
                  placeholder="URL ảnh hoặc bấm chọn file từ máy..."
                  value={formData.avatar || ''}
                  onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                  style={{ fontSize: '12.5px', padding: '6px 10px' }}
                />

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      background: '#1e88e5',
                      color: 'white',
                      cursor: compressing ? 'wait' : 'pointer',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(30, 136, 229, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📁 {formData.avatar ? 'Đổi ảnh khác' : 'Chọn ảnh tải lên'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={compressing}
                      onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                      onChange={handleFileSelect}
                    />
                  </label>

                  {formData.avatar && !compressing && (
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                      onClick={() => setFormData((prev: any) => ({ ...prev, avatar: '' }))}
                    >
                      ✕ Gỡ avatar
                    </button>
                  )}

                  {compressing && (
                    <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                      ⚡ {compressStatus || 'Đang nén & lưu Firebase...'}
                    </span>
                  )}
                  {!compressing && compressStatus && (
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                      {compressStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <small style={{ fontSize: '11.5px', color: '#64748b', marginTop: '5px', display: 'block' }}>
              ⚡ Hệ thống <strong>tự động nén ảnh vuông chuẩn (~20KB)</strong> và lưu trữ vào Firebase để tải tức thì.
            </small>
          </div>

        <div className="form-group-accounts">
          <label className="form-label-accounts">Email Google / Username</label>
          <input
            className="form-input-accounts"
            type="text"
            placeholder="vd: user@gmail.com hoặc username..."
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        {!editingAccount && (
          <div className="form-group-accounts">
            <label className="form-label-accounts">Mật khẩu (Tùy chọn nếu đăng nhập Google)</label>
            <input
              className="form-input-accounts"
              type="password"
              placeholder="Để trống nếu tài khoản dùng đăng nhập Google..."
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        )}

        <div className="form-group-accounts">
          <label className="form-label-accounts">Tên người dùng / Họ và tên</label>
          <input
            className="form-input-accounts"
            type="text"
            placeholder="vd: Nguyễn Văn A..."
            value={formData.userName}
            onChange={e => setFormData({ ...formData, userName: e.target.value })}
          />
        </div>

        <div className="form-group-accounts">
          <label className="form-label-accounts">Liên kết nhân viên (Tùy chọn)</label>
          <select
            className="form-input-accounts"
            value={formData.codePerson}
            onChange={e => setFormData({ ...formData, codePerson: e.target.value })}
          >
            <option value="">-- Tự động gán mã người dùng --</option>
            {persons.map(person => (
              <option key={person.id} value={person.code}>
                {person.name} ({person.code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group-accounts">
          <label className="form-label-accounts">Vai trò</label>
          <select
            className="form-input-accounts"
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
          >
            <option value="user">👤 User</option>
            <option value="admin">👑 Admin</option>
          </select>
        </div>
      </div>

      <div className="modal-footer-accounts">
        <button className="btn-cancel-accounts" onClick={() => setShowModal(false)}>
          Hủy
        </button>
        <button className="btn-submit-accounts" onClick={handleSubmit}>
          {editingAccount ? 'Cập nhật' : 'Thêm'}
        </button>
      </div>
    </div>
  </div>
  );
};

// Main Page Component
const ManageAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<(Account & { person?: Person })[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userName: '',
    codePerson: '',
    role: 'user' as 'admin' | 'user',
    avatar: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, personsData] = await Promise.all([
        getAccountsWithPersonInfo(),
        getAllPersons()
      ]);
      setAccounts(accountsData);
      setPersons(personsData);
    } catch (error) {
      alert('Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        username: account.username,
        password: '',
        userName: account.userName,
        codePerson: account.codePerson,
        role: account.role,
        avatar: account.avatar || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        username: '',
        password: '',
        userName: '',
        codePerson: '',
        role: 'user',
        avatar: ''
      });
    }
    setShowModal(true);
  };

  const handleQuickAvatarUpload = async (account: Account, file: File) => {
    if (!account.id) return;
    try {
      setLoading(true);
      const uploadedUrl = await uploadAvatarToFirebase(file, account.username || 'avatar');
      await updateAccount(account.id, { avatar: uploadedUrl });
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, avatar: uploadedUrl } : a));

      const cur = auth.getCurrentUser();
      if (cur && (cur.username === account.username || cur.email === account.username)) {
        auth.updateUser({ avatar: uploadedUrl });
      }
      alert(`✅ Đã tải lên và hiển thị avatar thành công cho tài khoản ${account.username}!`);
    } catch (err: any) {
      alert(`❌ Lỗi tải avatar: ${err.message || 'Không thể tải ảnh'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.userName.trim()) {
      alert('Vui lòng nhập Email/Username và Tên người dùng!');
      return;
    }

    const assignedCodePerson = formData.codePerson || ('USER_' + Math.random().toString(36).substring(2, 7).toUpperCase());
    const finalPassword = formData.password || 'GOOGLE_AUTH_ACCOUNT';
    const finalRole: 'admin' | 'user' = formData.role === 'admin' ? 'admin' : 'user';

    try {
      setLoading(true);
      
      if (editingAccount && editingAccount.id) {
        await updateAccount(editingAccount.id, {
          userName: formData.userName,
          codePerson: assignedCodePerson,
          role: finalRole,
          avatar: formData.avatar || ''
        });
        logUpdate(auth.getUsername()!, `Cập nhật tài khoản có id: ${editingAccount.id}`);

        // Cập nhật auth nếu là tài khoản đang đăng nhập
        const cur = auth.getCurrentUser();
        if (cur && (cur.username === editingAccount.username || cur.email === editingAccount.username)) {
          auth.updateUser({ avatar: formData.avatar || null, displayName: formData.userName });
        }
        alert('✅ Cập nhật thành công!');
      } else {
        await createAccount({
          username: formData.username.trim(),
          userName: formData.userName.trim(),
          password: finalPassword,
          codePerson: assignedCodePerson,
          role: finalRole,
          avatar: formData.avatar || ''
        });
        logCreate(auth.getUsername()!, `Thêm tài khoản mới với username: ${formData.username}`);
        alert('✅ Thêm tài khoản thành công!');
      }
      
      await loadData();
      setShowModal(false);
    } catch (error: any) {
      alert(`❌ ${error.message || 'Có lỗi xảy ra!'}`);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (await (window as any).customConfirm('Bạn có chắc muốn xóa tài khoản này?')) {
      try {
        setLoading(true);
        await deleteAccount(id);
        await loadData();
        logDelete(auth.getUsername()!,  `Xóa tài khoản có id: ${id}`);
        alert('✅ Xóa thành công!');
      } catch (error) {
        alert('❌ Không thể xóa!');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Nhập mật khẩu mới:');
    if (newPassword) {
      try {
        setLoading(true);
        await updateAccount(id, { password: newPassword });
        logUpdate(auth.getUsername()!, `Đặt lại mật khẩu cho tài khoản có id: ${id}`);
        alert('✅ Đặt lại mật khẩu thành công!');
      } catch (error) {
        alert('❌ Không thể đặt lại mật khẩu!');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="page-loader-accounts">
        <div className="loader-spinner-accounts"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="manage-accounts-page">
      <div className="page-content-accounts">
        <HeaderManageAccounts openModal={openModal} />
        <GridAccounts 
          accounts={accounts}
          openModal={openModal}
          handleDelete={handleDelete}
          handleResetPassword={handleResetPassword}
          handleQuickAvatarUpload={handleQuickAvatarUpload}
        />
      </div>

      {showModal && (
        <AccountModal
          editingAccount={editingAccount}
          formData={formData}
          setFormData={setFormData}
          persons={persons}
          setShowModal={setShowModal}
          handleSubmit={handleSubmit}
          onAvatarAutoSaved={(accountId, newAvatar) => {
            setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, avatar: newAvatar } : a));
          }}
        />
      )}

      {loading && (
        <div className="loading-overlay-accounts">
          <div className="loading-spinner-accounts"></div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;