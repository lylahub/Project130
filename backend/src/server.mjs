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

// Get the current file path and directory in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000'  // Enable CORS for frontend
}));

// Route handling
app.use("/", router);

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

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
