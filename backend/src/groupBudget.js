import { db, storage } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, setDoc ,Timestamp, updateDoc, deleteDoc, orderBy, doc, query, getDoc, where, serverTimestamp, runTransaction, writeBatch} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { SplitStrategy, EqualSplitStrategy, CustomSplitStrategy } from "./SplitStrategy.js";
import { Observable } from "./Observer.js";

//TODO: fix inconsistency of fetching groups
export class GroupBudget extends Observable {
    constructor(userId) {
        super();
        this.userId = userId; 
        this.groups = {};
    }

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
    
    
    
   /*  async fetchGroups(clients) {
        const groupsRef = collection(db, "groups");
        try {
            const q = query(groupsRef, where("participants", "array-contains", this.userId));
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                console.log("Fetched groups for user:", this.userId);
                querySnapshot.forEach(async (doc) => {
                    const curData = doc.data();
                    const groupId = doc.id;
                    console.log(curData.entries)
    
                    // Fetch entries and balances for the group
                    let entriesInfo = null;
                    let balances = null;
                    const entriesSnapshot = await getDocs(collection(doc.ref, "entries"));
                    //const balanceSnapshot = await getDocs(collection(doc.ref, "balances"));
                    if (!entriesSnapshot.empty) {
                        entriesInfo = await this.fetchEntries(groupId);
                        console.log("Entries Info: ", entriesInfo);
                        balances = await this.fetchBalances(groupId);
                        console.log("Balanced Info: ", balances)
                    }
    
                    // Update `groups` and `clients` info
                    this.groups[groupId] = {
                        groupId: groupId,
                        groupName: curData.groupName,
                        participants: curData.participants,
                        created_at: curData.created_at,
                        entriesInfo: entriesInfo,
                        balances: balances
                    };
    
                    this.clients[groupId] = curData.participants.map(uid => {
                        console.log(`Group ${groupId}, clients: ${clients}`);
                        return { uid, socket: clients[uid] || null };
                    });
    
                });
                return this.groups;
            } else {
                console.log("No groups found for user:", this.userId);
                return null;
            }
        } catch (error) {
            console.log("Error in fetching groups!", error);
        }
    } */

    //fixed with promiseall
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