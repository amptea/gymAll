import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth/react-native";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCim-F8duk67QQxINCdds91uPtnoJW_Lvs",
  authDomain: "gymall-9d754.firebaseapp.com",
  projectId: "gymall-9d754",
  storageBucket: "gymall-9d754.firebasestorage.app",
  messagingSenderId: "182263469548",
  appId: "1:182263469548:web:dd33ef724383e31abbdcc9",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };

