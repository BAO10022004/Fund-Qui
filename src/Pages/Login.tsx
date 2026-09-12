import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../firebase';
import { findAccountByGoogleEmail, getAllAccounts, createAccount, updateAccount } from '../services/AccountService';
import { logLogin } from '../services/HistoryService';
import { recordLoginLog } from '../services/LoginService';
import { Timestamp } from 'firebase/firestore';
import { auth } from '../Auth';
import type { Account } from '../models/Account';
import '../assets/nasaniLogin.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unapprovedEmail, setUnapprovedEmail] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  // Nếu đã xác thực thì điều hướng vào hệ thống
  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setUnapprovedEmail(null);

      // Đăng nhập qua Google Firebase Auth
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      const email = user.email;

      if (!email) {
        throw new Error('Không thể lấy địa chỉ Email từ tài khoản Google.');
      }

      // Tra cứu tài khoản trong danh sách hệ thống
      let account: Account | null = await findAccountByGoogleEmail(email);

      // 🛑 CHỈ CHO PHÉP EMAIL ĐÃ CÓ TRONG HỆ THỐNG - TẤT CẢ EMAIL KHÁC ĐỀU BỊ CHẶN
      if (!account) {
        await recordLoginLog({
          email,
          username: email,
          displayName: user.displayName || email,
          avatar: user.photoURL,
          role: 'user',
          status: 'blocked',
          reason: 'Email chưa được đăng ký trong hệ thống'
        });
        await firebaseAuth.signOut();
        setUnapprovedEmail(email);
        setError(`Email "${email}" chưa được Quản trị viên cấp quyền trong hệ thống. Chỉ tài khoản đã được Admin thêm trước mới được phép đăng nhập!`);
        return;
      }

      if (account) {
        // 🔒 KIỂM TRA BẢO MẬT: Nếu tài khoản bị Admin khóa quyền đăng nhập
        if (account.isBlocked) {
          await recordLoginLog({
            email,
            username: account.username || email,
            displayName: account.personName || account.userName || user.displayName || email,
            avatar: account.avatar || user.photoURL,
            role: account.role || 'user',
            status: 'blocked',
            reason: 'Tài khoản đã bị Quản trị viên tạm khóa quyền truy cập'
          });
          await firebaseAuth.signOut();
          setError('🚫 Tài khoản này đã bị Quản trị viên tạm khóa quyền truy cập website. Vui lòng liên hệ Admin để được hỗ trợ mở khóa!');
          return;
        }

        // Ghi nhật ký đăng nhập thành công vào hệ thống giám sát an ninh
        await recordLoginLog({
          email,
          username: account.username || email,
          displayName: account.personName || account.userName || user.displayName || email,
          avatar: account.avatar || user.photoURL,
          role: account.role || 'user',
          status: 'success'
        });

        // Cập nhật mốc thời gian đăng nhập mới nhất
        if (account.id) {
          try {
            await updateAccount(account.id, {
              lastLoginAt: Timestamp.now()
            });
          } catch (e) {
            console.warn('Could not update lastLoginAt:', e);
          }
        }

        // Đăng nhập thành công với quyền hạn của tài khoản (admin hoặc user)
        auth.login(
          account.username || email,
          account.role || 'user',
          account.codePerson || 'P_UNKNOWN',
          {
            personName: account.personName || account.userName || user.displayName || email,
            displayName: user.displayName || account.userName || email,
            avatar: account.avatar || null,
            photoURL: user.photoURL,
            email: email
          }
        );

        await logLogin(email);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Google. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nasani-login-page">
      {/* Background layer phong cảnh SẮC NÉT KHÔNG MỜ */}
      <div className="nasani-login-bg-layer"></div>
      <div className="nasani-login-overlay"></div>

      {/* Ô đăng nhập lệch qua phía bên phải một tí */}
      <div className="nasani-login-card">
        <div className="nasani-login-icon-wrap">
          <span>🏛️</span>
        </div>

        <h1 className="nasani-login-title">Hệ Thống Quản Lý Quỹ</h1>
        <p className="nasani-login-desc">
          Vui lòng đăng nhập bằng <strong>tài khoản Google</strong> đã được Quản trị viên (Admin) phê duyệt để tiếp tục.
        </p>

        {/* Thông báo từ chối truy cập nếu chưa duyệt */}
        {error && (
          <div className="nasani-alert-error" style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '20px' }}>🚫</span>
            <div>
              <strong>Từ chối truy cập</strong>
              <div>{error}</div>
            </div>
          </div>
        )}

        {unapprovedEmail && (
          <div className="nasani-alert-warning" style={{ marginBottom: '18px' }}>
            🛡️ <strong>Lưu ý:</strong> Vui lòng liên hệ Admin để thêm email <strong>{unapprovedEmail}</strong> vào mục <em>Quản lý Tài khoản</em>.
          </div>
        )}

        <div className="nasani-auth-box">
          {/* Nút đăng nhập với 2 tia sáng & 2 khung lồng nhau */}
          <div
            className="nasani-google-btn-wrapper"
            onClick={!loading ? handleGoogleLogin : undefined}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleGoogleLogin()}
          >
            {/* 2 tia sáng chạy quanh viền: chậm ở trạng thái thường, nhanh dần khi hover */}
            <div className="btn-beams-spinner btn-beams-slow"></div>
            <div className="btn-beams-spinner btn-beams-fast"></div>

            <button
              type="button"
              className="nasani-google-btn"
              disabled={loading}
            >
              {/* 2 khung lồng nhau xuất hiện khi hover */}
              <div className="btn-frame-outer"></div>
              <div className="btn-frame-inner"></div>

              <div className="btn-content-inner">
                {loading ? (
                  <span className="nasani-loading-dots">
                    Đang xác thực Google<span></span><span></span><span></span>
                  </span>
                ) : (
                  <>
                    <svg className="nasani-google-svg" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.327 2.745 1.5 6.75l3.766 3.015z"
                      />
                      <path
                        fill="#34A853"
                        d="M16.04 15.34c-1.073.71-2.437 1.17-4.04 1.17a6.994 6.994 0 0 1-6.734-4.91L1.5 14.614C3.327 18.62 7.336 21.36 12 21.36c2.945 0 5.618-.98 7.582-2.673l-3.542-3.346z"
                      />
                      <path
                        fill="#4285F4"
                        d="M22.545 10.227H12v3.818h6.073A5.205 5.205 0 0 1 15.82 17.51l3.541 3.345C21.436 18.964 24 15.055 24 10.227a13.3 13.3 0 0 0-.164-2H22.545z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.266 14.235A6.974 6.974 0 0 1 4.909 12c0-.79.136-1.545.357-2.235L1.5 6.75A11.964 11.964 0 0 0 0 12c0 1.92.455 3.736 1.255 5.364l4.011-3.129z"
                      />
                    </svg>
                    <span>Đăng nhập với Google</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="nasani-login-footer">
          <span>Design and Develop by Ôn Gia Bảo</span>
        </div>
      </div>
    </div>
  );
};

export default Login;