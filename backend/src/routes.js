import express from "express";
import { addNewCategory, addDefaultCategories, addEntryToCategory, resetMonthlyAmounts, getCategoryAmount, getCategoryDetails, getUserCategories, fetchTransactions } from "./categoricalBookkeeping.js";
import { login, signUp, signOutUser, emailVerification, resetPassword } from "./auth.js";

const router = express.Router();


// Add this root route to respond to GET / requests
router.get('/', (req, res) => {
    res.send('Welcome to the server! It is running correctly.');
});

//add default categories
router.post("/categories/default", async (req, res) => {
    const { userId } = req.body;
    try {
        await addDefaultCategories(userId);
        res.status(200).send("Default categories added successfully");
    } catch (error) {
        res.status(500).send({ error: "Failed to add default categories" });
    }
});

//add new categories
router.post("/categories", async(req, res) => {
    const { userId, categoryName, icon } = req.body;
    try {
        await addNewCategory(userId, categoryName, icon);
        res.status(201).send("Categories added successfully");
    } catch (error) {
        res.status(400).send("Error adding category", error);
    }
}); 

// add entry tp a category
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

router.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      await signUp(email, password);
      res.status(200).json({ message: "User registered successfully! Verification email sent." });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Login
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      await login(email, password);
      res.status(200).json({ message: "User logged in successfully!" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Signout
  router.post("/logout", async (req, res) => {
    try {
      await signOutUser();
      res.status(200).json({ message: "User signed out successfully." });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Verification email
  router.post("/send-verification", async (req, res) => {
    try {
      await emailVerification();
      res.status(200).json({ message: "Verification email sent successfully!" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // reset password
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
