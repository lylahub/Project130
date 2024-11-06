// Observable: Subject of the observer pattern
import { WebSocket } from "ws"; 
export class Observable {
    constructor() {
        this.clients = {};
    }
    addObserver(observer) {
        this.observers.push(observer);
    }
    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
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
