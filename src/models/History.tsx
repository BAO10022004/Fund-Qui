import type { Timestamp } from "firebase/firestore";
export type HistoryType = "DELETE" | "CREATE" | "UPDATE" | "LOGIN";
export interface History {
  id?: string;
  username: string;
  type: HistoryType;
  updatedAt?: Timestamp;
  content?: string;
}
