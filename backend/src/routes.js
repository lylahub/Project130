// routes.js
import express from "express";
import { addNewCategory, addDefaultCategories, addEntryToCategory, resetMonthlyAmounts, getCategoryAmount, getCategoryDetails, getUserCategories, fetchTransactions, getOverallAmount } from "./categoricalBookkeeping.js";
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

    //for test fetching balances
    router.get("/group/fetch-balances", async (req, res) => {
        const { userId, groupId } = req.query;

        // check relevant instance
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "No group budget for this user" });
        }

        try {
            const balances = await userGroupBudget.fetchBalances(groupId);

            res.status(200).json(balances);
        } catch (error) {
            res.status(500).json({ error: "Fail in fetching balances", details: error.message });
        }
    });


    // Route to add entry to a group
    router.post("/group/add-entry", async (req, res) => {
        const { groupId, payer, amount, memo, shares, userId } = req.body;

        // Retrieve the existing GroupBudget instance from groupBudgets
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }

        try {
            const results = await userGroupBudget.addEntry(groupId, payer, amount, memo, shares);
            res.status(201).json({ message: "Entry added successfully", results });
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


    router.post("/group/calculate-settlement", async (req, res) => {
        const { userId, groupId, payer, amount, splitStrategy, split } = req.body;
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }

        try {
            const settlementResults = await userGroupBudget.calculateSettlement(
                groupId, payer, amount, splitStrategy, split
            );
            res.status(200).json(settlementResults);
        } catch (error) {
            res.status(500).json({ error: "Failed to calculate settlement", details: error.message });
        }
    });


    //fetch group entries
    router.get("/group/fetch-entries", async (req, res) => {
        const { groupId, userId } = req.query;
        const userGroupBudget = groupBudgets[userId];
        
        if (!userGroupBudget) {
          return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }
      
        try {
          const entries = await userGroupBudget.fetchEntries(groupId);
          res.status(200).json(entries);
        } catch (error) {
          console.error("Error fetching entries:", error);
          res.status(500).json({ error: "Failed to fetch entries", details: error.message });
        }
      });

    //zero balances for the group
    router.post("/group/pay-balance", async (req, res) => {
        const { userId, groupId, payer, payee, amount } = req.body;
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }
        try {
            await userGroupBudget.payBalances(groupId, payer, payee, amount);
            res.status(200).json({
                message: "Balance successfully cleared between payer and payee",
                payer,
                payee
            });
            
        } catch(error) {
            console.log("Error clearing balance:", error);
            res.status(500).json({
                error: "Failed to clear balance",
                details: error.message
            });
        }
    });

    //Mark all paid
    router.post("/group/mark-all-paid", async (req, res) => {
        const { userId, groupId, payer } = req.body;
        const userGroupBudget = groupBudgets[userId];
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }
        try {
            await userGroupBudget.markAllAsPaidForParticipant(groupId, payer, userId);
            res.status(200).json({
                message: `All transactions between ${payer} and ${userId} in group ${groupId} marked as paid;`,
                payer,
                userId,
                groupId
            });
        } catch (error) {
            console.error("Error marking all transactions as paid:", error);
            res.status(500).json({
                error: "Failed to mark all transactions as paid",
                details: error.message
            });
        }
    });
    
    
    //MarkPaid
    router.post("/group/mark-paid", async (req, res) => {
        const { userId, groupId, transactionId, payer } = req.body;
        const userGroupBudget = groupBudgets[userId];
        
        if (!userGroupBudget) {
            return res.status(400).json({ error: "GroupBudget instance not found for this user" });
        }
        
        try {
            await userGroupBudget.markTransactionAsPaid(groupId, transactionId, userId, payer);
            
            res.status(200).json({
                message: `Transaction ${transactionId} marked as paid for user ${userId} in group ${groupId}.`,
                transactionId,
                userId,
                groupId
            });
        } catch (error) {
            console.error("Error marking transaction as paid:", error);
    
            res.status(500).json({
                error: "Failed to mark transaction as paid",
                details: error.message
            });
        }
    });
    
    
    

    // Add default categories
    router.post("/categories/default", async (req, res) => {
        const { userId, icons } = req.body;
        try {
            const result = await addDefaultCategories(userId, icons);
            if (result.success) {
                res.status(200).json({
                    message: "Default categories added successfully",
                    categories: result.categories
                });
            } else {
                res.status(500).send({ error: result.message });
            }
        } catch (error) {
            res.status(500).send({ error: "Failed to add default categories", details: error.message });
        }
    });
    
    // Add new categories
    router.post("/categories", async (req, res) => {
        const { userId, categoryName, icon } = req.body;
        try {
            const category = await addNewCategory(userId, categoryName, icon);

            console.log("Category Response:", category);
            res.status(201).json({ success: true, category }); 
        } catch (error) {
            console.error("Error adding category:", error.message);
            res.status(400).json({ success: false, message: "Error adding category", details: error.message });  // 处理错误返回 JSON
        }
    });
    
    // Add entry to a category
    router.post("/categories/entry", async (req, res) => {
        const { userId, categoryName, amount, note, incomeExpense } = req.body;
        try {
          const newEntry = await addEntryToCategory(userId, categoryName, amount, note, incomeExpense);
          res.status(201).json({ message: "Entry added successfully", entry: newEntry }); // Ensure JSON response
        } catch (error) {
          console.error("Error adding entry:", error);
          res.status(400).json({ error: "Error adding entry", details: error.message });
        }
      });
      
    // get category details
    router.get("/categories/details", async (req, res) => {
        const { userId, categoryName } = req.query;
    
        try {
            const details = await getCategoryDetails(userId, categoryName);
            if (details && details.length > 0) {
                res.status(200).json({ entries: details, message: "Successfully received" });
            } else {
                res.status(404).json({ entries: [] });
            }
        } catch (error) {
            res.status(400).json({ error: "Failed to fetch category details", entries: error.message });
        }
    });
    

    // amount
    router.get("/categories/amount", async (req, res) => {
        const { userId, categoryName } = req.query;
        try {
            const amounts = await getCategoryAmount(userId, categoryName);
            res.status(200).json({ amounts });
        } catch (error) {
            res.status(400).json({ error: "Failed to fetch category amount", details: error.message });
        }
    });

    // reset monthly amount
    router.post("/categories/reset-monthly", async (req, res) => {
        const { userId } = req.body;
        try {
            await resetMonthlyAmounts(userId);
            res.status(200).send("Monthly amounts reset successfully");
        } catch (error) {
            res.status(500).json({ error: "Failed to reset monthly amounts", details: error.message });
        }
    });

    // get all categories
    router.get("/categories/user-categories", async (req, res) => {
        const { userId } = req.query;
        try {
            const categories = await getUserCategories(userId);
            res.status(200).json({ categories });
        } catch (error) {
            res.status(400).json({ error: "Failed to fetch user categories", details: error.message });
        }
    });

    // fetch all transactions
    router.get("/categories/transactions", async (req, res) => {
        const { userId } = req.query;
    
        try {
            const transactions = await fetchTransactions(userId);
            res.status(200).json({ transactions });
        } catch (error) {
            res.status(400).json({ error: "Failed to fetch transactions", details: error.message });
        }
    });

    //overall monthly amount and total amount of a user
    router.get("/categories/overall", async (req, res) => {
        const { userId } = req.query;
        try {
            const overallAmounts = await getOverallAmount(userId);
            if (overallAmounts) {
                res.status(200).json(overallAmounts);
            } else {
                res.status(404).json({ error: "User data not found" });
            }
        } catch (error) {
            console.error("Failed to fetch overall amounts:", error);
            res.status(400).json({ error: "Failed to fetch overall amounts", details: error.message });
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
            const uid = await login(email, password); 
            res.status(200).json({ message: "User logged in successfully!", userId: uid }); 
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

