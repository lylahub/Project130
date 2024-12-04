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

/**
 * Conditionally load environment variables from a .env file for local development.
 * Uses the .env file only if environment variables are not already defined.
 */
if (!process.env.PORT) {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
//const groupBudget = new GroupBudget(userId);

/**
 * Map of user IDs to their GroupBudget instances.
 * @type {Object<string, GroupBudget>}
 */
const groupBudgets = {};

/**
 * Port number for the server to listen on.
 * @constant {number}
 */
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000'  // Enable CORS for frontend
}));

// Route handling
app.use("/", router(groupBudgets, clients));

// OpenAI recommendation route
/**
 * Route to fetch financial advice using OpenAI API.
 * Accepts financial data and returns a recommendation.
 * @route POST /api/get-recommendation
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body containing financialData.
 * @param {Object} res - The Express response object.
 */
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

/**
 * WebSocket server handling real-time connections.
 */
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

    /**
     * Handle WebSocket disconnection events.
     */
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
/**
 * Logs all currently connected WebSocket clients.
 * Iterates over the `clients` object and logs their connection status.
 */
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
