// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA10PZvSjqFMlqEo-oyn4AS7gCdPsDGVJ8",
  authDomain: "fund-22b8b.firebaseapp.com",
  projectId: "fund-22b8b",
  storageBucket: "fund-22b8b.firebasestorage.app",
  messagingSenderId: "731482890144",
  appId: "1:731482890144:web:46cd8ab00f1c7f51450ec5",
  measurementId: "G-QB1V1LMBGG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);