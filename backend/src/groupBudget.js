import { db, storage } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, setDoc ,Timestamp, updateDoc, deleteDoc, orderBy, doc, query, getDoc, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { SplitStrategy, EqualSplitStrategy, CustomSplitStrategy } from "./SplitStrategy.js";
import { Observable } from "./Observer.js";

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
            
            participantsUIDs.push(this.userId);
    
            const groupsRef = collection(db, "groups");
            const groupData = {
                groupName: groupName,
                createdBy: this.userId,
                participants: participantsUIDs,
                created_at: serverTimestamp()
            };
    
            // Add the document to Firestore and retrieve the document reference
            const groupDocRef = await addDoc(groupsRef, groupData);
            const groupId = groupDocRef.id; // Retrieve the generated groupId
    
            // Save the group information in the instance
            this.groups[groupId] = {
                groupName: groupName,
                participants: participantsUIDs,
                created_at: groupData.created_at
            };
    
            // Initialize the clients array for this group
            this.clients[groupId] = participantsUIDs.map(uid => {
                return { uid, socket: clients[uid] || null };
            });
            console.log(`clients for group '${groupName}' (${groupId}):`, this.clients[groupId]);
            console.log(`Group '${groupName}' created successfully with participants:`, participantsUIDs);
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

    async addEntry(groupId, payer, amount, memo, split = {}, splitStrategy = new EqualSplitStrategy()) {
        const groupRef = doc(db, "groups", groupId);
        const groupSnapshot = await getDoc(groupRef);
    
        if (!groupSnapshot.exists()) {
            console.log("Group does not exist.");
            return;
        }
    
        const groupData = groupSnapshot.data();
        const participants = groupData.participants;
    
        try {
            // Calculate share amount for each participant
            const shares = splitStrategy.calculateShare(amount, participants, split);
    
            // Save the split result
            const entriesRef = collection(db, "groups", groupId, "entries");
            const entryData = {
                amount: amount,
                payer: payer,
                participants: shares,
                memo: memo,
                created_at: serverTimestamp()
            };
    
            await addDoc(entriesRef, entryData);
    
            // Prepare the data to be sent as a notification
            const data = {
                action: 'newEntry',
                groupId: groupId,
                entry: entryData
            };
    
            // Notify all online participants in the group about the new entry
            this.notifyGroup(groupId, data);
    
            console.log("Entry added successfully with balances updated.");
            return shares;
    
        } catch (error) {
            console.error("Error in adding entry:", error);
        }
    }
    

    async updateBalances(groupId, participants, payer, totalAmount, shares) {
        const groupRef = doc(db, "groups", groupId);
        //create a balanceRef to keep track of the money owes
        const balancesRef = collection(groupRef, "balances");
    
        try {
            for (const participant of participants) {
                if (participant === payer) continue;
                
                //update balances
                const payerBalanceRef = doc(balancesRef, payer);
                const participantBalanceRef = doc(balancesRef, participant);
    
                const payerBalanceDoc = await getDoc(payerBalanceRef);
                const participantBalanceDoc = await getDoc(participantBalanceRef);
    
                let payerBalance = payerBalanceDoc.exists() ? payerBalanceDoc.data().owes || {} : {};
                let participantBalance = participantBalanceDoc.exists() ? participantBalanceDoc.data().owes || {} : {};
    
                const participantOwesPayer = shares[participant];
    
                payerBalance[participant] = (payerBalance[participant] || 0) + participantOwesPayer;
    
                participantBalance[payer] = (participantBalance[payer] || 0) - participantOwesPayer;
    
                await setDoc(payerBalanceRef, { owes: payerBalance }, { merge: true });
                await setDoc(participantBalanceRef, { owes: participantBalance }, { merge: true });
            }
    
            console.log("Balances updated successfully within the group.");
    
        } catch (error) {
            console.error("Error updating balances within the group:", error);
        }
    }
    
    
    async fetchGroups(clients) {
        const groupsRef = collection(db, "groups");
        try {
            const q = query(groupsRef, where("participants", "array-contains", this.userId));
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                console.log("Fetched groups for user:", this.userId);
                querySnapshot.forEach((doc) => {
                    const curData = doc.data();
                    const groupId = doc.id;
    
                    // 更新 `groups` 和 `clients` 信息
                    this.groups[groupId] = {
                        groupName: curData.groupName,
                        participants: curData.participants,
                        created_at: curData.created_at
                    };
    
                    this.clients[groupId] = curData.participants.map(uid => {
                        console.log(`Group ${groupId}, clients: ${clients}`)
                        return { uid, socket: clients[uid] || null };
                    });
    
                    console.log("Group ID:", groupId, "Participants:", this.clients[groupId]);
                });
            } else {
                console.log("No groups found for user:", this.userId);
            }
        } catch (error) {
            console.log("Error in fetching groups! ", error);
        }
    }
    
    
}

export default GroupBudget;