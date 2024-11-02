import { signOut, sendEmailVerification, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

// Sign up
const signUp = async (email, password) => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        console.log("Email already in use.");
        return { error: "Do not register multiple times" };
      }
      
      // only register when not registered
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered successfully:", userCredential.user);
    } catch (error) {
      console.error("Error during registration:", error.message);
      return { error: "Fail: " + error.message };
    }
  };

// Log in
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully:", userCredential.user);
  } catch (error) {
    console.error("Error during login:", error.message);
  }
};

// Sign out
const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
  } catch (error) {
    console.error("Sign out error:", error.message);
  }
};

// Verification; not tested
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

// reset password
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

export { login, signUp, signOutUser, emailVerification, resetPassword}
