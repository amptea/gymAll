// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCim-F8duk67QQxINCdds91uPtnoJW_Lvs",
  authDomain: "gymall-9d754.firebaseapp.com",
  projectId: "gymall-9d754",
  storageBucket: "gymall-9d754.firebasestorage.app",
  messagingSenderId: "182263469548",
  appId: "1:182263469548:web:dd33ef724383e31abbdcc9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Custom persistence implementation using AsyncStorage
const asyncStoragePersistence = {
  type: 'LOCAL' as const,
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
};

// Initialize Firebase Auth with custom persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };