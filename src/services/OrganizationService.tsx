import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Organization } from '../models/Organization';

const ORGANIZATION_COLLECTION = 'organizations';

// ============ CREATE ============

/**
 * Thêm tổ chức mới
 */
export const addOrganization = async (
  data: Omit<Organization, 'id'>
): Promise<string> => {
  try {
    const newOrg: Omit<Organization, 'id'> = {
      name: data.name,
      leader: data.leader || '',
      sub: data.sub || '',
    };

    const docRef = await addDoc(collection(db, ORGANIZATION_COLLECTION), newOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error adding organization:', error);
    throw error;
  }
};

// ============ READ ============

/**
 * Lấy tất cả tổ chức
 */
export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const q = query(
      collection(db, ORGANIZATION_COLLECTION),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Organization));
  } catch (error) {
    console.error('Error getting organizations:', error);
    throw error;
  }
};

/**
 * Lấy tổ chức theo ID
 */
export const getOrganizationById = async (id: string): Promise<Organization | null> => {
  try {
    const docRef = doc(db, ORGANIZATION_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Organization;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization by ID:', error);
    throw error;
  }
};

/**
 * Lấy tổ chức theo username của trưởng (leader)
 */
export const getOrganizationsByLeader = async (leaderUsername: string): Promise<Organization[]> => {
  try {
    const all = await getAllOrganizations();
    return all.filter(org => org.leader === leaderUsername);
  } catch (error) {
    console.error('Error getting organizations by leader:', error);
    throw error;
  }
};

/**
 * Lấy tổ chức theo username của hỗ trợ trưởng (sub)
 */
export const getOrganizationsBySub = async (subUsername: string): Promise<Organization[]> => {
  try {
    const all = await getAllOrganizations();
    return all.filter(org => org.sub === subUsername);
  } catch (error) {
    console.error('Error getting organizations by sub:', error);
    throw error;
  }
};

// ============ UPDATE ============

/**
 * Cập nhật thông tin tổ chức
 */
export const updateOrganization = async (
  id: string,
  data: Partial<Omit<Organization, 'id'>>
): Promise<void> => {
  try {
    const docRef = doc(db, ORGANIZATION_COLLECTION, id);
    await updateDoc(docRef, { ...data });
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

/**
 * Cập nhật trưởng tổ chức
 */
export const updateOrganizationLeader = async (
  id: string,
  leaderUsername: string
): Promise<void> => {
  await updateOrganization(id, { leader: leaderUsername });
};

/**
 * Cập nhật hỗ trợ trưởng tổ chức
 */
export const updateOrganizationSub = async (
  id: string,
  subUsername: string
): Promise<void> => {
  await updateOrganization(id, { sub: subUsername });
};

// ============ DELETE ============

/**
 * Xóa tổ chức theo ID
 */
export const deleteOrganization = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, ORGANIZATION_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
};