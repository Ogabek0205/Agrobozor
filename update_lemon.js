// Run: node update_lemon.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXvrLGzaNh3BsUTGJISEp-pj1ejulK9IE",
  authDomain: "agrobozor-3f5bc.firebaseapp.com",
  projectId: "agrobozor-3f5bc",
  storageBucket: "agrobozor-3f5bc.firebasestorage.app",
  messagingSenderId: "703250490456",
  appId: "1:703250490456:web:4e4ec9df3b8176299ad62d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateLemonImage() {
  const q = query(collection(db, "products"), where("name", "==", "Limon"));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("Limon mahsuloti topilmadi!");
    return;
  }
  for (const d of snap.docs) {
    await updateDoc(doc(db, "products", d.id), {
      image: "https://images.unsplash.com/photo-1602524816915-83b5d7b9e35f?w=500&h=340&fit=crop"
    });
    console.log("Limon rasmi yangilandi:", d.id);
  }
}

updateLemonImage().catch(console.error);
