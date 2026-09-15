import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

// 讀取 Vite 環境變數 (不硬編碼金鑰，防護 Node/Vite 相容性)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || ''
};

// 檢查環境變數是否已完整配置有效金鑰
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your_api_key')
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase 初始化警告，已切換至本機沙盒展示模式：', err);
  }
}

// 輔助函式：將「研究編號」轉換為合法的去識別化 Auth Email
export function formatSubjectEmail(subjectId) {
  const cleanId = (subjectId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `subject_${cleanId}@frailty.study`;
}

// 輔助函式：管理者 Email
export function formatAdminEmail(adminId) {
  const cleanId = (adminId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `admin_${cleanId}@frailty.study`;
}

/**
 * 本機展示模式狀態管理 (LocalStorage Sandbox Adapter)
 */
const DEMO_USER_KEY = 'frailty_demo_auth_user';
const demoListeners = new Set();

function notifyDemoListeners(user) {
  demoListeners.forEach(cb => {
    try { cb(user); } catch (e) { console.error(e); }
  });
}

/**
 * 監聽登入狀態改變
 */
export function onAuthStatusChange(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      // 從 Firestore 讀取使用者角色與研究編號
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          subjectId: userData.subjectId || firebaseUser.email?.split('@')[0]?.replace('subject_', '')?.toUpperCase() || 'SUBJ-UNKNOWN',
          role: userData.role || (firebaseUser.email?.startsWith('admin_') ? 'admin' : 'subject'),
          isFirebaseOnline: true
        });
      } catch (err) {
        console.warn('讀取使用者檔案失敗，使用基礎憑證：', err);
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          subjectId: firebaseUser.email?.split('@')[0]?.replace('subject_', '')?.toUpperCase() || 'SUBJ-UNKNOWN',
          role: firebaseUser.email?.startsWith('admin_') ? 'admin' : 'subject',
          isFirebaseOnline: true
        });
      }
    });
  } else {
    // 本機展示模式
    const stored = localStorage.getItem(DEMO_USER_KEY);
    const initialUser = stored ? JSON.parse(stored) : null;
    callback(initialUser);
    demoListeners.add(callback);
    return () => {
      demoListeners.delete(callback);
    };
  }
}

/**
 * 使用「研究編號」登入
 */
export async function loginWithSubjectId(subjectId, password = 'password123') {
  if (!subjectId || subjectId.trim() === '') {
    throw new Error('請輸入有效的研究編號！');
  }

  const cleanSubjectId = subjectId.trim().toUpperCase();
  const email = formatSubjectEmail(cleanSubjectId);

  if (isFirebaseConfigured && auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: userCred.user.uid,
        subjectId: cleanSubjectId,
        role: 'subject',
        isFirebaseOnline: true
      };
    } catch (err) {
      // 若帳號不存在則自動為該研究編號建立新個案帳戶
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, password);
          // 在 Firestore 建立去識別化使用者索引 (不包含姓名/身分證/生日)
          await setDoc(doc(db, 'users', newCred.user.uid), {
            subjectId: cleanSubjectId,
            role: 'subject',
            createdAt: serverTimestamp()
          });
          return {
            uid: newCred.user.uid,
            subjectId: cleanSubjectId,
            role: 'subject',
            isFirebaseOnline: true
          };
        } catch (regErr) {
          throw new Error('研究編號認證建立失敗：' + regErr.message);
        }
      }
      throw new Error('登入失敗：' + err.message);
    }
  } else {
    // 本機展示模式
    const user = {
      uid: `demo-uid-${cleanSubjectId.toLowerCase()}`,
      subjectId: cleanSubjectId,
      role: 'subject',
      isFirebaseOnline: false
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    notifyDemoListeners(user);
    return user;
  }
}

/**
 * 管理者登入 (可查看並搜尋全體個案)
 */
export async function loginAsAdmin(adminId = 'ADMIN-001', password = 'adminpassword') {
  const cleanAdminId = (adminId || 'ADMIN-001').trim().toUpperCase();
  const email = formatAdminEmail(cleanAdminId);

  if (isFirebaseConfigured && auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: userCred.user.uid,
        subjectId: cleanAdminId,
        role: 'admin',
        isFirebaseOnline: true
      };
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', newCred.user.uid), {
            subjectId: cleanAdminId,
            role: 'admin',
            createdAt: serverTimestamp()
          });
          return {
            uid: newCred.user.uid,
            subjectId: cleanAdminId,
            role: 'admin',
            isFirebaseOnline: true
          };
        } catch (regErr) {
          throw new Error('管理者帳號建立失敗：' + regErr.message);
        }
      }
      throw new Error('管理者登入失敗：' + err.message);
    }
  } else {
    // 本機展示模式
    const user = {
      uid: `demo-admin-${cleanAdminId.toLowerCase()}`,
      subjectId: cleanAdminId,
      role: 'admin',
      isFirebaseOnline: false
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    notifyDemoListeners(user);
    return user;
  }
}

/**
 * 登出目前帳號
 */
export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem(DEMO_USER_KEY);
    notifyDemoListeners(null);
  }
}

export { auth, db };
