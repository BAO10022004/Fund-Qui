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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Transaction } from '../models/Transaction';
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as Transaction);
    });
    
    return transactions;
  } catch (error) {
    console.error('Lỗi khi lấy giao dịch:', error);
    throw error;
  }
};

export const getTransactionsByPerson = async (personId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('personId', '==', personId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as Transaction);
    });
    
    return transactions;
  } catch (error) {
    console.error('Lỗi khi lấy giao dịch theo người:', error);
    throw error;
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transaction,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Lỗi khi thêm giao dịch:', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, data: Partial<Transaction>): Promise<void> => {
  try {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Lỗi khi cập nhật giao dịch:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (error) {
    console.error('Lỗi khi xóa giao dịch:', error);
    throw error;
  }
};