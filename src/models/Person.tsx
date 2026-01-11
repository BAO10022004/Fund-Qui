import type { Timestamp } from "firebase/firestore";

export interface Person {
  id?: string;
  name: string;
  code: string;
  createdAt?: Timestamp;
}
