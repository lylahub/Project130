import axios from 'axios';

const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

// Define a function to fetch financial advice based on user data
const getFinancialAdvice = async (userData) => {
    try {
        // Send a POST request to the OpenAI API endpoint
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: 'gpt-4o-mini', // Choose the model that fits your requirements
                prompt: `Provide budget recommendations for a user with an income of ${userData.income}. Suggest ideal spending on essentials, savings, and discretionary expenses.`,
                max_tokens: 100, // Limit tokens to control response length
                temperature: 0.7, // Adjusts response creativity
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`, // Use the API key securely
                },
            }
        );

        // Return the response text containing the financial advice
        return response.data.choices[0].text;
    } catch (error) {
        console.error("Error fetching financial advice:", error);
        throw error;
    }
};

export { getFinancialAdvice };
