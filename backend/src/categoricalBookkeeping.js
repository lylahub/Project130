import { db, storage } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, setDoc ,Timestamp, updateDoc, deleteDoc, orderBy, doc, query, getDoc, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const defaultCategories = [
    //random url for now
    { name: "Food", icon: "icon_food.png" },
    { name: "Entertainment", icon: "icon_entertainment.png" },
    { name: "Traffic", icon: "icon_transport.png" },
    { name: "Shopping", icon: "icon_shopping.png" }
  ];

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
            await setDoc(newCategoryRef, {
                name: categoryName,
                icon: icon,
                totalAmount: 0,
                monthlyAmount: 0,
                created_at: serverTimestamp()
            });
            console.log("Success");
            return { success: true, message: "Category added successfully" };
        } catch (error) {
            console.error("Error adding category:", error);
        }
    }
};

const addDefaultCategories = async (userId) => {
    const categoriesRef = collection(db, "users", userId, "categories");
    const batch = writeBatch(db);
  
    for (const category of defaultCategories) {
      const newCategoryRef = doc(categoriesRef, category.name);
      batch.set(newCategoryRef, {
        name: category.name,
        icon: category.icon,
        totalAmount: 0,
        monthlyAmount: 0,
        created_at: serverTimestamp()
      });
    }
  
    try {
      await batch.commit();
      console.log("Success");
    } catch (error) {
      console.error("Error", error);
    }
  };

  const addEntryToCategory = async (userId, categoryName, amount, memo, incomeExpense="expense") => {
    const categoryRef = doc(db, "users", userId, "categories", categoryName);
    const entriesRef = collection(db, "users", userId, "categories", categoryName, "entries");
    const userRef = doc(db, "users", userId);

    try {
        await addDoc(entriesRef, {
            amount: amount,
            type: incomeExpense,
            note: memo,
            created_at: serverTimestamp()
        });

        const categoryDoc = await getDoc(categoryRef);

        if (categoryDoc.exists()) {
            const data = categoryDoc.data();
            //avoid no totalAmount defined
            let newTotalAmount = data.totalAmount || 0;
            let newMonthlyAmount = data.monthlyAmount || 0;

            if (incomeExpense === "income") {
                newTotalAmount += amount;
                newMonthlyAmount += amount;
            } else {
                newTotalAmount -= amount;
                newMonthlyAmount -= amount;
            }

            // Update the category document with the new amounts
            await updateDoc(categoryRef, {
                totalAmount: newTotalAmount,
                monthlyAmount: newMonthlyAmount
            });
            console.log("Category updated successfully");
        }

        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            let overallTotalAmount = userData.overallTotalAmount || 0;
            let overallMonthlyAmount = userData.overallMonthlyAmount || 0;

            // Adjust the overall amounts based on income or expense
            if (incomeExpense === "income") {
                overallTotalAmount += amount;
                overallMonthlyAmount += amount;
            } else {
                overallTotalAmount -= amount;
                overallMonthlyAmount -= amount;
            }
            await updateDoc(userRef, {
                overallTotalAmount: overallTotalAmount,
                overallMonthlyAmount: overallMonthlyAmount
            });
            console.log("User totals updated successfully");
        }
    } catch (error) {
        console.error("Error adding entry to category:", error);
    }
};

const getCategoryDetails = async (userId, categoryName) => {
    const categoryDocRef = doc(db, "users", userId, "categories", categoryName);
    const entriesRef = collection(categoryDocRef, "entries");

    try {
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
        console.log("Error", error);
    }
};

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
    }
};


export { addNewCategory, addDefaultCategories, addEntryToCategory, resetMonthlyAmounts, deleteCategory ,getCategoryAmount, getCategoryDetails, getUserCategories, fetchTransactions }





