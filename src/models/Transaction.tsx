import type { Timestamp } from "firebase/firestore";

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