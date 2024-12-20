import { db, storage } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, setDoc ,Timestamp, updateDoc, deleteDoc, orderBy, doc, query, getDoc, where, serverTimestamp, runTransaction, writeBatch} from "firebase/firestore";
import { SplitStrategy, EqualSplitStrategy, CustomSplitStrategy } from "./SplitStrategy.js";
import { Observable } from "./Observer.js";

//TODO: fix inconsistency of fetching groups
/**
 * Represents a group budget system with participants, entries, and balances.
 * @extends Observable
 */
export class GroupBudget extends Observable {
    /**
     * Creates a GroupBudget instance for a user.
     * @param {string} userId - The ID of the user creating or managing the group.
     */
    constructor(userId) {
        super();
        this.userId = userId; 
        this.groups = {};
    }

    /**
     * Finds participants in the database by their email addresses.
     * @async
     * @param {string[]} emails - Array of participant email addresses.
     * @returns {Promise<string[]>} Array of participant user IDs.
     */
    async findParticipantsByEmail(emails) {
        const participantsUIDs = [];
        const usersRef = collection(db, "users");

        try {
            for (const email of emails) {
                const q = query(usersRef, where("email", "==", email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    querySnapshot.forEach((doc) => {
                        participantsUIDs.push(doc.id);
                    });
                //if exist, create relatedUsers, add entry for each group members
                } else {
                    console.log(`User with email ${email} not found.`);
                }
            }
            return participantsUIDs;
        } catch (error) {
            console.error("Error finding participants by email:", error);
            return [];
        }
    }

    /**
     * Creates a new group with the specified name and participants.
     * @async
     * @param {string} groupName - The name of the group.
     * @param {string[]} participantEmails - Array of participant email addresses.
     * @param {Object} clients - Client connections for WebSocket notifications.
     */
    async createGroup(groupName, participantEmails, clients) {
        try {
            const participantsUIDs = await this.findParticipantsByEmail(participantEmails);
            
            if (participantsUIDs.length !== participantEmails.length) {
                console.log("Invalid emails included, try again!");
                return;
            }
    
            if (!participantsUIDs.includes(this.userId)) {
                participantsUIDs.push(this.userId);
            }
    
            // remove duplicates
            const uniqueParticipantsUIDs = [...new Set(participantsUIDs)];
            
            const groupsRef = collection(db, "groups");
            const groupData = { 
                groupName: groupName,
                createdBy: this.userId,
                participants: uniqueParticipantsUIDs,
                created_at: serverTimestamp()
            };
    
            const groupDocRef = await addDoc(groupsRef, groupData);
            const groupId = groupDocRef.id;
    
            this.groups[groupId] = {
                groupId: groupId,
                groupName: groupName,
                createdBy: this.userId,
                participants: uniqueParticipantsUIDs,
                created_at: serverTimestamp(),
                balances: null,
                entriesInfo: null
            };
    
            // Initialize the clients array for this group :)
            this.clients[groupId] = uniqueParticipantsUIDs.map(uid => {
                return { uid, socket: clients[uid] || null };
            });
    
            const data = {
                action: 'newGroup',
                groupId: groupId,
                entry: this.groups[groupId]
            };
    
            this.notifyGroup(groupId, data);
    
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

    /**
     * Adds a new entry to a group and updates balances.
     * @async
     * @param {string} groupId - The ID of the group.
     * @param {string} payer - The user ID of the payer.
     * @param {number} amount - The amount of the transaction.
     * @param {string} memo - A note or memo for the entry.
     * @param {Object} shares - An object mapping participant IDs to their share amounts.
     * @returns {Promise<Object>} The new entry data with updated balances.
     */
    async addEntry(groupId, payer, amount, memo, shares) {
        const groupRef = doc(db, "groups", groupId);
        const groupSnapshot = await getDoc(groupRef);
    
        if (!groupSnapshot.exists()) {
            console.log("Group does not exist.");
            return;
        }
    
        try {
            const entriesRef = collection(db, "groups", groupId, "entries");
            const paidStatus = {};
            for (const participant in shares) {
                if (participant === payer) {
                    paidStatus[participant] = true; // payer is marked as true
                } else {
                    paidStatus[participant] = false; // other participants are marked as false
                }
            }
    
            let entryData = {

                amount: amount,
                payer: payer,
                participants: shares,
                memo: memo,
                created_at: serverTimestamp(),
                paidStatus: paidStatus
            };
    
            const updatedEntries = await addDoc(entriesRef, entryData);
    
            const balances = await this.updateBalances(groupId, Object.keys(shares), payer, shares);
    
            entryData = {
                ...entryData,
                balances: balances
            };
    
            const data = {
                action: 'newEntry',
                groupId: groupId,
                entryId: updatedEntries.id,
                entry: entryData
            };
            
            this.notifyGroup(groupId, data);
    
            console.log("Entry added successfully with balances updated.");
            return data;
    
        } catch (error) {
            console.error("Error in adding entry:", error);
        }
    }

    /**
     * Updates the balances in a group based on a new entry.
     * @async
     * @param {string} groupId - The ID of the group.
     * @param {string[]} participants - Array of participant user IDs.
     * @param {string} payer - The user ID of the payer.
     * @param {Object} shares - An object mapping participant IDs to their share amounts.
     * @returns {Promise<Object>} The updated balances for the group.
     */
    async updateBalances(groupId, participants, payer, shares) {
        const groupRef = doc(db, "groups", groupId);
        const balancesRef = collection(groupRef, "balances");
        const balances = {}
    
        try {
            for (const participant of participants) {
                if (participant === payer) continue;
    
                const payerBalanceRef = doc(balancesRef, payer);
                const participantBalanceRef = doc(balancesRef, participant);
    
                // Run a transaction to ensure atomic updates
                await runTransaction(db, async (transaction) => {
                    const payerBalanceDoc = await transaction.get(payerBalanceRef);
                    const participantBalanceDoc = await transaction.get(participantBalanceRef);

                    let payerBalance = payerBalanceDoc.exists() ? payerBalanceDoc.data().owes || {} : {};
                    let participantBalance = participantBalanceDoc.exists() ? participantBalanceDoc.data().owes || {} : {};
    
                    const participantOwesPayer = shares[participant];

                    // solved: ensure type is not string
                    payerBalance[participant] = parseFloat(payerBalance[participant] || 0) + parseFloat(participantOwesPayer);
                    participantBalance[payer] = parseFloat(participantBalance[payer] || 0) - parseFloat(participantOwesPayer);

    
                    // Set updated balances within the transaction
                    transaction.set(payerBalanceRef, { owes: payerBalance }, { merge: true });
                    transaction.set(participantBalanceRef, { owes: participantBalance }, { merge: true });

                    balances[payer] = balances[payer] || { creditor: payer, owes: {} };
                    balances[payer].owes[participant] = payerBalance[participant];

                    balances[participant] = balances[participant] || { creditor: participant, owes: {} };
                    balances[participant].owes[payer] = participantBalance[payer];
                });
            }
            return balances
    
        } catch (error) {
            console.error("Error updating Balances: ", error);
            return error;
        }
    }
    
    //fixed with promiseall
    /**
     * Fetches the groups that a user belongs to.
     * @async
     * @param {Object} clients - Client connections for WebSocket notifications.
     * @returns {Promise<Object>} A map of group IDs to group details.
     */
    async fetchGroups(clients) {
        const groupsRef = collection(db, "groups");
        try {
          const q = query(groupsRef, where("participants", "array-contains", this.userId));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            console.log("Fetched groups for user:", this.userId);
            const groupPromises = querySnapshot.docs.map(async (doc) => {
              const curData = doc.data();
              const groupId = doc.id;
      
              console.log(curData.entries);
      
              // Fetch entries and balances for each group concurrently
              const entriesInfo = await this.fetchEntries(groupId);
              const balances = await this.fetchBalances(groupId);
              this.groups[groupId] = {
                groupId: groupId,
                groupName: curData.groupName,
                participants: curData.participants,
                created_at: curData.created_at,
                entriesInfo: entriesInfo,
                balances: balances,
              };
      
              this.clients[groupId] = curData.participants.map(uid => ({
                uid,
                socket: clients[uid] || null,
              }));
            });
      
            await Promise.all(groupPromises);
            console.log("Final groups:", this.groups);
            return this.groups;
          } else {
            console.log("No groups found for user:", this.userId);
            return {};
          }
        } catch (error) {
          console.error("Error in fetching groups!", error);
        }
      }

    /**
     * Fetches all entries for a specific group.
     * @async
     * @param {string} groupId - The ID of the group.
     * @returns {Promise<Object>} A map of entry IDs to their respective details.
     */
    async fetchEntries(groupId) {
        const entriesRef = collection(db, "groups", groupId, "entries");
        const entriesSnapshot = await getDocs(entriesRef);
        let entries = {};
        
        entriesSnapshot.forEach((doc) => {
            const curData = doc.data();
            const entryId = doc.id;
            
            // Update: Add paidStatus to the entry data
            entries[entryId] = {
                entryId: entryId,
                amount: curData.amount,
                payer: curData.payer,
                created_at: curData.created_at,
                memo: curData.memo || " ",
                participants: curData.participants || [],
                paidStatus: curData.paidStatus || {}  // Ensure we fetch the paidStatus :)
            };
        });
        
        return entries;
    }

    /**
     * Fetches all balances for a specific group.
     * @async
     * @param {string} groupId - The ID of the group.
     * @returns {Promise<Object>} A map of creditor IDs to their respective balances.
     */
    async fetchBalances(groupId) {
        const balancesRef = collection(db, "groups", groupId, "balances");
        const balancesSnapshot = await getDocs(balancesRef);
    
        let balances = {};
        if (balancesSnapshot.empty) {
            console.log("No balances found in the 'balances' subcollection.");
            return balances; // Return an empty object if there are no documents
        }
    
        balancesSnapshot.forEach((doc) => {
            const creditorId = doc.id;
            const curData = doc.data();
        

            balances[creditorId] = {
                creditor: creditorId,
                owes: curData.owes || {} 
            };
        });
    
        console.log("Final Balances:", balances);
        return balances;
    }

    /**
     * Calculates settlements for a group transaction.
     * @async
     * @param {string} groupId - The ID of the group.
     * @param {string} payer - The user ID of the payer.
     * @param {number} amount - The total amount of the transaction.
     * @param {string} splitStrategyType - The type of split strategy to use ("EqualSplit" or "CustomSplit").
     * @param {Object} [split={}] - Custom split details if using "CustomSplit".
     * @returns {Promise<Object>} Settlement details including total expense, shares, and settlements.
     */
    async calculateSettlement(groupId, payer, amount, splitStrategyType, split = {}) {
        const groupRef = doc(db, "groups", groupId);
        const groupSnapshot = await getDoc(groupRef);

        if (!groupSnapshot.exists()) {
            throw new Error("Group does not exist.");
        }

        const groupData = groupSnapshot.data();
        const participants = groupData.participants;

        let splitStrategy;
        if (splitStrategyType === "EqualSplit") {
            splitStrategy = new EqualSplitStrategy();
        } else if (splitStrategyType === "CustomSplit") {
            splitStrategy = new CustomSplitStrategy();
        } else {
            throw new Error("Invalid split strategy type.");
        }

        const shares = splitStrategy.calculateShare(amount, participants, split);

        const settlements = participants.map(participant => ({
            from: participant,
            to: payer,
            amount: shares[participant] || 0
        }));

        return {
            totalExpense: amount,
            settlements,
            shares: shares
        };
    }
    /**
     * Updates balances for a transaction by adjusting payer and payee balances.
     * @async
     * @param {string} groupId - The ID of the group.
     * @param {string} payer - The user ID of the payer.
     * @param {string} payee - The user ID of the payee.
     * @param {number|null} [amount=null] - The amount to adjust (clears balance if null).
     */
    async payBalances(groupId, payer, payee, amount = null) {
        try {
            const groupRef = doc(db, "groups", groupId);
            const balancesRef = collection(groupRef, "balances");
            const payerRef = doc(balancesRef, payer);
            const payeeRef = doc(balancesRef, payee);
            const payerBalanceDoc = await getDoc(payerRef);
            const payeeBalanceDoc = await getDoc(payeeRef);
            let payerBalance = payerBalanceDoc.exists() ? payerBalanceDoc.data().owes || {} : {};
            let payeeBalance = payeeBalanceDoc.exists() ? payeeBalanceDoc.data().owes || {} : {};
            if (amount !== null) {
                // Adjust balances based on the amount
                if (payerBalance[payee] !== undefined) {
                    payerBalance[payee] = payerBalance[payee] + amount;
                }
                if (payeeBalance[payer] !== undefined) {
                    payeeBalance[payer] = payeeBalance[payer] - amount;
                }
            } else {
                // Clear balances if no amount is provided
                payerBalance[payee] = 0;
                payeeBalance[payer] = 0;
            }

            await updateDoc(payerRef, { owes: payerBalance || 0 });
            await updateDoc(payeeRef, { owes: payeeBalance || 0 });

            const data = {
                action: 'newBalance',
                groupId: groupId,
                payer: payer,
                payee: payee,
                entryPayer: {
                    owes : {[payee]: payerBalance[payee]}
                },
                entryPayee: {
                    owes : {[payer]: payeeBalance[payer]}
                }

            };
            this.notifyGroup(groupId, data);
        }
        catch(error) {
            console.error("Error updating balances: ", error);
        }
    }

    /**
     * Marks a specific transaction as paid by a participant.
     * @async
     * @param {string} groupId - The ID of the group.
     * @param {string} transactionId - The ID of the transaction.
     * @param {string} userId - The user ID of the participant marking as paid.
     * @param {string} payer - The user ID of the payer.
     */
    async markTransactionAsPaid(groupId, transactionId, userId, payer) {
        try {
            const groupRef = doc(db, "groups", groupId);
            const transactionRef = doc(collection(groupRef, "entries"), transactionId);
            const transactionDoc = await getDoc(transactionRef);
            
            if (!transactionDoc.exists()) {
                throw new Error("Transaction not found");
            }
    
            const transactionData = transactionDoc.data();
    
            if (!transactionData.paidStatus) {
                transactionData.paidStatus = {};
            }
    
            // Only update the current user's payment status if they are a participant in the transaction
            if (transactionData.participants && Object.keys(transactionData.participants).includes(userId)) {
                // Mark the current user as having paid if they are not the payer
                if (payer !== userId) {
                    transactionData.paidStatus[userId] = true;
                }
            }
    
            // Update the document with the new paidStatus
            await updateDoc(transactionRef, { paidStatus: transactionData.paidStatus });
    
            // Notify the group about the updated paidStatus
            const data = {
                action: 'markPaid',
                groupId: groupId,
                transactionId: transactionId,
                userId: userId,
                paidStatus: transactionData.paidStatus
            };
    
            this.notifyGroup(groupId, data);
    
        } catch (error) {
            console.error("Error marking transaction as paid:", error);
        }
    }

    /**
     * Marks all transactions for a participant as paid in a specific group.
     * @async
     * @param {string} groupId - The ID of the group.
     * @param {string} payer - The user ID of the payer.
     * @param {string} userId - The user ID of the participant marking as paid.
     */
    async markAllAsPaidForParticipant(groupId, payer, userId) {
        try {
            const groupRef = doc(db, "groups", groupId);
            const entriesRef = collection(groupRef, "entries");
            const entriesSnapshot = await getDocs(entriesRef);
            const batch = writeBatch(db);
    
            // Iterate over each transaction entry
            entriesSnapshot.forEach((doc) => {
                const transactionData = doc.data();
    
                if (!transactionData.paidStatus) {
                    transactionData.paidStatus = {};
                }
    
                if (transactionData.participants?.[userId] && transactionData.payer !== userId) {
                    // Mark the userId as paid for this transaction if they are not the payer
                    transactionData.paidStatus[userId] = true;
                    batch.update(doc.ref, { paidStatus: transactionData.paidStatus });
                }
            });
    
            await batch.commit();
    
            const data = {
                action: 'markAllPaid',
                groupId: groupId,
                payer: payer,
                userId: userId,
            };
            this.notifyGroup(groupId, data);
            console.log(`All transactions for ${payer} and ${userId} in group ${groupId} marked as paid.`);
        } catch (error) {
            console.error("Error marking all transactions as paid:", error);
        }
    }
}

export default GroupBudget;