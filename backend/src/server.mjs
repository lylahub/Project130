import express from "express";
import dotenv from "dotenv";
import { createServer } from "node:http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import router from "./routes.js";
import { getFinancialAdvice } from "./openaiService.js"; // Import the AI service function

// Load environment variables early
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Use built-in JSON parser
app.use((req, res, next) => {
    console.log("Received request:", req.method, req.url);
    next();
});

app.options("*", cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
