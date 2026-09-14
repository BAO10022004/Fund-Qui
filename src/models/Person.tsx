import type { Timestamp } from "firebase/firestore";

export interface Person {
  id?: string;
  name: string;
  code: string;
  email?: string;
  createdAt?: Timestamp;
  avatar?: string;
}
