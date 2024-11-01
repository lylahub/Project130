import React, { useState } from 'react';
import axios from 'axios';
import './FinancialAdvice.css';

const FinancialAdvice = () => {
    const [income, setIncome] = useState('');
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAdvice = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:5000/api/get-financial-advice', { income });
            setAdvice(response.data.advice);
        } catch (error) {
            setError("Failed to retrieve financial advice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="financial-advice-container">
            <input
                type="number"
                placeholder="Enter your income"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
            />
            <button onClick={getAdvice} disabled={loading || !income}>
                {loading ? "Loading..." : "Get Financial Advice"}
            </button>
            {error && <p className="error-message">{error}</p>}
            {advice && (
                <div>
                    <h3>Financial Advice</h3>
                    <p>{advice.split('\n').map((line, index) => (
                        <span key={index}>
              {line}
                            <br />
            </span>
                    ))}</p>
                </div>
            )}
        </div>
    );
};

export default FinancialAdvice;
