import React, { useState, useEffect } from 'react';
import {
  getPaymentConfig,
  savePaymentConfig,
  POPULAR_BANKS,
  generateVietQRUrl,
  DEFAULT_PAYMENT_CONFIG,
  type PaymentConfig
} from '../services/PaymentService';
import defaultQrImage from '../assets/payment_qr.png';
import { sendTestEmail } from '../services/EmailService';
import '../assets/PaymentSettings.css';

const PaymentSettings: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Tải cấu hình hiện tại từ Firestore
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getPaymentConfig();
      setConfig(data);
    } catch (err) {
      console.error('Lỗi khi tải cấu hình thanh toán:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (bankId: string) => {
    const found = POPULAR_BANKS.find(b => b.id === bankId);
    setConfig(prev => ({
      ...prev,
      bankId,
      bankName: found ? found.name : prev.bankName
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.accountNumber.trim()) {
      alert('Vui lòng nhập số tài khoản ngân hàng.');
      return;
    }
    if (!config.accountHolder.trim()) {
      alert('Vui lòng nhập tên chủ tài khoản.');
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);
      await savePaymentConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      alert('✅ Đã lưu cấu hình thanh toán thành công!');
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình:', err);
      alert('❌ Không thể lưu cấu hình thanh toán lên Firebase: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setTestResult(null);
      const res = await sendTestEmail(config);
      setTestResult(res);
      if (res.success) {
        alert('🎉 ' + res.message);
      } else {
        alert('⚠️ ' + res.message);
      }
    } catch (err: any) {
      const errMsg = err.text || err.message || 'Lỗi gửi mail';
      setTestResult({ success: false, message: errMsg });
      alert('❌ Lỗi kiểm tra email: ' + errMsg);
    } finally {
      setTestingEmail(false);
    }
  };

  // Preview VietQR
  const previewQrUrl = generateVietQRUrl(
    config.bankId,
    config.accountNumber,
    config.accountHolder,
    100000,
    'TV01 NGUYEN VAN A DONG QUY'
  );

  return (
    <div className="payment-settings-page">
      {/* Header */}
      <div className="payment-settings-header">
        <div>
          <h1 className="payment-settings-title">⚙️ Cấu Hình Thanh Toán Quỹ</h1>
          <p className="payment-settings-subtitle">
            Cài đặt thông tin tài khoản ngân hàng, mã VietQR và email tự động nhận thông báo thanh toán cho toàn bộ hệ thống
          </p>
        </div>
      </div>

      {loading ? (
        <div className="payment-settings-loading">Đang tải cấu hình thanh toán...</div>
      ) : (
        <div className="payment-settings-layout">
          {/* CỘT TRÁI: FORM CẤU HÌNH */}
          <div className="payment-form-card">
            <form onSubmit={handleSave}>
              <div className="form-group-section">
                <h3 className="section-title">Thông tin Tài khoản Ngân hàng</h3>

                {/* Chọn ngân hàng */}
                <div className="form-field">
                  <label className="field-label">Ngân hàng thụ hưởng</label>
                  <select
                    className="field-input"
                    value={config.bankId}
                    onChange={e => handleBankChange(e.target.value)}
                  >
                    {POPULAR_BANKS.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Hỗ trợ mã VietQR Napas247 quét liên ngân hàng</span>
                </div>

                {/* Tên ngân hàng tùy chỉnh */}
                <div className="form-field">
                  <label className="field-label">Tên hiển thị ngân hàng</label>
                  <input
                    type="text"
                    className="field-input"
                    value={config.bankName}
                    onChange={e => setConfig({ ...config, bankName: e.target.value })}
                    placeholder="VD: Ngân hàng TMCP Á Châu (ACB)"
                    required
                  />
                </div>

                {/* Số tài khoản */}
                <div className="form-field">
                  <label className="field-label">Số tài khoản ngân hàng</label>
                  <input
                    type="text"
                    className="field-input highlight-code"
                    value={config.accountNumber}
                    onChange={e => setConfig({ ...config, accountNumber: e.target.value })}
                    placeholder="Nhập số tài khoản nhận quỹ..."
                    required
                  />
                </div>

                {/* Tên chủ tài khoản */}
                <div className="form-field">
                  <label className="field-label">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    className="field-input"
                    value={config.accountHolder}
                    onChange={e => setConfig({ ...config, accountHolder: e.target.value.toUpperCase() })}
                    placeholder="VD: NGUYEN VAN A (viết hoa không dấu)"
                    required
                  />
                  <span className="field-hint">Nên viết hoa không dấu để khớp với chuẩn hệ thống ngân hàng</span>
                </div>
              </div>

              <div className="form-group-section">
                <h3 className="section-title">Kênh Nhận Thông Báo & Cú Pháp</h3>

                {/* Email Admin nhận thông báo */}
                <div className="form-field">
                  <label className="field-label">Email Admin nhận thông báo thanh toán tự động</label>
                  <input
                    type="email"
                    className="field-input"
                    value={config.adminEmail}
                    onChange={e => setConfig({ ...config, adminEmail: e.target.value })}
                    placeholder="VD: admin@nasani.vn"
                    required
                  />
                  <span className="field-hint">
                    Hệ thống tự động gửi email thông báo chi tiết khi thành viên bấm xác nhận thanh toán
                  </span>

                  {/* Nút gửi thử email kiểm tra tới Gmail Admin */}
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={testingEmail}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#1e293b',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {testingEmail ? '⏳ Đang gửi thử email...' : `✉️ Gửi thử email kiểm tra tới: ${config.adminEmail || 'admin'}`}
                    </button>
                    {testResult && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12.5px',
                        color: testResult.success ? '#15803d' : '#b91c1c',
                        background: testResult.success ? '#dcfce7' : '#fee2e2',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontWeight: 600
                      }}>
                        {testResult.success ? '✓ ' : '✕ '} {testResult.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cú pháp chuyển khoản */}
                <div className="form-field">
                  <label className="field-label">Cú pháp nội dung chuyển khoản mẫu</label>
                  <input
                    type="text"
                    className="field-input"
                    value={config.notePrefix || 'DONG QUY'}
                    onChange={e => setConfig({ ...config, notePrefix: e.target.value })}
                    placeholder="VD: DONG QUY"
                  />
                  <span className="field-hint">
                    Hệ thống sẽ tự động ghép thành: [Mã TV] [Tên TV] {config.notePrefix || 'DONG QUY'}
                  </span>
                </div>
              </div>

              {/* Nút lưu */}
              <div className="form-actions">
                <button type="submit" className="btn-save-settings" disabled={saving}>
                  {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình thanh toán'}
                </button>
                {saveSuccess && (
                  <span className="save-success-tag">✓ Đã lưu thành công lên Firebase!</span>
                )}
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: XEM TRƯỚC (LIVE PREVIEW) */}
          <div className="payment-preview-card">
            <h3 className="preview-title">👁️ Xem trước Thẻ Thanh toán</h3>
            <p className="preview-desc">
              Giao diện thực tế mà thành viên sẽ nhìn thấy khi thanh toán tiền quỹ:
            </p>

            <div className="preview-box">
              {/* Ảnh QR Preview */}
              <div className="preview-qr-wrap">
                <img
                  src={config.accountNumber ? previewQrUrl : defaultQrImage}
                  alt="QR Preview"
                  className="preview-qr-img"
                  onError={e => {
                    (e.target as HTMLImageElement).src = defaultQrImage;
                  }}
                />
                <span className="preview-qr-tag">VietQR Napas247</span>
              </div>

              {/* Chi tiết chuyển khoản preview */}
              <div className="preview-info-list">
                <div className="preview-info-row">
                  <span className="p-lbl">Ngân hàng:</span>
                  <span className="p-val">{config.bankName}</span>
                </div>
                <div className="preview-info-row">
                  <span className="p-lbl">Số TK:</span>
                  <span className="p-val bold">{config.accountNumber || 'Chưa nhập số TK'}</span>
                </div>
                <div className="preview-info-row">
                  <span className="p-lbl">Chủ TK:</span>
                  <span className="p-val">{config.accountHolder || 'Chưa nhập tên chủ TK'}</span>
                </div>
                <div className="preview-info-row">
                  <span className="p-lbl">Email Admin:</span>
                  <span className="p-val" style={{ color: '#2563eb', fontWeight: 600 }}>
                    {config.adminEmail || 'admin@nasani.vn'}
                  </span>
                </div>
              </div>

              {/* Nút Preview */}
              <div className="preview-zalo-btn" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                <span>✅ Xác nhận đã thanh toán (Gửi duyệt & Báo Email)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettings;
