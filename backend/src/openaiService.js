import axios from 'axios';
import dotenv from 'dotenv';

// Conditionally load environment variables from .env if not already defined
if (!process.env.REACT_APP_OPENAI_API_KEY) {
    dotenv.config();
}

const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;


// Define a function to fetch financial advice based on user data

/**
 * Fetches financial advice based on user-provided financial data.
 * @async
 * @function
 * @param {Object} userData - The user's financial data.
 * @param {number} userData.monthlyIncome - The user's monthly income.
 * @param {number} userData.monthlyExpenses - The user's monthly expenses.
 * @param {number} userData.savings - The user's current savings.
 * @param {number} userData.debt - The user's total debt.
 * @param {string} userData.financialGoals - The user's financial goals (e.g., "retirement", "buying a house").
 * @param {string} userData.riskTolerance - The user's risk tolerance (e.g., "low", "medium", "high").
 * @param {string} userData.investmentExperience - The user's investment experience level (e.g., "beginner", "intermediate", "expert").
 * @returns {Promise<string>} The financial advice text generated by the OpenAI API.
 * @throws Will throw an error if the API request fails.
 */
const getFinancialAdvice = async (userData) => {
    try {
        // Send a POST request to the OpenAI API endpoint
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: `I need financial advice based on the following data: 
                        Monthly Income: ${userData.monthlyIncome},
                        Monthly Expenses: ${userData.monthlyExpenses},
                        Savings: ${userData.savings},
                        Debt: ${userData.debt},
                        Financial Goals: ${userData.financialGoals},
                        Risk Tolerance: ${userData.riskTolerance},
                        Investment Experience: ${userData.investmentExperience}. 
                        Provide recommendations.`
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

        // Return the response text containing the financial advice
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching financial advice:", error.response?.data || error.message);
        throw error;
    }
};

export { getFinancialAdvice };
