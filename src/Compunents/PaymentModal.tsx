import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Person } from '../models/Person';
import type { Transaction } from '../models/Transaction';
import {
  getPaymentConfig,
  generateVietQRUrl,
  DEFAULT_PAYMENT_CONFIG,
  type PaymentConfig
} from '../services/PaymentService';
import { updateTransaction, addTransaction } from '../services/TransactionsService';
import { logUpdate, logCreate } from '../services/HistoryService';
import { createPaymentNotification } from '../services/NotificationService';
import { sendPaymentEmailToAdmin } from '../services/EmailService';
import defaultQrImage from '../assets/payment_qr.png';
import taxPaidLoader from '../assets/tax_paid_loader.gif';
import '../assets/PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  persons: Person[];
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  onSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  persons,
  transactions,
  formatCurrency,
  onSuccess
}) => {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState<number>(50000);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrMode, setQrMode] = useState<'dynamic' | 'original'>('dynamic');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [flightProgress, setFlightProgress] = useState<number>(0);
  const [isFlightDone, setIsFlightDone] = useState<boolean>(false);
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'select' | 'qr'>('select');

  // Tải cấu hình thanh toán
  useEffect(() => {
    if (isOpen) {
      getPaymentConfig().then(cfg => setConfig(cfg));
      setConfirmedMessage(null);
      setViewMode('select');
    }
  }, [isOpen]);

  // Tìm hồ sơ Person khớp với tài khoản đăng nhập (Chỉ cho phép đóng tiền cho bản thân)
  const currentPerson = useMemo(() => {
    if (!currentUser) return null;
    return (
      persons.find(p => p.code && p.code === currentUser.codePerson) ||
      persons.find(
        p => p.name && (p.name === currentUser.personName || p.name === currentUser.displayName)
      ) ||
      null
    );
  }, [currentUser, persons]);

  // Các khoản nợ / đang chờ thu (pending hoặc waiting) của riêng tài khoản này
  const userPendingTransactions = useMemo(() => {
    if (!currentUser) return [];
    return transactions.filter(t => {
      const isUncompletedThu = t.type === 'thu' && t.status !== 'completed';
      if (!isUncompletedThu) return false;
      const matchId = currentPerson?.id && t.personId === currentPerson.id;
      const matchName =
        (currentPerson?.name && t.personName === currentPerson.name) ||
        (currentUser?.personName && t.personName === currentUser.personName);
      return matchId || matchName;
    });
  }, [transactions, currentPerson, currentUser]);

  // Khởi tạo chọn tất cả khoản nợ khi mở modal
  useEffect(() => {
    if (isOpen && userPendingTransactions.length > 0) {
      setSelectedTxIds(userPendingTransactions.map(t => t.id || ''));
    }
  }, [isOpen, userPendingTransactions]);

  // Tính tổng số tiền cần thanh toán
  const amountToPay = useMemo(() => {
    if (userPendingTransactions.length === 0) {
      return customAmount;
    }
    return userPendingTransactions
      .filter(t => selectedTxIds.includes(t.id || ''))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [userPendingTransactions, selectedTxIds, customAmount]);

  // Nội dung chuyển khoản chuẩn hóa (chỉ cho bản thân người dùng đăng nhập)
  const transferContent = useMemo(() => {
    const code = currentPerson?.code || currentUser?.codePerson || 'TV';
    const name = currentPerson?.name || currentUser?.personName || currentUser?.displayName || 'ThanhVien';
    // Chuẩn hóa không dấu cho nội dung ngân hàng
    const cleanName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim();
    return `${code} ${cleanName} DONG QUY`;
  }, [currentPerson, currentUser]);

  // Link mã VietQR động
  const dynamicQrUrl = useMemo(() => {
    return generateVietQRUrl(
      config.bankId,
      config.accountNumber,
      config.accountHolder,
      amountToPay,
      transferContent
    );
  }, [config, amountToPay, transferContent]);

  // Sao chép thông tin
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const flightProgressRef = useRef(0);

  // Xử lý khi thành viên bấm "Xác nhận đã thanh toán"
  const handleConfirmPayment = async () => {
    if (submitting) return;

    const personId = currentPerson?.id || currentUser?.uid || '';
    const personName =
      currentPerson?.name ||
      currentUser?.personName ||
      currentUser?.displayName ||
      'Thành viên chưa đặt tên';

    setSubmitting(true);
    setFlightProgress(0);
    flightProgressRef.current = 0;
    setIsFlightDone(false);

    // Kích hoạt đường bay máy bay giấy cinema (3 giây)
    const startTime = Date.now();
    const flightDuration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / flightDuration) * 100), 100);
      flightProgressRef.current = progress;
      setFlightProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsFlightDone(true);
      }
    }, 40);

    try {
      let affectedTxIds: string[] = [];

      if (userPendingTransactions.length > 0) {
        const txsToUpdate = userPendingTransactions.filter(t =>
          selectedTxIds.includes(t.id || '')
        );
        affectedTxIds = txsToUpdate.map(t => t.id || '');

        for (const tx of txsToUpdate) {
          if (tx.id) {
            await updateTransaction(tx.id, {
              status: 'waiting'
            });
            await logUpdate(
              'Giao dịch',
              tx.id,
              tx.description || 'Đóng quỹ',
              `Thành viên báo đã thanh toán qua QR (ID: ${tx.id}) -> Chuyển sang Chờ xác nhận`,
              personName
            );
          }
        }
      } else {
        const newTxId = await addTransaction({
          date: new Date().toISOString().split('T')[0],
          dayOfWeek: new Date().toLocaleDateString('vi-VN', { weekday: 'long' }),
          amount: customAmount,
          type: 'thu',
          description: `Thành viên ${personName} đóng góp quỹ tự do`,
          personId,
          personName,
          status: 'waiting'
        });
        affectedTxIds = [newTxId];
        await logCreate(
          'Giao dịch',
          newTxId,
          `Đóng góp quỹ tự do`,
          `Thành viên ${personName} đóng góp tự do ${formatCurrency(customAmount)}`,
          personName
        );
      }

      const notifId = await createPaymentNotification({
        senderId: currentUser?.uid || personId,
        senderName: personName,
        senderAvatar: currentUser?.avatar || '',
        amount: amountToPay,
        transactionIds: affectedTxIds,
        note: `Nội dung CK: "${transferContent}"`
      });

      if (config.adminEmail) {
        try {
          await sendPaymentEmailToAdmin({
            adminEmail: config.adminEmail || 'giabaoonutc2@gmail.com',
            senderName: personName || 'Thành viên',
            senderCode: (persons.find(p => p.id === personId)?.code) || '',
            amount: amountToPay,
            transferContent: transferContent || '',
            bankName: config.bankName || '',
            accountNumber: config.accountNumber || '',
            transactionCount: affectedTxIds.length || 1,
            timeString: new Date().toLocaleString('vi-VN')
          }, config);
        } catch (mailErr) {
          console.warn('Gửi email thông báo cho Admin thất bại, nhưng thông báo Firestore đã gửi:', mailErr);
        }
      }

      setConfirmedMessage(
        `Đã gửi yêu cầu xác nhận thanh toán ${formatCurrency(amountToPay)} đến Admin! Hệ thống sẽ cập nhật ngay khi Admin duyệt.`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      clearInterval(interval);
      setFlightProgress(0);
      flightProgressRef.current = 0;
      setIsFlightDone(false);
      console.error('Lỗi khi gửi xác nhận thanh toán:', err);
      alert('❌ Không thể gửi xác nhận: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setTimeout(() => {
        setSubmitting(false);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-card" onClick={e => e.stopPropagation()}>
        {/* Topbar: Tiêu đề "Thanh toán" & Nút Đóng */}
        <div className="sketch-payment-topbar">
          <div className="sketch-topbar-left">
            {viewMode === 'qr' && (
              <button
                className="sketch-btn-back"
                onClick={() => setViewMode('select')}
                title="Quay lại chọn khoản cần đóng"
              >
                ← Quay lại
              </button>
            )}
            <h1 className="sketch-payment-title">
              {viewMode === 'select' ? 'Thanh toán' : 'Quét mã QR thanh toán'}
            </h1>
          </div>
          <button className="sketch-payment-close-btn" onClick={onClose} title="Đóng giao diện">
            ✕
          </button>
        </div>

        {/* Thân giao diện 2 cột chuẩn phác thảo: Cột trái luôn là animation, cột phải thay đổi sau khi tạo mã */}
        <div className="sketch-payment-body">
          {/* CỘT TRÁI: Luôn luôn là icon animation */}
          <div className="sketch-card-left">
            <div className="sketch-anim-container">
              <img
                src={taxPaidLoader}
                alt="Animation Tax Paid"
                className="sketch-anim-img"
              />
            </div>
          </div>

          {/* CỘT PHẢI: Trước khi tạo mã là danh sách chọn, sau khi tạo mã đổi thành mã QR & dưới là nút xác nhận */}
          {viewMode === 'select' ? (
            <div className="sketch-card-right">
              {/* Header: Chọn khoản cần đóng & Tổng số lượng */}
              <div className="sketch-right-header">
                <h3 className="sketch-right-title">Chọn khoản cần đóng</h3>
                <span className="sketch-right-counter">
                  Tổng số lượng: <strong>{selectedTxIds.length}</strong> / {userPendingTransactions.length}
                </span>
              </div>

              {/* Danh sách khoản nợ với Checkbox */}
              <div className="sketch-right-list">
                {userPendingTransactions.length > 0 ? (
                  userPendingTransactions.map(tx => {
                    const isChecked = selectedTxIds.includes(tx.id || '');
                    return (
                      <label key={tx.id} className={`sketch-item-row ${isChecked ? 'selected' : ''}`}>
                        <div className="sketch-item-check-wrap">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              const id = tx.id || '';
                              if (e.target.checked) {
                                setSelectedTxIds([...selectedTxIds, id]);
                              } else {
                                setSelectedTxIds(selectedTxIds.filter(item => item !== id));
                              }
                            }}
                            className="sketch-item-checkbox"
                          />
                        </div>
                        <div className="sketch-item-info">
                          <div className="sketch-item-name">
                            {tx.actionName || tx.description || 'Khoản thu quỹ'}
                            {tx.status === 'waiting' && (
                              <span className="sketch-item-waiting-tag">🕒 Chờ xác nhận</span>
                            )}
                          </div>
                          {tx.actionName && tx.description && tx.actionName !== tx.description && (
                            <div className="sketch-item-desc">{tx.description}</div>
                          )}
                          <div className="sketch-item-date">{tx.date}</div>
                        </div>
                        <div className="sketch-item-amount">
                          {formatCurrency(tx.amount)}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="sketch-no-debt-box">
                    <span className="sketch-no-debt-icon">🎉</span>
                    <h4>Bạn không có khoản nợ quỹ nào!</h4>
                    <p>Nếu muốn đóng góp hoặc ủng hộ quỹ, bạn có thể tùy chỉnh số tiền:</p>
                    <div className="sketch-custom-amount-box">
                      <input
                        type="number"
                        step="10000"
                        min="10000"
                        value={customAmount}
                        onChange={e => setCustomAmount(Number(e.target.value))}
                        className="sketch-custom-input"
                      />
                      <span className="sketch-custom-unit">VNĐ</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Đường kẻ ngang phân cách (Dashed Divider) */}
              <div className="sketch-dashed-divider" />

              {/* Hàng tổng số tiền */}
              <div className="sketch-total-row">
                <span className="sketch-total-label">Tổng số tiền</span>
                <span className="sketch-total-value">{formatCurrency(amountToPay)}</span>
              </div>

              {/* Hàng 2 nút: Tạo mã & Liên hệ */}
              <div className="sketch-actions-row">
                <button
                  className="sketch-btn-create-code"
                  onClick={() => {
                    if (amountToPay <= 0) {
                      alert('Vui lòng chọn ít nhất 1 khoản nợ để tạo mã thanh toán!');
                      return;
                    }
                    setViewMode('qr');
                  }}
                >
                  Tạo mã
                </button>

                <button
                  className="sketch-btn-contact"
                  onClick={() => {
                    window.open('https://zalo.me/0765837724', '_blank');
                  }}
                  title="Liên hệ Zalo / Hotline Admin"
                >
                  Liên hệ
                </button>
              </div>
            </div>
          ) : (
            /* Cột PHẢI sau khi tạo mã: Đổi thành Mã QR và dưới là Nút xác nhận */
            <div className="sketch-card-right qr-display-card">
              <div className="sketch-right-header">
                <h3 className="sketch-right-title">Quét mã QR thanh toán</h3>
                <button
                  className="sketch-btn-back-link"
                  onClick={() => setViewMode('select')}
                  title="Quay lại chọn các khoản khác"
                >
                  ← Chọn lại khoản
                </button>
              </div>

              {/* Khối Mã QR & Tabs */}
              <div className="sketch-qr-wrapper">
                <div className="payment-qr-tabs">
                  <button
                    className={`payment-qr-tab ${qrMode === 'dynamic' ? 'active' : ''}`}
                    onClick={() => setQrMode('dynamic')}
                  >
                    VietQR (Tự điền tiền)
                  </button>
                  <button
                    className={`payment-qr-tab ${qrMode === 'original' ? 'active' : ''}`}
                    onClick={() => setQrMode('original')}
                  >
                    Mã QR Gốc
                  </button>
                </div>

                <div className="sketch-qr-box">
                  <img
                    src={qrMode === 'dynamic' ? dynamicQrUrl : defaultQrImage}
                    alt="QR Thanh Toán"
                    className="sketch-qr-img"
                    onError={e => {
                      (e.target as HTMLImageElement).src = defaultQrImage;
                    }}
                  />
                  <div className="sketch-qr-badge-amount">
                    Số tiền: <strong>{formatCurrency(amountToPay)}</strong>
                  </div>
                </div>
              </div>



              {/* DƯỚI LÀ NÚT XÁC NHẬN THANH TOÁN */}
              <div className="payment-action-confirm-box" style={{ marginTop: '16px', width: '100%' }}>
                <button
                  className={`payment-confirm-btn ${submitting ? 'is-flying' : ''} ${isFlightDone ? 'is-done' : ''}`}
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                >
                  <div className="cinema-border-glow" />
                  <div className="cinema-cosmic-stars" />

                  {submitting && (
                    <div className="cinema-wind-lines">
                      <span className="wind-streak streak-1" />
                      <span className="wind-streak streak-2" />
                      <span className="wind-streak streak-3" />
                      <span className="wind-streak streak-4" />
                    </div>
                  )}

                  <div className="cinema-btn-text-box">
                    {isFlightDone ? (
                      <span className="btn-flight-text done-cinema">
                        <span className="cinema-check-badge">✓</span> ĐÃ GỬI MAIL & TẠO YÊU CẦU THÀNH CÔNG!
                      </span>
                    ) : submitting ? (
                      <span className="btn-flight-text flying-cinema">
                        <span className="cinema-pulse-dot" /> Đang chuyển phát thư đến Admin ({Math.min(flightProgress, 99)}%)...
                      </span>
                    ) : (
                      <span className="btn-flight-text idle-cinema">
                        <svg className="cinema-btn-paper-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                        Xác nhận đã thanh toán (Gửi mail duyệt)
                      </span>
                    )}
                  </div>
                </button>

                {confirmedMessage && (
                  <div className="confirm-toast-success">
                    ✓ {confirmedMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
