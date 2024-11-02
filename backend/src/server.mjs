// Create server
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { createServer } from "node:http";
import bodyParser from "body-parser";
import cors from "cors";
import { fileURLToPath } from 'url';
import path from 'path';
import router from "./routes.js";

// Get the current file path and directory in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;
const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

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

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: `I need financial advice based on the following data: 
                      Monthly Income: ${financialData.monthlyIncome}, 
                      Monthly Expenses: ${financialData.monthlyExpenses}, 
                      Savings: ${financialData.savings}, 
                      Debt: ${financialData.debt}, 
                      Financial Goals: ${financialData.financialGoals}, 
                      Risk Tolerance: ${financialData.riskTolerance}, 
                      Investment Experience: ${financialData.investmentExperience}. 
                      Provide recommendations.`,
                    }
                ],
                max_tokens: 400,
                temperature: 0.7,
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ recommendation: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Error fetching data from OpenAI:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
