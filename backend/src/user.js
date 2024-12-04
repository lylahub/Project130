import { db } from "./firebaseConfig.js";
import { updateDoc, setDoc, getDoc, doc } from "firebase/firestore";

// Fetch user data
export const getUserData = async (uid, email = "") => {
  const docRef = doc(db, "users", uid);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        username: data.username || "To be set",
        email: data.email || email, // Use provided email if missing
        bio: data.bio || "To be set",
        profile_pic: data.profile_pic || "https://via.placeholder.com/150",
      };
    } else {
      // Create document with default values
      const newUserData = {
        username: "To be set",
        email: email, // Use the provided email
        bio: "To be set",
        profile_pic: "https://via.placeholder.com/150",
      };
      console.log("Creating new Firestore document:", newUserData);
      await setDoc(docRef, newUserData);
      return newUserData;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Failed to fetch user data");
  }
};

// Update user data
export const updateUserData = async (uid, updates) => {
  const docRef = doc(db, "users", uid);
  try {
    await updateDoc(docRef, updates);
    return { message: "User updated successfully" };
  } catch (error) {
    console.error("Error updating user data:", error);
    throw new Error("Failed to update user data");
  }
};

// Ensure a field exists and initialize it with a default value if missing
export const ensureFieldExists = async (uid, field, defaultValue = null) => {
  const docRef = doc(db, "users", uid);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data()[field] === undefined) {
      await updateDoc(docRef, { [field]: defaultValue });
    }
  } catch (error) {
    console.error("Error ensuring field exists:", error);
    throw new Error(`Failed to check or initialize field: ${field}`);
  }
};

/**
 * Get the username associated with a given uid.
 * @param {string} uid - The user's unique ID (uid).
 * @returns {Promise<string>} - The username corresponding to the uid.
 * @throws {Error} - Throws an error if the uid is not found or any issue occurs.
 */
export const getUsernameByUid = async (uid) => {
    try {
      // Reference the user document in the "users" collection
      const userDocRef = doc(db, "users", uid);
  
      // Fetch the document snapshot
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        // Extract the username field from the document
        const userData = userDocSnap.data();
        return userData.username || "Username not set";
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error fetching username:", error.message);
      throw error;
    }
  };