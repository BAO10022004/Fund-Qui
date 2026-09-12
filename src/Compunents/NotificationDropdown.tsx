import React, { useState } from 'react';
import {
  type PaymentNotification,
  approvePaymentRequest,
  rejectPaymentRequest
} from '../services/NotificationService';
import '../assets/NotificationDropdown.css';

interface NotificationDropdownProps {
  isOpen?: boolean;
  onClose: () => void;
  notifications: PaymentNotification[];
  isAdmin?: boolean;
  adminName?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen = true,
  onClose,
  notifications,
  isAdmin = false,
  adminName = 'Admin'
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'waiting' | 'all'>('waiting');

  if (!isOpen) return null;

  const waitingCount = notifications.filter(n => n.status === 'waiting').length;

  const displayList = filterTab === 'waiting'
    ? notifications.filter(n => n.status === 'waiting')
    : notifications;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

  const formatTime = (ts: any) => {
    if (!ts) return '';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        ' ' + date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const handleApprove = async (e: React.MouseEvent, item: PaymentNotification) => {
    e.stopPropagation();
    if (!item.id || processingId) return;

    try {
      setProcessingId(item.id);
      await approvePaymentRequest(item.id, item.transactionIds || [], adminName);
      alert(`✅ Đã DUYỆT thành công khoản đóng quỹ ${formatCurrency(item.amount)} của ${item.senderName}!`);
    } catch (err: any) {
      console.error('Lỗi khi duyệt:', err);
      alert('❌ Lỗi khi duyệt: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, item: PaymentNotification) => {
    e.stopPropagation();
    if (!item.id || processingId) return;

    const confirmReject = window.confirm(
      `Bạn có chắc chắn muốn HỦY yêu cầu thanh toán ${formatCurrency(item.amount)} của ${item.senderName} không? (Khoản nợ sẽ trả về trạng thái Chưa hoàn thành)`
    );
    if (!confirmReject) return;

    try {
      setProcessingId(item.id);
      await rejectPaymentRequest(item.id, item.transactionIds || [], adminName);
      alert(`❌ Đã HỦY yêu cầu thanh toán của ${item.senderName}!`);
    } catch (err: any) {
      console.error('Lỗi khi hủy:', err);
      alert('❌ Lỗi khi hủy: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="notif-dropdown-card" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="notif-dropdown-header">
        <div className="notif-header-title">
          <span>🔔 Thông Báo Hệ Thống</span>
          {waitingCount > 0 && (
            <span className="notif-badge-pill">{waitingCount} chờ duyệt</span>
          )}
        </div>
        <button className="notif-close-icon-btn" onClick={onClose} title="Đóng">
          ✕
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="notif-tabs">
        <button
          className={`notif-tab ${filterTab === 'waiting' ? 'active' : ''}`}
          onClick={() => setFilterTab('waiting')}
        >
          Chờ duyệt ({waitingCount})
        </button>
        <button
          className={`notif-tab ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          Tất cả ({notifications.length})
        </button>
      </div>

      {/* List Content */}
      <div className="notif-scroll-area">
        {displayList.length === 0 ? (
          <div className="notif-empty-state">
            <span className="notif-empty-icon">📭</span>
            <p>
              {filterTab === 'waiting'
                ? 'Không có yêu cầu thanh toán nào đang chờ duyệt.'
                : 'Hiện tại chưa có thông báo mới.'}
            </p>
          </div>
        ) : (
          displayList.map((item) => {
            const isProcessing = processingId === item.id;
            return (
              <div
                key={item.id}
                className={`notif-item ${item.status}`}
              >
                <div className="notif-item-top">
                  <div className="notif-user-box">
                    <span className="notif-user-name">
                      {item.senderName}
                      {item.senderCode && (
                        <span className="notif-user-code">({item.senderCode})</span>
                      )}
                    </span>
                    <span className="notif-time">{formatTime(item.createdAt)}</span>
                  </div>
                  <span className="notif-amount">
                    +{formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="notif-desc">
                  {item.description || 'Đóng quỹ phòng'}
                </div>

                {/* Status or Admin Action Buttons */}
                <div className="notif-footer-row">
                  {item.status === 'waiting' ? (
                    isAdmin ? (
                      <div className="notif-admin-actions">
                        <button
                          className="btn-notif-approve"
                          onClick={(e) => handleApprove(e, item)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? '⏳ Đang xử lý...' : '✅ Duyệt'}
                        </button>
                        <button
                          className="btn-notif-reject"
                          onClick={(e) => handleReject(e, item)}
                          disabled={isProcessing}
                        >
                          ❌ Hủy
                        </button>
                      </div>
                    ) : (
                      <span className="notif-status-tag waiting">
                        🕒 Đang chờ Admin duyệt
                      </span>
                    )
                  ) : item.status === 'approved' ? (
                    <span className="notif-status-tag approved">
                      ✅ Đã duyệt {item.reviewedBy ? `bởi ${item.reviewedBy}` : ''}
                    </span>
                  ) : (
                    <span className="notif-status-tag rejected">
                      ❌ Đã hủy {item.reviewedBy ? `bởi ${item.reviewedBy}` : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
