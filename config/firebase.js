import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuecYygDc47APuyZrQ8r_RNSZyGhDnMFs",
  authDomain: "medi-lens-plus.firebaseapp.com",
  projectId: "medi-lens-plus",
  storageBucket: "medi-lens-plus.appspot.com",  // Fixed typo
  messagingSenderId: "445649323875",
  appId: "1:445649323875:web:46d3c8b75af4718f50b556",
  measurementId: "G-JH06YFC8SH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Auth

export { auth };

