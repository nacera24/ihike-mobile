import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔐 objet de configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAwzj7o03qIbwzTSwD1Ii0kUHyZBo_zTnE",
  authDomain: "randomap-fb590.firebaseapp.com",
  projectId: "randomap-fb590",
  storageBucket: "randomap-fb590.appspot.com",
  messagingSenderId: "665570993787",
  appId: "1:665570993787:web:e70edadb445137ed0164de",
 };
//  Initialiser Firebase
const app = initializeApp(firebaseConfig);
// Authentification
export const auth = getAuth(app);
//  Firestore
export const db = getFirestore(app);