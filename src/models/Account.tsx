import type { Timestamp } from "firebase/firestore";

export interface Account {
  id?: string;
  username: string;
  role: 'admin' | 'user';
  codePerson: string;     // liên kết Person
  personName: string;   // cache để query nhanh
  createdAt?: Timestamp;
  userName: string;
  password: string;
}