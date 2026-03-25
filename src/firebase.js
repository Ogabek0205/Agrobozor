import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCXvrLGzaNh3BsUTGJISEp-pj1ejulK9IE",
  authDomain: "agrobozor-3f5bc.firebaseapp.com",
  projectId: "agrobozor-3f5bc",
  storageBucket: "agrobozor-3f5bc.firebasestorage.app",
  messagingSenderId: "703250490456",
  appId: "1:703250490456:web:4e4ec9df3b8176299ad62d",
  measurementId: "G-CK6GCZG5V0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
