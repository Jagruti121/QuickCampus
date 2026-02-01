



// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REPLACE THIS WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyDkdrC92xpceioXqo_uyM_t_SBNRbUSd14",
  authDomain: "quickcampus-cfdab.firebaseapp.com",
  projectId: "quickcampus-cfdab",
  storageBucket: "quickcampus-cfdab.firebasestorage.app",
  messagingSenderId: "215209128516",
  appId: "1:215209128516:web:f396befbf685c39ee28211"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // For your database later
