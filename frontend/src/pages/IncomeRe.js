import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import '../css/IncomeRe.css';

const IncomeRecommendation = () => {
  const [financialData, setFinancialData] = useState({
    monthlyIncome: '',
    monthlyExpenses: '',
    savings: '',
    debt: '',
    financialGoals: '',
    riskTolerance: 'moderate',
    investmentExperience: 'beginner'
  });
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFinancialData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/get-recommendation', { financialData });
      setRecommendation({
        summary: response.data.recommendation,
        suggestions: [
          "Review your emergency fund size",
          "Diversify investments for better risk management",
          "Create a plan for debt reduction",
        ],
        detailedPlan: "Further detailed financial plan will go here...",
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="income-recommendation-container">
      <Navbar username="Baby" />
      <div className="page-container">
        <div className="block-container">
          <div className="form-block">
            <h1>Financial Advisor</h1>
            <p>Fill in your financial information to get personalized recommendations</p>
            
            <form onSubmit={handleSubmit} className="financial-form">
              <div className="form-content">
                <div className="input-section">
                  <div className="input-pairs">
                    <div className="input-pair">
                      <div className="input-group">
                        <label>Monthly Income</label>
                        <input
                          type="number"
                          name="monthlyIncome"
                          value={financialData.monthlyIncome}
                          onChange={handleInputChange}
                          placeholder="Enter monthly income"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Monthly Expenses</label>
                        <input
                          type="number"
                          name="monthlyExpenses"
                          value={financialData.monthlyExpenses}
                          onChange={handleInputChange}
                          placeholder="Enter monthly expenses"
                          required
                        />
                      </div>
                    </div>

                    <div className="input-pair">
                      <div className="input-group">
                        <label>Current Savings</label>
                        <input
                          type="number"
                          name="savings"
                          value={financialData.savings}
                          onChange={handleInputChange}
                          placeholder="Enter current savings"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Current Debt</label>
                        <input
                          type="number"
                          name="debt"
                          value={financialData.debt}
                          onChange={handleInputChange}
                          placeholder="Enter current debt"
                          required
                        />
                      </div>
                    </div>

                    <div className="goals-section">
                      <label>Financial Goals</label>
                      <textarea
                        name="financialGoals"
                        value={financialData.financialGoals}
                        onChange={handleInputChange}
                        placeholder="Describe your financial goals"
                        rows="4"
                      />
                    </div>
                  </div>
                </div>

                <div className="side-section">
                  <div className="input-group">
                    <label>Risk Tolerance</label>
                    <select
                      name="riskTolerance"
                      value={financialData.riskTolerance}
                      onChange={handleInputChange}
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Investment Experience</label>
                    <select
                      name="investmentExperience"
                      value={financialData.investmentExperience}
                      onChange={handleInputChange}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="experienced">Experienced</option>
                    </select>
                  </div>

                  <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Get Recommendations'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {recommendation && (
          <div className="block-container">
            <div className="recommendation-block">
              <h2>Your Personal Financial Recommendations</h2>
              <div className="recommendation-content">
                <div className="recommendation-summary">
                  <h3>Summary</h3>
                  <ReactMarkdown>{recommendation.summary}</ReactMarkdown>
                </div>
                <div className="recommendation-suggestions">
                  <h3>Key Suggestions</h3>
                  <ul>
                    {recommendation.suggestions.map((suggestion, index) => (
                      <li key={index}><ReactMarkdown>{suggestion}</ReactMarkdown></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeRecommendation;