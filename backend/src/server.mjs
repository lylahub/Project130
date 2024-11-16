// Create server
import express from "express";
import dotenv from "dotenv";
import { createServer } from "node:http";
import bodyParser from "body-parser";
import cors from "cors";
import { fileURLToPath } from 'url';
import path from 'path';
import router from "./routes.js";
import { getFinancialAdvice } from "./openaiService.js"; // Import the AI service function
import { WebSocketServer } from "ws";
import GroupBudget from "./groupBudget.js";

// Get the current file path and directory in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let clients = {};

// Conditionally load .env file for local development
if (!process.env.PORT) {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
//const groupBudget = new GroupBudget(userId);
const groupBudgets = {};

// Load environment variables
const PORT = process.env.PORT || 8080;
// Using REACT_APP_WEBSOCKET_URL for WebSocket configuration
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || "ws://localhost:8080";


// CORS configuration for local development or production (set in .env)
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000', // Local frontend
            'https://frontend-service-520187080239.us-west1.run.app' // Deployed frontend
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Middleware setup
app.use(bodyParser.json());

// Route handling
app.use("/", router(groupBudgets, clients));

// OpenAI recommendation route
app.post('/api/get-recommendation', async (req, res) => {
    try {
        const { financialData } = req.body;
        const advice = await getFinancialAdvice(financialData);
        res.json({ recommendation: advice });
    } catch (error) {
        console.error('Error fetching financial advice:', error.message);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// WebSocket handling
wss.on('connection', (socket) => {
    socket.on('message', async (message) => {
        const data = JSON.parse(message);
        console.log("Message received:", data);

        if (data.action === 'connect' && data.userId) {
            clients[data.userId] = socket;
            console.log(`User ${data.userId} connected to WebSocket`);

            // Log current clients
            logAllClients();

            if (!groupBudgets[data.userId]) {
                groupBudgets[data.userId] = new GroupBudget(data.userId);
                console.log(`Instance created for ${data.userId}`)
            }

            const userGroupBudget = groupBudgets[data.userId];

            // Update user sockets in group clients
            Object.keys(userGroupBudget.clients).forEach(groupId => {
                userGroupBudget.clients[groupId] = userGroupBudget.clients[groupId].map(client => {
                    if (clients[client.uid]) {
                        return { uid: client.uid, socket: clients[client.uid] };
                    }
                    return client;
                });
            });
        }
    });

    socket.on('close', () => {
        const disconnectedUserId = Object.keys(clients).find(id => clients[id] === socket);
        if (disconnectedUserId) {
            delete clients[disconnectedUserId];
            console.log(`User ${disconnectedUserId} disconnected from WebSocket`);

            // Log current clients after disconnection, for test
            logAllClients();
        }

        // Clean up sockets in groupBudgets if connection closed
        Object.values(groupBudgets).forEach(userGroupBudget => {
            Object.keys(userGroupBudget.clients).forEach(groupId => {
                userGroupBudget.clients[groupId] = userGroupBudget.clients[groupId].map(client => {
                    if (client.socket === socket) {
                        return { uid: client.uid, socket: null };
                    }
                    return client;
                });
            });
        });
    });
});

// Helper function to log all clients
function logAllClients() {
    console.log("Current connected clients:");
    Object.keys(clients).forEach(userId => {
        const isConnected = clients[userId] && clients[userId].readyState === 1;
        console.log(`User ${userId}: ${isConnected ? "Connected" : "Disconnected"}`);
    });
}


// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});