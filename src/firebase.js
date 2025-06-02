import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5F5gBtqImytVSQrEGOQljWjQguGgx-Dk",
    authDomain: "bebe-bank.firebaseapp.com",
    projectId: "bebe-bank",
    storageBucket: "bebe-bank.firebasestorage.app",
    messagingSenderId: "677906366160",
    appId: "1:677906366160:web:0bc694bcefd362da4da8d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app; 