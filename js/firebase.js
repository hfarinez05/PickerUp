import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const firebaseConfig = {
  // 👇 pega tu config aquí

  apiKey: "AIzaSyBXEU8zfJIB0M8Yo52kiGvw37-d6YfKbpM",
  authDomain: "pickerup-1d550.firebaseapp.com",
  projectId: "pickerup-1d550",
  storageBucket: "pickerup-1d550.firebasestorage.app",
  messagingSenderId: "531666332170",
  appId: "1:531666332170:web:3fd474199eaf0fa60b0df3",
  measurementId: "G-520P37EVFW",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
