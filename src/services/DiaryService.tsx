import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Diary } from '../models/Diary';

const DIARIES_COLLECTION = 'diaries';

// ============ CREATE ============

/**
 * Tạo diary mới
 */
export const createDiary = async (diaryData: Omit<Diary, 'id'>): Promise<string> => {
  try {
    // Kiểm tra xem user đã có diary cho ngày này chưa
    const dateQuery = query(
      collection(db, DIARIES_COLLECTION),
      where('date', '==', diaryData.date),
      where('username', '==', diaryData.username)
    );
    const dateSnapshot = await getDocs(dateQuery);
    
    if (!dateSnapshot.empty) {
      throw new Error('Diary cho ngày này và user này đã tồn tại!');
    }

    // Tạo diary mới
    const docRef = await addDoc(collection(db, DIARIES_COLLECTION), diaryData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating diary:', error);
    throw error;
  }
};

// ============ READ ============

/**
 * Lấy tất cả diaries
 */
export const getAllDiaries = async (): Promise<Diary[]> => {
  try {
    const q = query(
      collection(db, DIARIES_COLLECTION),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Diary));
  } catch (error) {
    console.error('Error getting diaries:', error);
    throw error;
  }
};

/**
 * Lấy diary theo ID
 */
export const getDiaryById = async (diaryId: string): Promise<Diary | null> => {
  try {
    const docRef = doc(db, DIARIES_COLLECTION, diaryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Diary;
    }
    return null;
  } catch (error) {
    console.error('Error getting diary:', error);
    throw error;
  }
};

/**
 * Lấy diary theo ngày (date) và username
 */
export const getDiaryByDate = async (date: Timestamp, username: string): Promise<Diary | null> => {
  try {
    const q = query(
      collection(db, DIARIES_COLLECTION),
      where('date', '==', date),
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Diary;
    }
    return null;
  } catch (error) {
    console.error('Error getting diary by date:', error);
    throw error;
  }
};

/**
 * Lấy diaries trong khoảng thời gian theo username
 */
export const getDiariesByDateRange = async (
  startDate: Timestamp,
  endDate: Timestamp,
  username: string
): Promise<Diary[]> => {
  try {
    const q = query(
      collection(db, DIARIES_COLLECTION),
      where('username', '==', username),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Diary));
  } catch (error) {
    console.error('Error getting diaries by date range:', error);
    throw error;
  }
};

/**
 * Lấy diaries theo session ID (morning hoặc afternoon) và username
 */
export const getDiariesBySessionId = async (
  sessionId: string,
  sessionType: 'morning' | 'afternoon',
  username: string
): Promise<Diary[]> => {
  try {
    const fieldName = sessionType === 'morning' ? 'morningSessionId' : 'afternoonSessionId';
    const q = query(
      collection(db, DIARIES_COLLECTION),
      where('username', '==', username),
      where(fieldName, '==', sessionId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Diary));
  } catch (error) {
    console.error('Error getting diaries by session ID:', error);
    throw error;
  }
};

/**
 * Lấy tất cả diaries của một user
 */
export const getDiariesByUsername = async (username: string): Promise<Diary[]> => {
  try {
    const q = query(
      collection(db, DIARIES_COLLECTION),
      where('username', '==', username),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Diary));
  } catch (error) {
    console.error('Error getting diaries by username:', error);
    throw error;
  }
};

// ============ UPDATE ============

/**
 * Cập nhật diary
 */
export const updateDiary = async (
  diaryId: string,
  diaryData: Partial<Omit<Diary, 'id'>>
): Promise<void> => {
  try {
    const docRef = doc(db, DIARIES_COLLECTION, diaryId);
    
    // Nếu thay đổi date hoặc username, kiểm tra xem date + username mới có bị trùng không
    if (diaryData.date || diaryData.username) {
      // Lấy thông tin diary hiện tại
      const currentDiary = await getDiaryById(diaryId);
      if (!currentDiary) {
        throw new Error('Diary không tồn tại!');
      }

      const checkDate = diaryData.date || currentDiary.date;
      const checkUsername = diaryData.username || currentDiary.username;

      const dateQuery = query(
        collection(db, DIARIES_COLLECTION),
        where('date', '==', checkDate),
        where('username', '==', checkUsername)
      );
      const dateSnapshot = await getDocs(dateQuery);
      
      // Kiểm tra xem có diary nào khác dùng date + username này không
      const duplicateDiary = dateSnapshot.docs.find(doc => doc.id !== diaryId);
      if (duplicateDiary) {
        throw new Error('Diary cho ngày này và user này đã tồn tại!');
      }
    }

    await updateDoc(docRef, diaryData);
  } catch (error) {
    console.error('Error updating diary:', error);
    throw error;
  }
};

/**
 * Cập nhật morning session ID
 */
export const updateMorningSessionId = async (
  diaryId: string,
  morningSessionId: string
): Promise<void> => {
  try {
    await updateDiary(diaryId, { morningSessionId });
  } catch (error) {
    console.error('Error updating morning session ID:', error);
    throw error;
  }
};

/**
 * Cập nhật afternoon session ID
 */
export const updateAfternoonSessionId = async (
  diaryId: string,
  afternoonSessionId: string
): Promise<void> => {
  try {
    await updateDiary(diaryId, { afternoonSessionId });
  } catch (error) {
    console.error('Error updating afternoon session ID:', error);
    throw error;
  }
};

/**
 * Cập nhật cả hai session IDs
 */
export const updateBothSessionIds = async (
  diaryId: string,
  morningSessionId: string,
  afternoonSessionId: string
): Promise<void> => {
  try {
    await updateDiary(diaryId, { morningSessionId, afternoonSessionId });
  } catch (error) {
    console.error('Error updating both session IDs:', error);
    throw error;
  }
};

// ============ DELETE ============

/**
 * Xóa diary
 */
export const deleteDiary = async (diaryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, DIARIES_COLLECTION, diaryId));
  } catch (error) {
    console.error('Error deleting diary:', error);
    throw error;
  }
};