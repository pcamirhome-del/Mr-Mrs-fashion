import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// قم بوضع مفتاح Firebase الخاص بك هنا
// يمكنك الحصول عليه من إعدادات مشروعك في Firebase Console
const firebaseConfig = {
  apiKey: "ضع_مفتاح_apiKey_هنا",
  authDomain: "ضع_مفتاح_authDomain_هنا",
  projectId: "ضع_مفتاح_projectId_هنا",
  storageBucket: "ضع_مفتاح_storageBucket_هنا",
  messagingSenderId: "ضع_مفتاح_messagingSenderId_هنا",
  appId: "ضع_مفتاح_appId_هنا"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة قاعدة بيانات Firestore
export const db = getFirestore(app);
