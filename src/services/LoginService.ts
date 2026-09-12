import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface LoginLog {
  id?: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  role: 'admin' | 'user';
  loginTime: Timestamp;
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  userAgent: string;
  status: 'success' | 'blocked';
  reason?: string;
  source?: 'realtime' | 'history';
}

const LOGIN_LOGS_COLLECTION = 'login_logs';
const ACCOUNTS_COLLECTION = 'accounts';
const HISTORY_COLLECTION = 'history';

/**
 * Phân tích User Agent trình duyệt để trích xuất Browser, OS, Device Type
 */
export const parseUserAgent = (ua: string = navigator.userAgent): {
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
} => {
  let browser = 'Trình duyệt khác';
  let os = 'Hệ điều hành khác';
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';

  // 1. Nhận diện thiết bị
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // 2. Nhận diện Hệ điều hành (OS)
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // 3. Nhận diện Trình duyệt (Browser)
  if (/CocCoc/i.test(ua)) browser = 'Cốc Cốc';
  else if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';

  return { browser, os, deviceType };
};

/**
 * Ghi lại nhật ký đăng nhập vào Firestore
 */
export const recordLoginLog = async (params: {
  email: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  role?: 'admin' | 'user';
  status?: 'success' | 'blocked';
  reason?: string;
}): Promise<string> => {
  try {
    const { browser, os, deviceType } = parseUserAgent();
    const logData: Omit<LoginLog, 'id'> = {
      email: params.email || '',
      username: params.username || params.email || '',
      displayName: params.displayName || params.username || params.email || 'Người dùng',
      avatar: params.avatar || null,
      role: params.role || 'user',
      loginTime: Timestamp.now(),
      browser: browser || 'Chrome',
      os: os || 'Windows',
      deviceType: deviceType || 'Desktop',
      userAgent: navigator.userAgent || '',
      status: params.status || 'success',
      reason: params.reason || (params.status === 'blocked' ? 'Bị khóa quyền truy cập' : 'Đăng nhập thành công')
    };

    const docRef = await addDoc(collection(db, LOGIN_LOGS_COLLECTION), logData);
    return docRef.id;
  } catch (error) {
    console.error('Lỗi khi ghi login log:', error);
    return '';
  }
};

/**
 * Lấy danh sách lịch sử đăng nhập tổng hợp (login_logs + history)
 */
export const fetchHistoricalLoginLogs = async (): Promise<LoginLog[]> => {
  try {
    const q = query(
      collection(db, HISTORY_COLLECTION),
      where('type', '==', 'LOGIN'),
      limit(150)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      const u = data.username || 'user';
      return {
        id: `hist_${d.id}`,
        email: u,
        username: u,
        displayName: u.split('@')[0],
        avatar: null,
        role: (u.includes('admin') || u.includes('giabao')) ? 'admin' : 'user',
        loginTime: data.updatedAt || Timestamp.now(),
        browser: 'Trình duyệt Web',
        os: 'Hệ điều hành Web',
        deviceType: 'Desktop',
        userAgent: '',
        status: 'success',
        reason: data.content || 'Đăng nhập thành công',
        source: 'history'
      } as LoginLog;
    });
  } catch (err) {
    console.warn('Could not fetch historical login logs:', err);
    return [];
  }
};

/**
 * Đăng ký lắng nghe nhật ký đăng nhập thời gian thực
 * Tự động hợp nhất cả login_logs và các bản ghi LOGIN cũ trong history
 */
export const subscribeLoginLogs = (
  callback: (logs: LoginLog[]) => void,
  limitCount: number = 150
) => {
  let historicalLogs: LoginLog[] = [];

  // 1. Tải trước các bản ghi lịch sử LOGIN cũ
  fetchHistoricalLoginLogs().then(hist => {
    historicalLogs = hist;
  });

  // 2. Lắng nghe thời gian thực collection login_logs
  const q = query(
    collection(db, LOGIN_LOGS_COLLECTION),
    orderBy('loginTime', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const realLogs = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        } as LoginLog))
        .filter(l => l.email !== 'test@gmail.com'); // Lọc bỏ dữ liệu test nếu có

      // Hợp nhất dữ liệu mới và dữ liệu cũ
      const mergedMap = new Map<string, LoginLog>();
      
      // Đưa dữ liệu realtime trước
      realLogs.forEach(l => {
        if (l.id) mergedMap.set(l.id, l);
      });

      // Bổ sung dữ liệu lịch sử nếu chưa có
      historicalLogs.forEach(h => {
        if (h.id && !mergedMap.has(h.id)) {
          mergedMap.set(h.id, h);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      // Sắp xếp thời gian giảm dần
      mergedList.sort((a, b) => {
        const tA = (a.loginTime as any)?.seconds || 0;
        const tB = (b.loginTime as any)?.seconds || 0;
        return tB - tA;
      });

      callback(mergedList);
    },
    (error) => {
      console.error('Lỗi khi lắng nghe realtime login logs:', error);
      // Fallback khi lỗi: trả về dữ liệu lịch sử
      if (historicalLogs.length > 0) {
        callback(historicalLogs);
      }
    }
  );
};

/**
 * Xóa 1 bản ghi đăng nhập
 */
export const deleteLoginLog = async (logId: string): Promise<void> => {
  try {
    if (logId.startsWith('hist_')) {
      const rawId = logId.replace('hist_', '');
      await deleteDoc(doc(db, HISTORY_COLLECTION, rawId));
    } else {
      await deleteDoc(doc(db, LOGIN_LOGS_COLLECTION, logId));
    }
  } catch (error) {
    console.error('Lỗi khi xóa login log:', error);
    throw error;
  }
};

/**
 * Xóa toàn bộ lịch sử đăng nhập
 */
export const clearAllLoginLogs = async (): Promise<void> => {
  try {
    const q = query(collection(db, LOGIN_LOGS_COLLECTION), limit(200));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Lỗi khi dọn dẹp login logs:', error);
    throw error;
  }
};

/**
 * Khóa hoặc Mở khóa quyền đăng nhập của tài khoản
 */
export const toggleAccountBlock = async (accountId: string, isBlocked: boolean): Promise<void> => {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(accountRef, {
      isBlocked: isBlocked
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái khóa tài khoản:', error);
    throw error;
  }
};
