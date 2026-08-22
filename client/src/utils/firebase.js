// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "authexamniai.firebaseapp.com",
  projectId: "authexamniai",
  storageBucket: "authexamniai.firebasestorage.app",
  messagingSenderId: "631895262414",
  appId: "1:631895262414:web:0ad3218f453c8dbae7bc9f",
  measurementId: "G-MRVQ8S7VWD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };