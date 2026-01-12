import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Session } from '../models/Session';
import type { Action } from '../models/Action';

const SESSIONS_COLLECTION = 'sessions';
const ACTIONS_COLLECTION = 'actions';

// ============ CREATE ============

export const createSession = async (
  number: number,
  actionId: string,
): Promise<string> => {
  try {
    // Validate number
    if (number <= 0) {
      throw new Error('Number phải lớn hơn 0!');
    }

    // Kiểm tra actionId có tồn tại không
    const actionRef = doc(db, ACTIONS_COLLECTION, actionId);
    const actionSnap = await getDoc(actionRef);
    
    if (!actionSnap.exists()) {
      throw new Error('Action không tồn tại!');
    }

    // Kiểm tra number đã tồn tại chưa
    const numberQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where('number', '==', number)
    );
    const numberSnapshot = await getDocs(numberQuery);
    
    if (!numberSnapshot.empty) {
      throw new Error(`Session với number ${number} đã tồn tại!`);
    }

    // Tạo session mới - CHỈ lưu number và actionId
    const newSession = {
      number,
      actionId,
    };

    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), newSession);
    console.log('✅ Session created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating session:', error);
    throw error;
  }
};

// ============ READ ============


export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, SESSIONS_COLLECTION));
    
    // Lấy tất cả actions để populate
    const actionsSnapshot = await getDocs(collection(db, ACTIONS_COLLECTION));
    const actionsMap = new Map<string, Action>();
    
    actionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      actionsMap.set(doc.id, {
        id: doc.id,
        name: data.name,
      });
    });
    
    // Map sessions với action data
    const sessions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        number: data.number,
        actionId: data.actionId,
      } as Session;
    });
    
    console.log('✅ Loaded sessions:', sessions.length);
    return sessions;
  } catch (error) {
    console.error('❌ Error getting sessions:', error);
    throw error;
  }
};


export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    
    // Lấy action data
    let action: Action = { id: data.actionId, name: 'Unknown' };
    if (data.actionId) {
      const actionRef = doc(db, ACTIONS_COLLECTION, data.actionId);
      const actionSnap = await getDoc(actionRef);
      if (actionSnap.exists()) {
        const actionData = actionSnap.data();
        action = {
          id: actionSnap.id,
          name: actionData.name,
        };
      }
    }
    
    return {
      id: docSnap.id,
      number: data.number,
      actionId: data.actionId,
    } as Session;
  } catch (error) {
    console.error('❌ Error getting session:', error);
    throw error;
  }
};

// ============ UPDATE ============

export const updateSession = async (
  sessionId: string,
  updateData: { number?: number; actionId?: string }
): Promise<void> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    
    // Kiểm tra session có tồn tại không
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Session không tồn tại!');
    }
    
    // Validate number nếu có
    if (updateData.number !== undefined) {
      if (updateData.number <= 0) {
        throw new Error('Number phải lớn hơn 0!');
      }
      
      // Kiểm tra number mới có bị trùng không
      const numberQuery = query(
        collection(db, SESSIONS_COLLECTION),
        where('number', '==', updateData.number)
      );
      const numberSnapshot = await getDocs(numberQuery);
      
      const duplicateSession = numberSnapshot.docs.find(d => d.id !== sessionId);
      if (duplicateSession) {
        throw new Error(`Session với number ${updateData.number} đã tồn tại!`);
      }
    }
    
    // Validate actionId nếu có
    if (updateData.actionId) {
      const actionRef = doc(db, ACTIONS_COLLECTION, updateData.actionId);
      const actionSnap = await getDoc(actionRef);
      
      if (!actionSnap.exists()) {
        throw new Error('Action không tồn tại!');
      }
    }
    
    await updateDoc(docRef, updateData);
    console.log('✅ Session updated:', sessionId);
  } catch (error) {
    console.error('❌ Error updating session:', error);
    throw error;
  }
};

// ============ DELETE ============

/**
 * Xóa session
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    console.log('✅ Session deleted:', sessionId);
  } catch (error) {
    console.error('❌ Error deleting session:', error);
    throw error;
  }
};
