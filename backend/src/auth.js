import { 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  fetchSignInMethodsForEmail 
} from "firebase/auth";
import { auth } from "./firebaseConfig.js";

// Sign up
const signUp = async (email, password) => {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      throw new Error("Email already in use");
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user); // Optional: Send verification
    return { userId: userCredential.user.uid };
  } catch (error) {
    console.error("Sign up error:", error.message);
    throw new Error("Failed to sign up: " + error.message);
  }
};

// Log in
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { userId: userCredential.user.uid };
  } catch (error) {
    console.error("Login error:", error.message);
    throw new Error("Failed to log in: " + error.message);
  }
};

// Sign out
const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
    return { message: "User signed out successfully" };
  } catch (error) {
    console.error("Sign out error:", error.message);
    throw new Error("Failed to sign out: " + error.message);
  }
};

// Verification
const emailVerification = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
      console.log("Email verification sent successfully!");
      return { message: "Verification email sent" };
    } catch (error) {
      console.error("Error sending email verification:", error.message);
      throw new Error("Failed to send verification email: " + error.message);
    }
  } else {
    console.error("No user is currently signed in.");
    throw new Error("No user is currently signed in");
  }
};

// Reset password
const resetPassword = async (email) => {
  if (!email) {
    console.error("Please provide an email address for password reset.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully!");
    return { message: "Password reset email sent" };
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    throw new Error("Failed to send password reset email: " + error.message);
  }
};

export { login, signUp, signOutUser, emailVerification, resetPassword };
