// import {
//   collection,
//   addDoc,
//   getDocs,
//   deleteDoc,
//   updateDoc,
//   doc,
//   query,
//   orderBy,
//   where,
//   Timestamp,
//   writeBatch
// } from 'firebase/firestore';
// import { db } from '../firebase';
// import type { Person } from '../models/Person';
// import type { Transaction } from '../models/Transaction';
// import type { Account } from '../models/Account';

// export const importPersons = async (persons: Omit<Person, 'id'>[]): Promise<void> => {
//   try {
//     const batch = writeBatch(db);
    
//     persons.forEach((person) => {
//       const docRef = doc(collection(db, 'persons'));
//       batch.set(docRef, {
//         ...person,
//         createdAt: Timestamp.now()
//       });
//     });
    
//     await batch.commit();
//   } catch (error) {
//     console.error('Lỗi khi import persons:', error);
//     throw error;
//   }
// };

// export const importTransactions = async (transactions: Omit<Transaction, 'id'>[]): Promise<void> => {
//   try {
//     // Firestore batch giới hạn 500 operations
//     const batchSize = 500;
    
//     for (let i = 0; i < transactions.length; i += batchSize) {
//       const batch = writeBatch(db);
//       const batchTransactions = transactions.slice(i, i + batchSize);
      
//       batchTransactions.forEach((transaction) => {
//         const docRef = doc(collection(db, 'transactions'));
//         batch.set(docRef, {
//           ...transaction,
//           createdAt: Timestamp.now()
//         });
//       });
      
//       await batch.commit();
//     }
//   } catch (error) {
//     console.error('Lỗi khi import transactions:', error);
//     throw error;
//   }
// };

// export const deleteAllTransactions = async (): Promise<void> => {
//   try {
//     const querySnapshot = await getDocs(collection(db, 'transactions'));
//     const batch = writeBatch(db);
    
//     querySnapshot.docs.forEach((doc) => {
//       batch.delete(doc.ref);
//     });
    
//     await batch.commit();
//   } catch (error) {
//     console.error('Lỗi khi xóa tất cả giao dịch:', error);
//     throw error;
//   }
// };

// export const deleteAllPersons = async (): Promise<void> => {
//   try {
//     const querySnapshot = await getDocs(collection(db, 'persons'));
//     const batch = writeBatch(db);
    
//     querySnapshot.docs.forEach((doc) => {
//       batch.delete(doc.ref);
//     });
    
//     await batch.commit();
//   } catch (error) {
//     console.error('Lỗi khi xóa tất cả persons:', error);
//     throw error;
//   }
// };
// export const getAllAccounts = async (): Promise<Account[]> => {
//   try {
//     const q = query(collection(db, 'accounts'), orderBy('createdAt', 'desc'));
//     const querySnapshot = await getDocs(q);

//     const accounts: Account[] = [];
//     querySnapshot.forEach((doc) => {
//       accounts.push({
//         id: doc.id,
//         ...doc.data()
//       } as Account);
//     });

//     return accounts;
//   } catch (error) {
//     console.error('Lỗi khi lấy danh sách account:', error);
//     throw error;
//   }
// };
// export const addAccount = async (
//   account: Omit<Account, 'id'>
// ): Promise<string> => {
//   try {
//     const docRef = await addDoc(collection(db, 'accounts'), {
//       ...account,
//       createdAt: Timestamp.now()
//     });

//     return docRef.id;
//   } catch (error) {
//     console.error('Lỗi khi thêm account:', error);
//     throw error;
//   }
// };
// export const updateAccount = async (
//   id: string,
//   data: Partial<Account>
// ): Promise<void> => {
//   try {
//     const docRef = doc(db, 'accounts', id);
//     await updateDoc(docRef, data);
//   } catch (error) {
//     console.error('Lỗi khi cập nhật account:', error);
//     throw error;
//   }
// };
// export const deleteAccount = async (id: string): Promise<void> => {
//   try {
//     await deleteDoc(doc(db, 'accounts', id));
//   } catch (error) {
//     console.error('Lỗi khi xóa account:', error);
//     throw error;
//   }
// };
// export const getAccountByPerson = async (
//   personId: string
// ): Promise<Account | null> => {
//   try {
//     const q = query(
//       collection(db, 'accounts'),
//       where('personId', '==', personId)
//     );

//     const snapshot = await getDocs(q);
//     if (snapshot.empty) return null;

//     const docSnap = snapshot.docs[0];
//     return {
//       id: docSnap.id,
//       ...docSnap.data()
//     } as Account;
//   } catch (error) {
//     console.error('Lỗi khi lấy account theo person:', error);
//     throw error;
//   }
// };
