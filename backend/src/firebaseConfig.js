import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import admin from "firebase-admin";

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


  // Firebase Admin SDK Configuration (for backend use)
  const adminConfig = {
    type: process.env.FIREBASE_ADMIN_TYPE,
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"), // Fix escaped newlines
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_ADMIN_CLIENT_ID,
    authUri: process.env.FIREBASE_ADMIN_AUTH_URI,
    tokenUri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    authProviderCertUrl: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL,
    clientCertUrl: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL,
    };

    let adminDb;
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(adminConfig),
        });
    }
    adminDb = admin.firestore();

    // Export both client and admin SDKs
    export { app, db, auth, storage, admin, adminDb };