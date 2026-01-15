import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { History, HistoryType } from '../models/history';

const HISTORY_COLLECTION = 'history';

// ============ CREATE ============

/**
 * Thêm lịch sử hành động
 */
export const addHistory = async (
  username: string,
  type: HistoryType,
  content?: string
): Promise<string> => {
  try {
    const newHistory: Omit<History, 'id'> = {
      username,
      type,
      updatedAt: Timestamp.now(),
      content: content || ''
    };

    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), newHistory);
    return docRef.id;
  } catch (error) {
    console.error('Error adding history:', error);
    throw error;
  }
};

// ============ READ ============

/**
 * Lấy tất cả lịch sử (sắp xếp theo thời gian mới nhất)
 */
export const getAllHistory = async (): Promise<History[]> => {
  try {
    const q = query(
      collection(db, HISTORY_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as History));
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
  }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Log hành động DELETE
 */
export const logDelete = async (username: string, content: string): Promise<void> => {
  await addHistory(username, 'DELETE', content);
};

/**
 * Log hành động CREATE
 */
export const logCreate = async (username: string, content: string): Promise<void> => {
  await addHistory(username, 'CREATE', content);
};

/**
 * Log hành động UPDATE
 */
export const logUpdate = async (username: string, content: string): Promise<void> => {
  await addHistory(username, 'UPDATE', content);
};

/**
 * Log hành động LOGIN
 */
export const logLogin = async (username: string): Promise<void> => {
  await addHistory(username, 'LOGIN', `Đăng nhập thành công`);
};

/**
 * Lấy lịch sử theo username
 */
export const getHistoryByUsername = async (username: string): Promise<History[]> => {
  try {
    const allHistory = await getAllHistory();
    return allHistory.filter(h => h.username === username);
  } catch (error) {
    console.error('Error getting history by username:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử theo loại hành động
 */
export const getHistoryByType = async (type: HistoryType): Promise<History[]> => {
  try {
    const allHistory = await getAllHistory();
    return allHistory.filter(h => h.type === type);
  } catch (error) {
    console.error('Error getting history by type:', error);
    throw error;
  }
};