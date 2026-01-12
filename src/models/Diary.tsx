import type { Timestamp } from "firebase/firestore";
export interface Diary {
  id?: string;
  date: Timestamp;
  morningSessionId: string;
  afternoonSessionId: string;
  username: string;
}
