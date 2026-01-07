// src/firebase.ts

// Import các hàm cần thiết
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// Cấu hình Firebase
const firebaseConfig = {
apiKey: "AIzaSyBnP8V6xWabk0cfGhwY4AdPX829rPPRnf4",
  authDomain: "bourbon-d0505.firebaseapp.com",
  projectId: "bourbon-d0505",
  storageBucket: "bourbon-d0505.firebasestorage.app",
  messagingSenderId: "935278237286",
  appId: "1:935278237286:web:2b8183abb241ac932fffa7",
  measurementId: "G-TEV7YQWQBZ"
};

// Khởi tạo Firebase
// Thêm 'export' để các file khác có thể import và sử dụng
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);

// Nếu sau này bạn dùng thêm Database (Firestore) hay Authentication, bạn cũng sẽ export tại đây.
// Ví dụ:
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(app);
