import { db } from "./firebaseConfig.js";
import { updateDoc, setDoc, getDoc, doc, Timestamp } from "firebase/firestore";

// Default user data template
export const defaultUserData = {
  username: "",
  email: "",
  bio: "Hello, World!",
  currency: "USD",
  riskTolerance: "moderate",
  notifications: true,
  theme: "light",
  profile_pic: "https://via.placeholder.com/150", // Default profile picture URL
  created_date: Timestamp.now(),
};

// Fetch user data
export const getUserData = async (uid, email = "") => {
  const docRef = doc(db, "users", uid);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Return existing data with defaults for missing fields
        return {
            username: data.username || "To be set",
            email: data.email || email,
            bio: data.bio || "To be set",
            currency: data.currency || "USD",
            riskTolerance: data.riskTolerance || "moderate",
            notifications: data.notifications !== undefined ? data.notifications : true,
            theme: data.theme || "light",
            profile_pic: data.profile_pic || "https://via.placeholder.com/150",
            created_date: data.created_date || Timestamp.now(),
        };
    } else {
      // If document doesn't exist, initialize it with default data
      const newUserData = { ...defaultUserData, email };
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
export const ensureFieldExists = async (uid, field) => {
  const docRef = doc(db, "users", uid);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data()[field] === undefined) {
      const defaultValue = defaultUserData[field] || null;
      await updateDoc(docRef, { [field]: defaultValue });
    }
  } catch (error) {
    console.error("Error ensuring field exists:", error);
    throw new Error(`Failed to check or initialize field: ${field}`);
  }
};
