import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// قم بوضع مفتاح Firebase الخاص بك هنا
// يمكنك الحصول عليه من إعدادات مشروعك في Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCuFiuZdk_E7O2Zo8rm8xRPb21NOJPg2sY",
  authDomain: "gen-lang-client-0650630522.firebaseapp.com",
  projectId: "gen-lang-client-0650630522",
  storageBucket: "gen-lang-client-0650630522.firebasestorage.app",
  messagingSenderId: "920845848192",
  appId: "1:920845848192:web:f3e6d3c265eb7875b7e065"
};

export const isFirebaseConfigured = firebaseConfig.projectId !== "ضع_مفتاح_projectId_هنا";

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة قاعدة بيانات Firestore
export const db = getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      providerInfo: []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    alert('خطأ في الصلاحيات: يرجى تحديث قواعد أمان Firestore (Security Rules) للسماح بالقراءة والكتابة.');
  }
  
  throw new Error(JSON.stringify(errInfo));
}
