import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAwzj7o03qIbwzTSwD1Ii0kUHyZBo_zTnE",
  authDomain: "randomap-fb590.firebaseapp.com",
  projectId: "randomap-fb590",
  storageBucket: "randomap-fb590.appspot.com",
  messagingSenderId: "665570993787",
  appId: "1:665570993787:web:e70edadb445137ed0164de",
 };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
