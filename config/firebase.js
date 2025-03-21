import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuecYygDc47APuyZrQ8r_RNSZyGhDnMFs",
  authDomain: "medi-lens-plus.firebaseapp.com",
  projectId: "medi-lens-plus",
  storageBucket: "medi-lens-plus.appspot.com",
  messagingSenderId: "445649323875",
  appId: "1:445649323875:web:46d3c8b75af4718f50b556",
  measurementId: "G-JH06YFC8SH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Auth
const db = getFirestore(app); // Initialize Firestore

export { app, auth, db }; // Export Firestore

