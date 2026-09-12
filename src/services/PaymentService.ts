// src/services/PaymentService.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PaymentConfig {
  bankId: string;           // Mã ngân hàng (VD: "ACB", "VCB", "MB", "TCB",...)
  bankName: string;         // Tên ngân hàng hiển thị
  accountNumber: string;    // Số tài khoản ngân hàng
  accountHolder: string;    // Tên chủ tài khoản
  adminEmail: string;       // Email nhận thông báo của Admin
  notePrefix?: string;      // Tiền tố nội dung chuyển khoản
  useDynamicVietQR?: boolean; // Tạo mã QR động điền sẵn số tiền hay dùng ảnh tĩnh
  emailjsServiceId?: string;  // Service ID EmailJS
  emailjsTemplateId?: string; // Template ID EmailJS
  emailjsPublicKey?: string;  // Public Key (User ID) EmailJS
}

export const POPULAR_BANKS = [
  { id: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)', shortName: 'ACB' },
  { id: 'VCB', name: 'Ngân hàng Ngoại Thương (Vietcombank)', shortName: 'Vietcombank' },
  { id: 'MB', name: 'Ngân hàng Quân Đội (MBBank)', shortName: 'MBBank' },
  { id: 'TCB', name: 'Ngân hàng Kỹ Thương (Techcombank)', shortName: 'Techcombank' },
  { id: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển (BIDV)', shortName: 'BIDV' },
  { id: 'CTG', name: 'Ngân hàng Công Thương (VietinBank)', shortName: 'VietinBank' },
  { id: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPBank' },
  { id: 'TPB', name: 'Ngân hàng Tiên Phong (TPBank)', shortName: 'TPBank' },
  { id: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)', shortName: 'Sacombank' },
  { id: 'HDB', name: 'Ngân hàng Phát triển TP.HCM (HDBank)', shortName: 'HDBank' },
  { id: 'VIB', name: 'Ngân hàng Quốc Tế (VIB)', shortName: 'VIB' },
  { id: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)', shortName: 'SHB' }
];

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  bankId: 'ACB',
  bankName: 'Ngân hàng TMCP Á Châu (ACB)',
  accountNumber: '0765837724',
  accountHolder: 'QUAN LY QUY NASANI',
  adminEmail: 'giabaoonutc2@gmail.com',
  notePrefix: 'DONG QUY',
  useDynamicVietQR: true,
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: ''
};

const PAYMENT_STORAGE_KEY = 'nasani_payment_config_cache';

/**
 * Lấy cấu hình thanh toán từ Firestore (kèm fallback cache và giá trị mặc định)
 */
export const getPaymentConfig = async (): Promise<PaymentConfig> => {
  try {
    const docRef = doc(db, 'settings', 'payment');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as PaymentConfig;
      const merged = { ...DEFAULT_PAYMENT_CONFIG, ...data };
      try {
        localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.warn('Lỗi lưu cache payment config:', e);
      }
      return merged;
    }
  } catch (error) {
    console.warn('Không thể tải cấu hình thanh toán từ Firestore, dùng cache:', error);
  }

  // Fallback từ LocalStorage
  try {
    const cached = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(cached) };
    }
  } catch (e) {
    console.warn('Lỗi đọc cache payment config:', e);
  }

  return DEFAULT_PAYMENT_CONFIG;
};

/**
 * Lưu cấu hình thanh toán lên Firestore
 */
export const savePaymentConfig = async (config: PaymentConfig): Promise<void> => {
  const docRef = doc(db, 'settings', 'payment');
  await setDoc(docRef, config, { merge: true });
  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('payment_config_updated', { detail: config }));
  } catch (e) {
    console.warn('Lỗi cập nhật cache payment config:', e);
  }
};

/**
 * Tạo URL mã VietQR động theo chuẩn Napas247 từ vietqr.io
 */
export const generateVietQRUrl = (
  bankId: string,
  accountNumber: string,
  accountHolder: string,
  amount?: number,
  content?: string
): string => {
  const cleanBank = encodeURIComponent(bankId || 'ACB');
  const cleanAcc = encodeURIComponent(accountNumber.trim());
  let url = `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png`;

  const params: string[] = [];
  if (amount && amount > 0) {
    params.push(`amount=${Math.round(amount)}`);
  }
  if (content && content.trim()) {
    // Chuẩn hóa tiếng Việt không dấu cho nội dung chuyển khoản an toàn
    const cleanContent = content
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim();
    params.push(`addInfo=${encodeURIComponent(cleanContent)}`);
  }
  if (accountHolder && accountHolder.trim()) {
    const cleanName = accountHolder
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'D')
      .toUpperCase()
      .trim();
    params.push(`accountName=${encodeURIComponent(cleanName)}`);
  }

  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  return url;
};
