import { db, storage } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, setDoc ,Timestamp, updateDoc, deleteDoc, orderBy, doc, query, getDoc, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const defaultCategories = [
    { name: "Food" },
    { name: "Entertainment"  },
    { name: "Traffic" },
    { name: "Shopping" }
  ];
/**
 * Adds a new category for a user.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @param {string} categoryName - The name of the category.
 * @param {string} icon - Icon URL or identifier for the category.
 * @returns {Promise<Object>} An object containing success status and details of the operation.
 */
  const addNewCategory = async (userId, categoryName, icon) => {
    const categoriesRef = collection(db, "users", userId, "categories"); 
    const q = query(categoriesRef, where("name", "==", categoryName));
    const qSnapshot = await getDocs(q);

    if (!qSnapshot.empty) {
        console.log("Category exists");
        return { success: false, message: "Category already exists" };

    } else {
        const newCategoryRef = doc(categoriesRef, categoryName); 
        try {
            let categoryData = {
                name: categoryName,
                icon: icon,
                totalAmount: 0,
                monthlyAmount: 0,
                created_at: serverTimestamp()
            };
            await setDoc(newCategoryRef, categoryData);

            categoryData.categoryId = newCategoryRef.id;
            return { success: true, categoryData };
        } catch (error) {
            console.error("Error adding category:", error);
            return { success: false, message: "Error adding category", details: error.message };
        }
    }
};

/**
 * Adds default categories for a user.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @param {string[]} icons - Array of icons corresponding to the default categories.
 * @returns {Promise<Object>} An object containing success status and the added categories.
 */
const addDefaultCategories = async (userId, icons) => {
    const categoriesRef = collection(db, "users", userId, "categories");
    const batch = writeBatch(db);
    const addedCategories = [];
  
    defaultCategories.forEach((category, index) => {
      const newCategoryRef = doc(categoriesRef, category.name);
      const categoryData = {
        name: category.name,
        icon: icons[index],
        totalAmount: 0,
        monthlyAmount: 0,
        created_at: serverTimestamp(),
        categoryId: newCategoryRef.id
      };
      batch.set(newCategoryRef, categoryData);
      addedCategories.push(categoryData);
    });
  
    try {
      await batch.commit();
      console.log("Default categories added successfully.");
      return { success: true, categories: addedCategories };
    } catch (error) {
      console.error("Error adding default categories:", error);
      return { success: false, message: "Error adding default categories", details: error.message };
    }
};


/**
 * Adds an entry to a specific category.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @param {string} categoryName - The name of the category.
 * @param {number} amount - The amount for the entry.
 * @param {string} memo - A note for the entry.
 * @param {string} incomeExpense - The type of entry, either "income" or "expense".
 * @returns {Promise<Object|null>} The entry data and updated totals or null if an error occurs.
 */

const addEntryToCategory = async (userId, categoryName, amount, memo, incomeExpense = "expense") => {
    const categoryRef = doc(db, "users", userId, "categories", categoryName);
    const entriesRef = collection(db, "users", userId, "categories", categoryName, "entries");
    const userRef = doc(db, "users", userId);

    // Ensure amount is a valid number
    amount = parseFloat(amount);
    if (isNaN(amount)) {
        alert("Please enter a valid number for the amount.");
        return;
    }

    try {
        if (typeof amount !== 'number') {
            throw new Error("Amount must be a number");
        }
        if (!["income", "expense"].includes(incomeExpense)) {
            throw new Error("Invalid incomeExpense type");
        }

        console.log("Adding entry with values:", { userId, categoryName, amount, memo, incomeExpense });

        // Add the new entry to the entries collection
        const newEntryRef = await addDoc(entriesRef, {
            amount: amount,
            type: incomeExpense,
            note: memo,
            created_at: serverTimestamp()
        });

        const newEntrySnapshot = await getDoc(newEntryRef);

        // Calculate adjustment for totals based on entry type
        const adjustment = incomeExpense === "income" ? amount : -amount;

        const categoryDoc = await getDoc(categoryRef);
        let currentTotalAmount = categoryDoc.exists() ? categoryDoc.data().totalAmount || 0 : 0;
        let currentMonthlyAmount = categoryDoc.exists() ? categoryDoc.data().monthlyAmount || 0 : 0;

        await updateDoc(categoryRef, {
            totalAmount: currentTotalAmount + adjustment,
            monthlyAmount: currentMonthlyAmount + adjustment
        });

        // Fetch current user totals
        const userDoc = await getDoc(userRef);
        let currentOverallTotalAmount = userDoc.exists() ? userDoc.data().overallTotalAmount || 0 : 0;
        let currentOverallMonthlyAmount = userDoc.exists() ? userDoc.data().overallMonthlyAmount || 0 : 0;
        
        await updateDoc(userRef, {
            overallTotalAmount: currentOverallTotalAmount + adjustment,
            overallMonthlyAmount: currentOverallMonthlyAmount + adjustment
        });
        const newEntryData = {
            id: newEntryRef.id,
            ...newEntrySnapshot.data(),
            overallTotalAmount: currentOverallTotalAmount + adjustment,
            overallMonthlyAmount: currentOverallMonthlyAmount + adjustment,
            totalAmount: currentTotalAmount + adjustment,
            monthlyAmount: currentMonthlyAmount + adjustment
        };

        console.log("Entry added and totals updated successfully");

        return newEntryData;

    } catch (error) {
        console.error("Error adding entry to category:", error);
        return null; // Handle errors as needed
    }
};


/**
 * Retrieves all details of a specific category.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @param {string} categoryName - The name of the category.
 * @returns {Promise<Object[]>} An array of entries in the category.
 */
const getCategoryDetails = async (userId, categoryName) => {
    try {
        const categoryDocRef = doc(db, "users", userId, "categories", categoryName);
        const entriesRef = collection(categoryDocRef, "entries");

        console.log("Fetching entries for category path:", entriesRef.path);
        const querySnapshot = await getDocs(entriesRef);
        let entries = [];

        querySnapshot.forEach((doc) => {
            entries.push({
                id: doc.id,
                ...doc.data()
            });
        });
        console.log("Category details:", entries);
        return entries;
    } catch (error) {
        console.log("Error fetching category details:", error);
    }
};

/**
 * Retrieves the overall amount (total and monthly) for a user.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} An object containing overall total and monthly amounts.
 */
const getOverallAmount = async (userId) => {
    const userRef = doc(db, "users", userId);
    try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const totalAmount = data.overallTotalAmount || 0;
            const monthlyAmount = data.overallMonthlyAmount || 0;
            return { totalAmount, monthlyAmount };
        } else {
            console.warn(`User document for ${userId} does not exist.`);
            return { totalAmount: 0, monthlyAmount: 0 }; 
        }
    } catch (error) {
        console.error("Error fetching overall amounts:", error);
        throw error;
    }
};

/**
 * Retrieves the total and monthly amounts for a specific category.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @param {string} categoryName - The name of the category.
 * @returns {Promise<Object>} An object containing total and monthly amounts.
 */
const getCategoryAmount = async (userId, categoryName) => {
    const categoryDocRef = doc(db, "users", userId, "categories", categoryName);
    try {
        const categoryDoc = await getDoc(categoryDocRef)
        if (categoryDoc.exists()) {
            const data = categoryDoc.data()
            const totalAmount = data.totalAmount
            const monthlyAmount = data.monthlyAmount
            return { totalAmount, monthlyAmount };
        }

    } catch {
        console.log("Error", error)
    }
}

/**
 * Deletes a specific category and all its entries.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @param {string} categoryName - The name of the category.
 * @returns {Promise<void>} Resolves when the category is deleted.
 */
const deleteCategory = async (userId, categoryName) => {
    const categoryDocRef = doc(db, "users", userId, "categories", categoryName);
    const entriesRef = collection(db, "users", userId, "categories", categoryName, "entries");

    try {
        const entriesSnapshot = await getDocs(entriesRef);
        const batch = writeBatch(db);
        entriesSnapshot.forEach((doc) => {
            batch.delete(doc.ref); 
        });

        batch.delete(categoryDocRef);
        await batch.commit();
        console.log("Category and its entries deleted successfully");
    } catch (error) {
        console.log("Error", error);
    }
};

/**
 * Resets the monthly amounts for all categories of a user.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
const resetMonthlyAmounts = async (userId) => {
    const categoriesRef = collection(db, "users", userId, "categories");

    try {
        const categoriesSnapshot = await getDocs(categoriesRef);
        const batch = writeBatch(db);
        categoriesSnapshot.forEach((doc) => {
            const categoryRef = doc.ref;
            batch.update(categoryRef, {
                monthlyAmount: 0 
            });
        });

        await batch.commit();
        console.log("Monthly amounts reset");
    } catch (error) {
        console.log("Error", error);
    }
};

/**
 * Retrieves all categories of a user.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @returns {Promise<Object[]>} An array of categories for the user.
 */
const getUserCategories = async (userId) => {
    const categoriesRef = collection(db, "users", userId, "categories");

    try {
        const querySnapshot = await getDocs(categoriesRef);
        let categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        console.log("User categories:", categories);
        return categories;
    } catch (error) {
        console.log("Error", error);
    }
};

/**
 * Fetches all transactions across all categories for a user.
 * @async
 * @function
 * @param {string} userId - The user ID.
 * @returns {Promise<Object[]>} An array of all transactions for the user.
 */
const fetchTransactions = async (userId) => {
    const categoriesRef = collection(db, "users", userId, "categories");

    try {
        const categoriesSnapshot = await getDocs(categoriesRef);
        let allTransactions = [];

        for (const categoryDoc of categoriesSnapshot.docs) {
            const entriesRef = collection(categoryDoc.ref, "entries");
            const entriesSnapshot = await getDocs(entriesRef);

            entriesSnapshot.forEach((entryDoc) => {
                allTransactions.push({
                    categoryId: categoryDoc.id,
                    ...entryDoc.data()
                });
            });
        }

        console.log("All transactions:", allTransactions);
        return allTransactions;
    } catch (error) {
        console.log("Error fetching transactions:", error);
        return [];
    }
};


export { addNewCategory, addDefaultCategories, addEntryToCategory, resetMonthlyAmounts, getOverallAmount, deleteCategory ,getCategoryAmount, getCategoryDetails, getUserCategories, fetchTransactions }





