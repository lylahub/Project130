import { adminDb } from "./firebaseConfig.js"; // Use adminDb for backend Firestore access

const updateUsers = async () => {
    try {
        const usersCollection = adminDb.collection("users");
        const usersSnapshot = await usersCollection.get();

        const batch = adminDb.batch(); // Use batch for efficient bulk updates

        usersSnapshot.forEach((doc) => {
            const userRef = usersCollection.doc(doc.id);
            batch.update(userRef, {
                username: "To be set", // Add default username
                bio: "To be set",      // Add default bio
                profile_pic: "https://via.placeholder.com/150", // Add default profile picture
            });
        });

        await batch.commit(); // Commit all updates in one batch
        console.log("Batch update successful!");
    } catch (error) {
        console.error("Error during batch update:", error);
    }
};

// Run the script
updateUsers();
