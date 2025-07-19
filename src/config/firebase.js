// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSDzy30rZXsf676uEpyxKE91kmcuLT7WU",
  authDomain: "hijab-bedc0.firebaseapp.com",
  databaseURL: "https://hijab-bedc0-default-rtdb.firebaseio.com",
  projectId: "hijab-bedc0",
  storageBucket: "hijab-bedc0.firebasestorage.app",
  messagingSenderId: "361267265403",
  appId: "1:361267265403:web:b3ccc40cbcc60e541787de",
  measurementId: "G-57X0F8PLQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

