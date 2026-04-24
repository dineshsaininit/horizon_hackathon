import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6Fg7ZxDJ2LFWeSKvyJ3mzWIjPUQIURqA",
  authDomain: "horizon-fe2a4.firebaseapp.com",
  projectId: "horizon-fe2a4",
  storageBucket: "horizon-fe2a4.firebasestorage.app",
  messagingSenderId: "397600676448",
  appId: "1:397600676448:web:37c8252e4bbec1a1f70105",
  measurementId: "G-FRJ8E2C8T9"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
