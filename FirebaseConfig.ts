// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCim-F8duk67QQxINCdds91uPtnoJW_Lvs",
  authDomain: "gymall-9d754.firebaseapp.com",
  projectId: "gymall-9d754",
  storageBucket: "gymall-9d754.firebasestorage.app",
  messagingSenderId: "182263469548",
  appId: "1:182263469548:web:dd33ef724383e31abbdcc9",
  measurementId: "G-0KJCD3Y59R"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});