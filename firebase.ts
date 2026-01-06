
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { getDatabase, ref, onValue, set, push, update, remove } from 'firebase/database';

// Configuration based on provided google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCbl0C-3RpYZRw3Ccsi0abjTVvlO7DuE1Q",
  authDomain: "shemwave-f1d00.firebaseapp.com",
  databaseURL: "https://shemwave-f1d00-default-rtdb.firebaseio.com",
  projectId: "shemwave-f1d00",
  storageBucket: "shemwave-f1d00.firebasestorage.app",
  messagingSenderId: "672676150445",
  appId: "1:672676150445:android:0fe36c9f5b66ddda765a24"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Export auth listeners and methods
export { onAuthStateChanged };

export const loginEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const signupEmail = async (name: string, email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  } catch (error) {
    console.error("Signup failed", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Generic DB helpers
export const dbGet = (path: string, callback: (data: any) => void) => {
  const dbRef = ref(db, path);
  return onValue(dbRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const dbSet = (path: string, data: any) => set(ref(db, path), data);
export const dbPush = (path: string, data: any) => push(ref(db, path), data);
export const dbUpdate = (path: string, data: any) => update(ref(db, path), data);
export const dbRemove = (path: string) => remove(ref(db, path));
