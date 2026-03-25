import { db } from './firebase.js';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

const DB = {
  users: [
    { id: 1, name: "Admin User", email: "admin@agro.uz", password: "admin123", role: "admin", region: "Toshkent", phone: "+998901234567", createdAt: "2024-01-01", avatar: "A", bio: "Platforma administratori" },
    { id: 2, name: "Jasur Toshmatov", email: "jasur@mail.uz", password: "123456", role: "farmer", region: "Samarqand", phone: "+998911234567", createdAt: "2024-02-15", avatar: "J", bio: "10 yillik tajribali fermer", farm: "Toshmatov Fermer Xo'jaligi", rating: 4.8 },
    { id: 3, name: "Malika Yunusova", email: "malika@mail.uz", password: "123456", role: "buyer", region: "Buxoro", phone: "+998931234567", createdAt: "2024-03-10", avatar: "M", bio: "Ulgurji xaridor" },
  ],
  categories: [
    { id: 1, name: "Sabzavotlar", icon: "📦", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&h=320&fit=crop", color: "#10B981", count: 156 },
    { id: 2, name: "Mevalar", icon: "🍎", image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500&h=320&fit=crop", color: "#10B981", count: 234 },
    { id: 3, name: "Don-donlar", icon: "🌾", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=320&fit=crop", color: "#10B981", count: 89 },
    { id: 4, name: "Qovoqlilar", icon: "🎃", image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&h=320&fit=crop", color: "#10B981", count: 67 },
    { id: 5, name: "Ko'katlar", icon: "🌿", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=320&fit=crop", color: "#10B981", count: 112 },
    { id: 6, name: "Kartoshka", icon: "🥔", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&h=320&fit=crop", color: "#10B981", count: 45 },
    { id: 7, name: "Piyoz va sarimsoq", icon: "🧅", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&h=320&fit=crop", color: "#10B981", count: 38 },
    { id: 8, name: "Urug'lar", icon: "🌱", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=320&fit=crop", color: "#10B981", count: 23 },
  ],
  products: [
    { id: 1, name: "Pomidor (Yangi)", categoryId: 1, price: 4500, unit: "kg", region: "Toshkent", seller: "Jasur Toshmatov", sellerId: 2, stock: 500, desc: "Issiqxonada yetishtirilgan yangi pomidor", rating: 4.8, reviews: 34, image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500&h=340&fit=crop", emoji: "🍅", status: "active", createdAt: "2024-06-01" },
    { id: 2, name: "Bodring", categoryId: 1, price: 3200, unit: "kg", region: "Farg'ona", seller: "Ali Karimov", sellerId: 2, stock: 300, desc: "Organik bodring, pestitsidsiz", rating: 4.6, reviews: 21, image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&h=340&fit=crop", emoji: "🥒", status: "active", createdAt: "2024-06-05" },
    { id: 3, name: "Olma (Fuji)", categoryId: 2, price: 8900, unit: "kg", region: "Samarqand", seller: "Zafar Usmonov", sellerId: 2, stock: 1200, desc: "Fuji olmasi, shirinlik 16 Brix", rating: 4.9, reviews: 67, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&h=340&fit=crop", emoji: "🍎", status: "active", createdAt: "2024-05-20" },
    { id: 4, name: "Uzum (Kishmish)", categoryId: 2, price: 12000, unit: "kg", region: "Namangan", seller: "Mansur Abdullayev", sellerId: 2, stock: 800, desc: "Namangan kishmishi", rating: 4.7, reviews: 45, image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&h=340&fit=crop", emoji: "🍇", status: "active", createdAt: "2024-05-25" },
    { id: 5, name: "Bug'doy", categoryId: 3, price: 2800, unit: "kg", region: "Qashqadaryo", seller: "Bobur Hamidov", sellerId: 2, stock: 10000, desc: "Kuchli bug'doy, kleykovini 28%", rating: 4.5, reviews: 12, image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=340&fit=crop", emoji: "🌾", status: "active", createdAt: "2024-04-10" },
    { id: 6, name: "Tarvuz", categoryId: 4, price: 1500, unit: "kg", region: "Xorazm", seller: "Nargiza Yusupova", sellerId: 2, stock: 2000, desc: "Xorazm tarvuzi, tabiiy shirin", rating: 4.9, reviews: 89, image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=500&h=340&fit=crop", emoji: "🍉", status: "active", createdAt: "2024-07-01" },
    { id: 8, name: "Limon", categoryId: 2, price: 15000, unit: "kg", region: "Toshkent", seller: "Jasur Toshmatov", sellerId: 2, stock: 200, desc: "Issiqxona limoni", rating: 4.7, reviews: 29, image: "https://images.unsplash.com/photo-1590502593747-422e0618037a?w=800&q=80", emoji: "🍋", status: "active", createdAt: "2024-06-20" }
  ],
  news: [
    { id: 1, title: "O'zbekistonda qishloq xo'jaligi eksporti 30% oshdi", category: "Iqtisodiyot", date: "2024-07-10", image: "📈", desc: "Joriy yilda mamlakatimizdan eksport qilingan qishloq xo'jaligi mahsulotlari hajmi keskin oshdi. Asosiy eksport yo'nalishi — Rossiya, Xitoy va Yevroosiyо mamlakatlari.", author: "Agro Press", views: 1240 },
    { id: 2, title: "Yangi organik sertifikatlash tizimi joriy etildi", category: "Yangilik", date: "2024-07-08", image: "🏆", desc: "Qishloq xo'jaligi vazirligi fermerlar uchun yangi organik sertifikatlash dasturini ishga tushirdi. Endi mahsulotlaringizni xalqaro bozorga chiqarish osonlashdi.", author: "QXV", views: 890 }
  ]
};

async function uploadData() {
  console.log("Checking if data exists...");
  const categoriesRef = collection(db, "categories");
  const snap = await getDocs(categoriesRef);
  if (!snap.empty) {
    console.log("Data already exists in Firestore! Skipping upload.");
    return;
  }

  console.log("Uploading users...");
  for (const item of DB.users) {
    await setDoc(doc(db, "users", String(item.email)), item);
  }

  console.log("Uploading categories...");
  for (const item of DB.categories) {
    await setDoc(doc(db, "categories", String(item.id)), item);
  }

  console.log("Uploading products...");
  for (const item of DB.products) {
    await setDoc(doc(db, "products", String(item.id)), item);
  }

  console.log("Uploading news...");
  for (const item of DB.news) {
    await setDoc(doc(db, "news", String(item.id)), item);
  }

  console.log("Data upload complete!");
}

uploadData().catch(console.error);
