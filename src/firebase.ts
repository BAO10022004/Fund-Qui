
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
apiKey: "AIzaSyBnP8V6xWabk0cfGhwY4AdPX829rPPRnf4",
  authDomain: "bourbon-d0505.firebaseapp.com",
  projectId: "bourbon-d0505",
  storageBucket: "bourbon-d0505.firebasestorage.app",
  messagingSenderId: "935278237286",
  appId: "1:935278237286:web:2b8183abb241ac932fffa7",
  measurementId: "G-TEV7YQWQBZ"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
