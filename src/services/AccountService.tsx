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
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Account } from '../models/Account';
import type { Person } from '../models/Person';

const ACCOUNTS_COLLECTION = 'accounts';
const PERSONS_COLLECTION = 'persons';

export const createAccount = async (accountData: Omit<Account, 'id' | 'createdAt' | 'personName'>): Promise<string> => {
  try {
    // Kiểm tra Person có tồn tại không
    const personQuery = query(
      collection(db, PERSONS_COLLECTION),
      where('code', '==', accountData.codePerson)
    );
    const personSnapshot = await getDocs(personQuery);
    
    if (personSnapshot.empty) {
      throw new Error(`Không tìm thấy người với mã: ${accountData.codePerson}`);
    }

    const personData = personSnapshot.docs[0].data() as Person;
    
    // Kiểm tra username đã tồn tại chưa
    const usernameQuery = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('username', '==', accountData.username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      throw new Error(`Username "${accountData.username}" đã tồn tại!`);
    }

    // Tạo account với personName từ Person
    const newAccount: Omit<Account, 'id'> = {
      ...accountData,
      personName: personData.name,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), newAccount);
    return docRef.id;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

// ============ READ ============

/**
 * Lấy tất cả accounts
 */
export const getAllAccounts = async (): Promise<Account[]> => {
  try {
    const q = query(collection(db, ACCOUNTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Account));
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
};

/**
 * Lấy account theo ID
 */
export const getAccountById = async (accountId: string): Promise<Account | null> => {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Account;
    }
    return null;
  } catch (error) {
    console.error('Error getting account:', error);
    throw error;
  }
};

/**
 * Lấy account theo username
 */
export const getAccountByUsername = async (username: string): Promise<Account | null> => {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Account;
    }
    return null;
  } catch (error) {
    console.error('Error getting account by username:', error);
    throw error;
  }
};

/**
 * Lấy account theo codePerson
 */
export const getAccountByCodePerson = async (codePerson: string): Promise<Account | null> => {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('codePerson', '==', codePerson)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Account;
    }
    return null;
  } catch (error) {
    console.error('Error getting account by codePerson:', error);
    throw error;
  }
};

/**
 * Lấy tất cả accounts theo role
 */
export const getAccountsByRole = async (role: 'admin' | 'user'): Promise<Account[]> => {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Account));
  } catch (error) {
    console.error('Error getting accounts by role:', error);
    throw error;
  }
};

// ============ UPDATE ============

/**
 * Cập nhật account
 * Nếu codePerson thay đổi, tự động cập nhật personName
 */
export const updateAccount = async (
  accountId: string,
  accountData: Partial<Omit<Account, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    
    // Nếu codePerson thay đổi, cập nhật personName
    if (accountData.codePerson) {
      const personQuery = query(
        collection(db, PERSONS_COLLECTION),
        where('code', '==', accountData.codePerson)
      );
      const personSnapshot = await getDocs(personQuery);
      
      if (personSnapshot.empty) {
        throw new Error(`Không tìm thấy người với mã: ${accountData.codePerson}`);
      }

      const personData = personSnapshot.docs[0].data() as Person;
      accountData.personName = personData.name;
    }

    // Kiểm tra username mới có bị trùng không (nếu thay đổi username)
    if (accountData.username) {
      const usernameQuery = query(
        collection(db, ACCOUNTS_COLLECTION),
        where('username', '==', accountData.username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      // Kiểm tra xem có account nào khác dùng username này không
      const duplicateAccount = usernameSnapshot.docs.find(doc => doc.id !== accountId);
      if (duplicateAccount) {
        throw new Error(`Username "${accountData.username}" đã tồn tại!`);
      }
    }

    await updateDoc(docRef, accountData);
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

/**
 * Đổi mật khẩu
 */
export const changePassword = async (accountId: string, newPassword: string): Promise<void> => {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(docRef, {
      password: newPassword
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Cập nhật role
 */
export const updateAccountRole = async (
  accountId: string,
  newRole: 'admin' | 'user'
): Promise<void> => {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(docRef, {
      role: newRole
    });
  } catch (error) {
    console.error('Error updating account role:', error);
    throw error;
  }
};

// ============ DELETE ============

/**
 * Xóa account
 */
export const deleteAccount = async (accountId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, accountId));
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Xác thực đăng nhập
 */
export const authenticateAccount = async (
  username: string,
  password: string
): Promise<Account | null> => {
  try {
    const account = await getAccountByUsername(username);
    
    if (account && account.password === password) {
      return account;
    }
    return null;
  } catch (error) {
    console.error('Error authenticating account:', error);
    throw error;
  }
};

/**
 * Kiểm tra username có tồn tại không
 */
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const account = await getAccountByUsername(username);
    return account !== null;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

/**
 * Đồng bộ personName khi Person thay đổi tên
 * Gọi function này khi update Person
 */
export const syncPersonNameInAccounts = async (codePerson: string, newName: string): Promise<void> => {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('codePerson', '==', codePerson)
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { personName: newName })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error syncing person name in accounts:', error);
    throw error;
  }
};

/**
 * Kiểm tra Person có thể xóa không (không có Account nào liên kết)
 */
export const canDeletePerson = async (codePerson: string): Promise<boolean> => {
  try {
    const account = await getAccountByCodePerson(codePerson);
    return account === null;
  } catch (error) {
    console.error('Error checking if person can be deleted:', error);
    throw error;
  }
};

/**
 * Lấy danh sách accounts với thông tin Person đầy đủ
 */
export const getAccountsWithPersonInfo = async (): Promise<(Account & { person?: Person })[]> => {
  try {
    const accounts = await getAllAccounts();
    const personsQuery = await getDocs(collection(db, PERSONS_COLLECTION));
    const personsMap = new Map<string, Person>();
    
    personsQuery.docs.forEach(doc => {
      const person = { id: doc.id, ...doc.data() } as Person;
      personsMap.set(person.code, person);
    });
    
    return accounts.map(account => ({
      ...account,
      person: personsMap.get(account.codePerson)
    }));
  } catch (error) {
    console.error('Error getting accounts with person info:', error);
    throw error;
  }
};