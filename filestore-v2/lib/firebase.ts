import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth, getAuth, getReactNativePersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as fbSignOut, sendPasswordResetEmail, updateProfile,
  onAuthStateChanged, User,
} from 'firebase/auth';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

// ─── Auth helpers ───────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  phone: string
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: fullName });
  await setDoc(doc(db, 'profiles', cred.user.uid), {
    full_name: fullName,
    phone,
    email,
    role: 'customer',
    created_at: new Date().toISOString(),
  });
  return cred.user;
};

export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signOut = async () => {
  await fbSignOut(auth);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const getProfile = async (userId: string) => {
  const snap = await getDoc(doc(db, 'profiles', userId));
  if (!snap.exists()) throw new Error('Profile not found');
  return { id: snap.id, ...snap.data() } as any;
};

export const getProfileStats = async (userId: string) => {
  const [grantsSnap, requestsSnap] = await Promise.all([
    getDocs(query(collection(db, 'access_grants'), where('user_id', '==', userId))),
    getDocs(query(collection(db, 'payment_requests'), where('user_id', '==', userId))),
  ]);
  const downloads = grantsSnap.size;
  const pending = requestsSnap.docs.filter(d => (d.data() as any).status === 'pending').length;
  return { downloads, pending };
};

// ─── File helpers ────────────────────────────────────────────────────────────

export const getFiles = async () => {
  const snap = await getDocs(collection(db, 'files'));
  const files = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(f => f.is_active !== false);
  files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return files;
};

export const getFileById = async (fileId: string) => {
  const snap = await getDoc(doc(db, 'files', fileId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
};

export const uploadFile = async (
  file: { uri: string; name: string; type: string },
  metadata: { title: string; description: string; price: number; category: string },
  onProgress?: (percent: number) => void
) => {
  const fileName = `${Date.now()}_${file.name}`;
  const storagePath = `files/${fileName}`;
  const storageRef = ref(storage, storagePath);

  const response = await fetch(file.uri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, { contentType: file.type });
  if (onProgress) onProgress(100);
  const fileUrl = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, 'files'), {
    title: metadata.title,
    description: metadata.description,
    price: metadata.price,
    category: metadata.category,
    file_path: storagePath,
    file_url: fileUrl,
    file_name: file.name,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  return { id: docRef.id };
};

export const updateFileDetails = async (fileId: string, updates: Record<string, any>) => {
  await updateDoc(doc(db, 'files', fileId), updates);
};

export const deleteFileSoft = async (fileId: string) => {
  await updateDoc(doc(db, 'files', fileId), { is_active: false });
};

// ─── Payment Request helpers ──────────────────────────────────────────────────

export const submitPaymentRequest = async (
  fileId: string,
  userId: string,
  paymentRef: string,
  amount: number
) => {
  const docRef = await addDoc(collection(db, 'payment_requests'), {
    file_id: fileId,
    user_id: userId,
    payment_reference: paymentRef,
    amount,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  return { id: docRef.id };
};

export const getPaymentRequestForUserFile = async (userId: string, fileId: string) => {
  const snap = await getDocs(query(collection(db, 'payment_requests'), where('user_id', '==', userId)));
  const match = snap.docs.find(d => (d.data() as any).file_id === fileId);
  return match ? { id: match.id, ...match.data() } as any : null;
};

export const getMyPaymentRequests = async (userId: string) => {
  const snap = await getDocs(query(collection(db, 'payment_requests'), where('user_id', '==', userId)));
  let requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  requests = await Promise.all(requests.map(async (r) => {
    const fileSnap = await getDoc(doc(db, 'files', r.file_id));
    return { ...r, files: fileSnap.exists() ? { id: fileSnap.id, ...fileSnap.data() } : null };
  }));
  return requests;
};

export const getPendingRequests = async () => {
  const snap = await getDocs(query(collection(db, 'payment_requests'), where('status', '==', 'pending')));
  let requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  requests = await Promise.all(requests.map(async (r) => {
    const [profileSnap, fileSnap] = await Promise.all([
      getDoc(doc(db, 'profiles', r.user_id)),
      getDoc(doc(db, 'files', r.file_id)),
    ]);
    return {
      ...r,
      profiles: profileSnap.exists() ? profileSnap.data() : null,
      files: fileSnap.exists() ? fileSnap.data() : null,
    };
  }));
  return requests;
};

export const approveRequest = async (requestId: string, fileId: string, userId: string) => {
  await updateDoc(doc(db, 'payment_requests', requestId), { status: 'approved' });
  await addDoc(collection(db, 'access_grants'), {
    file_id: fileId,
    user_id: userId,
    created_at: new Date().toISOString(),
  });
};

export const rejectRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'payment_requests', requestId), { status: 'rejected' });
};

// ─── Access & Downloads ───────────────────────────────────────────────────────

export const getMyDownloads = async (userId: string) => {
  const snap = await getDocs(query(collection(db, 'access_grants'), where('user_id', '==', userId)));
  let grants = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  grants.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  grants = await Promise.all(grants.map(async (g) => {
    const fileSnap = await getDoc(doc(db, 'files', g.file_id));
    return { ...g, files: fileSnap.exists() ? { id: fileSnap.id, ...fileSnap.data() } : null };
  }));
  return grants;
};

export const hasAccess = async (userId: string, fileId: string) => {
  const snap = await getDocs(query(collection(db, 'access_grants'), where('user_id', '==', userId)));
  return snap.docs.some(d => (d.data() as any).file_id === fileId);
};

export const revokeAccess = async (grantId: string) => {
  await deleteDoc(doc(db, 'access_grants', grantId));
};

export const logDownload = async (userId: string, fileId: string) => {
  await addDoc(collection(db, 'downloads'), {
    user_id: userId,
    file_id: fileId,
    downloaded_at: new Date().toISOString(),
  });
};

// ─── Admin helpers ─────────────────────────────────────────────────────────

export const getAdminStats = async () => {
  const [filesSnap, profilesSnap, requestsSnap, downloadsSnap] = await Promise.all([
    getDocs(collection(db, 'files')),
    getDocs(collection(db, 'profiles')),
    getDocs(collection(db, 'payment_requests')),
    getDocs(collection(db, 'downloads')),
  ]);

  const files = filesSnap.docs.map(d => d.data() as any);
  const profiles = profilesSnap.docs.map(d => d.data() as any);
  const requests = requestsSnap.docs.map(d => d.data() as any);

  return {
    totalFiles: files.filter(f => f.is_active !== false).length,
    totalUsers: profiles.filter(p => p.role === 'customer').length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    totalDownloads: downloadsSnap.size,
    totalRevenue: requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.amount ?? 0), 0),
  };
};

export const getAllCustomers = async () => {
  const snap = await getDocs(collection(db, 'profiles'));
  const customers = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(c => c.role === 'customer');
  customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return customers;
};

export const getCustomerDetail = async (userId: string) => {
  const [profileSnap, grantsSnap, requestsSnap] = await Promise.all([
    getDoc(doc(db, 'profiles', userId)),
    getDocs(query(collection(db, 'access_grants'), where('user_id', '==', userId))),
    getDocs(query(collection(db, 'payment_requests'), where('user_id', '==', userId))),
  ]);

  const profile = profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as any : null;

  let grants = grantsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  grants.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  grants = await Promise.all(grants.map(async (g) => {
    const fileSnap = await getDoc(doc(db, 'files', g.file_id));
    return { ...g, files: fileSnap.exists() ? { id: fileSnap.id, ...fileSnap.data() } : null };
  }));

  let requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  requests = await Promise.all(requests.map(async (r) => {
    const fileSnap = await getDoc(doc(db, 'files', r.file_id));
    return { ...r, files: fileSnap.exists() ? { id: fileSnap.id, ...fileSnap.data() } : null };
  }));

  return { profile, grants, requests };
};

// ─── Push token ───────────────────────────────────────────────────────────

export const savePushToken = async (userId: string, token: string) => {
  await updateDoc(doc(db, 'profiles', userId), { push_token: token });
};
