import { signOut, sendEmailVerification, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig.js";
import { setDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import WebSocket from 'ws';
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';

/**
 * Registers a new user in Firebase Authentication and creates a user document in Firestore.
 * @async
 * @function
 * @param {string} email - The email address of the user.
 * @param {string} password - The password for the user.
 * @returns {Promise<Object|undefined>} Returns an error object if the operation fails.
 */
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User registered successfully:", user);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email
    });
  } catch (error) {
    console.error("Error during registration:", error.message);
    return { error: "Fail: " + error.message };
  }
};

/**
 * Logs in an existing user and establishes a WebSocket connection.
 * @async
 * @function
 * @param {string} email - The email address of the user.
 * @param {string} password - The password for the user.
 * @returns {Promise<string|null>} The user ID if login is successful, or null if it fails.
 */
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User logged in successfully:", user);
    console.log("User", user.uid);

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.on("open", () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({
        action: "connect",
        userId: user.uid,
      }));
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
    return user.uid;
  } catch (error) {
    console.error("Error during login:", error.message);
    return null;
  }
};

/**
 * Signs out the currently authenticated user.
 * @async
 * @function
 * @returns {Promise<void>} Resolves when the user is signed out.
 */
const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
  } catch (error) {
    console.error("Sign out error:", error.message);
  }
};

/**
 * Sends an email verification to the currently signed-in user.
 * @async
 * @function
 * @returns {Promise<void>} Resolves when the email verification is sent, or logs an error.
 */
const emailVerification = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
      console.log("Email verification sent successfully!");
    } catch (error) {
      console.error("Error sending email verification:", error.message);
    }
  } else {
    console.error("No user is currently signed in.");
  }
};

/**
 * Sends a password reset email to the specified email address.
 * @async
 * @function
 * @param {string} email - The email address to send the reset link to.
 * @returns {Promise<void>} Resolves when the password reset email is sent, or logs an error.
 */
const resetPassword = async (email) => {
  if (!email) {
    console.error("Please provide an email address for password reset.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
  }
};

export { login, signUp, signOutUser, emailVerification, resetPassword };
