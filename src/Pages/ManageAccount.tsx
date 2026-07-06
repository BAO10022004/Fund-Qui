import React, { useState, useEffect } from 'react';
import {
  getAllAccounts,
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
import { Auth } from '../Auth';
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
  handleResetPassword 
}: {
  accounts: (Account & { person?: Person })[];
  openModal: (account?: Account) => void;
  handleDelete: (id: string) => void;
  handleResetPassword: (id: string) => void;
}) => (
  <div className="grid-accounts-container">
    <table className="accounts-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Tên người dùng</th>
          <th>Mã nhân viên</th>
          <th>Vai trò</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {accounts.length === 0 ? (
          <tr>
            <td colSpan={5} className="empty-state-accounts">
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
              <td>
                <div className="account-username">
                  <div className="account-avatar">
                    {account.username.charAt(0).toUpperCase()}
                  </div>
                  <strong>{account.username}</strong>
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
  handleSubmit
}: {
  editingAccount: Account | null;
  formData: {
    username: string;
    password: string;
    userName: string;
    codePerson: string;
    role: 'admin' | 'user';
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  persons: Person[];
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: () => void;
}) => (
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
        <div className="form-group-accounts">
          <label className="form-label-accounts">Username</label>
          <input
            className="form-input-accounts"
            type="text"
            placeholder="Nhập username..."
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        {!editingAccount && (
          <div className="form-group-accounts">
            <label className="form-label-accounts">Mật khẩu</label>
            <input
              className="form-input-accounts"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        )}

        <div className="form-group-accounts">
          <label className="form-label-accounts">Tên người dùng</label>
          <input
            className="form-input-accounts"
            type="text"
            placeholder="Nhập tên..."
            value={formData.userName}
            onChange={e => setFormData({ ...formData, userName: e.target.value })}
          />
        </div>

        <div className="form-group-accounts">
          <label className="form-label-accounts">Chọn nhân viên</label>
          <select
            className="form-input-accounts"
            value={formData.codePerson}
            onChange={e => setFormData({ ...formData, codePerson: e.target.value })}
          >
            <option value="">-- Chọn nhân viên --</option>
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

// Main Page Component
const ManageAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<(Account & { person?: Person })[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const auth = new Auth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userName: '',
    codePerson: '',
    role: 'user' as 'admin' | 'user'
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
        role: account.role
      });
    } else {
      setEditingAccount(null);
      setFormData({
        username: '',
        password: '',
        userName: '',
        codePerson: '',
        role: 'user'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.userName || !formData.codePerson) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (!editingAccount && !formData.password) {
      alert('Vui lòng nhập mật khẩu!');
      return;
    }
    
    // Ensure role has a valid value
    if (!formData.role || (formData.role !== 'admin' && formData.role !== 'user')) {
      alert('Vui lòng chọn vai trò hợp lệ!');
      return;
    }

    try {
      setLoading(true);
      
      if (editingAccount && editingAccount.id) {
        await updateAccount(editingAccount.id, {
          userName: formData.userName,
          codePerson: formData.codePerson,
          role: formData.role || 'user' // Ensure role is never undefined
        });
        logUpdate(auth.getUsername()!, `Cập nhật tài khoản có id: ${editingAccount.id}`);
        alert('✅ Cập nhật thành công!');
      } else {
        await createAccount({
          ...formData,
          role: formData.role || 'user' // Ensure role is never undefined
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