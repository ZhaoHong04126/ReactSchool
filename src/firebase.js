import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBvWcCroeNSe4O1H_-hXgOJysO-Fyez0Qg",
    authDomain: "campusking6.firebaseapp.com",
    projectId: "campusking6",
    storageBucket: "campusking6.firebasestorage.app",
    messagingSenderId: "904334224237",
    appId: "1:904334224237:web:21e9c3717bd05896af0864",
    measurementId: "G-ER6B64XEBJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
