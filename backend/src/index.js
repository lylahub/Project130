import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';  // Import cors
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file path and directory in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;
const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

// Enable CORS for requests from http://localhost:3000
app.use(cors({
    origin: 'http://localhost:3000'
}));

// Middleware to parse JSON
app.use(express.json());

// Root route to verify the server is running
app.get('/', (req, res) => {
    res.send('SmartBudget Backend Server is running');
});

// Route to fetch financial advice from OpenAI
app.post('/api/get-financial-advice', async (req, res) => {
    try {
        const { income } = req.body;
        if (!income) {
            return res.status(400).json({ error: "Income is required" });
        }

        const messages = [
            { role: "system", content: "You are a financial advisor." },
            { role: "user", content: `Provide budget recommendations for a user with an income of ${income}. Suggest ideal spending on essentials, savings, and discretionary expenses.` }
        ];

        // Make request to OpenAI API using the /v1/chat/completions endpoint
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini', // Use a chat-based model such as gpt-3.5-turbo or gpt-4
                messages: messages,
                max_tokens: 200,
                temperature: 0.7,
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
            }
        );

        // Extract advice from the OpenAI response
        const advice = response.data.choices[0]?.message?.content.trim();
        if (!advice) {
            throw new Error("No advice generated from OpenAI API");
        }

        res.status(200).json({ advice });
    } catch (error) {
        console.error("Error fetching financial advice:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to retrieve financial advice' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});