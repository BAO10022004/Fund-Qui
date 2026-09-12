// src/services/NotificationService.ts
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { updateTransaction } from './TransactionsService';
import { logUpdate } from './HistoryService';

export interface PaymentNotification {
  id?: string;
  type: 'payment_request';
  title: string;
  senderName: string;
  senderCode?: string;
  amount: number;
  transactionIds: string[];
  description: string;
  status: 'waiting' | 'approved' | 'rejected';
  createdAt: any;
  isRead: boolean;
  reviewedBy?: string;
  reviewedAt?: any;
}

const NOTIFICATION_COLLECTION = 'notifications';

/**
 * Tạo thông báo chờ duyệt thanh toán mới
 */
export const createPaymentNotification = async (
  notification: Omit<PaymentNotification, 'id' | 'createdAt' | 'status' | 'isRead'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATION_COLLECTION), {
      ...notification,
      status: 'waiting',
      isRead: false,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Lỗi khi tạo thông báo:', error);
    throw error;
  }
};

/**
 * Lắng nghe danh sách thông báo Realtime (sắp xếp mới nhất)
 */
export const subscribeNotifications = (
  callback: (notifications: PaymentNotification[]) => void
) => {
  const q = query(
    collection(db, NOTIFICATION_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PaymentNotification[] = [];
      snapshot.forEach((d) => {
        list.push({
          id: d.id,
          ...d.data()
        } as PaymentNotification);
      });
      callback(list);
    },
    (error) => {
      console.warn('Lỗi khi lắng nghe realtime thông báo:', error);
    }
  );
};

/**
 * Admin duyệt yêu cầu thanh toán:
 * 1. Chuyển các giao dịch sang 'completed' (Hoàn thành)
 * 2. Cập nhật thông báo sang 'approved'
 * 3. Ghi log lịch sử hệ thống
 */
export const approvePaymentRequest = async (
  notificationId: string,
  transactionIds: string[],
  adminName: string
): Promise<void> => {
  try {
    // 1. Cập nhật các giao dịch sang completed
    for (const txId of transactionIds) {
      if (txId) {
        await updateTransaction(txId, { status: 'completed' });
      }
    }

    // 2. Cập nhật thông báo
    const notifRef = doc(db, NOTIFICATION_COLLECTION, notificationId);
    await updateDoc(notifRef, {
      status: 'approved',
      isRead: true,
      reviewedBy: adminName,
      reviewedAt: Timestamp.now()
    });

    // 3. Ghi log lịch sử
    await logUpdate(
      adminName,
      `Admin ${adminName} đã DUYỆT yêu cầu thanh toán (Thông báo ID: ${notificationId}, Giao dịch: [${transactionIds.join(', ')}])`
    );
  } catch (error) {
    console.error('Lỗi khi duyệt thanh toán:', error);
    throw error;
  }
};

/**
 * Admin từ chối/hủy yêu cầu thanh toán:
 * 1. Chuyển các giao dịch về lại 'pending' (Chưa hoàn thành)
 * 2. Cập nhật thông báo sang 'rejected'
 * 3. Ghi log lịch sử hệ thống
 */
export const rejectPaymentRequest = async (
  notificationId: string,
  transactionIds: string[],
  adminName: string
): Promise<void> => {
  try {
    // 1. Chuyển các giao dịch về pending
    for (const txId of transactionIds) {
      if (txId) {
        await updateTransaction(txId, { status: 'pending' });
      }
    }

    // 2. Cập nhật thông báo
    const notifRef = doc(db, NOTIFICATION_COLLECTION, notificationId);
    await updateDoc(notifRef, {
      status: 'rejected',
      isRead: true,
      reviewedBy: adminName,
      reviewedAt: Timestamp.now()
    });

    // 3. Ghi log lịch sử
    await logUpdate(
      adminName,
      `Admin ${adminName} đã HỦY/TỪ CHỐI yêu cầu thanh toán (Thông báo ID: ${notificationId}, Giao dịch: [${transactionIds.join(', ')}])`
    );
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu thanh toán:', error);
    throw error;
  }
};
