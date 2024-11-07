import express from "express";
import { 
  addNewCategory, addDefaultCategories, addEntryToCategory, resetMonthlyAmounts, 
  getCategoryAmount, getCategoryDetails, getUserCategories, fetchTransactions 
} from "./categoricalBookkeeping.js";
import { login, signUp, signOutUser, emailVerification, resetPassword } from "./auth.js";

const router = express.Router();

// Root route
router.get('/', (req, res) => {
  res.send('Welcome to the server! It is running correctly.');
});

// Default categories route
router.post("/categories/default", async (req, res) => {
  const { userId } = req.body;
  try {
    await addDefaultCategories(userId);
    res.status(200).send("Default categories added successfully");
  } catch (error) {
    res.status(500).json({ error: "Failed to add default categories" });
  }
});

// Add new category
router.post("/categories", async (req, res) => {
  const { userId, categoryName, icon } = req.body;
  try {
    await addNewCategory(userId, categoryName, icon);
    res.status(201).send("Category added successfully");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}); 

// Add entry to category
router.post("/categories/entry", async (req, res) => {
  const { userId, categoryName, amount, memo, incomeExpense } = req.body;
  try {
    await addEntryToCategory(userId, categoryName, amount, memo, incomeExpense);
    res.status(201).send("Entry added successfully");
  } catch (error) {
    console.error("Error adding entry:", error);
    res.status(400).json({ error: "Error adding entry", details: error.message });
  }
});

// Sign-up route
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await signUp(email, password);
    res.status(200).json({ message: "User registered successfully! Verification email sent.", userId: result.userId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await login(email, password);
    res.status(200).json({ message: "User logged in successfully!", userId: result.userId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  try {
    await signOutUser();
    res.status(200).json({ message: "User signed out successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verification email route
router.post("/send-verification", async (req, res) => {
  try {
    await emailVerification();
    res.status(200).json({ message: "Verification email sent successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset password route
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please provide an email address for password reset." });
  }
  try {
    await resetPassword(email);
    res.status(200).json({ message: "Password reset email sent successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
