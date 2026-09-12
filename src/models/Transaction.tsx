import type { Timestamp } from "firebase/firestore";

export type TransactionStatus = 'completed' | 'waiting' | 'pending';

export interface Transaction {
  id?: string;
  date: string;
  dayOfWeek: string;
  amount: number;
  type: 'thu' | 'chi';
  description: string;
  personId: string;
  personName: string;
  status: TransactionStatus;
  createdAt?: Timestamp;
}