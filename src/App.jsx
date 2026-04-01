import { useRef, useEffect, useState } from "react";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db as firestoreDb } from "./firebase";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { 
  X,
  Leaf, 
  LogIn, 
  Loader,
  ShoppingCart, 
  LogOut, 
  ChevronRight, 
  User, 
  Package, 
  Award, 
  Plus, 
  FileText, 
  CheckCircle,
  UserPlus,
  Star,
  MapPin,
  Heart,
  Shield,
  Phone,
  Mail,
  Lock
} from "lucide-react";

// CSS-only stubs replacing Three.js/react-three-fiber (Vite 7 compat)
const Canvas = ({ children, style, ...props }) => (
  <div style={{ position: "relative", width: "100%", height: "100%", background: "transparent", ...style }}>
    {children}
  </div>
);
const Float = ({ children }) => <div style={{ animation: "floatAnim 3s ease-in-out infinite" }}>{children}</div>;
const PresentationControls = ({ children }) => <>{children}</>;
const Environment = () => null;
const ContactShadows = () => null;
const THREE = {};


// ─── LOCAL STORAGE PERSISTENCE ───────────────────────────────────────────────
function loadLocal(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── API ──────────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('agro_token');
const setToken = (t) => localStorage.setItem('agro_token', t);
const delToken = () => localStorage.removeItem('agro_token');

async function req(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
  return data;
}

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const DB = {
  users: [
    { id: 1, name: "Admin User", email: "admin@agro.uz", password: "admin123", role: "admin", region: "Toshkent", phone: "+998901234567", createdAt: "2024-01-01", avatar: "A", bio: "Platforma administratori" },
    { id: 2, name: "Jasur Toshmatov", email: "jasur@mail.uz", password: "123456", role: "farmer", region: "Samarqand", phone: "+998911234567", createdAt: "2024-02-15", avatar: "J", bio: "10 yillik tajribali fermer", farm: "Toshmatov Fermer Xo'jaligi", rating: 4.8 },
    { id: 3, name: "Malika Yunusova", email: "malika@mail.uz", password: "123456", role: "buyer", region: "Buxoro", phone: "+998931234567", createdAt: "2024-03-10", avatar: "M", bio: "Ulgurji xaridor" },
  ],
  categories: [
    { id: 1, name: "Sabzavotlar", icon: "📦",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&h=320&fit=crop",
      color: "#10B981", count: 156 },
    { id: 2, name: "Mevalar", icon: "🍎",
      image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500&h=320&fit=crop",
      color: "#10B981", count: 234 },
    { id: 3, name: "Don-donlar", icon: "🌾",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=320&fit=crop",
      color: "#10B981", count: 89 },
    { id: 4, name: "Qovoqlilar", icon: "🎃",
      image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&h=320&fit=crop",
      color: "#10B981", count: 67 },
    { id: 5, name: "Ko'katlar", icon: "🌿",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=320&fit=crop",
      color: "#10B981", count: 112 },
    { id: 6, name: "Kartoshka", icon: "🥔",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&h=320&fit=crop",
      color: "#10B981", count: 45 },
    { id: 7, name: "Piyoz va sarimsoq", icon: "🧅",
      image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&h=320&fit=crop",
      color: "#10B981", count: 38 },
    { id: 8, name: "Urug'lar", icon: "🌱",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=320&fit=crop",
      color: "#10B981", count: 23 },
  ],
  products: [
    { id: 1,  name: "Pomidor (Yangi)",  categoryId: 1, price: 4500,  unit: "kg", region: "Toshkent",     seller: "Jasur Toshmatov",    sellerId: 2, stock: 500,   desc: "Issiqxonada yetishtirilgan yangi pomidor",  rating: 4.8, reviews: 34,
      image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500&h=340&fit=crop", emoji: "🍅", status: "active", createdAt: "2024-06-01" },
    { id: 2,  name: "Bodring",          categoryId: 1, price: 3200,  unit: "kg", region: "Farg'ona",      seller: "Ali Karimov",         sellerId: 2, stock: 300,   desc: "Organik bodring, pestitsidsiz",             rating: 4.6, reviews: 21,
      image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&h=340&fit=crop", emoji: "🥒", status: "active", createdAt: "2024-06-05" },
    { id: 3,  name: "Olma (Fuji)",      categoryId: 2, price: 8900,  unit: "kg", region: "Samarqand",     seller: "Zafar Usmonov",       sellerId: 2, stock: 1200,  desc: "Fuji olmasi, shirinlik 16 Brix",            rating: 4.9, reviews: 67,
      image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&h=340&fit=crop", emoji: "🍎", status: "active", createdAt: "2024-05-20" },
    { id: 4,  name: "Uzum (Kishmish)",  categoryId: 2, price: 12000, unit: "kg", region: "Namangan",      seller: "Mansur Abdullayev",   sellerId: 2, stock: 800,   desc: "Namangan kishmishi",                        rating: 4.7, reviews: 45,
      image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&h=340&fit=crop", emoji: "🍇", status: "active", createdAt: "2024-05-25" },
    { id: 5,  name: "Bug'doy",          categoryId: 3, price: 2800,  unit: "kg", region: "Qashqadaryo",   seller: "Bobur Hamidov",       sellerId: 2, stock: 10000, desc: "Kuchli bug'doy, kleykovini 28%",            rating: 4.5, reviews: 12,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=340&fit=crop", emoji: "🌾", status: "active", createdAt: "2024-04-10" },
    { id: 6,  name: "Tarvuz",           categoryId: 4, price: 1500,  unit: "kg", region: "Xorazm",        seller: "Nargiza Yusupova",    sellerId: 2, stock: 2000,  desc: "Xorazm tarvuzi, tabiiy shirin",             rating: 4.9, reviews: 89,
      image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=500&h=340&fit=crop", emoji: "🍉", status: "active", createdAt: "2024-07-01" },
    { id: 7,  name: "Karam",            categoryId: 1, price: 1800,  unit: "kg", region: "Andijon",       seller: "Sherzod Mirzayev",    sellerId: 2, stock: 450,   desc: "Yangi oq karam",                            rating: 4.3, reviews: 18,
      image: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&h=340&fit=crop", emoji: "🥬", status: "active", createdAt: "2024-06-15" },
    { id: 8,  name: "Limon",            categoryId: 2, price: 15000, unit: "kg", region: "Toshkent",      seller: "Jasur Toshmatov",     sellerId: 2, stock: 200,   desc: "Issiqxona limoni",                          rating: 4.7, reviews: 29,
      image: "https://images.unsplash.com/photo-1602524816915-83b5d7b9e35f?w=500&h=340&fit=crop", emoji: "🍋", status: "active", createdAt: "2024-06-20" },
    { id: 9,  name: "Sarimsoq",         categoryId: 7, price: 25000, unit: "kg", region: "Buxoro",        seller: "Hamid Normatov",      sellerId: 2, stock: 150,   desc: "Buxoro sariq sarimsoq",                     rating: 4.8, reviews: 41,
      image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&h=340&fit=crop", emoji: "🧄", status: "active", createdAt: "2024-05-30" },
    { id: 10, name: "Kartoshka (Qizil)",categoryId: 6, price: 3500,  unit: "kg", region: "Jizzax",        seller: "Umid Qodirov",        sellerId: 2, stock: 3000,  desc: "Jizzax qizil kartoshkasi",                  rating: 4.4, reviews: 22,
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&h=340&fit=crop", emoji: "🥔", status: "active", createdAt: "2024-06-08" },
    { id: 11, name: "Ko'katlar",           categoryId: 5, price: 5000,  unit: "kg", region: "Farg'ona",      seller: "Gulnora Rahimova",    sellerId: 2, stock: 80,    desc: "Yangi shivit, aromatli",                    rating: 4.6, reviews: 15,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80", emoji: "🌿", status: "active", createdAt: "2024-06-21" },
    { id: 12, name: "Qovoq",            categoryId: 4, price: 1200,  unit: "kg", region: "Surxondaryo",   seller: "Akbar Tursunov",      sellerId: 2, stock: 1500,  desc: "Katta qovoq, mazali",                       rating: 4.2, reviews: 9,
      image: "https://images.unsplash.com/photo-1506917728037-b6af01a7d403?w=500&h=340&fit=crop", emoji: "🎃", status: "active", createdAt: "2024-07-05" },
  ],
  reviews: [
    { id: 1, productId: 1, userId: 3, userName: "Malika Y.", rating: 5, comment: "Juda mazali pomidor, yangiligi ajoyib!", date: "2024-06-15", likes: 12 },
    { id: 2, productId: 1, userId: 2, userName: "Jasur T.", rating: 4, comment: "Sifati yaxshi, narxi ham qulay", date: "2024-06-20", likes: 8 },
    { id: 3, productId: 3, userId: 3, userName: "Malika Y.", rating: 5, comment: "Eng yaxshi olma! Har yil shu yerdan olamiz", date: "2024-06-01", likes: 23 },
  ],
  news: [
    { id: 1, title: "O'zbekistonda qishloq xo'jaligi eksporti 30% oshdi", category: "Iqtisodiyot", date: "2024-07-10", image: "📈", desc: "Joriy yilda mamlakatimizdan eksport qilingan qishloq xo'jaligi mahsulotlari hajmi keskin oshdi. Asosiy eksport yo'nalishi — Rossiya, Xitoy va Yevroosiyо mamlakatlari.", author: "Agro Press", views: 1240 },
    { id: 2, title: "Yangi organik sertifikatlash tizimi joriy etildi", category: "Yangilik", date: "2024-07-08", image: "🏆", desc: "Qishloq xo'jaligi vazirligi fermerlar uchun yangi organik sertifikatlash dasturini ishga tushirdi. Endi mahsulotlaringizni xalqaro bozorga chiqarish osonlashdi.", author: "QXV", views: 890 },
    { id: 3, title: "Pomidor narxi yozda 15% ko'tarildi", category: "Narxlar", date: "2024-07-05", image: "🍅", desc: "Mavsumiy omillar va issiq ob-havo ta'sirida pomidor narxi barcha viloyatlarda oshdi. Mutaxassislar avgust oyida narx barqarorlashishini kutmoqda.", author: "Bozor Tahlil", views: 2340 },
    { id: 4, title: "Fermerlar uchun yangi kreditlash dasturi", category: "Moliya", date: "2024-07-01", image: "💰", desc: "O'zbekiston Qishloq xo'jaligi banki fermerlar uchun 3% foizli kredit dasturini e'lon qildi. Ariza topshirish muddati — 1 sentyabrgacha.", author: "Agro Bank", views: 3100 },
    { id: 5, title: "Toshkentda yirik agro ko'rgazma bo'lib o'tadi", category: "Tadbir", date: "2024-06-28", image: "🎪", desc: "O'zAgroExpo 2024 ko'rgazmasi 15-18 avgustda Toshkentda bo'lib o'tadi. 200 dan ortiq ishtirokchi va 50 mamlakat vakillari kutilmoqda.", author: "Expo Center", views: 1560 },
  ],
  orders: [
    { id: 1, buyerId: 3, sellerId: 2, productId: 1, quantity: 50, totalPrice: 225000, status: "delivered", createdAt: "2024-06-10", address: "Toshkent, Chilonzor tumani", tracking: [{ status: "Qabul qilindi", date: "2024-06-10", done: true }, { status: "Tayyorlanmoqda", date: "2024-06-11", done: true }, { status: "Yo'lda", date: "2024-06-12", done: true }, { status: "Yetkazildi", date: "2024-06-13", done: true }] },
    { id: 2, buyerId: 3, sellerId: 2, productId: 6, quantity: 100, totalPrice: 150000, status: "shipping", createdAt: "2024-07-08", address: "Buxoro, Markaziy ko'cha 45", tracking: [{ status: "Qabul qilindi", date: "2024-07-08", done: true }, { status: "Tayyorlanmoqda", date: "2024-07-09", done: true }, { status: "Yo'lda", date: "2024-07-10", done: true }, { status: "Yetkazildi", date: "", done: false }] },
  ],
  contracts: [
    { id: 1, buyerId: 3, sellerId: 2, productId: 1, quantity: 500, pricePerUnit: 4500, totalPrice: 2250000, startDate: "2024-07-01", endDate: "2024-09-30", status: "active", terms: "Har hafta 125 kg yetkazib berish", createdAt: "2024-06-25" },
  ],
  regionPrices: [
    { region: "Toshkent", pomidor: 4800, bodring: 3500, olma: 9500, lat: 41.2995, lng: 69.2401 },
    { region: "Samarqand", pomidor: 4200, bodring: 3000, olma: 8900, lat: 39.6542, lng: 66.9597 },
    { region: "Farg'ona", pomidor: 4500, bodring: 3200, olma: 9000, lat: 40.3842, lng: 71.7843 },
    { region: "Andijon", pomidor: 4300, bodring: 3100, olma: 8700, lat: 40.7821, lng: 72.3442 },
    { region: "Namangan", pomidor: 4400, bodring: 3300, olma: 9200, lat: 41.0011, lng: 71.6727 },
    { region: "Buxoro", pomidor: 4100, bodring: 2900, olma: 8500, lat: 39.7681, lng: 64.4556 },
    { region: "Xorazm", pomidor: 3900, bodring: 2800, olma: 8200, lat: 41.3625, lng: 60.3483 },
    { region: "Qashqadaryo", pomidor: 4000, bodring: 2700, olma: 8000, lat: 38.8610, lng: 65.7918 },
    { region: "Surxondaryo", pomidor: 3800, bodring: 2600, olma: 7800, lat: 37.9404, lng: 67.5703 },
    { region: "Jizzax", pomidor: 4100, bodring: 2900, olma: 8300, lat: 40.1158, lng: 67.8422 },
    { region: "Sirdaryo", pomidor: 4200, bodring: 3000, olma: 8600, lat: 40.8274, lng: 68.6644 },
    { region: "Navoiy", pomidor: 4000, bodring: 2800, olma: 8100, lat: 40.0838, lng: 65.3791 },
  ],
  priceHistory: {
    1: [{ date: "Apr", price: 3200 }, { date: "May", price: 3800 }, { date: "Iyn", price: 4200 }, { date: "Iyl", price: 4500 }],
    3: [{ date: "Apr", price: 6500 }, { date: "May", price: 7500 }, { date: "Iyn", price: 8200 }, { date: "Iyl", price: 8900 }],
    6: [{ date: "Apr", price: 600 }, { date: "May", price: 900 }, { date: "Iyn", price: 1200 }, { date: "Iyl", price: 1500 }],
  }
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
  :root {
    --g1: #064E3B; /* Deep Emerald */
    --g2: #065F46; /* Mid Emerald */
    --g3: #10B981; /* Primary Emerald */
    --g4: #34D399; /* Light Emerald */
    --g5: #ECFDF5; /* Softest Emerald Background */
    
    --a1: #92400E; /* Deep Gold */
    --a2: #F59E0B; /* Primary Amber */
    --a3: #FBBF24; /* Bright Amber */
    --a4: #FFFBEB; /* Soft Amber Background */
    
    --r1: #E11D48; /* Vibrant Rose */
    --r2: #FB7185; /* Soft Rose */
    
    --cream: #F9FAFB; /* Modern Neutral Light Gray/Cream */
    --white: #FFFFFF;
    
    --s1: #F3F4F6; /* Gray 100 */
    --s2: #E5E7EB; /* Gray 200 */
    --s3: #9CA3AF; /* Gray 400 */
    --s4: #4B5563; /* Gray 600 */
    --s5: #111827; /* Gray 900 */
    
    --sh: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --sh2: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    --rad: 1.25rem; /* 20px - More rounded/modern */
    --rad2: 0.75rem; /* 12px */
    --tr: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Outfit', 'Inter', sans-serif; 
    background-color: var(--cream); 
    color: var(--s5); 
    min-height: 100vh; 
    width: 100%;
    -webkit-font-smoothing: antialiased;
  }
  #root { width: 100%; min-height: 100vh; }
  h1, h2, h3, h4 { font-family: 'Playfair Display', serif; font-weight: 700; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: var(--g3); border-radius: 10px; border: 2px solid var(--cream); }
  
  /* NAV */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    background: rgba(13, 51, 32, 0.55); 
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    height: 80px; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    transition: var(--tr);
  }
  .nav-brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .brand-logo {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, var(--g3), var(--g4));
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  }
  .brand-name { color: #fff; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px; }
  .brand-name span { color: var(--g4); }
  .nav-links { display: flex; gap: 8px; align-items: center; }
  .nl {
    background: none; border: none; color: rgba(255, 255, 255, 0.8);
    padding: 10px 16px; border-radius: 10px; cursor: pointer;
    font-size: 14px; font-weight: 600; transition: var(--tr);
    display: flex; align-items: center; gap: 5px;
  }
  .nl:hover, .nl.act { background: rgba(255, 255, 255, 0.15); color: #fff; }
  .nl.cta {
    background: var(--a2); color: var(--g1);
    font-weight: 700; padding: 10px 24px;
    box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
  }
  .nl.cta:hover { background: var(--a3); transform: translateY(-2px); }
  .cart-badge {
    position: absolute; top: -5px; right: -5px;
    background: var(--r1); color: #fff;
    border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 800;
  }
  .av {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--g3), var(--g4));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; border: 2px solid rgba(255, 255, 255, 0.2);
  }
  .umenu{position:relative;}
  .udrop{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:var(--rad);width:220px;box-shadow:var(--sh2);border:1px solid var(--s2);overflow:hidden;animation:fadeD .2s ease;}
  @keyframes fadeD{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .udrop-head{padding:16px;background:var(--g5);border-bottom:1px solid var(--s2);}
  .udrop-name{font-weight:700;font-size:15px;}
  .udrop-email{font-size:12px;color:var(--s3);}
  .role-badge{display:inline-block;margin-top:4px;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;}
  .rb-admin{background:#fce4ec;color:#880e4f;} .rb-farmer{background:#fff3cd;color:#856404;} .rb-buyer{background:#e3f2fd;color:#1565c0;}
  .ditem{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:var(--tr);font-size:14px;background:none;border:none;width:100%;text-align:left;color:var(--s5);}
  .ditem:hover{background:var(--s1);}
  .ditem.red{color:var(--r1);}

  /* LAYOUT */
  .main { padding-top: 72px; min-height: 100vh; }
  .container { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
  .section { padding: 80px 0; }

  /* HERO */
  .hero {
    background: var(--g1);
    color: #fff;
    padding: 120px 0;
    position: relative;
    overflow: hidden;
  }
  .hero-inner-bg {
    position: absolute; inset: 0;
    background: radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.15), transparent 50%),
                radial-gradient(circle at 10% 80%, rgba(245, 158, 11, 0.1), transparent 40%);
    pointer-events: none;
    z-index: 1;
  }
  .hero-inner {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; align-items: center;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px; border-radius: 9999px;
    font-size: 14px; font-weight: 600; color: var(--g4);
    margin-bottom: 24px;
    backdrop-filter: blur(4px);
  }
  .hero h1 { font-size: 4.5rem; line-height: 1; margin-bottom: 24px; letter-spacing: -2px; }
  .hero h1 span { color: var(--g3); font-style: italic; font-family: 'Playfair Display', serif; }
  .hero-sub { font-size: 1.25rem; color: rgba(255, 255, 255, 0.7); line-height: 1.6; margin-bottom: 40px; max-width: 600px; }
  .hero-acts { display: flex; gap: 16px; }
  .hero-visual { position: relative; }
  .hero-card-stack { position: relative; width: 100%; display: flex; justify-content: center; align-items: center; }
  .hero-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
  .hstat {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    padding: 30px 20px; border-radius: var(--rad);
    text-align: center; transition: var(--tr);
  }
  .hstat:hover { transform: translateY(-5px); border-color: var(--g3); background: rgba(255, 255, 255, 0.08); }
  .hstat-num { font-size: 2.5rem; font-weight: 800; color: var(--white); margin-bottom: 4px; }
  .hstat-lbl { color: var(--g4); font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

  .hero-floating-element {
    position: absolute; bottom: -20px; left: -20px;
    z-index: 10; animation: floatAnim 4s ease-in-out infinite;
  }
  @keyframes floatAnim {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  .floating-card {
    background: white; color: var(--s5);
    padding: 12px 20px; border-radius: 12px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    font-weight: 700; font-size: 14px;
  }

  /* BUTTONS */
  .btn{padding:12px 24px;border-radius:12px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:600;border:none;transition:var(--tr);display:inline-flex;align-items:center;gap:8px;}
  .btn-amber{background:var(--a2);color:var(--g1);}
  .btn-amber:hover{background:var(--a3);transform:translateY(-1px);box-shadow:0 8px 24px rgba(212,160,23,.35);}
  .btn-outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.35);}
  .btn-outline:hover{background:rgba(255,255,255,.1);border-color:#fff;}
  .btn-green{background:var(--g3);color:#fff;}
  .btn-green:hover{background:var(--g2);transform:translateY(-1px);}
  .btn-ghost{background:var(--s1);color:var(--s5);}
  .btn-ghost:hover{background:var(--s2);}
  .btn-danger{background:var(--r1);color:#fff;}
  .btn-sm{padding:8px 16px;font-size:13px;border-radius:9px;}
  .btn-xs{padding:5px 12px;font-size:12px;border-radius:7px;}
  .btn:disabled{opacity:.5;cursor:not-allowed;}

  /* SECTION HEADER */
  .sh{margin-bottom:36px;}
  .sh h2{font-size:36px;color:var(--g1);}
  .sh p{color:var(--s3);margin-top:6px;font-size:16px;}
  .sh-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:36px;}
  .sh-row .sh{margin-bottom:0;}

  /* CATEGORY GRID & CARDS */
  .cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
  .cat-card{
    border-radius:24px; cursor:pointer; 
    border:1px solid rgba(255,255,255,0.6); 
    transition:var(--tr); position:relative; overflow:hidden; 
    box-shadow:0 10px 30px rgba(0,0,0,0.06); height:220px;
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4));
    backdrop-filter: blur(10px);
  }
  .cat-card::before {
    content:''; position:absolute; inset:0; border-radius:inherit;
    background: linear-gradient(180deg, transparent 40%, rgba(6, 78, 59, 0.8) 100%);
    z-index: 2; opacity: 0; transition: var(--tr);
  }
  .cat-card:hover::before { opacity: 1; }
  .cat-card:hover{transform:translateY(-8px) scale(1.02); box-shadow:0 20px 40px rgba(16,185,129,0.25); border-color:var(--g3);}
  .cat-card:hover .cat-overlay{opacity:1;}
  
  .prod-card {
    background: #fff; border-radius: 20px; overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid var(--s2);
    display: flex; flex-direction: column; position: relative;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  .prod-img { position: relative; height: 180px; overflow: hidden; background: var(--g5); display: flex; align-items: stretch; }
  .prod-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .prod-card:hover .prod-img img { transform: scale(1.1); }
  .prod-badge { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 30px; font-size: 11px; font-weight: 700; color: var(--g1); display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 2; }
  .prod-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); opacity: 0; transition: var(--tr); display: flex; align-items: center; justify-content: center; z-index: 3; }
  .prod-card:hover .prod-overlay { opacity: 1; }
  .view-btn { padding: 10px 20px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); color: var(--g1); font-weight: 700; font-size: 13px; border: none; border-radius: 12px; cursor: pointer; transform: translateY(20px); transition: var(--tr); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
  .prod-card:hover .view-btn { transform: translateY(0); }
  .prod-body { padding: 18px; display: flex; flex-direction: column; flex: 1; }
  .prod-cat-small { font-size: 11px; color: var(--g3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  .prod-title { font-size: 16px; font-weight: 700; color: var(--s5); margin-bottom: 8px; cursor: pointer; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; transition: var(--tr); }
  .prod-title:hover { color: var(--g3); }
  .prod-seller-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 12px; color: var(--s3); }
  .seller-name { display: flex; align-items: center; gap: 4px; }
  .prod-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
  .prod-price-box { display: flex; flex-direction: column; }
  .price-val { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; color: var(--g1); line-height: 1; }
  .price-unit { font-size: 12px; color: var(--s3); margin-top: 4px; font-weight: 500; }
  .add-cart-btn { width: 42px; height: 42px; border-radius: 12px; background: var(--g5); color: var(--g3); display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .add-cart-btn:hover { background: var(--g3); color: #fff; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }
  
  .prod-price span{font-size:13px;color:var(--s3);font-family:'Plus Jakarta Sans',sans-serif;font-weight:400;}
  .prod-rating{font-size:13px;color:var(--a1);font-weight:600;}

  /* FILTERS */
  .filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;align-items:center;}
  .fbtn{padding:8px 16px;border-radius:20px;border:1.5px solid var(--s2);background:#fff;cursor:pointer;font-size:13px;font-weight:500;transition:var(--tr);color:var(--s5);font-family:'Plus Jakarta Sans',sans-serif;}
  .fbtn:hover,.fbtn.act{background:var(--g3);color:#fff;border-color:var(--g3);}
  .search-inp{flex:1;max-width:320px;padding:10px 16px;border-radius:20px;border:1.5px solid var(--s2);background:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;outline:none;transition:var(--tr);}
  .search-inp:focus{border-color:var(--g4);box-shadow:0 0 0 3px rgba(82,183,136,.15);}

  /* MODAL */
  .overlay{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .2s ease;}
  @keyframes fi{from{opacity:0}to{opacity:1}}
  .modal{background:#fff;border-radius:24px;width:100%;max-width:500px;box-shadow:0 24px 80px rgba(0,0,0,.2);animation:su .3s ease;max-height:90vh;overflow-y:auto;}
  .modal-lg{max-width:700px;}
  @keyframes su{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
  .mhead{padding:26px 28px 18px;border-bottom:1px solid var(--s2);display:flex;align-items:center;justify-content:space-between;}
  .mhead h3{font-size:22px;color:var(--g1);}
  .mclose{width:32px;height:32px;border-radius:50%;border:none;background:var(--s1);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:var(--tr);}
  .mclose:hover{background:var(--s2);}
  .mbody{padding:24px 28px;}
  .mfoot{padding:14px 28px 24px;display:flex;gap:10px;}

  /* FORM */
  .fg{margin-bottom:16px;}
  .fl{display:block;font-size:13px;font-weight:600;color:var(--s5);margin-bottom:5px;}
  .fi,.fs,.fta{width:100%;padding:11px 15px;border:1.5px solid var(--s2);border-radius:var(--rad2);font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;outline:none;transition:var(--tr);background:#fff;}
  .fi:focus,.fs:focus,.fta:focus{border-color:var(--g4);box-shadow:0 0 0 3px rgba(82,183,136,.12);}
  .fta{min-height:90px;resize:vertical;}
  .frow{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .ftabs{display:flex;margin-bottom:22px;background:var(--s1);border-radius:10px;padding:4px;}
  .ftab{flex:1;padding:10px;border:none;background:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:500;border-radius:8px;transition:var(--tr);color:var(--s3);}
  .ftab.act{background:#fff;color:var(--g3);box-shadow:0 2px 8px rgba(0,0,0,.08);}

  /* TABLE */
  .tbl{width:100%;border-collapse:collapse;background:#fff;border-radius:var(--rad);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);}
  .tbl th{background:var(--s1);padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:var(--s3);text-transform:uppercase;letter-spacing:.06em;}
  .tbl td{padding:14px 16px;border-bottom:1px solid var(--s1);font-size:14px;}
  .tbl tr:last-child td{border-bottom:none;}
  .tbl tr:hover td{background:rgba(82,183,136,.03);}

  /* STATUS */
  .stt{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;}
  .stt-active{background:#d8f3dc;color:var(--g3);}
  .stt-pending{background:#fff3cd;color:#856404;}
  .stt-completed,.stt-delivered{background:#e3f2fd;color:#1565c0;}
  .stt-shipping{background:#fff3cd;color:#856404;}
  .stt-inactive{background:#fce4ec;color:var(--r1);}
  .stt-farmer{background:#fff3cd;color:#856404;}
  .stt-buyer{background:#e3f2fd;color:#1565c0;}
  .stt-admin{background:#fce4ec;color:#880e4f;}

  /* TOAST */
  .toast{position:fixed;bottom:24px;right:24px;z-index:9999;background:var(--g2);color:#fff;padding:14px 20px;border-radius:12px;display:flex;align-items:center;gap:10px;box-shadow:var(--sh2);animation:tst .3s ease;max-width:320px;font-size:14px;font-weight:500;}
  @keyframes tst{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
  .toast.err{background:var(--r1);}
  .toast.suc{background:var(--g3);}

  /* PROFILE HEADER */
  .prof-head{background:linear-gradient(135deg,var(--g1),var(--g3));padding:48px;color:#fff;display:flex;align-items:center;gap:28px;}
  .prof-av{width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,.2);border:3px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;}
  .prof-tabs{display:flex;border-bottom:2px solid var(--s2);margin-bottom:32px;}
  .ptab{padding:14px 22px;cursor:pointer;border:none;background:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:600;color:var(--s3);border-bottom:2px solid transparent;margin-bottom:-2px;transition:var(--tr);}
  .ptab.act{color:var(--g3);border-color:var(--g3);}

  /* NEWS CARD */
  .news-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
  .news-card{background:#fff;border-radius:var(--rad);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);border:1.5px solid var(--s2);transition:var(--tr);cursor:pointer;}
  .news-card:hover{transform:translateY(-3px);box-shadow:var(--sh);border-color:var(--g4);}
  .news-img{height:120px;display:flex;align-items:center;justify-content:center;font-size:56px;}
  .news-body{padding:18px;}
  .news-cat{font-size:11px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;}
  .news-title{font-weight:700;font-size:16px;line-height:1.4;margin-bottom:8px;color:var(--s5);}
  .news-meta{font-size:12px;color:var(--s3);display:flex;gap:10px;}

  /* TRACKING */
  .track-steps{display:flex;flex-direction:column;gap:0;}
  .track-step{display:flex;gap:16px;position:relative;}
  .track-step:not(:last-child)::before{content:'';position:absolute;left:15px;top:32px;bottom:-8px;width:2px;background:var(--s2);}
  .track-step.done::before{background:var(--g3);}
  .track-dot{width:32px;height:32px;border-radius:50%;border:2px solid var(--s2);display:flex;align-items:center;justify-content:center;font-size:14px;background:#fff;flex-shrink:0;z-index:1;}
  .track-step.done .track-dot{background:var(--g3);border-color:var(--g3);color:#fff;}
  .track-info{padding-bottom:24px;}
  .track-status{font-weight:700;font-size:14px;}
  .track-date{font-size:12px;color:var(--s3);margin-top:2px;}

  /* REVIEW */
  .review-card{background:var(--s1);border-radius:var(--rad2);padding:18px;margin-bottom:12px;}
  .review-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
  .review-user{display:flex;align-items:center;gap:10px;}
  .review-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--g4),var(--a2));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;}
  .stars{color:var(--a2);font-size:14px;}

  /* MAP */
  .map-container{background:#fff;border-radius:var(--rad);overflow:hidden;box-shadow:var(--sh);padding:24px;}
  .region-dots{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;}
  .region-dot{background:var(--s1);border-radius:var(--rad2);padding:14px;text-align:center;cursor:pointer;transition:var(--tr);border:2px solid transparent;}
  .region-dot:hover,.region-dot.act{background:var(--g5);border-color:var(--g4);}
  .region-dot-name{font-weight:700;font-size:13px;}
  .region-dot-price{color:var(--g3);font-weight:700;font-size:15px;margin-top:2px;}

  /* ADMIN */
  .admin-layout{display:flex;min-height:calc(100vh - 64px);}
  .aside{width:240px;background:var(--g1);padding:24px 14px;flex-shrink:0;}
  .aside-title{color:rgba(255,255,255,.4);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:0 8px;margin-bottom:6px;margin-top:20px;}
  .aside-title:first-child{margin-top:0;}
  .alink{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;color:rgba(255,255,255,.65);font-size:13.5px;font-weight:500;transition:var(--tr);margin-bottom:2px;background:none;border:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
  .alink:hover,.alink.act{background:rgba(255,255,255,.1);color:#fff;}
  .amain{flex:1;padding:32px;overflow:auto;}
  .ahead{margin-bottom:28px;}
  .ahead h2{font-size:28px;color:var(--g1);}
  .ahead p{color:var(--s3);margin-top:4px;}
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
  .stat-card{background:#fff;border-radius:var(--rad);padding:22px;border-left:4px solid;box-shadow:0 2px 8px rgba(0,0,0,.04);}
  .sc-label{font-size:12px;color:var(--s3);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em;}
  .sc-val{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;}
  .sc-ch{font-size:12px;margin-top:4px;color:var(--g3);}

  /* CONTRACT */
  .contract-card{background:#fff;border-radius:var(--rad);padding:24px;box-shadow:var(--sh);margin-bottom:16px;border-left:4px solid var(--g3);}
  .contract-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
  .contract-body{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .cinfo{background:var(--s1);border-radius:var(--rad2);padding:14px;}
  .cinfo-label{font-size:11px;font-weight:700;color:var(--s3);text-transform:uppercase;margin-bottom:4px;}
  .cinfo-val{font-weight:700;font-size:15px;color:var(--s5);}

  /* PAYMENT */
  .payment-methods{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
  .pay-method{border:2px solid var(--s2);border-radius:var(--rad2);padding:16px;text-align:center;cursor:pointer;transition:var(--tr);}
  .pay-method:hover,.pay-method.act{border-color:var(--g4);background:var(--g5);}
  .pay-icon{font-size:28px;margin-bottom:6px;}
  .pay-name{font-weight:600;font-size:13px;}

  /* CONTACT */
  .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;}
  .social-links{display:flex;flex-direction:column;gap:12px;}
  .slink{display:flex;align-items:center;gap:14px;padding:18px 20px;border-radius:var(--rad);text-decoration:none;color:#fff;font-weight:600;font-size:15px;transition:var(--tr);}
  .slink:hover{transform:translateX(4px);opacity:.9;}
  .slink.ig{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);}
  .slink.tg{background:#2196F3;}
  .slink.wa{background:#25D366;}
  .slink.ph{background:var(--g3);}
  .slink-icon{font-size:24px;width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;}

  /* CHART */
  .chart-bars{display:flex;align-items:flex-end;gap:8px;height:100px;}
  .cbar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
  .cbar{width:100%;background:linear-gradient(to top,var(--g3),var(--g4));border-radius:4px 4px 0 0;min-height:8px;transition:var(--tr);cursor:pointer;}
  .cbar:hover{background:linear-gradient(to top,var(--a1),var(--a2));}
  .cbar-lbl{font-size:11px;color:var(--s3);}
  .cbar-val{font-size:11px;font-weight:700;color:var(--g3);}

  /* FOOTER */
  .footer{background:var(--g1);color:#fff;padding:60px 0 30px;}
  .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;}
  .footer h4{font-family:'Playfair Display',serif;font-size:18px;margin-bottom:16px;color:var(--a2);}
  .footer p,.footer a{font-size:14px;color:rgba(255,255,255,.6);line-height:1.8;text-decoration:none;}
  .footer a:hover{color:var(--g4);}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:24px;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:rgba(255,255,255,.4);}
  .footer-socials{display:flex;gap:12px;}
  .fsoc{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--tr);font-size:16px;}
  .fsoc:hover{background:rgba(255,255,255,.15);}

  /* RESPONSIVE */
  @media(max-width:900px){
    .cat-grid{grid-template-columns:repeat(2,1fr);}
    .prod-grid{grid-template-columns:repeat(2,1fr);}
    .stat-grid{grid-template-columns:repeat(2,1fr);}
    .hero-inner{grid-template-columns:1fr;}
    .hero{padding:60px 0;}
    .hero h1{font-size:38px;}
    .news-grid{grid-template-columns:1fr 1fr;}
    .footer-grid{grid-template-columns:1fr 1fr;}
    .container{padding:0 20px;}
    .contact-grid{grid-template-columns:1fr;}
  }
  @media(max-width:600px){
    .cat-grid,.prod-grid,.news-grid{grid-template-columns:1fr;}
    .nav { height: auto; padding: 12px; flex-wrap: wrap; gap: 10px; }
    .nav-links { width: 100%; overflow-x: auto; padding-bottom: 5px; justify-content: flex-start; -webkit-overflow-scrolling: touch; }
    .nav-links::-webkit-scrollbar { height: 4px; }
    .nav-links::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; border: none; }
    .main { padding-top: 110px; }
    .hero h1{font-size:30px;}
    .footer-grid{grid-template-columns:1fr;}
  }
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return <div className={`toast ${type}`}><span>{type === "err" ? "✕" : "✓"}</span> {msg}</div>;
}

// ─── MINI CHART ──────────────────────────────────────────────────────────────
function MiniChart({ data }) {
  if (!data) return null;
  const max = Math.max(...data.map(d => d.price));
  const min = Math.min(...data.map(d => d.price));
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--s3)", marginBottom: 10 }}>Narx dinamikasi (so'm/kg)</p>
      <div className="chart-bars">
        {data.map((d, i) => {
          const h = ((d.price - min) / (max - min || 1)) * 70 + 20;
          return (
            <div key={i} className="cbar-wrap">
              <div className="cbar-val">{(d.price / 1000).toFixed(1)}k</div>
              <div className="cbar" style={{ height: h }} />
              <div className="cbar-lbl">{d.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PRODUCT IMAGE COMPONENT ─────────────────────────────────────────────────
function ProductImage({ image, emoji, alt, height = "100%", radius = 0 }) {
  const [err, setErr] = useState(false);
  const isUrl = image && (image.startsWith("http") || image.startsWith("data:") || image.startsWith("/"));
  if (isUrl && !err) {
    return (
      <img src={image} alt={alt || "mahsulot"} onError={() => setErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: radius }} />
    );
  }
  // Emoji: fill the full parent container like a real image
  const icon = emoji || image || "🌿";
  // Pick a pleasant gradient based on the emoji
  const gradients = {
    "🍅":"135deg,#fca5a5,#f87171", "🥒":"135deg,#86efac,#4ade80",
    "🍎":"135deg,#fca5a5,#ef4444", "🍇":"135deg,#c4b5fd,#a78bfa",
    "🌾":"135deg,#fde68a,#f59e0b", "🍉":"135deg,#fca5a5,#4ade80",
    "🥬":"135deg,#bbf7d0,#22c55e", "🍋":"135deg,#fef08a,#facc15",
    "🧄":"135deg,#f5f5f4,#d6d3d1", "🥔":"135deg,#fef3c7,#d97706",
    "🌿":"135deg,#bbf7d0,#22c55e", "🎃":"135deg,#fed7aa,#ea580c",
    "🧅":"135deg,#fef9c3,#ca8a04", "🌱":"135deg,#bbf7d0,#16a34a",
  };
  const grad = gradients[icon] || "135deg,#d1fae5,#6ee7b7";
  return (
    <div style={{
      width: "100%", height: "100%", borderRadius: radius,
      background: `linear-gradient(${grad})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.12)", top: -30, right: -30 }} />
      <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)", bottom: -15, left: -15 }} />
      <span style={{ fontSize: 90, lineHeight: 1, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.2))", position: "relative", zIndex: 1, userSelect: "none" }}>
        {icon}
      </span>
    </div>
  );
}

// ─── 3D TILT HOOK ─────────────────────────────────────────────────────────────
function useTilt() {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const onMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };
  const onMouseLeave = () => { x.set(0); y.set(0); };
  return { ref, style: { rotateX, rotateY }, onMouseMove, onMouseLeave };
}

// ─── PRODUCT CARD WITH PREMIUM 3D TILT ───────────────────────────────────────
function ProdCard({ p, onClick, onCart, user, openAuth }) {
  const tilt = useTilt();
  const isUrl = p.image && (p.image.startsWith("http") || p.image.startsWith("data:"));
  return (
    <motion.div 
      className="prod-card"
      ref={tilt.ref}
      style={{ perspective: 1200, ...tilt.style }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      whileHover={{ y: -12, scale: 1.02, boxShadow: "0 30px 60px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="prod-img" onClick={onClick}>
        <div className="prod-badge">
          <MapPin size={12} color="var(--g3)" /> {p.region}
        </div>
        <ProductImage image={p.image} emoji={p.emoji} alt={p.name} height="100%" />
        <div className="prod-overlay">
          <button className="view-btn">Tezkor ko'rish</button>
        </div>
      </div>
      <div className="prod-body">
        <div className="prod-cat-small">{p.categoryName || "Premium"}</div>
        <div className="prod-title" onClick={onClick}>{p.name}</div>
        <div className="prod-seller-row">
          <span className="seller-name" style={{ color: "var(--s4)", fontWeight: 500 }}><User size={13} /> {p.seller}</span>
          <span className="prod-rating" style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--a4)", padding: "2px 6px", borderRadius: 8, color: "var(--a1)" }}>
            <Star size={12} className="fill-amber-400" /> {p.rating}
          </span>
        </div>
        <div className="prod-footer">
          <div className="prod-price-box">
            <span className="price-val">{p.price.toLocaleString()}</span>
            <span className="price-unit">so'm / {p.unit}</span>
          </div>
          <motion.button 
            className="add-cart-btn" 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); user ? onCart() : openAuth(); }}
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────────────────────────
function AuthModal({ onClose, login, register, loading }) {
  const [tab, setTab] = useState("login");
  const [ld, setLd] = useState({ email: "", password: "" });
  const [rd, setRd] = useState({ name: "", email: "", password: "", phone: "", region: "Toshkent", role: "farmer" });
  const [err, setErr] = useState("");
  const regions = ["Toshkent", "Samarqand", "Farg'ona", "Andijon", "Namangan", "Buxoro", "Xorazm", "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy"];

  const doLogin = () => {
    if (!ld.email || !ld.password) { setErr("Email va parolni kiriting!"); return; }
    setErr(""); login(ld.email, ld.password);
  };
  const doRegister = () => {
    if (!rd.name || !rd.email || !rd.password) { setErr("Barcha majburiy maydonlarni to'ldiring!"); return; }
    if (rd.password.length < 6) { setErr("Parol kamida 6 ta belgi bo'lishi kerak!"); return; }
    setErr(""); register(rd);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mhead"><h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Leaf size={24} color="var(--g3)" /> Xush kelibsiz</h3><button className="mclose" onClick={onClose}><X size={18} /></button></div>
        <div className="mbody">
          <div className="ftabs">
            <button className={`ftab ${tab === "login" ? "act" : ""}`} onClick={() => { setTab("login"); setErr(""); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><LogIn size={16} /> Kirish</button>
            <button className={`ftab ${tab === "reg" ? "act" : ""}`} onClick={() => { setTab("reg"); setErr(""); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><UserPlus size={16} /> Ro'yxat</button>
          </div>
          {err && <div style={{background:"#ffebee",border:"1px solid #ffcdd2",borderRadius:10,padding:"10px 14px",color:"#c62828",fontWeight:600,fontSize:13,marginBottom:14}}>{err}</div>}
          {tab === "login" ? (
            <>
              <div style={{ background: "var(--g5)", borderRadius: 10, padding: 12, marginBottom: 18, fontSize: 13 }}>
                <strong>Admin:</strong> admin@agro.uz / admin123 &nbsp;|&nbsp; <strong>Fermer:</strong> jasur@mail.uz / 123456
              </div>
              <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} /> Email</label><input className="fi" type="email" value={ld.email} onChange={e => setLd(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" onKeyDown={e=>e.key==="Enter"&&doLogin()} /></div>
              <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><Lock size={14} /> Parol</label><input className="fi" type="password" value={ld.password} onChange={e => setLd(p => ({ ...p, password: e.target.value }))} placeholder="••••••" onKeyDown={e=>e.key==="Enter"&&doLogin()} /></div>
              <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }} onClick={doLogin} disabled={loading}>{loading ? <Loader className="spin" size={18} /> : <><LogIn size={18} /> Kirish</>}</button>
            </>
          ) : (
            <>
              <div className="frow">
                <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={14} /> Ism *</label><input className="fi" value={rd.name} onChange={e => setRd(p => ({ ...p, name: e.target.value }))} placeholder="To'liq ism" /></div>
                <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} /> Telefon</label><input className="fi" value={rd.phone} onChange={e => setRd(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" /></div>
              </div>
              <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} /> Email *</label><input className="fi" type="email" value={rd.email} onChange={e => setRd(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><Lock size={14} /> Parol * (min 6 ta belgi)</label><input className="fi" type="password" value={rd.password} onChange={e => setRd(p => ({ ...p, password: e.target.value }))} /></div>
              <div className="frow">
                <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> Viloyat</label><select className="fs" value={rd.region} onChange={e => setRd(p => ({ ...p, region: e.target.value }))}>{regions.map(r => <option key={r}>{r}</option>)}</select></div>
                <div className="fg"><label className="fl" style={{ display: "flex", alignItems: "center", gap: 6 }}><Shield size={14} /> Rol</label>
                  <select className="fs" value={rd.role} onChange={e => setRd(p => ({ ...p, role: e.target.value }))}>
                    <option value="farmer">🌾 Fermer (sotuvchi)</option>
                    <option value="buyer">🛒 Xaridor</option>
                  </select>
                </div>
              </div>
              {rd.role === "farmer" && (
                <div style={{background:"var(--g5)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--g2)",marginBottom:8}}>
                  🌾 Fermer sifatida mahsulot qo'shish va sotish imkoniyatiga ega bo'lasiz
                </div>
              )}
              <button className="btn btn-green" style={{ width: "100%", justifyContent: "center" }} onClick={doRegister} disabled={loading}>{loading ? "⏳ Saqlanmoqda..." : "Ro'yxatdan o'tish →"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL MODAL ─────────────────────────────────────────────────────
function ProdDetailModal({ p, db, onClose, addToCart, user, openAuth, showToast }) {
  const [qty, setQty] = useState(1);
  const [revTab, setRevTab] = useState("detail");
  const [newRev, setNewRev] = useState({ rating: 5, comment: "" });
  const [reviews, setReviews] = useState(db.reviews.filter(r => r.productId === p.id));
  const history = db.priceHistory[p.id];
  const bgs = ["#d8f3dc", "#fce4ec", "#fff9db", "#e3f2fd", "#f3e5f5"];

  const submitReview = () => {
    if (!newRev.comment.trim()) return;
    const r = { id: Date.now(), productId: p.id, userId: user?.id, userName: user?.name?.split(" ")[0] + " " + user?.name?.split(" ")[1]?.[0] + ".", rating: newRev.rating, comment: newRev.comment, date: new Date().toISOString().split("T")[0], likes: 0 };
    setReviews(prev => [r, ...prev]);
    setNewRev({ rating: 5, comment: "" });
    showToast("Sharh qo'shildi! ⭐");
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="mhead"><h3>{p.name}</h3><button className="mclose" onClick={onClose}>✕</button></div>
        <div className="mbody">
          {(() => {
            const isUrl = p.image && (p.image.startsWith("http") || p.image.startsWith("data:"));
            return isUrl ? (
              <div style={{ borderRadius: "var(--rad)", overflow:"hidden", height:220, marginBottom:20 }}>
                <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            ) : (
              <div style={{ background: bgs[p.id % bgs.length], borderRadius: "var(--rad)", fontSize: 90, textAlign: "center", padding: "24px 0", marginBottom: 20 }}>{p.emoji || p.image}</div>
            );
          })()}
          <div className="ftabs">
            {[["detail", "📋 Ma'lumot"], ["price", "📊 Narx tahlili"], ["reviews", `💬 Sharhlar (${reviews.length})`]].map(([v, l]) => (
              <button key={v} className={`ftab ${revTab === v ? "act" : ""}`} onClick={() => setRevTab(v)}>{l}</button>
            ))}
          </div>

          {revTab === "detail" && (
            <>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, color: "var(--g3)", fontWeight: 700, marginBottom: 14 }}>{p.price.toLocaleString()} <span style={{ fontSize: 18, color: "var(--s3)", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 400 }}>so'm/{p.unit}</span></div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
                {[["📍 Viloyat", p.region], ["👤 Sotuvchi", p.seller], ["📦 Zaxira", `${p.stock} ${p.unit}`], ["⭐ Reyting", `${p.rating} (${p.reviews} ta)`]].map(([l, v]) => (
                  <div key={l} style={{ fontSize: 14 }}><span style={{ color: "var(--s3)" }}>{l}: </span><strong>{v}</strong></div>
                ))}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--s4)", marginBottom: 20 }}>{p.desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Miqdor:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <strong style={{ minWidth: 30, textAlign: "center" }}>{qty}</strong>
                  <button className="btn btn-ghost btn-xs" onClick={() => setQty(q => q + 1)}>+</button>
                </div>
                <strong style={{ color: "var(--g3)" }}>{(p.price * qty).toLocaleString()} so'm</strong>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {user ? (
                  <button className="btn btn-amber" style={{ flex: 1, justifyContent: "center" }} onClick={() => { addToCart({ ...p, qty }); onClose(); }}>🛒 Savatga qo'shish</button>
                ) : (
                  <button className="btn btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={() => { onClose(); openAuth(); }}>🔑 Kirish kerak</button>
                )}
              </div>
            </>
          )}

          {revTab === "price" && (
            <>
              {history ? <MiniChart data={history} /> : <p style={{ color: "var(--s3)" }}>Narx tarixi mavjud emas</p>}
              <div style={{ marginTop: 20, background: "var(--g5)", borderRadius: "var(--rad2)", padding: 18 }}>
                <h4 style={{ marginBottom: 10, color: "var(--g1)" }}>📊 Bozor holati</h4>
                <p style={{ fontSize: 14, color: "var(--g2)", lineHeight: 1.8 }}>
                  Hozirgi narx: <strong>{p.price.toLocaleString()} so'm/{p.unit}</strong><br />
                  So'nggi oy o'zgarishi: <strong style={{ color: "var(--r1)" }}>+7.1% ↑</strong><br />
                  O'rtacha bozor narxi: <strong>{(p.price * 0.95).toLocaleString()} so'm/{p.unit}</strong>
                </p>
              </div>
            </>
          )}

          {revTab === "reviews" && (
            <>
              {user && (
                <div style={{ background: "var(--s1)", borderRadius: "var(--rad2)", padding: 18, marginBottom: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label className="fl">⭐ Baholang</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", opacity: s <= newRev.rating ? 1 : 0.3 }} onClick={() => setNewRev(p => ({ ...p, rating: s }))}>⭐</button>
                      ))}
                    </div>
                  </div>
                  <textarea className="fta" style={{ minHeight: 70 }} placeholder="Sharh yozing..." value={newRev.comment} onChange={e => setNewRev(p => ({ ...p, comment: e.target.value }))} />
                  <button className="btn btn-green btn-sm" style={{ marginTop: 10 }} onClick={submitReview}>Yuborish</button>
                </div>
              )}
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--s3)" }}>
                  <div style={{ fontSize: 40 }}>💬</div><p style={{ marginTop: 8 }}>Hali sharh yo'q</p>
                </div>
              ) : reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-head">
                    <div className="review-user">
                      <div className="review-av">{r.userName[0]}</div>
                      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{r.userName}</div><div style={{ fontSize: 12, color: "var(--s3)" }}>{r.date}</div></div>
                    </div>
                    <div className="stars">{"⭐".repeat(r.rating)}</div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--s4)", lineHeight: 1.6 }}>{r.comment}</p>
                  <div style={{ fontSize: 12, color: "var(--s3)", marginTop: 8 }}>👍 {r.likes} ta foydali</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD PRODUCT MODAL ────────────────────────────────────────────────────────
function AddProdModal({ onClose, addProduct, db }) {
  const [d, setD] = useState({ name: "", categoryId: 1, price: "", unit: "kg", region: "Toshkent", stock: "", desc: "", image: "🥦", emoji: "🥦" });
  const [imgTab, setImgTab] = useState("emoji"); // "emoji" | "url" | "upload"
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState("");
  const emojis = ["🥦", "🍅", "🥒", "🍎", "🍇", "🌾", "🎃", "🥬", "🧄", "🥔", "🌿", "🍋", "🧅", "🍉", "🫑", "🥕", "🫐", "🍑", "🥭", "🌽"];
  const regions = ["Toshkent", "Samarqand", "Farg'ona", "Andijon", "Namangan", "Buxoro", "Xorazm", "Qashqadaryo", "Surxondaryo", "Jizzax"];

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Fayl 5MB dan kichik bo'lishi kerak!"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreview(base64);
      setD(p => ({ ...p, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const applyUrl = () => {
    if (!urlInput.trim()) return;
    setPreview(urlInput.trim());
    setD(p => ({ ...p, image: urlInput.trim() }));
  };

  const currentPreview = imgTab === "emoji" ? null : preview;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="mhead"><h3>➕ Mahsulot qo'shish</h3><button className="mclose" onClick={onClose}>✕</button></div>
        <div className="mbody">

          {/* IMAGE SECTION */}
          <div className="fg">
            <label className="fl">📸 Rasm tanlash usuli</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["emoji","😊 Emoji"],["url","🔗 URL"],["upload","📁 Fayl"]].map(([v,l]) => (
                <button key={v} onClick={() => setImgTab(v)}
                  style={{ flex:1, padding:"8px 4px", border: imgTab===v ? "2px solid var(--g4)" : "2px solid var(--s2)", borderRadius:9, background: imgTab===v ? "var(--g5)" : "var(--s1)", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>{l}</button>
              ))}
            </div>

            {/* PREVIEW */}
            {currentPreview && (
              <div style={{ width:"100%", height:160, borderRadius:12, overflow:"hidden", marginBottom:12, border:"2px solid var(--g4)", position:"relative" }}>
                <img src={currentPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setPreview("")} />
                <button onClick={() => { setPreview(""); setD(p => ({ ...p, image: d.emoji })); }}
                  style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.5)", color:"#fff", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:16 }}>✕</button>
              </div>
            )}

            {imgTab === "emoji" && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => setD(p => ({ ...p, image: e, emoji: e }))}
                    style={{ background: d.image===e ? "var(--g5)" : "var(--s1)", border: d.image===e ? "2px solid var(--g4)" : "2px solid transparent", borderRadius:9, padding:"6px 8px", cursor:"pointer", fontSize:22, transition:"all .15s" }}>{e}</button>
                ))}
              </div>
            )}

            {imgTab === "url" && (
              <div style={{ display:"flex", gap:8 }}>
                <input className="fi" style={{ flex:1 }} value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/rasm.jpg" />
                <button className="btn btn-green btn-sm" onClick={applyUrl}>Ko'rish</button>
              </div>
            )}

            {imgTab === "upload" && (
              <label style={{ display:"block", border:"2px dashed var(--g4)", borderRadius:12, padding:"24px 16px", textAlign:"center", cursor:"pointer", background:"var(--g5)", transition:"all .2s" }}>
                <input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
                <div style={{ fontSize:40, marginBottom:8 }}>📁</div>
                <div style={{ fontWeight:700, color:"var(--g2)" }}>Rasmni bu yerga tashlang yoki bosing</div>
                <div style={{ fontSize:13, color:"var(--s3)", marginTop:4 }}>JPG, PNG, WEBP — max 5MB</div>
              </label>
            )}
          </div>

          <div className="fg"><label className="fl">Mahsulot nomi</label><input className="fi" value={d.name} onChange={e => setD(p => ({ ...p, name: e.target.value }))} placeholder="Masalan: Yangi pomidor" /></div>
          <div className="frow">
            <div className="fg"><label className="fl">Kategoriya</label><select className="fs" value={d.categoryId} onChange={e => setD(p => ({ ...p, categoryId: Number(e.target.value) }))}>{db.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
            <div className="fg"><label className="fl">Birlik</label><select className="fs" value={d.unit} onChange={e => setD(p => ({ ...p, unit: e.target.value }))}>{["kg", "tonna", "qop", "dona", "litr"].map(u => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="frow">
            <div className="fg"><label className="fl">Narx (so'm)</label><input className="fi" type="number" value={d.price} onChange={e => setD(p => ({ ...p, price: e.target.value }))} /></div>
            <div className="fg"><label className="fl">Zaxira</label><input className="fi" type="number" value={d.stock} onChange={e => setD(p => ({ ...p, stock: e.target.value }))} /></div>
          </div>
          <div className="fg"><label className="fl">Viloyat</label><select className="fs" value={d.region} onChange={e => setD(p => ({ ...p, region: e.target.value }))}>{regions.map(r => <option key={r}>{r}</option>)}</select></div>
          <div className="fg"><label className="fl">Tavsif</label><textarea className="fta" value={d.desc} onChange={e => setD(p => ({ ...p, desc: e.target.value }))} placeholder="Mahsulot haqida..." /></div>
        </div>
        <div className="mfoot">
          <button className="btn btn-green" onClick={() => { if (d.name && d.price && d.stock) { addProduct({ ...d, price: Number(d.price), stock: Number(d.stock) }); onClose(); } }}>✅ Qo'shish</button>
          <button className="btn btn-ghost" onClick={onClose}>Bekor</button>
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ db, user, setPage, openAuth, openAddProd, setSelProd, addToCart, setCatFilter }) {
  return (
    <>
      <section className="hero">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1 }}
          className="hero-inner-bg"
        />
        <div className="container">
          <div className="hero-inner">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="hero-badge">
                <span className="badge-icon">🌿</span> O'zbekiston №1 Agro Platformasi
              </div>
              <h1>Fermerlar uchun <br/><span>zamonaviy</span> bozor</h1>
              <p className="hero-sub">
                Mahsulot yetishtiruvchi va xaridorni to'g'ridan-to'g'ri bog'laydigan, 
                hududlar bo'yicha narxlarni real vaqtda tahlil qiluvchi innovatsion platforma.
              </p>
              <div className="hero-acts">
                <button className="btn btn-amber btn-lg" onClick={() => setPage("catalog")}>
                   🛒 Bozorni ko'rish
                </button>
                <button className="btn btn-outline btn-lg" onClick={user ? openAddProd : openAuth}>
                  {user ? "➕ Sotuvni boshlash" : "📋 Ro'yxatdan o'tish"}
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              className="hero-visual"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="hero-card-stack">
                <div className="hero-stats-grid">
                  {[["2.4K+", "Mahsulotlar"], ["850+", "Fermerlar"], ["14", "Viloyat"], ["98%", "Ishonch"]].map(([n, l], i) => (
                    <motion.div 
                      key={l} 
                      className="hstat"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                    >
                      <div className="hstat-num">{n}</div>
                      <div className="hstat-lbl">{l}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="hero-floating-element">
                  <div className="floating-card">
                    <Star className="text-amber-500 fill-amber-500" size={20} />
                    <span>Eng yuqori sifatli mahsulotlar</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="section">
          <div className="sh"><h2>Kategoriyalar</h2><p>O'zingizga kerakli mahsulot turini tanlang</p></div>
          <div className="cat-grid">
            {db.categories.map(c => (
              <div key={c.id} className="cat-card" onClick={() => { if(setCatFilter) setCatFilter(c.id); setPage("catalog"); }} style={{ border: "3px solid transparent", cursor:"pointer" }}>
                <div className="cat-img-wrap">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="cat-img"
                      onError={e => { e.target.parentNode.style.background = c.color+"33"; e.target.style.display="none"; }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", background: c.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:64 }}>{c.icon}</div>
                  )}
                </div>
                <div className="cat-gradient" />
                <div className="cat-overlay" />
                <div className="cat-body">
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-pill">✦ {c.count} ta mahsulot</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="sh-row">
            <div className="sh"><h2>So'nggi mahsulotlar</h2><p>Eng yangi va frеsh mahsulotlar</p></div>
            <button className="btn btn-green btn-sm" onClick={() => setPage("catalog")}>Barchasini ko'rish →</button>
          </div>
          <div className="prod-grid">
            {db.products.slice(0, 6).map(p => <ProdCard key={p.id} p={p} onClick={() => setSelProd(p)} onCart={() => addToCart(p)} user={user} openAuth={openAuth} />)}
          </div>
        </div>

        <div className="section">
          <div className="sh-row">
            <div className="sh"><h2>📰 So'nggi yangiliklar</h2><p>Agrar soha bo'yicha eng yangi xabarlar</p></div>
            <button className="btn btn-green btn-sm" onClick={() => setPage("news")}>Barchasini ko'rish →</button>
          </div>
          <div className="news-grid">
            {db.news.slice(0, 3).map(n => (
              <div key={n.id} className="news-card" style={{ cursor:"pointer" }} onClick={() => setPage("news")}>
                <div className="news-img" style={{ background: "var(--g5)" }}>{n.image}</div>
                <div className="news-body">
                  <div className="news-cat">{n.category}</div>
                  <div className="news-title">{n.title}</div>
                  <div className="news-meta"><span>📅 {n.date}</span><span>👁️ {n.views}</span><span>✍️ {n.author}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer setPage={setPage} />
    </>
  );
}

// ─── CATALOG PAGE ─────────────────────────────────────────────────────────────
function CatalogPage({ db, user, openAuth, setSelProd, addToCart, initCat }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(initCat || null);
  const [sort, setSort] = useState("new");
  const [focused, setFocused] = useState(false);

  // FIX: Convert both sides to String for comparison (fixes Firebase type mismatch)
  const filtered = db.products.filter(p => {
    const mc = !cat || String(p.categoryId) === String(cat);
    const ms = !search.trim() ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.region && p.region.toLowerCase().includes(search.toLowerCase())) ||
      (p.seller && p.seller.toLowerCase().includes(search.toLowerCase()));
    return mc && ms && p.status !== "inactive";
  }).sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
    // FIX: sort by createdAt string instead of numeric id
    return (b.createdAt || "") > (a.createdAt || "") ? 1 : -1;
  });

  const suggestions = search.trim().length >= 1 && !focused
    ? []
    : db.products.filter(p =>
        search.trim().length >= 1 &&
        p.name && p.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5);

  return (
    <div className="container">
      <div className="section">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="catalog-header"
          style={{ marginBottom: 32 }}
        >
          <div className="sh">
            <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
              🛒 Mahsulotlar katalogi
            </h2>
            <p>Jami <strong style={{ color: "var(--g3)" }}>{db.products.length}</strong> ta mahsulotdan <strong style={{ color: "var(--a2)" }}>{filtered.length}</strong> ta topildi</p>
          </div>
        </motion.div>

        {/* Premium Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ position: "relative", marginBottom: 20 }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            borderRadius: 16,
            padding: "4px 8px 4px 20px",
            boxShadow: focused
              ? "0 0 0 3px rgba(16,185,129,0.25), 0 8px 32px rgba(0,0,0,0.1)"
              : "0 4px 24px rgba(0,0,0,0.08)",
            border: `2px solid ${focused ? "var(--g3)" : "transparent"}`,
            transition: "all 0.3s ease",
            gap: 12,
          }}>
            <motion.div
              animate={{ scale: focused ? 1.15 : 1, rotate: focused ? 10 : 0 }}
              transition={{ type: "spring", stiffness: 400 }}
              style={{ color: focused ? "var(--g3)" : "var(--s3)", display: "flex", flexShrink: 0 }}
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </motion.div>
            <input
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 16, fontFamily: "inherit",
                background: "transparent", color: "var(--s5)",
                padding: "14px 0",
              }}
              placeholder="Mahsulot nomi, hudud yoki sotuvchi..."
              value={search}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              onChange={e => setSearch(e.target.value)}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={() => setSearch("")}
                  style={{
                    background: "var(--s1)", border: "none", borderRadius: "50%",
                    width: 32, height: 32, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                    color: "var(--s3)", fontSize: 16
                  }}
                >✕</motion.button>
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "linear-gradient(135deg, var(--g3), var(--g4))",
                border: "none", borderRadius: 12, padding: "10px 24px",
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: "pointer", flexShrink: 0, display: "flex",
                alignItems: "center", gap: 6,
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Qidirish
            </motion.button>
          </div>

          {/* Live Suggestions Dropdown */}
          <AnimatePresence>
            {focused && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                  background: "#fff", borderRadius: 14, zIndex: 100,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  overflow: "hidden",
                }}
              >
                {suggestions.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { setSelProd(p); setFocused(false); setSearch(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 20px", cursor: "pointer",
                      borderBottom: i < suggestions.length - 1 ? "1px solid var(--s1)" : "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--g5)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 28 }}>{p.emoji || "🌿"}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--s5)" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--s3)" }}>📍 {p.region} · {p.price?.toLocaleString()} so'm/kg</div>
                    </div>
                    <div style={{ marginLeft: "auto", color: "var(--g3)", fontWeight: 700, fontSize: 14 }}>
                      {p.price?.toLocaleString()} <span style={{ fontSize: 11 }}>so'm</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
        >
          <button
            onClick={() => setCat(null)}
            style={{
              padding: "8px 18px", borderRadius: 50, border: "none",
              background: !cat ? "linear-gradient(135deg,var(--g3),var(--g4))" : "var(--s1)",
              color: !cat ? "#fff" : "var(--s4)", fontWeight: 600, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >Barchasi</button>
          {db.categories.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCat(String(cat) === String(c.id) ? null : c.id)}
              style={{
                padding: "8px 18px", borderRadius: 50, border: "none",
                background: String(cat) === String(c.id)
                  ? "linear-gradient(135deg,var(--g3),var(--g4))"
                  : "var(--s1)",
                color: String(cat) === String(c.id) ? "#fff" : "var(--s4)",
                fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
              }}
            >{c.icon} {c.name}</motion.button>
          ))}
        </motion.div>

        {/* Sort Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--s3)" }}>Saralash:</span>
          {[["new", "🕐 Yangi"], ["price-asc", "💰 Arzon↑"], ["price-desc", "💎 Qimmat↓"], ["rating", "⭐ Reyting"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSort(v)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none",
                background: sort === v ? "var(--g5)" : "transparent",
                color: sort === v ? "var(--g2)" : "var(--s3)",
                fontWeight: sort === v ? 700 : 500, fontSize: 13,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >{l}</button>
          ))}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "80px 0" }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ fontSize: 72, display: "inline-block" }}
              >
                🔍
              </motion.div>
              <h3 style={{ marginTop: 20, color: "var(--s4)", fontSize: 22 }}>
                "{search || "Bu kategoriyada"}" bo'yicha hech narsa topilmadi
              </h3>
              <p style={{ color: "var(--s3)", marginTop: 8 }}>
                Boshqa so'z kiriting yoki kategoriyani o'zgartiring
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearch(""); setCat(null); }}
                style={{
                  marginTop: 20, padding: "12px 28px", borderRadius: 12,
                  background: "linear-gradient(135deg,var(--g3),var(--g4))",
                  border: "none", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >Barchasini ko'rsatish</motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="prod-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                >
                  <ProdCard p={p} onClick={() => setSelProd(p)} onCart={() => addToCart(p)} user={user} openAuth={openAuth} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── PRICES PAGE ──────────────────────────────────────────────────────────────
function PricesPage({ db }) {
  const [sel, setSel] = useState("pomidor");
  const [selRegion, setSelRegion] = useState(null);
  const sorted = [...db.regionPrices].sort((a, b) => a[sel] - b[sel]);

  return (
    <div className="container">
      <div className="section">
        <div className="sh"><h2>📊 Narxlar tahlili</h2><p>Viloyatlar kesimida narx solishtirish</p></div>
        <div className="filters">
          {[["pomidor", "🍅 Pomidor"], ["bodring", "🥒 Bodring"], ["olma", "🍎 Olma"]].map(([v, l]) => (
            <button key={v} className={`fbtn ${sel === v ? "act" : ""}`} onClick={() => setSel(v)}>{l}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 20, color: "var(--g1)" }}>Viloyatlar jadvali</h3>
            <table className="tbl">
              <thead><tr><th>#</th><th>Viloyat</th><th>Narx (so'm/kg)</th><th>Holat</th></tr></thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={r.region} style={{ cursor: "pointer" }} onClick={() => setSelRegion(r)}>
                    <td style={{ fontWeight: 700, color: i < 3 ? "var(--g3)" : "var(--s3)" }}>{i + 1}</td>
                    <td>📍 {r.region}</td>
                    <td><strong>{r[sel].toLocaleString()}</strong></td>
                    <td><span className={`stt ${i < 3 ? "stt-active" : "stt-pending"}`}>{i < 3 ? "↓ Arzon" : "↑ Qimmat"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 20, color: "var(--g1)" }}>Bar grafik</h3>
            <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)" }}>
              {sorted.map((r) => {
                const max = Math.max(...db.regionPrices.map(x => x[sel]));
                const pct = (r[sel] / max * 100).toFixed(0);
                return (
                  <div key={r.region} style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>📍 {r.region}</span>
                      <strong style={{ color: "var(--g3)" }}>{r[sel].toLocaleString()} so'm</strong>
                    </div>
                    <div style={{ background: "var(--s1)", borderRadius: 6, overflow: "hidden", height: 10 }}>
                      <div style={{ width: `${pct}%`, background: "linear-gradient(to right,var(--g3),var(--g4))", height: "100%", borderRadius: 6, transition: "width .6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {selRegion && (
              <div style={{ marginTop: 20, background: "var(--g5)", borderRadius: "var(--rad)", padding: 20 }}>
                <h4 style={{ color: "var(--g1)", marginBottom: 12 }}>📍 {selRegion.region} narxlari</h4>
                {[["🍅 Pomidor", selRegion.pomidor], ["🥒 Bodring", selRegion.bodring], ["🍎 Olma", selRegion.olma]].map(([n, v]) => (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.06)", fontSize: 14 }}>
                    <span>{n}</span><strong style={{ color: "var(--g3)" }}>{v.toLocaleString()} so'm/kg</strong>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, background: "#fff", borderRadius: "var(--rad)", padding: 20, boxShadow: "var(--sh)" }}>
              <h4 style={{ marginBottom: 12, color: "var(--g1)" }}>📈 Bozor xulosasi</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  ["Eng arzon", `${Math.min(...db.regionPrices.map(r => r[sel])).toLocaleString()} so'm`, "var(--g3)"],
                  ["O'rtacha", `${Math.round(db.regionPrices.reduce((s, r) => s + r[sel], 0) / db.regionPrices.length).toLocaleString()} so'm`, "var(--a1)"],
                  ["Eng qimmat", `${Math.max(...db.regionPrices.map(r => r[sel])).toLocaleString()} so'm`, "var(--r1)"],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: "var(--s1)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--s3)", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NEWS PAGE ────────────────────────────────────────────────────────────────
function NewsPage({ db }) {
  const [sel, setSel] = useState(null);
  const cats = ["Barchasi", ...new Set(db.news.map(n => n.category))];
  const [cat, setCat] = useState("Barchasi");
  const filtered = cat === "Barchasi" ? db.news : db.news.filter(n => n.category === cat);

  if (sel) return (
    <div className="container">
      <div className="section">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => setSel(null)}>← Orqaga</button>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 80, textAlign: "center", padding: "40px", background: "var(--g5)", borderRadius: "var(--rad)", marginBottom: 32 }}>{sel.image}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--g3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>{sel.category}</div>
          <h2 style={{ fontSize: 36, color: "var(--g1)", marginBottom: 16, lineHeight: 1.3 }}>{sel.title}</h2>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--s3)", marginBottom: 28 }}>
            <span>📅 {sel.date}</span><span>✍️ {sel.author}</span><span>👁️ {sel.views} ko'rildi</span>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--s4)" }}>{sel.desc}</p>
          <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--s4)", marginTop: 20 }}>
            Agrar soha rivojlanishi davom etmoqda. Mamlakatimiz fermerlarining mehnati tufayli yildan-yilga mahsulot sifati va miqdori oshib bormoqda. Raqamli texnologiyalar qishloq xo'jaligiga yangi imkoniyatlar ochmoqda.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="section">
        <div className="sh"><h2>📰 Yangiliklar va Blog</h2><p>Agrar soha bo'yicha eng so'nggi xabarlar</p></div>
        <div className="filters">
          {cats.map(c => <button key={c} className={`fbtn ${cat === c ? "act" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="news-grid">
          {filtered.map(n => (
            <div key={n.id} className="news-card" onClick={() => setSel(n)}>
              <div className="news-img" style={{ background: "var(--g5)" }}>{n.image}</div>
              <div className="news-body">
                <div className="news-cat">{n.category}</div>
                <div className="news-title">{n.title}</div>
                <p style={{ fontSize: 13, color: "var(--s3)", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.desc}</p>
                <div className="news-meta"><span>📅 {n.date}</span><span>👁️ {n.views}</span><span>✍️ {n.author}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DELIVERY PAGE ────────────────────────────────────────────────────────────
function DeliveryPage({ db, user, openAuth }) {
  const [trackId, setTrackId] = useState("");
  const [result, setResult] = useState(null);

  const track = () => {
    const order = db.orders.find(o => o.id === Number(trackId));
    setResult(order || "notfound");
  };

  return (
    <div className="container">
      <div className="section">
        <div className="sh"><h2>🚚 Yetkazib berish kuzatuvi</h2><p>Buyurtmangiz holatini real vaqtda kuzating</p></div>

        <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 32, boxShadow: "var(--sh)", maxWidth: 600, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16, color: "var(--g1)" }}>Buyurtma raqami bo'yicha qidirish</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <input className="fi" style={{ flex: 1 }} placeholder="Buyurtma ID (masalan: 1 yoki 2)" value={trackId} onChange={e => setTrackId(e.target.value)} />
            <button className="btn btn-green" onClick={track}>🔍 Kuzatish</button>
          </div>
          {result === "notfound" && <p style={{ color: "var(--r1)", marginTop: 12 }}>❌ Buyurtma topilmadi</p>}
        </div>

        {result && result !== "notfound" && (
          <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 32, boxShadow: "var(--sh)", maxWidth: 600, marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 style={{ color: "var(--g1)" }}>Buyurtma #{result.id}</h3>
              <span className={`stt stt-${result.status}`}>{result.status === "delivered" ? "✅ Yetkazildi" : result.status === "shipping" ? "🚚 Yo'lda" : "⏳ Kutilmoqda"}</span>
            </div>
            <div style={{ marginBottom: 24, fontSize: 14, color: "var(--s4)" }}>
              <div>📦 {db.products.find(p => p.id === result.productId)?.name} — {result.quantity} kg</div>
              <div style={{ marginTop: 4 }}>📍 {result.address}</div>
              <div style={{ marginTop: 4 }}>💰 {result.totalPrice.toLocaleString()} so'm</div>
            </div>
            <div className="track-steps">
              {result.tracking.map((step, i) => (
                <div key={i} className={`track-step ${step.done ? "done" : ""}`}>
                  <div className="track-dot">{step.done ? "✓" : i + 1}</div>
                  <div className="track-info">
                    <div className="track-status">{step.status}</div>
                    <div className="track-date">{step.date || "Kutilmoqda..."}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && (
          <>
            <h3 style={{ marginBottom: 20, color: "var(--g1)" }}>Mening buyurtmalarim</h3>
            {db.orders.filter(o => o.buyerId === user.id || o.sellerId === user.id).map(o => {
              const prod = db.products.find(p => p.id === o.productId);
              const doneCount = o.tracking.filter(t => t.done).length;
              const pct = (doneCount / o.tracking.length * 100).toFixed(0);
              return (
                <div key={o.id} style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h4 style={{ color: "var(--g1)", display: "flex", alignItems: "center", gap: 10 }}>
                        {prod?.image && (prod.image.startsWith("http") || prod.image.startsWith("data:")) ? <img src={prod.image} alt={prod.name} style={{width: 44, height: 44, borderRadius: 10, objectFit: "cover"}} onError={(e) => {e.target.style.display="none"}} /> : <span style={{fontSize: 28}}>{prod?.emoji || prod?.image || "📦"}</span>}
                        {prod?.name}
                      </h4>
                      <div style={{ fontSize: 13, color: "var(--s3)", marginTop: 6 }}>Buyurtma #{o.id} · {o.createdAt} · 📍 {o.address}</div>
                    </div>
                    <span className={`stt stt-${o.status}`}>{o.status === "delivered" ? "✅ Yetkazildi" : "🚚 Yo'lda"}</span>
                  </div>
                  <div style={{ background: "var(--s1)", borderRadius: 8, overflow: "hidden", height: 8, marginBottom: 8 }}>
                    <div style={{ width: `${pct}%`, background: "linear-gradient(to right,var(--g3),var(--g4))", height: "100%", borderRadius: 8, transition: "width .6s" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--s3)" }}>Holat: {doneCount}/{o.tracking.length} bosqich yakunlandi</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

// ─── SANDBOX TEST KARTALAR ────────────────────────────────────────────────────
const SANDBOX_CARDS = {
  // UzCard test kartalar
  "8600495473316478": { name: "JASUR TOSHMATOV",   bank: "Xalq Banki",   status: "ok" },
  "8600123456789012": { name: "MALIKA YUNUSOVA",   bank: "Ipoteka Bank", status: "ok" },
  "8600111122223333": { name: "BOBUR HAMIDOV",      bank: "Asaka Bank",   status: "ok" },
  "8600000000000001": { name: "TEST MUVAFFAQIYAT",  bank: "Test Bank",    status: "ok" },
  "8600000000000002": { name: "KARTA BLOKLANGAN",   bank: "Test Bank",    status: "blocked" },
  "8600000000000003": { name: "MABLAG YETARLI EMAS",bank: "Test Bank",    status: "insufficient" },
  // Humo test kartalar
  "9860123456781234": { name: "ZAFAR USMONOV",      bank: "Agrobank",     status: "ok" },
  "9860987654321098": { name: "GULNORA RAHIMOVA",   bank: "Hamkorbank",   status: "ok" },
  "9860000000000001": { name: "TEST MUVAFFAQIYAT",  bank: "Test Bank",    status: "ok" },
  // Payme/Click test (Visa/MC)
  "4111111111111111": { name: "TEST VISA USER",     bank: "Visa",         status: "ok" },
  "5500000000000004": { name: "TEST MC USER",       bank: "Mastercard",   status: "ok" },
  "4000000000000002": { name: "KARTA RAD ETILDI",   bank: "Visa",         status: "declined" },
};

function lookupSandbox(num) {
  const clean = num.replace(/\s/g, "");
  if (clean.length < 16) return null;
  // Exact match
  if (SANDBOX_CARDS[clean]) return SANDBOX_CARDS[clean];
  // Prefix-based fallback
  const names = ["ALISHER KARIMOV","DILNOZA ERGASHEVA","SARDOR TOSHEV","MAVLUDA HOLIQOVA","BAHODIR NORMURODOV","FERUZA NAZAROVA","OTABEK RASHIDOV","SANJAR YULDASHEV"];
  const banks = { "8600":"Xalq Banki","9860":"Agrobank","4111":"Visa Bank","5500":"MC Bank" };
  const prefix = clean.slice(0,4);
  const idx = parseInt(clean.slice(12,16), 10) % names.length;
  return { name: names[idx], bank: banks[prefix] || "O'zbekiston Banki", status: "ok" };
}

// ─── PAYME CHECKOUT (sandbox UI) ─────────────────────────────────────────────
function PaymeCheckout({ total, onSuccess, onCancel }) {
  const [stage, setStage] = useState("card"); // card → otp → processing → result
  const [cardNum, setCardNum] = useState("");
  const [exp, setExp] = useState("");
  const [otp, setOtp] = useState("");
  const [cardInfo, setCardInfo] = useState(null);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (stage === "otp") {
      const t = setInterval(() => setTimer(p => p > 0 ? p-1 : 0), 1000);
      return () => clearInterval(t);
    }
  }, [stage]);

  const submitCard = () => {
    const clean = cardNum.replace(/\s/g,"");
    if (clean.length < 16) { setError("Karta raqamini to'liq kiriting"); return; }
    if (!exp || exp.length < 5) { setError("Muddatni kiriting (MM/YY)"); return; }
    const month = parseInt(exp.slice(0,2),10);
    if (month < 1 || month > 12) { setError("Oy noto'g'ri (01-12)"); return; }
    const info = lookupSandbox(cardNum);
    if (info?.status === "blocked") { setError("❌ Karta bloklangan. Bankingizga murojaat qiling."); return; }
    if (info?.status === "insufficient") { setError("❌ Kartada mablag' yetarli emas."); return; }
    if (info?.status === "declined") { setError("❌ Bank to'lovni rad etdi."); return; }
    setCardInfo(info);
    setError("");
    setStage("otp");
    setTimer(60);
  };

  const submitOtp = async () => {
    if (otp.length < 6) { setError("6 xonali kodni kiriting"); return; }
    // sandbox: any 6-digit code works except 000000
    if (otp === "000000") { setError("❌ Noto'g'ri kod. Qayta urinib ko'ring."); return; }
    setError("");
    setStage("processing");
    await new Promise(r => setTimeout(r, 2200));
    setStage("success");
    setTimeout(() => onSuccess(), 1800);
  };

  const fmtCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = (v) => { let d=v.replace(/\D/g,""); if(d.length>=2) d=d.slice(0,2)+"/"+d.slice(2,4); return d; };

  // Payme green brand colors
  const pm = "#27ae60";

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",minHeight:"100%"}}>
      {/* Header */}
      <div style={{background:pm,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="8" fill="#fff"/><text x="4" y="20" fill={pm} fontSize="14" fontWeight="900">P</text></svg>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:16,lineHeight:1}}>Payme</div>
            <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>Xavfsiz to'lov tizimi</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:11}}>To'lov summasi</div>
          <div style={{color:"#fff",fontWeight:800,fontSize:18}}>{total.toLocaleString()} so'm</div>
        </div>
      </div>

      {/* Merchant info */}
      <div style={{background:"#f0faf4",borderBottom:"1px solid #d4edda",padding:"10px 20px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,background:pm,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🌿</div>
        <div>
          <div style={{fontWeight:700,fontSize:13}}>Salom AgroBozor</div>
          <div style={{fontSize:11,color:"#666"}}>agrobozor.uz · ✅ Tasdiqlangan savdogar</div>
        </div>
        <div style={{marginLeft:"auto",background:"#d4edda",color:pm,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>🔒 SSL</div>
      </div>

      <div style={{padding:"20px"}}>
        {/* STAGE: card */}
        {stage === "card" && (<>
          <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:14}}>Karta ma'lumotlarini kiriting</div>

          {/* Mini test cards hint */}
          <div style={{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12}}>
            <div style={{fontWeight:700,color:"#f57f17",marginBottom:4}}>🧪 Sandbox test kartalar:</div>
            <div style={{color:"#555",lineHeight:1.8}}>
              ✅ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11}}>8600 4954 7331 6478</code> — muvaffaqiyatli<br/>
              ✅ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11}}>8600 0000 0000 0001</code> — muvaffaqiyatli<br/>
              ❌ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11}}>8600 0000 0000 0002</code> — bloklangan<br/>
              ❌ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11}}>8600 0000 0000 0003</code> — mablag' yetarli emas
            </div>
            <div style={{color:"#888",marginTop:6,fontSize:11}}>SMS kod: istalgan 6 ta raqam (000000 dan tashqari)</div>
          </div>

          {/* Card input */}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:"#555",display:"block",marginBottom:6}}>Karta raqami</label>
            <div style={{position:"relative"}}>
              <input value={cardNum} onChange={e=>{const v=fmtCard(e.target.value);setCardNum(v);const i=lookupSandbox(v);setCardInfo(i);setError("");}}
                placeholder="0000 0000 0000 0000" maxLength={19}
                style={{width:"100%",border:"2px solid #ddd",borderRadius:10,padding:"13px 50px 13px 14px",fontSize:17,fontFamily:"'Courier New',monospace",letterSpacing:3,fontWeight:700,outline:"none",boxSizing:"border-box",borderColor:error?"#e53935":cardInfo&&cardNum.replace(/\s/g,"").length>=16?"#27ae60":"#ddd",transition:"border-color .2s"}}
              />
              {/* Card brand icon */}
              <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)"}}>
                {cardNum.startsWith("8600") && <svg viewBox="0 0 40 24" width="40" height="24"><rect width="40" height="24" rx="4" fill="#1a4731"/><text x="3" y="16" fill="#fff" fontSize="7" fontWeight="bold">UzCARD</text></svg>}
                {cardNum.startsWith("9860") && <svg viewBox="0 0 40 24" width="40" height="24"><rect width="40" height="24" rx="4" fill="#7b2d8b"/><circle cx="14" cy="12" r="8" fill="#c77dff" opacity=".7"/><circle cx="22" cy="12" r="8" fill="#9d4edd" opacity=".7"/></svg>}
                {cardNum.startsWith("4") && <svg viewBox="0 0 40 24" width="40" height="24"><rect width="40" height="24" rx="4" fill="#1a1f71"/><text x="3" y="17" fill="#fff" fontSize="12" fontWeight="900" fontStyle="italic">VISA</text></svg>}
                {cardNum.startsWith("5") && <svg viewBox="0 0 40 24" width="40" height="24"><rect width="40" height="24" rx="4" fill="#fff" stroke="#ddd"/><circle cx="15" cy="12" r="9" fill="#eb001b"/><circle cx="25" cy="12" r="9" fill="#f79e1b"/></svg>}
              </div>
            </div>
            {/* Auto-detected name */}
            {cardInfo && cardNum.replace(/\s/g,"").length >= 16 && cardInfo.status === "ok" && (
              <div style={{marginTop:8,background:"#f0faf4",border:"1px solid #a8d5b5",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,background:pm,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{cardInfo.name[0]}</div>
                <div>
                  <div style={{fontSize:11,color:"#888"}}>Karta egasi</div>
                  <div style={{fontWeight:800,color:"#1a4731",fontSize:14,fontFamily:"'Courier New',monospace"}}>{cardInfo.name}</div>
                  <div style={{fontSize:11,color:pm}}>🏦 {cardInfo.bank}</div>
                </div>
                <svg style={{marginLeft:"auto",flexShrink:0}} width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill={pm}/><path d="M5 11l4 4 8-8" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round"/></svg>
              </div>
            )}
            {cardInfo && cardInfo.status !== "ok" && cardNum.replace(/\s/g,"").length >= 16 && (
              <div style={{marginTop:8,background:"#ffebee",border:"1px solid #ffcdd2",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#c62828",fontWeight:600}}>
                ❌ {cardInfo.name}
              </div>
            )}
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:"#555",display:"block",marginBottom:6}}>Amal qilish muddati</label>
            <input value={exp} onChange={e=>{setExp(fmtExp(e.target.value));setError("");}}
              placeholder="MM / YY" maxLength={5}
              style={{width:"100%",border:"2px solid #ddd",borderRadius:10,padding:"13px 14px",fontSize:17,fontFamily:"'Courier New',monospace",letterSpacing:4,fontWeight:700,outline:"none",boxSizing:"border-box"}}
            />
          </div>

          <div style={{background:"#e8f5e9",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#2e7d32"}}>
            ℹ️ UzCard va Humo kartalarida CVV kod yo'q. To'lov SMS kod orqali tasdiqlanadi.
          </div>

          {error && <div style={{background:"#ffebee",border:"1px solid #ffcdd2",borderRadius:10,padding:"10px 14px",color:"#c62828",fontWeight:600,fontSize:13,marginBottom:14}}>{error}</div>}

          <button onClick={submitCard}
            style={{width:"100%",background:pm,color:"#fff",border:"none",borderRadius:12,padding:"15px",fontWeight:800,fontSize:16,cursor:"pointer",transition:"opacity .2s"}}
            onMouseOver={e=>e.target.style.opacity=".9"} onMouseOut={e=>e.target.style.opacity="1"}>
            Davom etish →
          </button>
        </>)}

        {/* STAGE: otp */}
        {stage === "otp" && (<>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{width:60,height:60,background:"#e8f5e9",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:28}}>📱</div>
            <div style={{fontWeight:800,fontSize:16,marginBottom:6}}>SMS tasdiqlash</div>
            <div style={{fontSize:13,color:"#666",lineHeight:1.6}}>
              <strong>{cardInfo?.name}</strong> kartasiga bog'liq<br/>
              <strong>+998 ** *** **67</strong> raqamiga SMS yuborildi
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:"#555",display:"block",marginBottom:8,textAlign:"center"}}>6 xonali kodni kiriting</label>
            <input value={otp} onChange={e=>{setOtp(e.target.value.replace(/\D/g,"").slice(0,6));setError("");}}
              placeholder="_ _ _ _ _ _" maxLength={6} autoFocus
              style={{width:"100%",border:"2px solid #ddd",borderRadius:12,padding:"16px",fontSize:30,fontFamily:"'Courier New',monospace",letterSpacing:14,textAlign:"center",fontWeight:900,outline:"none",boxSizing:"border-box",borderColor:otp.length===6?"#27ae60":"#ddd"}}
            />
            <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"#888"}}>
              {timer > 0
                ? <>Kod amal qilish vaqti: <strong style={{color:timer<15?"#e53935":pm}}>{timer}s</strong></>
                : <span style={{color:pm,cursor:"pointer",fontWeight:700}} onClick={()=>{setTimer(60);}}>Qayta yuborish</span>}
            </div>
          </div>

          {error && <div style={{background:"#ffebee",border:"1px solid #ffcdd2",borderRadius:10,padding:"10px 14px",color:"#c62828",fontWeight:600,fontSize:13,marginBottom:14}}>{error}</div>}

          <button onClick={submitOtp}
            style={{width:"100%",background:otp.length===6?pm:"#bbb",color:"#fff",border:"none",borderRadius:12,padding:"15px",fontWeight:800,fontSize:16,cursor:otp.length===6?"pointer":"not-allowed",transition:"background .2s"}}>
            ✅ Tasdiqlash
          </button>
          <button onClick={()=>{setStage("card");setError("");}}
            style={{width:"100%",background:"none",border:"none",color:"#888",marginTop:10,padding:"8px",cursor:"pointer",fontSize:13,fontWeight:600}}>
            ← Orqaga
          </button>
        </>)}

        {/* STAGE: processing */}
        {stage === "processing" && (
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{width:70,height:70,border:`4px solid #e8f5e9`,borderTop:`4px solid ${pm}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>To'lov amalga oshirilmoqda</div>
            <div style={{fontSize:13,color:"#888"}}>Bank bilan bog'lanilmoqda...</div>
            <div style={{marginTop:16,fontSize:12,color:"#aaa",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
              🔒 256-bit SSL shifrlash
            </div>
          </div>
        )}

        {/* STAGE: success */}
        {stage === "success" && (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:70,height:70,background:"linear-gradient(135deg,#27ae60,#2ecc71)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 30px rgba(39,174,96,.4)"}}>
              <svg width="36" height="36" viewBox="0 0 36 36"><path d="M6 18l8 8 16-16" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{fontWeight:800,fontSize:18,color:"#1a4731",marginBottom:6}}>To'lov qabul qilindi!</div>
            <div style={{fontSize:13,color:"#666"}}>Buyurtmangiz tasdiqlanmoqda...</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{borderTop:"1px solid #eee",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#aaa"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>🔒 Payme xavfsiz to'lov</div>
        <button onClick={onCancel} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:12}}>Bekor qilish</button>
      </div>
    </div>
  );
}

// ─── CLICK CHECKOUT (sandbox UI) ─────────────────────────────────────────────
function ClickCheckout({ total, onSuccess, onCancel }) {
  const [stage, setStage] = useState("card");
  const [cardNum, setCardNum] = useState("");
  const [exp, setExp] = useState("");
  const [otp, setOtp] = useState("");
  const [cardInfo, setCardInfo] = useState(null);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(90);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (stage === "otp") {
      const t = setInterval(() => setTimer(p => p > 0 ? p-1 : 0), 1000);
      return () => clearInterval(t);
    }
  }, [stage]);

  const fmtCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = (v) => { let d=v.replace(/\D/g,""); if(d.length>=2) d=d.slice(0,2)+"/"+d.slice(2,4); return d; };

  const submitCard = () => {
    const clean = cardNum.replace(/\s/g,"");
    if (clean.length < 16) { setError("Karta raqamini to'liq kiriting"); return; }
    if (!exp || exp.length < 5) { setError("Muddatni kiriting"); return; }
    const info = lookupSandbox(cardNum);
    if (info?.status === "blocked") { setError("❌ Karta faol emas."); return; }
    if (info?.status === "insufficient") { setError("❌ Hisobda mablag' yetarli emas."); return; }
    if (info?.status === "declined") { setError("❌ Bank to'lovni rad etdi."); return; }
    setCardInfo(info);
    setError("");
    setSmsSent(true);
    setStage("otp");
    setTimer(90);
  };

  const submitOtp = async () => {
    if (otp.length < 6) { setError("6 xonali kodni kiriting"); return; }
    if (otp === "000000") { setError("❌ Noto'g'ri tasdiqlash kodi."); return; }
    setError("");
    setStage("processing");
    await new Promise(r => setTimeout(r, 2000));
    setStage("success");
    setTimeout(() => onSuccess(), 1600);
  };

  const ck = "#0095D3"; // Click blue

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#007ab8,${ck})`,padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{background:"#fff",borderRadius:10,padding:"4px 10px",fontWeight:900,fontSize:18,color:ck,letterSpacing:-1}}>Click</div>
            <div style={{color:"rgba(255,255,255,.8)",fontSize:11}}>To'lov tizimi</div>
          </div>
          <div style={{color:"#fff",fontWeight:800,fontSize:17}}>{total.toLocaleString()} so'm</div>
        </div>
        {/* Progress steps */}
        <div style={{display:"flex",alignItems:"center",marginTop:16,gap:0}}>
          {["Karta","SMS","Tasdiqlash"].map((s,i) => {
            const stageIdx = stage==="card"?0:stage==="otp"?1:2;
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={s} style={{display:"flex",alignItems:"center",flex:1}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:done?"#fff":active?"#fff":"rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
                    {done ? <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l4 4 6-6" stroke={ck} strokeWidth="2.2" fill="none" strokeLinecap="round"/></svg>
                          : <span style={{fontSize:11,fontWeight:800,color:active?ck:"rgba(255,255,255,.6)"}}>{i+1}</span>}
                  </div>
                  <span style={{fontSize:10,color:active?"#fff":"rgba(255,255,255,.6)",fontWeight:active?700:400}}>{s}</span>
                </div>
                {i < 2 && <div style={{height:2,flex:0,width:20,background:done?"#fff":"rgba(255,255,255,.3)",marginBottom:16}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Merchant */}
      <div style={{background:"#f0f8ff",borderBottom:"1px solid #dceefb",padding:"10px 20px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,background:ck,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🌿</div>
        <div>
          <div style={{fontWeight:700,fontSize:13}}>Salom AgroBozor</div>
          <div style={{fontSize:11,color:"#666"}}>✅ Click tasdiqlangan savdogar</div>
        </div>
      </div>

      <div style={{padding:"20px"}}>
        {stage === "card" && (<>
          {/* Test cards hint */}
          <div style={{background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12}}>
            <div style={{fontWeight:700,color:"#1565c0",marginBottom:4}}>🧪 Test kartalar (sandbox):</div>
            <div style={{color:"#444",lineHeight:1.8}}>
              ✅ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11,fontFamily:"monospace"}}>8600 0000 0000 0001</code> — muvaffaqiyatli<br/>
              ✅ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11,fontFamily:"monospace"}}>9860 1234 5678 1234</code> — muvaffaqiyatli<br/>
              ❌ <code style={{background:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11,fontFamily:"monospace"}}>8600 0000 0000 0003</code> — mablag' kam
            </div>
            <div style={{fontSize:11,color:"#888",marginTop:4}}>SMS kod: 6 ta ixtiyoriy raqam</div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:700,color:"#444",display:"block",marginBottom:6}}>Karta raqami</label>
            <input value={cardNum} onChange={e=>{const v=fmtCard(e.target.value);setCardNum(v);setCardInfo(lookupSandbox(v));setError("");}}
              placeholder="8600 0000 0000 0000" maxLength={19}
              style={{width:"100%",border:`2px solid ${error?"#e53935":cardInfo&&cardNum.replace(/\s/g,"").length>=16&&cardInfo.status==="ok"?ck:"#ddd"}`,borderRadius:10,padding:"13px 14px",fontSize:18,fontFamily:"'Courier New',monospace",letterSpacing:3,fontWeight:700,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}}
            />
            {cardInfo && cardNum.replace(/\s/g,"").length >= 16 && cardInfo.status === "ok" && (
              <div style={{marginTop:8,background:"#e3f2fd",border:"1px solid #90caf9",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,background:ck,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>{cardInfo.name[0]}</div>
                <div>
                  <div style={{fontSize:11,color:"#888"}}>Karta egasi</div>
                  <div style={{fontWeight:800,color:"#003d6b",fontFamily:"'Courier New',monospace",fontSize:14}}>{cardInfo.name}</div>
                  <div style={{fontSize:11,color:ck}}>🏦 {cardInfo.bank}</div>
                </div>
                <svg style={{marginLeft:"auto"}} width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill={ck}/><path d="M5 11l4 4 8-8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
              </div>
            )}
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:700,color:"#444",display:"block",marginBottom:6}}>Muddati</label>
            <input value={exp} onChange={e=>{setExp(fmtExp(e.target.value));setError("");}}
              placeholder="MM / YY" maxLength={5}
              style={{width:"100%",border:"2px solid #ddd",borderRadius:10,padding:"13px 14px",fontSize:18,fontFamily:"'Courier New',monospace",letterSpacing:4,fontWeight:700,outline:"none",boxSizing:"border-box"}}
            />
          </div>

          <div style={{background:"#e8f5e9",borderRadius:10,padding:"9px 13px",marginBottom:14,fontSize:12,color:"#2e7d32"}}>
            ℹ️ UzCard/Humo kartalarida CVV kod yo'q — SMS orqali tasdiqlanadi
          </div>

          {error && <div style={{background:"#ffebee",borderRadius:10,padding:"10px 14px",color:"#c62828",fontWeight:600,fontSize:13,marginBottom:14}}>{error}</div>}

          <button onClick={submitCard} style={{width:"100%",background:`linear-gradient(135deg,#007ab8,${ck})`,color:"#fff",border:"none",borderRadius:12,padding:"15px",fontWeight:800,fontSize:16,cursor:"pointer"}}>
            SMS kod olish →
          </button>
        </>)}

        {stage === "otp" && (<>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{width:64,height:64,background:"#e3f2fd",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:30}}>📲</div>
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>Tasdiqlash kodi</div>
            <div style={{fontSize:13,color:"#666",lineHeight:1.7}}>
              <strong>{cardInfo?.name}</strong> kartasiga ulangan<br/>
              <strong>+998 ** *** **67</strong> raqamiga yuborildi
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <input value={otp} onChange={e=>{setOtp(e.target.value.replace(/\D/g,"").slice(0,6));setError("");}}
              placeholder="• • • • • •" maxLength={6} autoFocus
              style={{width:"100%",border:`2px solid ${otp.length===6?ck:"#ddd"}`,borderRadius:12,padding:"16px",fontSize:32,fontFamily:"'Courier New',monospace",letterSpacing:16,textAlign:"center",fontWeight:900,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}}
            />
            <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"#888"}}>
              ⏱ {timer > 0 ? <span>Kod amal qilish vaqti: <strong style={{color:timer<20?ck:"inherit"}}>{timer}s</strong></span>
                           : <span style={{color:ck,cursor:"pointer",fontWeight:700}} onClick={()=>setTimer(90)}>Qayta yuborish</span>}
            </div>
          </div>

          {error && <div style={{background:"#ffebee",borderRadius:10,padding:"10px 14px",color:"#c62828",fontWeight:600,fontSize:13,marginBottom:14}}>{error}</div>}

          <button onClick={submitOtp} style={{width:"100%",background:otp.length===6?`linear-gradient(135deg,#007ab8,${ck})`:"#bbb",color:"#fff",border:"none",borderRadius:12,padding:"15px",fontWeight:800,fontSize:16,cursor:otp.length===6?"pointer":"not-allowed"}}>
            ✅ To'lovni tasdiqlash
          </button>
          <button onClick={()=>{setStage("card");setError("");}} style={{width:"100%",background:"none",border:"none",color:"#888",marginTop:8,padding:"8px",cursor:"pointer",fontSize:13,fontWeight:600}}>← Orqaga</button>
        </>)}

        {stage === "processing" && (
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{width:70,height:70,border:"4px solid #e3f2fd",borderTop:`4px solid ${ck}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>Amalga oshirilmoqda...</div>
            <div style={{fontSize:13,color:"#888"}}>Bank bilan bog'lanilmoqda</div>
          </div>
        )}

        {stage === "success" && (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:70,height:70,background:`linear-gradient(135deg,#007ab8,${ck})`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:`0 8px 30px rgba(0,149,211,.4)`}}>
              <svg width="36" height="36" viewBox="0 0 36 36"><path d="M6 18l8 8 16-16" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{fontWeight:800,fontSize:18,color:"#003d6b",marginBottom:6}}>Muvaffaqiyatli!</div>
            <div style={{fontSize:13,color:"#666"}}>Buyurtma tasdiqlanmoqda...</div>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid #eee",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#aaa"}}>
        <div>🔒 Click xavfsiz to'lov · SSL</div>
        <button onClick={onCancel} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:12}}>Bekor</button>
      </div>
    </div>
  );
}

// ─── PAYMENT MODAL (wrapper) ──────────────────────────────────────────────────
function PaymentModal({ total, onClose, showToast, cart, placeOrder, setCart, setPage }) {
  const [method, setMethod] = useState(null); // null = method select screen
  const [addr, setAddr] = useState("");
  const [addrDone, setAddrDone] = useState(false);
  const [step, setStep] = useState("method"); // method → checkout → done
  const [cashStep, setCashStep] = useState(1);

  const handleSuccess = async () => {
    if (placeOrder && cart) {
      const ok = await placeOrder(cart, addr);
      if (ok) setStep("done");
    } else {
      setStep("done");
    }
  };

  const handleClose = () => {
    if (step === "done" && setCart && setPage) { setCart([]); setPage("home"); }
    onClose();
  };

  const methods = [
    { id:"payme",    label:"Payme",    color:"#27ae60", desc:"Karta orqali to'lov",
      logo:<div style={{background:"#27ae60",borderRadius:10,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:20}}>P</div>},
    { id:"click",    label:"Click",    color:"#0095D3", desc:"Click karta bilan",
      logo:<div style={{background:"#0095D3",borderRadius:10,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:14,letterSpacing:-1}}>Click</div>},
    { id:"uzcard",   label:"UzCard",   color:"#2d6a4f", desc:"UzCard to'g'ridan-to'g'ri",
      logo:<div style={{background:"#1a4731",borderRadius:10,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center"}}><svg viewBox="0 0 40 18" width="40" height="18"><text x="0" y="14" fill="#fff" fontSize="9" fontWeight="900">UzCARD</text></svg></div>},
    { id:"humo",     label:"Humo",     color:"#7b2d8b", desc:"Humo karta bilan",
      logo:<div style={{background:"#7b2d8b",borderRadius:10,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center"}}><svg viewBox="0 0 32 20" width="32" height="20"><circle cx="10" cy="10" r="9" fill="#c77dff" opacity=".7"/><circle cx="18" cy="10" r="9" fill="#e0aaff" opacity=".7"/></svg></div>},
    { id:"cash",     label:"Naqd",     color:"#d4a017", desc:"Yetkazib berishda to'lov",
      logo:<div style={{background:"#f0c040",borderRadius:10,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>💵</div>},
    { id:"transfer", label:"O'tkazma", color:"#374151", desc:"Bank o'tkazmasi",
      logo:<div style={{background:"#374151",borderRadius:10,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🏦</div>},
  ];

  // Payme or Click — show full checkout UI
  if (step === "checkout" && (method === "payme" || method === "click" || method === "uzcard" || method === "humo")) {
    return (
      <div className="overlay" onClick={onClose}>
        <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:460,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 30px 80px rgba(0,0,0,.3)"}} onClick={e=>e.stopPropagation()}>
          {(method === "payme" || method === "uzcard") && (
            <PaymeCheckout total={total} onSuccess={handleSuccess} onCancel={()=>setStep("method")} />
          )}
          {(method === "click" || method === "humo") && (
            <ClickCheckout total={total} onSuccess={handleSuccess} onCancel={()=>setStep("method")} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>

        {/* DONE */}
        {step === "done" && (
          <>
            <div style={{textAlign:"center",padding:"40px 24px"}}>
              <div style={{width:90,height:90,background:"linear-gradient(135deg,var(--g3),var(--g4))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 12px 40px rgba(45,106,79,.4)"}}>
                <svg width="46" height="46" viewBox="0 0 46 46"><path d="M8 23l10 10 20-20" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 style={{color:"var(--g1)",marginBottom:8}}>To'lov muvaffaqiyatli!</h2>
              <p style={{color:"var(--s3)",fontSize:14,marginBottom:4}}>Buyurtmangiz qabul qilindi</p>
              <p style={{color:"var(--g3)",fontSize:13,fontWeight:600,marginBottom:24}}>Profildagi "Buyurtmalar" bo'limida kuzating</p>
              <div style={{background:"var(--s1)",borderRadius:12,padding:"14px 20px",marginBottom:20,textAlign:"left",fontSize:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:"var(--s3)"}}>Summa:</span><strong>{total.toLocaleString()} so'm</strong></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:"var(--s3)"}}>Usul:</span><strong>{methods.find(m=>m.id===method)?.label}</strong></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--s3)"}}>Manzil:</span><strong style={{maxWidth:200,textAlign:"right"}}>{addr}</strong></div>
              </div>
              <button className="btn btn-green" style={{width:"100%",justifyContent:"center",padding:"14px",fontSize:15}} onClick={handleClose}>✅ Bosh sahifaga qaytish</button>
            </div>
          </>
        )}

        {/* METHOD SELECT */}
        {step === "method" && (<>
          <div className="mhead" style={{background:"var(--g1)",borderRadius:"16px 16px 0 0"}}>
            <h3 style={{color:"#fff"}}>💳 To'lov usulini tanlang</h3>
            <button className="mclose" style={{color:"rgba(255,255,255,.7)"}} onClick={onClose}>✕</button>
          </div>
          <div className="mbody">
            {/* Summa */}
            <div style={{background:"linear-gradient(135deg,var(--g1),var(--g3))",borderRadius:14,padding:"14px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:11,color:"rgba(255,255,255,.6)",letterSpacing:1}}>TO'LOV SUMMASI</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#fff",fontWeight:700}}>{total.toLocaleString()} <span style={{fontSize:14,opacity:.6}}>so'm</span></div></div>
              <div style={{fontSize:32}}>🛒</div>
            </div>

            {/* Manzil */}
            <div className="fg" style={{marginBottom:20}}>
              <label className="fl">📍 Yetkazib berish manzili *</label>
              <input className="fi" value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Toshkent, Yunusobod 5-mavze, 12-uy..." />
            </div>

            {/* Methods */}
            <div style={{fontSize:12,fontWeight:700,color:"var(--s3)",letterSpacing:1,marginBottom:12}}>TO'LOV USULINI TANLANG</div>
            <div style={{display:"grid",gap:10}}>
              {methods.map(m=>(
                <div key={m.id} onClick={()=>{
                  if(!addr.trim()){showToast("Yetkazib berish manzilini kiriting!","err");return;}
                  setMethod(m.id);
                  if(m.id==="cash"||m.id==="transfer") setCashStep(1);
                  setStep(m.id==="cash"||m.id==="transfer"?"cash":"checkout");
                }}
                  style={{border:"2px solid #eee",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all .18s",background:"#fff"}}
                  onMouseOver={e=>{e.currentTarget.style.border=`2px solid ${m.color}`;e.currentTarget.style.background=m.color+"11";}}
                  onMouseOut={e=>{e.currentTarget.style.border="2px solid #eee";e.currentTarget.style.background="#fff";}}>
                  {m.logo}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15}}>{m.label}</div>
                    <div style={{fontSize:12,color:"#888"}}>{m.desc}</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 20 20"><path d="M7 4l6 6-6 6" stroke="#ccc" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* CASH / TRANSFER */}
        {step === "cash" && (<>
          <div className="mhead">
            <h3>{method==="cash"?"💵 Naqd to'lov":"🏦 Bank o'tkazmasi"}</h3>
            <button className="mclose" onClick={()=>setStep("method")}>✕</button>
          </div>
          <div className="mbody">
            {method==="cash" ? (
              <div>
                <div style={{textAlign:"center",fontSize:56,marginBottom:16}}>💵</div>
                <h4 style={{textAlign:"center",marginBottom:16}}>Yetkazib berishda to'laysiz</h4>
                <div style={{background:"var(--g5)",borderRadius:12,padding:18,lineHeight:2.2,fontSize:14}}>
                  ✅ Mahsulot qabul qilishda to'laysiz<br/>
                  🧾 Yetkazib beruvchi chek beradi<br/>
                  💰 To'lov summasi: <strong style={{color:"var(--g2)"}}>{total.toLocaleString()} so'm</strong><br/>
                  📍 Manzil: <strong>{addr}</strong>
                </div>
              </div>
            ) : (
              <div>
                <div style={{textAlign:"center",fontSize:56,marginBottom:16}}>🏦</div>
                <h4 style={{textAlign:"center",marginBottom:16}}>Bank rekvizitlari</h4>
                <div style={{background:"var(--s1)",borderRadius:12,padding:18,fontSize:13,fontFamily:"monospace",lineHeight:2.4}}>
                  <div>🏦 Bank: <strong>Xalq Banki</strong></div>
                  <div>📋 Hisob: <strong>2020 8000 0000 0001</strong></div>
                  <div>🏢 MFO: <strong>00873</strong></div>
                  <div>🆔 STIR: <strong>307 428 912</strong></div>
                  <div>👤 Qabul: <strong>Salom AgroBozor MChJ</strong></div>
                  <div>💰 Summa: <strong style={{color:"var(--g2)"}}>{total.toLocaleString()} so'm</strong></div>
                </div>
              </div>
            )}
          </div>
          <div className="mfoot">
            <button className="btn btn-green" style={{flex:1,justifyContent:"center"}} onClick={handleSuccess}>✅ Tasdiqlash</button>
            <button className="btn btn-ghost" onClick={()=>setStep("method")}>← Orqaga</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
function CartPage({ cart, setCart, user, openAuth, showToast, setPage, placeOrder }) {
  const [payModal, setPayModal] = useState(false);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const upd = (id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const rem = (id) => setCart(p => p.filter(i => i.id !== id));

  return (
    <div className="container">
      <div className="section">
        <div className="sh"><h2>🛍️ Savat</h2><p>{cart.length} ta mahsulot</p></div>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 72 }}>🛒</div>
            <h3 style={{ marginTop: 20, color: "var(--g1)" }}>Savat bo'sh</h3>
            <p style={{ color: "var(--s3)", marginTop: 8 }}>Mahsulot qo'shing va xarid qiling</p>
            <button className="btn btn-green" style={{ marginTop: 20 }} onClick={() => setPage("catalog")}>Katalogga o'tish →</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
            <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 28, boxShadow: "var(--sh)" }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: "1px solid var(--s1)", alignItems: "center" }}>
                  <div style={{ width:56, height:56, borderRadius:10, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--s1)" }}>
                    {item.image && (item.image.startsWith("http") || item.image.startsWith("data:"))
                      ? <img src={item.image} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <span style={{ fontSize:36 }}>{item.emoji || item.image}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: "var(--s3)" }}>📍 {item.region} · 👤 {item.seller}</div>
                    <div style={{ fontWeight: 700, color: "var(--g3)", fontSize: 15 }}>{item.price.toLocaleString()} so'm/{item.unit}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => upd(item.id, -1)}>−</button>
                      <strong style={{ minWidth: 24, textAlign: "center" }}>{item.qty}</strong>
                      <button className="btn btn-ghost btn-xs" onClick={() => upd(item.id, 1)}>+</button>
                    </div>
                    <strong style={{ color: "var(--g3)" }}>{(item.price * item.qty).toLocaleString()}</strong>
                    <button style={{ background: "none", border: "none", color: "var(--r1)", cursor: "pointer", fontSize: 12 }} onClick={() => rem(item.id)}>🗑️ O'chirish</button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)", position: "sticky", top: 80 }}>
                <h3 style={{ marginBottom: 18, color: "var(--g1)" }}>📋 Buyurtma xulosasi</h3>
                {cart.map(i => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                    <span>{i.image} {i.name} ×{i.qty}</span>
                    <strong>{(i.price * i.qty).toLocaleString()}</strong>
                  </div>
                ))}
                <div style={{ borderTop: "2px solid var(--s1)", marginTop: 14, paddingTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--s3)", marginBottom: 8 }}><span>Yetkazib berish:</span><span>Bepul</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--g1)" }}><span>Jami:</span><span>{total.toLocaleString()}</span></div>
                </div>
                {user ? (
                  <button className="btn btn-amber" style={{ width: "100%", marginTop: 18, justifyContent: "center" }} onClick={() => setPayModal(true)}>💰 To'lov qilish</button>
                ) : (
                  <button className="btn btn-green" style={{ width: "100%", marginTop: 18, justifyContent: "center" }} onClick={openAuth}>🔑 Kirish kerak</button>
                )}
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10, justifyContent: "center" }} onClick={() => setCart([])}>🗑️ Savatni tozalash</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {payModal && <PaymentModal total={total} onClose={() => setPayModal(false)} showToast={showToast} cart={cart} placeOrder={placeOrder} setCart={setCart} setPage={setPage} />}
    </div>
  );
}

// ─── CONTRACT PAGE ────────────────────────────────────────────────────────────
function ContractPage({ db, user, openAuth, showToast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: 1, quantity: "", pricePerUnit: "", startDate: "", endDate: "", terms: "" });
  const [contracts, setContracts] = useState(db.contracts);

  const submit = async () => {
    if (!user) { openAuth(); return; }
    if (!form.productId || !form.quantity || !form.pricePerUnit) { showToast("Barcha maydonlarni to'ldiring!", "err"); return; }
    if (createContract) {
      await createContract({ ...form, productId: Number(form.productId), quantity: Number(form.quantity), pricePerUnit: Number(form.pricePerUnit) });
    } else {
      const c = { id: contracts.length + 1, buyerId: user.id, sellerId: 2, ...form, productId: Number(form.productId), quantity: Number(form.quantity), pricePerUnit: Number(form.pricePerUnit), totalPrice: Number(form.quantity) * Number(form.pricePerUnit), status: "pending", createdAt: new Date().toISOString().split("T")[0] };
      setContracts(p => [...p, c]);
      showToast("Shartnoma so'rovi yuborildi! 🤝");
    }
    setModal(false);
  };

  return (
    <div className="container">
      <div className="section">
        <div className="sh-row">
          <div className="sh"><h2>🤝 Shartnoma tuzish</h2><p>Fermerlar bilan uzoq muddatli hamkorlik shartnomalari</p></div>
          <button className="btn btn-amber" onClick={() => user ? setModal(true) : openAuth()}>+ Yangi shartnoma</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 40 }}>
          {[["🤝", "Ishonchlilik", "Huquqiy kuch kasb etuvchi shartnomalar"], ["⏱️", "Tez tuzish", "10 daqiqa ichida shartnoma rasmiylashtiriladi"], ["🔒", "Xavfsizlik", "Ikki tomonning huquqlari to'liq himoyalangan"]].map(([icon, title, desc]) => (
            <div key={title} style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
              <h4 style={{ marginBottom: 8, color: "var(--g1)" }}>{title}</h4>
              <p style={{ fontSize: 14, color: "var(--s3)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ marginBottom: 20, color: "var(--g1)" }}>Faol shartnomalar</h3>
        {contracts.map(c => {
          const prod = db.products.find(p => p.id === c.productId);
          return (
            <div key={c.id} className="contract-card">
              <div className="contract-head">
                <div><h4 style={{ color: "var(--g1)", fontSize: 18 }}>{prod?.image} {prod?.name} — Shartnoma #{c.id}</h4><div style={{ fontSize: 13, color: "var(--s3)", marginTop: 4 }}>{c.startDate} dan {c.endDate} gacha</div></div>
                <span className={`stt stt-${c.status}`}>{c.status === "active" ? "✅ Faol" : "⏳ Kutilmoqda"}</span>
              </div>
              <div className="contract-body">
                <div className="cinfo"><div className="cinfo-label">Miqdor</div><div className="cinfo-val">{c.quantity.toLocaleString()} kg</div></div>
                <div className="cinfo"><div className="cinfo-label">Birlik narxi</div><div className="cinfo-val">{c.pricePerUnit?.toLocaleString()} so'm</div></div>
                <div className="cinfo"><div className="cinfo-label">Jami summa</div><div className="cinfo-val" style={{ color: "var(--g3)" }}>{c.totalPrice?.toLocaleString()} so'm</div></div>
              </div>
              {c.terms && <p style={{ fontSize: 13, color: "var(--s3)", marginTop: 14, padding: "12px 0 0", borderTop: "1px solid var(--s1)" }}>📝 {c.terms}</p>}
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mhead"><h3>🤝 Yangi shartnoma</h3><button className="mclose" onClick={() => setModal(false)}>✕</button></div>
            <div className="mbody">
              <div className="fg"><label className="fl">Mahsulot</label><select className="fs" value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}>{db.products.map(p => <option key={p.id} value={p.id}>{p.image} {p.name}</option>)}</select></div>
              <div className="frow">
                <div className="fg"><label className="fl">Miqdor (kg)</label><input className="fi" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                <div className="fg"><label className="fl">Narx (so'm/kg)</label><input className="fi" type="number" value={form.pricePerUnit} onChange={e => setForm(p => ({ ...p, pricePerUnit: e.target.value }))} /></div>
              </div>
              <div className="frow">
                <div className="fg"><label className="fl">Boshlanish</label><input className="fi" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                <div className="fg"><label className="fl">Tugash</label><input className="fi" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
              </div>
              <div className="fg"><label className="fl">Shartlar</label><textarea className="fta" value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))} placeholder="Yetkazib berish shartlari, miqdor..." /></div>
              {form.quantity && form.pricePerUnit && (
                <div style={{ background: "var(--g5)", borderRadius: 10, padding: 14, fontSize: 15 }}>
                  💰 Jami summa: <strong style={{ color: "var(--g2)" }}>{(Number(form.quantity) * Number(form.pricePerUnit)).toLocaleString()} so'm</strong>
                </div>
              )}
            </div>
            <div className="mfoot"><button className="btn btn-green" onClick={submit}>✅ Yuborish</button><button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
function ContactPage({ showToast }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!form.name || !form.message) { showToast("Ism va xabarni kiriting!", "err"); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    showToast("Xabaringiz yuborildi! 24 soat ichida javob beramiz 📩");
    setForm({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => setSent(false), 5000);
  };

  const contacts = [
    {
      href: "https://t.me/agrobozor_uz",
      icon: "✈️",
      cls: "tg",
      title: "Telegram",
      sub: "@agrobozor_uz",
      desc: "Tezkor javob — 24/7",
      color: "#2CA5E0"
    },
    {
      href: "https://instagram.com/salomaqrobozor",
      icon: "📸",
      cls: "ig",
      title: "Instagram",
      sub: "@salomaqrobozor",
      desc: "Yangiliklar va fotolavhalar",
      color: "#E1306C"
    },
    {
      href: "https://wa.me/998900000000",
      icon: "💬",
      cls: "wa",
      title: "WhatsApp",
      sub: "+998 90 000 00 00",
      desc: "Muloqot va buyurtma",
      color: "#25D366"
    },
    {
      href: "tel:+998712000000",
      icon: "📞",
      cls: "ph",
      title: "Telefon",
      sub: "+998 71 200 00 00",
      desc: "Du-Ju: 9:00 - 18:00",
      color: "#2d6a4f"
    },
  ];

  return (
    <div className="container">
      <div className="section">
        <div className="sh"><h2>📞 Biz bilan bog'laning</h2><p>Savol va takliflaringiz uchun murojaat qiling</p></div>
        <div className="contact-grid">
          <div>
            <h3 style={{ marginBottom: 20, color: "var(--g1)" }}>Ijtimoiy tarmoqlar va aloqa</h3>
            <div className="social-links">
              {contacts.map(c => (
                <a key={c.title} href={c.href} target={c.href.startsWith("tel:") ? "_self" : "_blank"} rel="noreferrer"
                  className={`slink ${c.cls}`}
                  onClick={() => showToast(`${c.title} ga o'tilmoqda... 🔗`)}
                  style={{ textDecoration:"none" }}>
                  <div className="slink-icon" style={{ background: c.color+"22", border:`2px solid ${c.color}44` }}>{c.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{c.title}</div>
                    <div style={{ fontSize:13, opacity:.85, fontWeight:600 }}>{c.sub}</div>
                    <div style={{ fontSize:11, opacity:.6, marginTop:2 }}>{c.desc}</div>
                  </div>
                  <div style={{ fontSize:20, opacity:.4 }}>→</div>
                </a>
              ))}
            </div>

            <div style={{ marginTop: 28, background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)" }}>
              <h4 style={{ marginBottom: 16, color: "var(--g1)" }}>📍 Manzil</h4>
              <p style={{ fontSize: 14, color: "var(--s3)", lineHeight: 1.8 }}>
                O'zbekiston, Toshkent shahri,<br />
                Amir Temur ko'chasi, 108A<br />
                📮 Pochta: 100084<br />
                ⏰ Ish vaqti: Du-Ju, 9:00 - 18:00
              </p>
              <a href="https://maps.google.com/?q=Amir+Temur+108A+Tashkent" target="_blank" rel="noreferrer"
                style={{ display:"inline-block", marginTop:12, padding:"8px 16px", background:"var(--g5)", color:"var(--g2)", borderRadius:8, fontWeight:600, fontSize:13, textDecoration:"none" }}>
                🗺️ Xaritada ko'rish
              </a>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 32, boxShadow: "var(--sh)" }}>
            <h3 style={{ marginBottom: 24, color: "var(--g1)" }}>✉️ Xabar yuborish</h3>
            <div className="fg"><label className="fl">Ismingiz *</label><input className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="To'liq ismingiz" /></div>
            <div className="fg"><label className="fl">Telefon</label><input className="fi" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998 90 000 00 00" /></div>
            <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" /></div>
            <div className="fg"><label className="fl">Xabar *</label><textarea className="fta" style={{ minHeight: 120 }} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Savolingiz yoki taklifingizni yozing..." /></div>
            {sent && <div style={{ background:"#d4edda", border:"1px solid #c3e6cb", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#155724", fontWeight:600 }}>✅ Xabaringiz muvaffaqiyatli yuborildi!</div>}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <button className="btn btn-green" style={{ flex:1, justifyContent: "center" }} onClick={submit} disabled={sending}>{sending ? "⏳ Yuborilmoqda..." : "📤 Yuborish"}</button>
              <a href="https://t.me/agrobozor_uz" target="_blank" rel="noreferrer" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"#2CA5E0", color:"#fff", borderRadius:10, fontWeight:700, fontSize:14, textDecoration:"none", padding:"10px 16px" }}>
                ✈️ Telegram orqali
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ user, db, setDb, openAddProd, showToast, apiOnline, setUser, updateProfile, setSelProd }) {
  const [tab, setTab] = useState("info");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: user.name, phone: user.phone || "", bio: user.bio || "", region: user.region || "" });
  const [confirmDel, setConfirmDel] = useState(null); // product to delete

  const myProds = db.products.filter(p => p.sellerId === user.id);
  const myOrders = db.orders.filter(o => o.buyerId === user.id);
  const myContracts = db.contracts.filter(c => c.buyerId === user.id);

  const saveProfile = () => {
    const updated = { ...user, ...editData };
    if (updateProfile) updateProfile(updated);
    else setUser(updated);
    setEditMode(false);
  };

  const deleteProd = (prod) => setConfirmDel(prod);
  const confirmDelete = async () => {
    if (!confirmDel) return;
    try {
      await deleteDoc(doc(firestoreDb, "products", String(confirmDel.id)));
      showToast(`"${confirmDel.name}" o'chirildi! 🗑️`);
    } catch(e) {
      showToast("Xatolik", "err");
    }
    setConfirmDel(null);
  };

  return (
    <>
      <div className="prof-head">
        <div className="prof-av">{user.avatar}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 30, marginBottom: 6 }}>{user.name}</h2>
          <p style={{ opacity: .75 }}>{user.email} · 📍 {user.region} · 📱 {user.phone}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <span className={`role-badge rb-${user.role}`}>{user.role === "farmer" ? "🌾 Fermer" : user.role === "admin" ? "👑 Admin" : "🛒 Xaridor"}</span>
            <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Tasdiqlangan</span>
          </div>
        </div>
        <button className="btn btn-amber" onClick={openAddProd}>➕ Mahsulot qo'shish</button>
      </div>

      <div className="container">
        <div style={{ paddingTop: 32 }}>
          <div className="prof-tabs">
            {[["info", "👤 Ma'lumotlar"], ["products", `🌾 Mahsulotlarim (${myProds.length})`], ["orders", `📦 Buyurtmalar (${myOrders.length})`], ["stats", "📊 Statistika"]].map(([v, l]) => (
              <button key={v} className={`ptab ${tab === v ? "act" : ""}`} onClick={() => setTab(v)}>{l}</button>
            ))}
          </div>

          {tab === "info" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 28, boxShadow: "var(--sh)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <h3 style={{ color: "var(--g1)" }}>Shaxsiy ma'lumotlar</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(p => !p)}>{editMode ? "❌ Bekor" : "✏️ Tahrirlash"}</button>
                </div>
                {editMode ? (
                  <div>
                    <div className="fg"><label className="fl">👤 Ism</label><input className="fi" value={editData.name} onChange={e=>setEditData(p=>({...p,name:e.target.value}))} /></div>
                    <div className="fg"><label className="fl">📱 Telefon</label><input className="fi" value={editData.phone} onChange={e=>setEditData(p=>({...p,phone:e.target.value}))} placeholder="+998901234567" /></div>
                    <div className="fg"><label className="fl">📍 Viloyat</label>
                      <select className="fi" value={editData.region} onChange={e=>setEditData(p=>({...p,region:e.target.value}))}>
                        {["Toshkent","Samarqand","Farg'ona","Andijon","Namangan","Buxoro","Xorazm","Qashqadaryo","Surxondaryo","Jizzax","Sirdaryo","Navoiy","Qoraqalpog'iston"].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="fg"><label className="fl">📝 Bio</label><textarea className="fta" value={editData.bio} onChange={e=>setEditData(p=>({...p,bio:e.target.value}))} placeholder="O'zingiz haqida..." /></div>
                    <button className="btn btn-green" onClick={saveProfile} style={{width:"100%",justifyContent:"center"}}>💾 Saqlash</button>
                  </div>
                ) : (
                  <>
                    {[["👤 Ism", user.name], ["📧 Email", user.email], ["📱 Telefon", user.phone || "Kiritilmagan"], ["📍 Viloyat", user.region], ["🎭 Rol", user.role], ["📅 Ro'yxat", user.createdAt], ["📝 Bio", user.bio || "—"]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--s1)", fontSize: 14 }}>
                        <span style={{ color: "var(--s3)" }}>{l}</span><strong style={{maxWidth:"55%",textAlign:"right"}}>{v}</strong>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div style={{ background: "var(--g5)", borderRadius: "var(--rad)", padding: 28 }}>
                <h3 style={{ marginBottom: 20, color: "var(--g1)" }}>Qisqa statistika</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[["🌾", myProds.length, "Mahsulot"], ["📦", myOrders.length, "Buyurtma"], ["⭐", myProds.length ? (myProds.reduce((s,p)=>s+p.rating,0)/myProds.length).toFixed(1) : "—", "Reyting"], ["💬", myProds.reduce((s,p)=>s+p.reviews,0), "Sharh"]].map(([i, v, l]) => (
                    <div key={l} style={{ background: "#fff", borderRadius: 12, padding: 18, textAlign: "center" }}>
                      <div style={{ fontSize: 28 }}>{i}</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "var(--g3)" }}>{v}</div>
                      <div style={{ fontSize: 12, color: "var(--s3)" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "products" && (
            myProds.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 56 }}>🌱</div>
                <h3 style={{ marginTop: 16 }}>Mahsulot yo'q</h3>
                <button className="btn btn-green" style={{ marginTop: 20 }} onClick={openAddProd}>➕ Birinchi mahsulot</button>
              </div>
            ) : (
              <>
              <table className="tbl">
                <thead><tr><th>Rasm</th><th>Mahsulot nomi</th><th>Narx</th><th>Zaxira</th><th>Viloyat</th><th>Reyting</th><th>Holat</th><th></th></tr></thead>
                <tbody>{myProds.map(p => (
                  <tr key={p.id} style={{cursor:"pointer"}} onClick={() => setSelProd && setSelProd(p)}>
                    <td>
                      <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",background:"var(--s1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {p.image && (p.image.startsWith("http")||p.image.startsWith("data:"))
                          ? <img src={p.image} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}} />
                          : <span style={{fontSize:26}}>{p.image||p.emoji||"🌿"}</span>}
                      </div>
                    </td>
                    <td><strong>{p.name}</strong><div style={{fontSize:11,color:"var(--s3)",marginTop:2}}>{p.desc?.slice(0,40)}...</div></td>
                    <td>{p.price.toLocaleString()} so'm/{p.unit}</td>
                    <td>{p.stock} {p.unit}</td>
                    <td>📍 {p.region}</td>
                    <td>⭐ {p.rating || 0}</td>
                    <td><span style={{background:"#d4edda",color:"#155724",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>✅ Faol</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteProd(p)}
                        style={{background:"#ffebee",color:"#c62828",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:700,whiteSpace:"nowrap"}}>🗑️ O'chirish</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>

              {confirmDel && (
                <div className="overlay" onClick={() => setConfirmDel(null)}>
                  <div style={{background:"#fff",borderRadius:20,padding:32,maxWidth:400,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,.25)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:52,marginBottom:12}}>🗑️</div>
                    <h3 style={{marginBottom:8,color:"var(--g1)"}}>O'chirishni tasdiqlang</h3>
                    <p style={{color:"var(--s3)",fontSize:14,marginBottom:8}}>Quyidagi mahsulot o'chiriladi:</p>
                    <div style={{background:"var(--s1)",borderRadius:12,padding:"12px 16px",marginBottom:24,fontWeight:700,fontSize:15}}>
                      {confirmDel.name}
                    </div>
                    <div style={{display:"flex",gap:12}}>
                      <button onClick={() => setConfirmDel(null)} style={{flex:1,padding:"12px",background:"var(--s1)",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer"}}>Bekor</button>
                      <button onClick={confirmDelete} style={{flex:1,padding:"12px",background:"#ef4444",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer"}}>Ha, o'chirish</button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )
          )}

          {tab === "orders" && (
            myOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}><div style={{ fontSize: 56 }}>📦</div><h3 style={{ marginTop: 16 }}>Buyurtma yo'q</h3><p style={{color:"var(--s3)",marginTop:8}}>Mahsulot sotib oling va buyurtmalar bu yerda ko'rinadi</p></div>
            ) : (
              <table className="tbl">
                <thead><tr><th>#</th><th>Mahsulot</th><th>Miqdor</th><th>Summa</th><th>Manzil</th><th>Sana</th><th>Holat</th></tr></thead>
                <tbody>{myOrders.map(o => {
                  const prod = db.products.find(p => p.id === o.productId);
                  const statusColors = { pending:"#f59e0b", shipping:"#3b82f6", delivered:"#10b981", cancelled:"#ef4444" };
                  const statusLabels = { pending:"⏳ Kutilmoqda", shipping:"🚚 Yo'lda", delivered:"✅ Yetkazildi", cancelled:"❌ Bekor" };
                  return (
                    <tr key={o.id}>
                      <td><strong>#{typeof o.id === 'number' ? o.id : String(o.id).slice(-4)}</strong></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {o.productImage && o.productImage.startsWith("http") ? <img src={o.productImage} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}} onError={e=>e.target.style.display="none"} /> : <span style={{fontSize:24}}>{o.productEmoji || prod?.emoji}</span>}
                          <span>{o.productName || prod?.name}</span>
                        </div>
                      </td>
                      <td>{o.quantity} kg</td>
                      <td><strong>{o.totalPrice?.toLocaleString()} so'm</strong></td>
                      <td style={{fontSize:12,maxWidth:120}}>{o.address || "—"}</td>
                      <td>{o.createdAt}</td>
                      <td><span style={{background:statusColors[o.status]+"22",color:statusColors[o.status],padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{statusLabels[o.status] || o.status}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )
          )}

          {tab === "stats" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 28, boxShadow: "var(--sh)" }}>
                <h3 style={{ marginBottom: 20, color: "var(--g1)" }}>Oylik savdo</h3>
                {["Apr", "May", "Iyn", "Iyl"].map((m, i) => {
                  const vals = [320000, 450000, 680000, 820000];
                  return (
                    <div key={m} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span>{m}</span><strong style={{ color: "var(--g3)" }}>{vals[i].toLocaleString()} so'm</strong>
                      </div>
                      <div style={{ background: "var(--s1)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                        <div style={{ width: `${vals[i] / 820000 * 100}%`, background: "linear-gradient(to right,var(--g3),var(--g4))", height: "100%", borderRadius: 6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 28, boxShadow: "var(--sh)" }}>
                <h3 style={{ marginBottom: 20, color: "var(--g1)" }}>Mahsulot reytingi</h3>
                {myProds.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 28 }}>{p.image}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ background: "var(--s1)", borderRadius: 6, height: 8, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ width: `${p.rating / 5 * 100}%`, background: "linear-gradient(to right,var(--a1),var(--a2))", height: "100%", borderRadius: 6 }} />
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--a1)", fontSize: 14 }}>⭐ {p.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ db, setDb, showToast, apiOnline }) {
  const [sec, setSec] = useState("dash");
  const [realStats, setRealStats] = useState(null);

  useEffect(() => {
    if (apiOnline) {
      req('/stats').then(s => setRealStats(s)).catch(() => {});
    }
  }, [apiOnline]);
  const totalRev = db.orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalPrice, 0);

  const delUser = async (id) => { await deleteDoc(doc(firestoreDb, "users", String(id))); showToast("O'chirildi"); };
  const delProd = async (id) => { await deleteDoc(doc(firestoreDb, "products", String(id))); showToast("O'chirildi"); };
  const togProd = async (id) => { 
    const pr=db.products.find(p=>p.id===id); 
    if(pr) await updateDoc(doc(firestoreDb, "products", String(id)), { status: pr.status === "active" ? "inactive" : "active" }); 
  };
  const delOrder = async (id) => { await deleteDoc(doc(firestoreDb, "orders", String(id))); showToast("O'chirildi! 🗑️"); };

  const navItems = [
    ["dash", "📊", "Dashboard"], ["users", "👥", "Foydalanuvchilar"], ["products", "🌾", "Mahsulotlar"],
    ["orders", "📦", "Buyurtmalar"], ["contracts", "🤝", "Shartnomalar"], ["categories", "🏷️", "Kategoriyalar"],
    ["stats", "📈", "Hisobotlar"], ["settings", "⚙️", "Sozlamalar"]
  ];

  return (
    <div className="admin-layout">
      <div className="aside">
        <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 800, letterSpacing: ".1em", padding: "0 8px", marginBottom: 12 }}>ADMIN PANEL</div>
        {navItems.map(([v, icon, label]) => (
          <button key={v} className={`alink ${sec === v ? "act" : ""}`} onClick={() => setSec(v)}>{icon} {label}</button>
        ))}
      </div>

      <div className="amain">
        {sec === "dash" && (
          <>
            <div className="ahead"><h2>📊 Dashboard</h2><p>Tizim holati va ko'rsatkichlar</p></div>
            <div className="stat-grid">
              {[
                ["Foydalanuvchilar", realStats?.totalUsers ?? db.users.length, "var(--g3)", "Jami"],
                ["Faol mahsulotlar", realStats?.totalProducts ?? db.products.filter(p => p.status === "active").length, "var(--a1)", "Aktiv"],
                ["Buyurtmalar", realStats?.totalOrders ?? db.orders.length, "var(--r1)", "Jami"],
                ["Daromad", `${((realStats?.totalRevenue ?? totalRev) / 1000000).toFixed(1)}M so'm`, "var(--g1)", "Yetkazilgan"],
              ].map(([l, v, c, ch]) => (
                <div key={l} className="stat-card" style={{ borderColor: c }}>
                  <div className="sc-label">{l}</div>
                  <div className="sc-val" style={{ color: c }}>{v}</div>
                  <div className="sc-ch">{ch}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)" }}>
                <h4 style={{ marginBottom: 16, color: "var(--g1)" }}>So'nggi foydalanuvchilar</h4>
                {db.users.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--s1)" }}>
                    <div className="av" style={{ width: 34, height: 34, fontSize: 13 }}>{u.avatar}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div><div style={{ fontSize: 12, color: "var(--s3)" }}>{u.region} · {u.createdAt}</div></div>
                    <span className={`stt stt-${u.role}`}>{u.role}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)" }}>
                <h4 style={{ marginBottom: 16, color: "var(--g1)" }}>Kategoriyalar taqsimoti</h4>
                {db.categories.map(c => (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span>{c.icon} {c.name}</span><strong>{c.count}</strong>
                    </div>
                    <div style={{ background: "var(--s1)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${c.count / 234 * 100}%`, background: c.color, height: "100%", borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {sec === "users" && (
          <>
            <div className="ahead"><h2>👥 Foydalanuvchilar</h2><p>Jami {db.users.length} ta ro'yxatdan o'tgan</p></div>
            <table className="tbl">
              <thead><tr><th>ID</th><th>Ism</th><th>Email</th><th>Telefon</th><th>Viloyat</th><th>Rol</th><th>Sana</th><th>Amal</th></tr></thead>
              <tbody>{db.users.map(u => (
                <tr key={u.id}>
                  <td style={{ color: "var(--s3)" }}>#{u.id}</td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="av" style={{ width: 30, height: 30, fontSize: 12 }}>{u.avatar}</div><strong>{u.name}</strong></div></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>📍 {u.region}</td>
                  <td><span className={`stt stt-${u.role}`}>{u.role}</span></td>
                  <td style={{ fontSize: 13, color: "var(--s3)" }}>{u.createdAt}</td>
                  <td><button className="btn btn-danger btn-xs" onClick={() => delUser(u.id)} disabled={u.role === "admin"}>🗑️</button></td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {sec === "products" && (
          <>
            <div className="ahead"><h2>🌾 Mahsulotlar</h2><p>Jami {db.products.length} ta mahsulot</p></div>
            <table className="tbl">
              <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Zaxira</th><th>Reyting</th><th>Holat</th><th>Amal</th></tr></thead>
              <tbody>{db.products.map(p => {
                const cat = db.categories.find(c => c.id === p.categoryId);
                return (
                  <tr key={p.id}>
                    <td><span style={{ fontSize: 20, marginRight: 6 }}>{p.image}</span><strong>{p.name}</strong><div style={{ fontSize: 11, color: "var(--s3)" }}>📍 {p.region}</div></td>
                    <td>{cat?.icon} {cat?.name}</td>
                    <td style={{ fontWeight: 700, color: "var(--g3)" }}>{p.price.toLocaleString()}</td>
                    <td>{p.stock} {p.unit}</td>
                    <td>⭐ {p.rating} ({p.reviews})</td>
                    <td><button onClick={() => togProd(p.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><span className={`stt stt-${p.status}`}>{p.status}</span></button></td>
                    <td><button className="btn btn-danger btn-xs" onClick={() => delProd(p.id)}>🗑️</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </>
        )}

        {sec === "orders" && (
          <>
            <div className="ahead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2>📦 Buyurtmalar</h2><p>Jami {db.orders.length} ta buyurtma</p></div>
              <button className="btn btn-danger" onClick={() => { if (window.confirm("Barcha xotiradagi (shu jumladan qoldiqli/uzun ID dagi) buyurtmalarni o'chirib yuborishni xohlaysizmi?")) { db.orders.forEach(o => deleteDoc(doc(firestoreDb, "orders", String(o.id)))); showToast("Barcha buyurtmalar xotiradan tozalandi 🗑️"); } }}>🗑️ Barchasini tozalash</button>
            </div>
            <table className="tbl">
              <thead><tr><th>#</th><th>Mahsulot</th><th>Xaridor</th><th>Miqdor</th><th>Summa</th><th>Manzil</th><th>Sana</th><th>Holat</th><th>Amal</th></tr></thead>
              <tbody>{db.orders.map(o => {
                const prod = db.products.find(p => p.id === o.productId);
                const buyer = db.users.find(u => u.id === o.buyerId);
                return (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{prod?.image && prod.image.length < 5 ? prod.image : "📦"} {prod?.name}</td>
                    <td>{buyer?.name}</td>
                    <td>{o.quantity} kg</td>
                    <td style={{ fontWeight: 700, color: "var(--g3)" }}>{o.totalPrice.toLocaleString()}</td>
                    <td style={{ fontSize: 12 }}>{o.address}</td>
                    <td style={{ fontSize: 13, color: "var(--s3)" }}>{o.createdAt}</td>
                    <td><span className={`stt stt-${o.status}`}>{o.status}</span></td>
                    <td><button className="btn btn-danger btn-xs" onClick={() => delOrder(o.id)}>🗑️</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </>
        )}

        {sec === "contracts" && (
          <>
            <div className="ahead"><h2>🤝 Shartnomalar</h2><p>Jami {db.contracts.length} ta shartnoma</p></div>
            {db.contracts.map(c => {
              const prod = db.products.find(p => p.id === c.productId);
              return (
                <div key={c.id} className="contract-card">
                  <div className="contract-head">
                    <div><h4 style={{ color: "var(--g1)" }}>{prod?.image} {prod?.name} — #{c.id}</h4><div style={{ fontSize: 13, color: "var(--s3)", marginTop: 4 }}>{c.startDate} → {c.endDate}</div></div>
                    <span className={`stt stt-${c.status}`}>{c.status}</span>
                  </div>
                  <div className="contract-body">
                    <div className="cinfo"><div className="cinfo-label">Miqdor</div><div className="cinfo-val">{c.quantity.toLocaleString()} kg</div></div>
                    <div className="cinfo"><div className="cinfo-label">Birlik narxi</div><div className="cinfo-val">{c.pricePerUnit?.toLocaleString()} so'm</div></div>
                    <div className="cinfo"><div className="cinfo-label">Jami</div><div className="cinfo-val" style={{ color: "var(--g3)" }}>{c.totalPrice?.toLocaleString()} so'm</div></div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {sec === "categories" && (
          <>
            <div className="ahead"><h2>🏷️ Kategoriyalar</h2><p>{db.categories.length} ta kategoriya</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {db.categories.map(c => (
                <div key={c.id} style={{ background: "#fff", borderRadius: "var(--rad)", padding: 22, textAlign: "center", boxShadow: "var(--sh)", borderTop: `4px solid ${c.color}` }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div style={{ background: "var(--g5)", color: "var(--g3)", borderRadius: 20, padding: "4px 12px", display: "inline-block", fontSize: 12, fontWeight: 700, marginTop: 10 }}>{c.count} ta</div>
                </div>
              ))}
            </div>
          </>
        )}

        {sec === "stats" && (
          <>
            <div className="ahead"><h2>📈 Hisobotlar</h2><p>Tizim analitikasi va statistikasi</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 28, boxShadow: "var(--sh)" }}>
                <h4 style={{ marginBottom: 20, color: "var(--g1)" }}>Oylik daromad (mln so'm)</h4>
                {["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul"].map((m, i) => {
                  const vals = [4.2, 5.1, 6.8, 8.3, 9.7, 11.2, 13.5];
                  return (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ width: 55, fontSize: 13, color: "var(--s3)" }}>{m}</span>
                      <div style={{ flex: 1, background: "var(--s1)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                        <div style={{ width: `${vals[i] / 13.5 * 100}%`, background: `linear-gradient(to right,var(--a1),var(--a2))`, height: "100%", borderRadius: 6 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--a1)", width: 50 }}>{vals[i]}M</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "#fff", borderRadius: "var(--rad)", padding: 28, boxShadow: "var(--sh)" }}>
                <h4 style={{ marginBottom: 20, color: "var(--g1)" }}>Viloyatlar bo'yicha foydalanuvchilar</h4>
                {[["Toshkent", 28], ["Samarqand", 19], ["Farg'ona", 15], ["Andijon", 12], ["Namangan", 10], ["Buxoro", 8]].map(([r, cnt]) => (
                  <div key={r} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span>📍 {r}</span><strong>{cnt} ta</strong>
                    </div>
                    <div style={{ background: "var(--s1)", borderRadius: 6, height: 9, overflow: "hidden" }}>
                      <div style={{ width: `${cnt / 28 * 100}%`, background: "linear-gradient(to right,var(--g3),var(--g4))", height: "100%", borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {sec === "settings" && (
          <>
            <div className="ahead"><h2>⚙️ Sozlamalar</h2><p>Tizim konfiguratsiyasi</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { title: "📧 Email (SMTP)", fields: ["SMTP Server", "Port", "Email", "Parol"] },
                { title: "💰 To'lov tizimi", fields: ["Click API", "Payme API", "Merchant ID", "Secret key"] },
                { title: "📱 SMS xabarlar", fields: ["Provider", "API Token", "Sender", "Test raqam"] },
                { title: "🔐 Xavfsizlik", fields: ["JWT Secret", "Session muddat", "2FA", "IP whitelist"] },
              ].map(s => (
                <div key={s.title} style={{ background: "#fff", borderRadius: "var(--rad)", padding: 24, boxShadow: "var(--sh)" }}>
                  <h4 style={{ marginBottom: 16, fontSize: 16, color: "var(--g1)" }}>{s.title}</h4>
                  {s.fields.map(f => (
                    <div key={f} style={{ marginBottom: 12 }}>
                      <label className="fl" style={{ fontSize: 12 }}>{f}</label>
                      <input className="fi" style={{ padding: "8px 12px", fontSize: 13 }} placeholder={`${f}...`} />
                    </div>
                  ))}
                  <button className="btn btn-green btn-sm" onClick={() => showToast("Saqlandi! ✅")}>Saqlash</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div className="brand-logo">🌿</div>
              <span className="brand-name">Salom <span>Agro</span>Bozor</span>
            </div>
            <p style={{ lineHeight: 1.8, marginBottom: 20 }}>O'zbekiston fermerlarini xaridorlar bilan to'g'ridan-to'g'ri bog'laydigan zamonaviy raqamli platforma.</p>
            <div className="footer-socials">
              {["📸", "✈️", "💬", "📺"].map((i, idx) => <div key={idx} className="fsoc">{i}</div>)}
            </div>
          </div>
          <div>
            <h4>Sahifalar</h4>
            {[["home", "Bosh sahifa"], ["catalog", "Katalog"], ["prices", "Narxlar"], ["news", "Yangiliklar"]].map(([p, l]) => (
              <div key={p}><a href="#" onClick={e => { e.preventDefault(); setPage(p); }}>{l}</a></div>
            ))}
          </div>
          <div>
            <h4>Xizmatlar</h4>
            {[["delivery", "Yetkazib berish"], ["contracts", "Shartnomalar"], ["catalog", "Bozor"], ["contact", "Bog'lanish"]].map(([p, l]) => (
              <div key={p}><a href="#" onClick={e => { e.preventDefault(); setPage(p); }}>{l}</a></div>
            ))}
          </div>
          <div>
            <h4>Aloqa</h4>
            <p>📍 Toshkent, Amir Temur 108A</p>
            <p>📞 +998 71 200 00 00</p>
            <p>📧 info@agrobozor.uz</p>
            <p>⏰ Du-Ju: 9:00–18:00</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 Salom AgroBozor. Barcha huquqlar himoyalangan.</span>
          <span>🌿 O'zbekiston fermerlari uchun</span>
        </div>
      </div>
    </footer>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ user, page, setPage, openAuth, cart, userMenuOpen, setUserMenuOpen, logout }) {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const Icon = ({ d, size=16 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
  const navPages = [
    ["home",      "Bosh sahifa",  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"],
    ["catalog",   "Katalog",      "M4 7h16M4 12h16M4 17h10"],
    ["prices",    "Narxlar",      "M18 20V10M12 20V4M6 20v-6"],
    ["news",      "Yangiliklar",  "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8"],
    ["delivery",  "Yetkazish",    "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm1-9H9l3-8 9 4-3 4z"],
    ["contracts", "Shartnoma",    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"],
    ["contact",   "Bog'lanish",   "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.35 6.35l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"],
  ];
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => setPage("home")}>
        <div className="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-13 5 1-2 3-3.5 7-4.5-5 0-7.5 2-10 7.5C8 16 11 14 15 14c-1 .5-2 1.5-3 3l2.5 1.5C15.5 17 16 15 17 8z"/></svg>
        </div>
        <span className="brand-name">Salom <span>Agro</span>Bozor</span>
      </div>
      <div className="nav-links">
        {navPages.map(([p, l, d]) => (
          <button key={p} className={`nl ${page === p ? "act" : ""}`} onClick={() => setPage(p)}>
            <Icon d={d} /> {l}
          </button>
        ))}
        {user && (
          <button className={`nl ${page === "cart" ? "act" : ""}`} onClick={() => setPage("cart")}>
            🛍️ {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        )}
        {user?.role === "admin" && <button className={`nl ${page === "admin" ? "act" : ""}`} onClick={() => setPage("admin")}>⚙️</button>}
        {user ? (
          <div className="umenu">
            <div className="av" onClick={() => setUserMenuOpen(p => !p)}>{user.avatar}</div>
            {userMenuOpen && (
              <div className="udrop">
                <div className="udrop-head">
                  <div className="udrop-name">{user.name}</div>
                  <div className="udrop-email">{user.email}</div>
                  <span className={`role-badge rb-${user.role}`}>{user.role}</span>
                </div>
                <button className="ditem" onClick={() => { setPage("profile"); setUserMenuOpen(false); }}>👤 Profil</button>
                <button className="ditem" onClick={() => { setPage("cart"); setUserMenuOpen(false); }}>🛍️ Savat ({cartCount})</button>
                {user.role === "admin" && <button className="ditem" onClick={() => { setPage("admin"); setUserMenuOpen(false); }}>⚙️ Admin panel</button>}
                <button className="ditem red" onClick={logout}>🚪 Chiqish</button>
              </div>
            )}
          </div>
        ) : (
          <button className="nl cta" onClick={openAuth}>Kirish / Ro'yxat</button>
        )}
      </div>
    </nav>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [cart, setCart] = useState([]);
  const [selProd, setSelProd] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [db, setDb] = useState({
    users: [], categories: [], products: [], news: [], orders: [], contracts: [], reviews: [],
    regionPrices: DB.regionPrices, priceHistory: DB.priceHistory
  });
  const [catFilter, setCatFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiOnline] = useState(false); // always offline — local mode

  const showToast = (msg, type = "suc") => setToast({ msg, type });

  // ── FIREBASE DATA INIT ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snap) => {
      setDb(p => ({ ...p, products: snap.docs.map(d => ({ ...d.data(), id: d.id, _docId: d.id })) }));
    });
    const unsubCategories = onSnapshot(collection(firestoreDb, "categories"), (snap) => {
      setDb(p => ({ ...p, categories: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
    });
    const unsubUsers = onSnapshot(collection(firestoreDb, "users"), (snap) => {
      setDb(p => ({ ...p, users: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
    });
    const unsubNews = onSnapshot(collection(firestoreDb, "news"), (snap) => {
      setDb(p => ({ ...p, news: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
    });
    const unsubOrders = onSnapshot(collection(firestoreDb, "orders"), (snap) => {
      setDb(p => ({ ...p, orders: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
    });
    const unsubContracts = onSnapshot(collection(firestoreDb, "contracts"), (snap) => {
      setDb(p => ({ ...p, contracts: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
    });
    const unsubReviews = onSnapshot(collection(firestoreDb, "reviews"), (snap) => {
      setDb(p => ({ ...p, reviews: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
    });
    
    // Sessiyani tiklash
    const savedUser = loadLocal('agro_session', null);
    if (savedUser) setUser(savedUser);

    return () => {
      unsubProducts(); unsubCategories(); unsubUsers(); unsubNews();
      unsubOrders(); unsubContracts(); unsubReviews();
    };
  }, []);

  // ── LOGIN (firebase) ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    const u = db.users.find(u => u.email === email && String(u.password) === String(password));
    if (!u) { showToast("Email yoki parol noto'g'ri!", "err"); setLoading(false); return; }
    setUser(u);
    saveLocal('agro_session', u);
    showToast(`Xush kelibsiz, ${u.name}! 🌿`);
    setModal(null);
    setLoading(false);
  };

  // ── REGISTER (firebase) ──────────────────────────────────────────────────────
  const register = async (data) => {
    if (!data.name || !data.email || !data.password) { showToast("Barcha maydonlarni to'ldiring!", "err"); return; }
    setLoading(true);
    if (db.users.find(u => u.email === data.email)) { showToast("Bu email allaqachon ro'yxatdan o'tgan!", "err"); setLoading(false); return; }
    const newUser = { name: data.name, email: data.email, password: data.password, role: data.role || "buyer", region: data.region || "Toshkent", phone: data.phone || "", createdAt: new Date().toISOString().split("T")[0], avatar: data.name[0].toUpperCase(), bio: "" };
    try {
      const docRef = doc(collection(firestoreDb, "users"));
      await setDoc(docRef, { ...newUser, id: docRef.id });
      const createdUser = { ...newUser, id: docRef.id, _docId: docRef.id };
      setUser(createdUser);
      saveLocal('agro_session', createdUser);
      showToast(`Xush kelibsiz, ${newUser.name}! Ro'yxatdan o'tdingiz 🎉`);
      setModal(null);
    } catch (e) {
      showToast("Xatolik yuz berdi: " + e.message, "err");
    }
    setLoading(false);
  };

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = () => {
    saveLocal('agro_session', null);
    setUser(null); setPage("home"); setMenuOpen(false);
    showToast("Chiqdingiz! Yana ko'rishguncha 👋");
  };

  // ── SAVAT ─────────────────────────────────────────────────────────────────
  const addToCart = (prod) => {
    setCart(p => {
      const ex = p.find(i => i.id === prod.id);
      if (ex) return p.map(i => i.id === prod.id ? { ...i, qty: i.qty + (prod.qty || 1) } : i);
      return [...p, { ...prod, qty: prod.qty || 1 }];
    });
    showToast(`${prod.name} savatga qo'shildi! 🛒`);
  };

  // ── MAHSULOT QO'SHISH (firebase) ─────────────────────────────────────────────
  const addProduct = async (data) => {
    try {
      const p = { ...data, price: Number(data.price), stock: Number(data.stock), sellerId: user.id, seller: user.name, rating: 0, reviews: 0, status: "active", createdAt: new Date().toISOString().split("T")[0] };
      const docRef = doc(collection(firestoreDb, "products"));
      await setDoc(docRef, { ...p, id: docRef.id });
      
      const cat = db.categories.find(c => c.id === p.categoryId);
      if (cat) {
        await updateDoc(doc(firestoreDb, "categories", String(cat.id)), { count: (cat.count || 0) + 1 });
      }
      showToast("Mahsulot qo'shildi! ✅");
    } catch(e) {
      showToast("Xatolik: " + e.message, "err");
    }
  };

  // ── BUYURTMA BERISH (firebase) ───────────────────────────────────────────────
  const placeOrder = async (cartItems, address) => {
    try {
      for (const item of cartItems) {
        const docRef = doc(collection(firestoreDb, "orders"));
        await setDoc(docRef, {
          id: docRef.id,
          buyerId: user?.id,
          buyerName: user?.name,
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          productEmoji: item.emoji || "",
          quantity: item.qty,
          totalPrice: item.price * item.qty,
          address,
          status: "pending",
          createdAt: new Date().toISOString().split("T")[0],
          tracking: [
            { status: "Qabul qilindi", date: new Date().toLocaleDateString("uz-UZ"), done: true },
            { status: "Tayyorlanmoqda", date: "", done: false },
            { status: "Yo'lda", date: "", done: false },
            { status: "Yetkazildi", date: "", done: false }
          ]
        });
      }
      showToast("Buyurtma muvaffaqiyatli joylashtirildi! 🎉");
      return true;
    } catch(e) {
      showToast("Xatolik: " + e.message, "err");
      return false;
    }
  };

  // ── SHARTNOMA TUZISH (firebase) ──────────────────────────────────────────────
  const createContract = async (data) => {
    try {
      const docRef = doc(collection(firestoreDb, "contracts"));
      await setDoc(docRef, { ...data, id: docRef.id, buyerId: user?.id, buyerName: user?.name, status: "pending", createdAt: new Date().toISOString().split("T")[0] });
      showToast("Shartnoma yaratildi! ✅");
    } catch(e) { showToast("Xatolik: "+e.message, "err"); }
  };

  // ── SHARH QO'SHISH (firebase) ───────────────────────────────────────────────
  const addReview = async (productId, rating, comment) => {
    try {
      const docRef = doc(collection(firestoreDb, "reviews"));
      await setDoc(docRef, { id: docRef.id, productId, userId: user?.id, userName: user?.name || "Foydalanuvchi", rating, comment, date: new Date().toLocaleDateString("uz-UZ"), likes: 0 });
      
      const prodRevs = [...db.reviews.filter(r => r.productId === productId), { rating }];
      const avg = prodRevs.reduce((s, r) => s + r.rating, 0) / prodRevs.length;
      
      await updateDoc(doc(firestoreDb, "products", String(productId)), { 
        rating: Math.round(avg * 10) / 10, 
        reviews: prodRevs.length 
      });
      showToast("Sharhingiz qo'shildi! ⭐");
    } catch(e) { showToast("Xatolik", "err"); }
  };

  // ── PROFIL YANGILASH (firebase) ──────────────────────────────────────────────
  const updateProfile = async (updatedUser) => {
    try {
      await updateDoc(doc(firestoreDb, "users", String(updatedUser.id || updatedUser.email)), updatedUser);
      setUser(updatedUser);
      saveLocal('agro_session', updatedUser);
      showToast("Profil yangilandi! ✅");
    } catch(e) { showToast("Xatolik: " + e.message, "err"); }
  };

  useEffect(() => {
    window.addEventListener("click", (e) => { if (!e.target.closest(".umenu")) setMenuOpen(false); });
  }, []);

  const props = { db, user, setPage, showToast, openAuth: () => setModal("auth"), addToCart, setSelProd, apiOnline };

  return (
    <>
      <style>{css}</style>
      <Nav user={user} page={page} setPage={setPage} openAuth={() => setModal("auth")} cart={cart} userMenuOpen={menuOpen} setUserMenuOpen={setMenuOpen} logout={logout} />
      <main className="main">
        {page === "home"      && <HomePage {...props} openAddProd={() => setModal("addprod")} setCatFilter={setCatFilter} />}
        {page === "catalog"   && <CatalogPage {...props} initCat={catFilter} />}
        {page === "prices"    && <PricesPage db={db} apiOnline={apiOnline} />}
        {page === "news"      && <NewsPage db={db} apiOnline={apiOnline} showToast={showToast} />}
        {page === "delivery"  && <DeliveryPage db={db} user={user} openAuth={() => setModal("auth")} apiOnline={apiOnline} />}
        {page === "contracts" && <ContractPage db={db} user={user} openAuth={() => setModal("auth")} showToast={showToast} createContract={createContract} />}
        {page === "contact"   && <ContactPage showToast={showToast} apiOnline={apiOnline} />}
        {page === "cart"      && <CartPage cart={cart} setCart={setCart} user={user} openAuth={() => setModal("auth")} showToast={showToast} setPage={setPage} placeOrder={placeOrder} />}
        {page === "profile"   && user && <ProfilePage user={user} db={db} setDb={setDb} openAddProd={() => setModal("addprod")} showToast={showToast} apiOnline={apiOnline} setUser={setUser} updateProfile={updateProfile} setSelProd={setSelProd} />}
        {page === "admin"     && user?.role === "admin" && <AdminPanel db={db} setDb={setDb} showToast={showToast} apiOnline={apiOnline} />}
      </main>

      {modal === "auth"    && <AuthModal onClose={() => setModal(null)} login={login} register={register} loading={loading} />}
      {modal === "addprod" && user && <AddProdModal onClose={() => setModal(null)} addProduct={addProduct} db={db} />}
      {selProd && <ProdDetailModal p={selProd} db={db} onClose={() => setSelProd(null)} addToCart={addToCart} user={user} openAuth={() => setModal("auth")} showToast={showToast} addReview={addReview} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
