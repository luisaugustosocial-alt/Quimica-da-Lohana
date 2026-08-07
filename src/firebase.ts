import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWKxKg0f1esuIRPdvPBwtLTt8fNxHutoM",
  authDomain: "quimica-da-lohana.firebaseapp.com",
  projectId: "quimica-da-lohana",
  storageBucket: "quimica-da-lohana.firebasestorage.app",
  messagingSenderId: "592422802834",
  appId: "1:592422802834:web:dcced61bdb0b9a96bf5d4b",
  measurementId: "G-2Q60Z7GXHR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);