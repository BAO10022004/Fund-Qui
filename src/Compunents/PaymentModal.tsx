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

  // Tải cấu hình thanh toán
  useEffect(() => {
    if (isOpen) {
      getPaymentConfig().then(cfg => setConfig(cfg));
      setConfirmedMessage(null);
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
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const flightProgressRef = useRef(0);

  // Cập nhật ref mỗi khi flightProgress thay đổi
  useEffect(() => {
    flightProgressRef.current = flightProgress;
  }, [flightProgress]);

  // Xác nhận đã chuyển khoản & Gửi thông báo / Email tự động đến Admin
  const handleConfirmPayment = async () => {
    if (submitting) return;

    let flightInterval: any = null;
    try {
      setSubmitting(true);
      setIsFlightDone(false);
      setFlightProgress(4);
      flightProgressRef.current = 4;

      // Mô phỏng máy bay giấy lướt mượt mà như phim điện ảnh
      flightInterval = setInterval(() => {
        setFlightProgress(prev => {
          if (prev >= 88) return prev;
          const remaining = 88 - prev;
          const step = Math.max(1, Math.ceil(remaining * 0.065));
          const next = prev + step;
          flightProgressRef.current = next;
          return next;
        });
      }, 45);

      const username = currentUser?.username || currentUser?.personName || 'User';
      const senderName = currentPerson?.name || currentUser?.personName || currentUser?.displayName || 'Thành viên';
      const senderCode = currentPerson?.code || currentUser?.codePerson || '';
      const updatedTxIds: string[] = [];

      // 1. Cập nhật các giao dịch nợ được chọn sang trạng thái 'waiting'
      if (selectedTxIds.length > 0) {
        for (const id of selectedTxIds) {
          await updateTransaction(id, { status: 'waiting' });
          await logUpdate(
            username,
            `Thành viên báo đã thanh toán qua QR (ID: ${id}) -> Chuyển sang Chờ xác nhận`
          );
          updatedTxIds.push(id);
        }
      } else if (userPendingTransactions.length === 0 && customAmount > 0) {
        // Trường hợp người dùng không có nợ nhưng đóng góp tự nguyện
        const now = new Date();
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const newId = await addTransaction({
          date: now.toISOString().split('T')[0],
          dayOfWeek: days[now.getDay()],
          amount: customAmount,
          type: 'thu',
          description: `${transferContent} (Đóng góp)`,
          personId: currentPerson?.id || '',
          personName: senderName,
          status: 'waiting'
        });
        await logCreate(
          username,
          `Tạo giao dịch đóng quỹ ${formatCurrency(customAmount)} (Chờ xác nhận, ID: ${newId})`
        );
        updatedTxIds.push(newId);
      }

      // 2. Tạo thông báo chờ duyệt thời gian thực trên website cho Admin
      await createPaymentNotification({
        title: 'Yêu cầu duyệt đóng quỹ',
        senderName: senderName,
        senderCode: senderCode,
        amount: amountToPay,
        transactionIds: updatedTxIds,
        description: transferContent,
      });

      // 3. Tự động gửi email thông báo cho Admin
      const nowStr = new Date().toLocaleString('vi-VN');
      const emailResult = await sendPaymentEmailToAdmin({
        adminEmail: config.adminEmail || 'giabaoonutc2@gmail.com',
        senderName: senderName,
        senderCode: senderCode,
        amount: amountToPay,
        transferContent: transferContent,
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        transactionCount: updatedTxIds.length,
        timeString: nowStr
      }, config);

      // KHI GỬI XONG: Tăng tốc bứt phá siêu mượt về đích 100% (Cinematic Supersonic Sprint)
      if (flightInterval) clearInterval(flightInterval);
      let cur = flightProgressRef.current;
      while (cur < 100) {
        cur = Math.min(100, cur + 3);
        setFlightProgress(cur);
        flightProgressRef.current = cur;
        await new Promise(r => setTimeout(r, 16)); // 60fps mượt mà
      }
      setIsFlightDone(true);

      // 4. Kích hoạt cập nhật dữ liệu ngoài trang
      onSuccess?.();

      if (emailResult.success) {
        setConfirmedMessage('Đã chuyển sang "Chờ xác nhận", tạo thông báo trên website & gửi email thành công tới Gmail Admin!');
      } else {
        setConfirmedMessage('Đã chuyển sang "Chờ xác nhận" và tạo thông báo duyệt trên website!');
      }
    } catch (err: any) {
      if (flightInterval) clearInterval(flightInterval);
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
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-header-title-box">
            <span className="payment-header-icon">💳</span>
            <div>
              <h2 className="payment-modal-title">Thanh Toán Quỹ Phòng</h2>

            </div>
          </div>
          <button className="payment-close-btn" onClick={onClose} title="Đóng modal">
            ✕
          </button>
        </div>

        {/* Khung thành viên chỉ định */}
        <div className="payment-user-lock-banner">
          <div className="payment-user-avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="payment-user-meta">
            <span className="payment-lock-badge">
              🔒 Tài khoản thanh toán (Chính chủ)
            </span>
            <div className="payment-user-name">
              {currentPerson?.name || currentUser?.personName || currentUser?.displayName || 'Thành viên'}
              {currentPerson?.code && (
                <span className="payment-user-code">({currentPerson.code})</span>
              )}
            </div>

          </div>
        </div>

        {/* Body 2 cột: Trái thông tin số tiền & danh sách nợ, Phải mã QR & Zalo */}
        <div className="payment-modal-grid">
          {/* CỘT TRÁI: DANH SÁCH KHOẢN CẦN ĐÓNG & THÔNG TIN CHUYỂN KHOẢN */}
          <div className="payment-left-col">
            {/* Danh sách khoản nợ */}
            <div className="payment-section-box">
              <div className="payment-section-header">
                <span className="payment-section-title">Khoản quỹ cần đóng</span>
                {userPendingTransactions.length > 0 && (
                  <span className="payment-pending-tag">
                    {userPendingTransactions.length} khoản chưa thu
                  </span>
                )}
              </div>

              {userPendingTransactions.length > 0 ? (
                <div className="payment-debt-list">
                  {userPendingTransactions.map(tx => {
                    const isChecked = selectedTxIds.includes(tx.id || '');
                    return (
                      <label key={tx.id} className={`payment-debt-item ${isChecked ? 'active' : ''}`}>
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
                        />
                        <div className="debt-item-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="debt-item-desc">{tx.description || 'Đóng quỹ'}</span>
                            {tx.status === 'waiting' && (
                              <span style={{ fontSize: '10.5px', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                🕒 Chờ xác nhận
                              </span>
                            )}
                          </div>
                          <span className="debt-item-date">{tx.date}</span>
                        </div>
                        <span className="debt-item-amount">
                          {formatCurrency(tx.amount)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="payment-no-debt">
                  <div className="no-debt-icon">🎉</div>
                  <div className="no-debt-text">
                    <strong>Bạn không có khoản nợ quỹ nào!</strong>
                    <p>Nếu muốn đóng góp thêm hoặc ủng hộ quỹ, bạn có thể tùy chỉnh số tiền:</p>
                  </div>
                  <div className="payment-custom-amount-box">
                    <input
                      type="number"
                      step="10000"
                      min="10000"
                      value={customAmount}
                      onChange={e => setCustomAmount(Number(e.target.value))}
                      className="payment-custom-input"
                    />
                    <span className="payment-custom-unit">VNĐ</span>
                  </div>
                </div>
              )}

              {/* Tổng tiền cần thanh toán */}
              <div className="payment-total-box">
                <span className="payment-total-label">Số tiền thanh toán:</span>
                <span className="payment-total-value">{formatCurrency(amountToPay)}</span>
              </div>
            </div>

            {/* Chi tiết tài khoản ngân hàng */}
            <div className="payment-details-box">
              <div className="payment-detail-row">
                <span className="detail-label">Ngân hàng:</span>
                <span className="detail-value highlight">{config.bankName}</span>
              </div>

              <div className="payment-detail-row">
                <span className="detail-label">Số tài khoản:</span>
                <div className="detail-copy-wrap">
                  <span className="detail-value bold">{config.accountNumber}</span>
                  <button
                    className="payment-copy-btn"
                    onClick={() => handleCopy(config.accountNumber, 'acc')}
                  >
                    {copiedField === 'acc' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="payment-detail-row">
                <span className="detail-label">Chủ tài khoản:</span>
                <div className="detail-copy-wrap">
                  <span className="detail-value">{config.accountHolder}</span>
                  <button
                    className="payment-copy-btn"
                    onClick={() => handleCopy(config.accountHolder, 'holder')}
                  >
                    {copiedField === 'holder' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="payment-detail-row">
                <span className="detail-label">Nội dung CK:</span>
                <div className="detail-copy-wrap">
                  <span className="detail-value note">{transferContent}</span>
                  <button
                    className="payment-copy-btn"
                    onClick={() => handleCopy(transferContent, 'content')}
                  >
                    {copiedField === 'content' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: MÃ QR & NÚT XÁC NHẬN QUA ZALO */}
          <div className="payment-right-col">
            {/* Khung hiển thị QR */}
            <div className="payment-qr-card">
              {/* Tab chuyển đổi mã QR động / QR gốc */}
              <div className="payment-qr-tabs">
                <button
                  className={`payment-qr-tab ${qrMode === 'dynamic' ? 'active' : ''}`}
                  onClick={() => setQrMode('dynamic')}
                  title="Tự động điền đúng số tiền và nội dung chuyển khoản"
                >
                  VietQR (Tự động điền tiền)
                </button>
                <button
                  className={`payment-qr-tab ${qrMode === 'original' ? 'active' : ''}`}
                  onClick={() => setQrMode('original')}
                  title="Mã QR ACB gốc do Admin cung cấp"
                >
                  Mã QR Gốc (ACB)
                </button>
              </div>

              <div className="payment-qr-frame">
                <img
                  src={qrMode === 'dynamic' ? dynamicQrUrl : defaultQrImage}
                  alt="QR Thanh Toán"
                  className="payment-qr-image"
                  onError={e => {
                    // Fallback nếu link vietqr lỗi mạng
                    (e.target as HTMLImageElement).src = defaultQrImage;
                  }}
                />
              </div>

              <div className="payment-qr-caption">
                {qrMode === 'dynamic' ? (
                  <>
                    <span className="qr-badge-live">● Tự động điền {formatCurrency(amountToPay)}</span>
                    <p>Mở app ngân hàng bất kỳ để quét mã tự động</p>
                  </>
                ) : (
                  <>
                    <span className="qr-badge-static">Mã VietQR Napas247</span>
                    <p>Vui lòng nhập đúng số tiền và nội dung chuyển khoản</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Khối xác nhận thanh toán & Gửi mail - Đặt ở giữa và to hơn */}
        <div className="payment-action-confirm-box">
          <button
            className={`payment-confirm-btn ${submitting ? 'is-flying' : ''} ${isFlightDone ? 'is-done' : ''}`}
            onClick={handleConfirmPayment}
            disabled={submitting}
          >
            {/* 0. Khung viền quang học Cinema (Anamorphic Aurora Glow) */}
            <div className="cinema-border-glow" />
            <div className="cinema-cosmic-stars" />

            {/* 1. Vệt gió siêu thanh (Wind Speed Streaks) */}
            {submitting && (
              <div className="cinema-wind-lines">
                <span className="wind-streak streak-1" />
                <span className="wind-streak streak-2" />
                <span className="wind-streak streak-3" />
                <span className="wind-streak streak-4" />
              </div>
            )}

            {/* 2. Vùng khói mờ ảo đa tầng điện ảnh (Volumetric Smoke Plume) */}
            {submitting && (
              <>
                {/* Lớp khói khổng lồ bao trùm (Plume Aura) */}
                <div
                  className="cinema-smoke-aura"
                  style={{ width: `calc(${flightProgress}% - 4px)` }}
                />
                {/* Lớp mây cuộn phản lực (Turbulent Billows) */}
                <div
                  className="cinema-smoke-clouds"
                  style={{ width: `calc(${flightProgress}% - 8px)` }}
                />
                {/* Tinh vân lấp lánh trong khói (Stardust Sparks) */}
                <div
                  className="cinema-smoke-sparks"
                  style={{ width: `calc(${flightProgress}% - 12px)` }}
                />
                {/* Lõi tia sáng laser phản lực (Jet Plasma Core) */}
                <div
                  className="cinema-jet-core"
                  style={{ width: `calc(${flightProgress}% - 6px)` }}
                />
              </>
            )}

            {/* 3. Chiếc máy bay giấy 3D Origami phong cách Hollywood lướt siêu êm */}
            {submitting && (
              <div
                className="cinema-plane-wrapper"
                style={{ left: `calc(${Math.min(flightProgress, 91)}% - 6px)` }}
              >
                {/* Chùm đèn pha quang học xé toang màn đêm (Forward Photon Beam) */}
                <div className="cinema-nose-beam" />

                {/* Vệt sáng Anamorphic Flare kinh điển điện ảnh */}
                <div className="cinema-anamorphic-flare" />

                {/* Lửa phản lực đuôi máy bay (Afterburner Core & Mach Ring) */}
                <div className="cinema-afterburner-glow" />
                <div className="cinema-mach-ring" />

                {/* SVG Máy bay giấy 3D Origami đa giác lập thể */}
                <svg
                  className="cinema-origami-plane"
                  viewBox="0 0 46 26"
                  width="44"
                  height="26"
                >
                  <defs>
                    <linearGradient id="origamiWingTop" x1="0%" y1="0%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#f0f9ff" />
                      <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                    <linearGradient id="origamiWingBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                    <linearGradient id="origamiKeel" x1="0%" y1="0%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <filter id="cinemaPlaneGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.7" />
                    </filter>
                  </defs>
                  {/* Cánh trên đón sáng */}
                  <polygon points="44,13 4,3 16,13" fill="url(#origamiWingTop)" filter="url(#cinemaPlaneGlow)" />
                  {/* Cánh dưới tạo khối sâu 3D */}
                  <polygon points="44,13 16,13 4,23" fill="url(#origamiWingBottom)" />
                  {/* Sống lưng thân origami */}
                  <polygon points="16,13 4,23 9,15" fill="url(#origamiKeel)" />
                  {/* Tâm buồng phản lực laser */}
                  <circle cx="5" cy="13" r="3" fill="#38bdf8" />
                  <circle cx="5" cy="13" r="1.2" fill="#ffffff" />
                </svg>
              </div>
            )}

            {/* 4. Sóng xung kích kép khi cán đích thành công (Dual Sonic Boom) */}
            {isFlightDone && (
              <>
                <div className="cinema-sonic-burst" />
                <div className="cinema-sonic-ring" />
              </>
            )}

            {/* 5. Nhãn nút phong cách Cinema */}
            <div className="confirm-btn-inner-content">
              {isFlightDone ? (
                <span className="btn-flight-text success-cinema">
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
                  Xác nhận thanh toán (Gửi mail duyệt)
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

        {/* Footer */}
        <div className="payment-modal-footer">

          <button className="payment-btn-done" onClick={onClose}>
            Hoàn tất / Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
