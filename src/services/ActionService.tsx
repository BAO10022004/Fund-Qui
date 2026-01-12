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
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Action } from '../models/Action';

const ACTIONS_COLLECTION = 'actions';

// ============ CREATE ============

/**
 * Tạo action mới
 */
export const createAction = async (actionData: string): Promise<string> => {
  try {
    // Kiểm tra tên action đã tồn tại chưa
    const nameQuery = query(
      collection(db, ACTIONS_COLLECTION),
      where('name', '==', actionData)
    );
    const nameSnapshot = await getDocs(nameQuery);
    
    if (!nameSnapshot.empty) {
      throw new Error(`Action với tên "${actionData}" đã tồn tại!`);
    }

    // Tạo action mới
    const newAction: Omit<Action, 'id'> = {
      name: actionData,
    };

    const docRef = await addDoc(collection(db, ACTIONS_COLLECTION), newAction);
    return docRef.id;
  } catch (error) {
    console.error('Error creating action:', error);
    throw error;
  }
};

// ============ READ ============

/**
 * Lấy tất cả actions
 */
export const getAllActions = async (): Promise<Action[]> => {
  try {
    const q = query(collection(db, ACTIONS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Action));
  } catch (error) {
    console.error('Error getting actions:', error);
    throw error;
  }
};

/**
 * Lấy action theo ID
 */
export const getActionById = async (actionId: string): Promise<Action | null> => {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Action;
    }
    return null;
  } catch (error) {
    console.error('Error getting action:', error);
    throw error;
  }
};

/**
 * Lấy action theo tên
 */
export const getActionByName = async (name: string): Promise<Action | null> => {
  try {
    const q = query(
      collection(db, ACTIONS_COLLECTION),
      where('name', '==', name)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Action;
    }
    return null;
  } catch (error) {
    console.error('Error getting action by name:', error);
    throw error;
  }
};


// ============ UPDATE ============

/**
 * Cập nhật action
 */
export const updateAction = async (
  actionId: string,
  actionData: Partial<Omit<Action, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    
    // Kiểm tra tên mới có bị trùng không (nếu thay đổi tên)
    if (actionData.name) {
      const nameQuery = query(
        collection(db, ACTIONS_COLLECTION),
        where('name', '==', actionData.name)
      );
      const nameSnapshot = await getDocs(nameQuery);
      
      // Kiểm tra xem có action nào khác dùng tên này không
      const duplicateAction = nameSnapshot.docs.find(doc => doc.id !== actionId);
      if (duplicateAction) {
        throw new Error(`Action với tên "${actionData.name}" đã tồn tại!`);
      }
    }

    await updateDoc(docRef, actionData);
  } catch (error) {
    console.error('Error updating action:', error);
    throw error;
  }
};

/**
 * Cập nhật tên action
 */
export const updateActionName = async (actionId: string, newName: string): Promise<void> => {
  try {
    await updateAction(actionId, { name: newName });
  } catch (error) {
    console.error('Error updating action name:', error);
    throw error;
  }
};

// ============ DELETE ============

export const deleteAction = async (actionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ACTIONS_COLLECTION, actionId));
  } catch (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
};
