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
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Person {
  id?: string;
  name: string;
  code: string;
  createdAt?: Timestamp;
}

export interface Transaction {
  id?: string;
  date: string;
  dayOfWeek: string;
  amount: number;
  type: 'thu' | 'chi';
  description: string;
  personId: string;
  personName: string;
  status: 'pending' | 'completed';
  createdAt?: Timestamp;
}

// ==================== PERSONS ====================

export const getAllPersons = async (): Promise<Person[]> => {
  try {
    const q = query(collection(db, 'persons'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const persons: Person[] = [];
    
    querySnapshot.forEach((doc) => {
      persons.push({
        id: doc.id,
        ...doc.data()
      } as Person);
    });
    
    return persons;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người:', error);
    throw error;
  }
};

export const addPerson = async (person: Omit<Person, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'persons'), {
      ...person,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Lỗi khi thêm người:', error);
    throw error;
  }
};

export const updatePerson = async (id: string, data: Partial<Person>): Promise<void> => {
  try {
    const docRef = doc(db, 'persons', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Lỗi khi cập nhật người:', error);
    throw error;
  }
};

export const deletePerson = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'persons', id));
  } catch (error) {
    console.error('Lỗi khi xóa người:', error);
    throw error;
  }
};

// ==================== TRANSACTIONS ====================

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

// ==================== BATCH OPERATIONS ====================

export const importPersons = async (persons: Omit<Person, 'id'>[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    persons.forEach((person) => {
      const docRef = doc(collection(db, 'persons'));
      batch.set(docRef, {
        ...person,
        createdAt: Timestamp.now()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Lỗi khi import persons:', error);
    throw error;
  }
};

export const importTransactions = async (transactions: Omit<Transaction, 'id'>[]): Promise<void> => {
  try {
    // Firestore batch giới hạn 500 operations
    const batchSize = 500;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchTransactions = transactions.slice(i, i + batchSize);
      
      batchTransactions.forEach((transaction) => {
        const docRef = doc(collection(db, 'transactions'));
        batch.set(docRef, {
          ...transaction,
          createdAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Lỗi khi import transactions:', error);
    throw error;
  }
};

export const deleteAllTransactions = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Lỗi khi xóa tất cả giao dịch:', error);
    throw error;
  }
};

export const deleteAllPersons = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'persons'));
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Lỗi khi xóa tất cả persons:', error);
    throw error;
  }
};