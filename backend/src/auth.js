import {
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebaseConfig.js";
import { setDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import WebSocket from "ws";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Use environment variable for WebSocket URL
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || "ws://localhost:8080";

// Helper function for WebSocket connection
const connectWebSocket = (userId) => {
  const ws = new WebSocket(WEBSOCKET_URL);

  ws.on("open", () => {
    console.log("WebSocket connected");
    ws.send(
        JSON.stringify({
          action: "connect",
          userId,
        })
    );
  });

  ws.on("message", (data) => {
    const message = JSON.parse(data);
    console.log("Received message from WebSocket:", message);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  return ws;
};

// Sign up
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User registered successfully:", user);

    // Save user to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
    });

    return { success: true, userId: user.uid };
  } catch (error) {
    console.error("Error during registration:", error.message);
    return { success: false, error: "Fail: " + error.message };
  }
};

// Log in
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User logged in successfully:", user);

    // Connect to WebSocket
    connectWebSocket(user.uid);

    return { success: true, userId: user.uid };
  } catch (error) {
    console.error("Error during login:", error.message);
    return { success: false, error: error.message };
  }
};

// Sign out
const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error.message);
    return { success: false, error: error.message };
  }
};

// Email verification
const emailVerification = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
      console.log("Email verification sent successfully!");
      return { success: true };
    } catch (error) {
      console.error("Error sending email verification:", error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.error("No user is currently signed in.");
    return { success: false, error: "No user signed in." };
  }
};

// Reset password
const resetPassword = async (email) => {
  if (!email) {
    console.error("Please provide an email address for password reset.");
    return { success: false, error: "Email address required." };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    return { success: false, error: error.message };
  }
};

export { login, signUp, signOutUser, emailVerification, resetPassword };
