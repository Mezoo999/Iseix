// Firebase configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAlh7PDk3WQgdqkU6E3eVqZKGz5Y7wzVj8",
  authDomain: "iseix-15880.firebaseapp.com",
  projectId: "iseix-15880",
  storageBucket: "iseix-15880.appspot.com", // تصحيح اسم حاوية التخزين
  messagingSenderId: "1017998773369",
  appId: "1:1017998773369:web:4a8b71b2f2115ea30d18a8"
};

// تهيئة Firebase فقط إذا لم تكن هناك تطبيقات موجودة بالفعل
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// تصدير خدمات Firebase
export const auth = getAuth(app);

// تهيئة Firestore
export const db = getFirestore(app);

export const storage = getStorage(app);

// استخدام المحاكيات المحلية في بيئة التطوير
if (process.env.NODE_ENV === 'development' && process.env.USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;