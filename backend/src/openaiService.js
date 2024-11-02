import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

// Define a function to fetch financial advice based on user data
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
