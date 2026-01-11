import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Person } from '../models/Person';


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
