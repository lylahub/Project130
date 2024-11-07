// routes.js
import express from "express";
import { addNewCategory, addDefaultCategories, addEntryToCategory, resetMonthlyAmounts, getCategoryAmount, getCategoryDetails, getUserCategories, fetchTransactions } from "./categoricalBookkeeping.js";
import { login, signUp, signOutUser, emailVerification, resetPassword } from "./auth.js";

const router = express.Router();

export default function (groupBudgets, clients) {
    // Add this root route to respond to GET / requests
    router.get('/', (req, res) => {
        console.log(groupBudgets)
        res.send('Welcome to the server! It is running correctly.');
    });

    
    // Route to create a new group
    router.post("/group/create", async (req, res) => {
        const { userId, groupName, participantEmails } = req.body;

        // Retrieve the existing GroupBudget instance from groupBudgets
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }

        try {
            await userGroupBudget.createGroup(groupName, participantEmails, clients);
            res.status(200).send(`Group '${groupName}' created successfully`);
        } catch (error) {
            res.status(500).send({ error: "Failed to create group", details: error.message });
        }
    });

    // Route to add entry to a group
    router.post("/group/add-entry", async (req, res) => {
        const { userId, groupId, payer, amount, memo, split, splitStrategy } = req.body;

        // Retrieve the existing GroupBudget instance from groupBudgets
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }

        try {
            const shares = await userGroupBudget.addEntry(groupId, payer, amount, memo, split, splitStrategy);
            res.status(201).json({ message: "Entry added successfully", shares });
        } catch (error) {
            res.status(500).json({ error: "Failed to add entry", details: error.message });
        }
    });

    // Route to fetch all groups
    router.get("/group/fetch-groups", async (req, res) => {
        const { userId } = req.query; // fetch userId from query

        // Retrieve the existing GroupBudget instance from groupBudgets
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }

        try {
            const groups = await userGroupBudget.fetchGroups(clients);
            res.status(200).json({ groups });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch groups", details: error.message });
        }
    });

    // Add default categories
    router.post("/categories/default", async (req, res) => {
        const { userId } = req.body;
        try {
            await addDefaultCategories(userId);
            res.status(200).send("Default categories added successfully");
        } catch (error) {
            res.status(500).send({ error: "Failed to add default categories" });
        }
    });

    // Add new categories
    router.post("/categories", async (req, res) => {
        const { userId, categoryName, icon } = req.body;
        try {
            await addNewCategory(userId, categoryName, icon);
            res.status(201).send("Categories added successfully");
        } catch (error) {
            res.status(400).send("Error adding category", error);
        }
    });

    // Add entry to a category
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

    // User sign up
    router.post("/signup", async (req, res) => {
        const { email, password } = req.body;
        try {
            await signUp(email, password);
            res.status(200).json({ message: "User registered successfully! Verification email sent." });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // User login
    router.post("/login", async (req, res) => {
        const { email, password } = req.body;
        try {
            await login(email, password);
            res.status(200).json({ message: "User logged in successfully!" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // User sign out
    router.post("/logout", async (req, res) => {
        try {
            await signOutUser();
            res.status(200).json({ message: "User signed out successfully." });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Send verification email
    router.post("/send-verification", async (req, res) => {
        try {
            await emailVerification();
            res.status(200).json({ message: "Verification email sent successfully!" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Reset password
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

    return router;
}

