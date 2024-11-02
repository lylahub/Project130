import { db, storage } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, setDoc ,Timestamp, updateDoc, deleteDoc, orderBy, doc, query, getDoc, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { SplitStrategy, EqualSplitStrategy, CustomSplitStrategy } from "./SplitStrategy.js";

const addSharedExpense = async (userId, amount, memo, participants, payer, split = {}, splitStrategy = new EqualSplitStrategy()) => {
    const entriesRef = collection(db, "users", userId, "split-payment");
    try {
        const shares = splitStrategy.calculateShare(amount, participants, split);

        await addDoc(entriesRef, {
            amount: amount,
            payer: payer,
            participants: shares,
            note: memo,
            created_at: serverTimestamp()
        });
        return shares;
    }
    catch (error) {
        console.log("Error", error);
    }
}


const updateBalances = async (participants, payer, totalAmount, shares) => {
    try {
        participants.forEach(async (participant) => {
            if (participant === payer) return; 

            const payerRef = doc(db, "users", payer, "balances");
            const participantRef = doc(db, "users", participant, "balances");

            const payerDoc = await getDoc(payerRef);
            const participantDoc = await getDoc(participantRef);

            let payerBalance = payerDoc.exists() ? payerDoc.data().balance || [] : [];
            let participantBalance = participantDoc.exists() ? participantDoc.data().balance || [] : [];

            const participantOwesPayer = shares[participant];

            let payerBalanceEntry = payerBalance.find(b => b.id === participant);
            if (payerBalanceEntry) {
                payerBalanceEntry.amount += participantOwesPayer;
            } else {
                payerBalance.push({ id: participant, amount: participantOwesPayer });
            }

            let participantBalanceEntry = participantBalance.find(b => b.id === payer);
            if (participantBalanceEntry) {
                participantBalanceEntry.amount -= participantOwesPayer;
            } else {
                participantBalance.push({ id: payer, amount: -participantOwesPayer });
            }

            await updateDoc(payerRef, { balance: payerBalance });
            await updateDoc(participantRef, { balance: participantBalance });
        });

        console.log("Balances updated successfully with debt tracking!");

    } catch (error) {
        console.log("Error updating balances with debts:", error);
    }
};
