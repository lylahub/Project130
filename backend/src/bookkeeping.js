import { db, storage } from "./firebaseConfig.js";
import {
    collection, addDoc, getDocs, setDoc, Timestamp, updateDoc, deleteDoc, orderBy, doc, query,
    getDoc, where, serverTimestamp, writeBatch
} from "firebase/firestore";
import { Observable } from "./Observer.js";

class Bookkeeping extends Observable {
    constructor(userId) {
        super();
        this.userId = userId;
    }

    static defaultCategories = [
        { name: "Food", icon: "icon_food.png" },
        { name: "Entertainment", icon: "icon_entertainment.png" },
        { name: "Traffic", icon: "icon_transport.png" },
        { name: "Shopping", icon: "icon_shopping.png" }
    ];

    async addNewCategory(categoryName, icon) {
        const categoriesRef = collection(db, "users", this.userId, "categories");
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
                this.notify({ action: 'categoryAdded', data: { categoryName, icon } });
                console.log("Category added successfully");
                return { success: true, message: "Category added successfully" };
            } catch (error) {
                console.error("Error adding category:", error);
            }
        }
    }

    async addDefaultCategories() {
        const categoriesRef = collection(db, "users", this.userId, "categories");
        const batch = writeBatch(db);

        for (const category of Bookkeeping.defaultCategories) {
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
            this.notify({ action: 'categoryAdded' });
            console.log("Default categories added successfully");
        } catch (error) {
            console.error("Error adding default categories:", error);
        }
    }

    async addEntryToCategory(categoryName, amount, memo, incomeExpense = "expense") {
        const categoryRef = doc(db, "users", this.userId, "categories", categoryName);
        const entriesRef = collection(db, "users", this.userId, "categories", categoryName, "entries");
        const userRef = doc(db, "users", this.userId);

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
                let newTotalAmount = data.totalAmount || 0;
                let newMonthlyAmount = data.monthlyAmount || 0;

                if (incomeExpense === "income") {
                    newTotalAmount += amount;
                    newMonthlyAmount += amount;
                } else {
                    newTotalAmount -= amount;
                    newMonthlyAmount -= amount;
                }

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

                this.notify({ action: 'entryAdded', data: { categoryName, amount, memo, incomeExpense } });
            }
        } catch (error) {
            console.error("Error adding entry to category:", error);
        }
    }
}

export default Bookkeeping;
