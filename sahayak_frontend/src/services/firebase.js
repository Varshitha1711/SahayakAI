import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2U7TPDSYZQ1hnquklfelWafp3r1WmBNU",
  authDomain: "sahayak-c1d25.firebaseapp.com",
  projectId: "sahayak-c1d25",
  storageBucket: "sahayak-c1d25.firebasestorage.app",
  messagingSenderId: "116835267148",
  appId: "1:116835267148:web:912a70fc7444691bb9bae9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
