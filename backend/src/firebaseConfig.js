import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file path and directory in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file if not already loaded
if (!process.env.REACT_APP_FIREBASE_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}


import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  const app = initializeApp(firebaseConfig);
  //const analytics = getAnalytics(app);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  export { app, db, auth, storage};