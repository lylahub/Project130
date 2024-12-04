// Observable: Subject of the observer pattern
import { WebSocket } from "ws";
/**
 * Represents the Observable (Subject) in the Observer pattern.
 * Manages a list of observers and facilitates notifications to WebSocket clients.
 */
export class Observable {
    /**
     * Creates an instance of Observable.
     */
    constructor() {
        /**
         * Stores WebSocket clients for each group.
         * @type {Object.<string, Array<{uid: string, socket: WebSocket}>>}
         */
        this.clients = {};
    }
    /**
     * Adds an observer to the list.
     * @param {Object} observer - The observer to add.
     */
    addObserver(observer) {
        this.observers.push(observer);
    }
    /**
     * Removes an observer from the list.
     * @param {Object} observer - The observer to remove.
     */
    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    /**
     * Notifies all WebSocket clients in a specific group.
     * Sends a message to each client's WebSocket connection.
     * @param {string} groupId - The ID of the group to notify.
     * @param {Object} data - The data to send to the clients.
     */
    notifyGroup(groupId, data) {
        if (this.clients[groupId]) {
            this.clients[groupId].forEach(({ uid, socket }) => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    const messageData = { ...data, receiverId: uid };
                    console.log(`Sending message to client ${uid} in group ${groupId}`);
                    socket.send(JSON.stringify(messageData));
                }
                else { console.log(`No active clients for group ${groupId}`);
             }
            });
        }
    }
}
