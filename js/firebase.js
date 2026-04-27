// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  increment,orderBy,query,where,limit,updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCthFnm3ogMF4Zk0XZ4v9ZtS4zZKbU-3XM",
  authDomain: "rootrix-crew.firebaseapp.com",
  projectId: "rootrix-crew",
  storageBucket: "rootrix-crew.firebasestorage.app",
  messagingSenderId: "593736406484",
  appId: "1:593736406484:web:9bc34f2c763bd1e3a67241",
  measurementId: "G-70W66WGBJN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Re-export Firestore and Auth helpers
export {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  increment,orderBy,query,where,limit,updateDoc
};

// Expose globals for legacy scripts
window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;
