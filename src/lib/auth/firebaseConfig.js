import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyBZxl6kPa5G3HUFyzCIyxG-pBQbJ1XrkTA",
    authDomain: "rx-casino.firebaseapp.com",
    projectId: "rx-casino",
    storageBucket: "rx-casino.firebasestorage.app",
    messagingSenderId: "344529976226",
    appId: "1:344529976226:web:066c9effb1f555391a50fb"
};

export const fb = initializeApp(firebaseConfig);