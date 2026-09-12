import type { Timestamp } from "firebase/firestore";

export interface Account {
  id?: string;
  username: string;
  email?: string;       // Email Google được phép đăng nhập
  role: 'admin' | 'user';
  codePerson: string;     // liên kết Person
  personName: string;   // cache để query nhanh
  createdAt?: Timestamp;
  userName: string;
  password: string;
  avatar?: string;      // Avatar riêng của tài khoản (tách riêng với Google)
  isBlocked?: boolean;  // Trạng thái bị khóa quyền đăng nhập bởi Admin
  lastLoginAt?: Timestamp; // Lần đăng nhập gần nhất
}