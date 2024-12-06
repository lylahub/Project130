// Import required dependencies and components
/**
 * @file IncomeRecommendation.js
 * @description This file contains the implementation of the IncomeRecommendation component, a financial advisor tool for providing personalized financial recommendations based on user inputs.
 */
import React, { useState, useEffect } from 'react';
import { useUser } from '../userContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import '../css/IncomeRe.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Utility function to fetch username from server
/**
 * Fetches the username for a given user ID.
 *
 * @async
 * @param {string} uid - The user ID.
 * @returns {Promise<string>} The username of the user.
 * @throws {Error} If the fetch request fails.
 */
const fetchUsername = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/get-username/${uid}`);
  if (!response.ok) {
    throw new Error("Failed to fetch username");
  }
  const data = await response.json();
  return data.username;
};

// Main component for financial recommendation system
/**
 * IncomeRecommendation Component.
 *
 * @component
 * @returns {JSX.Element} The rendered IncomeRecommendation component.
 */
const IncomeRecommendation = () => {
  // Initialize state for financial form data
  const [financialData, setFinancialData] = useState({
    monthlyIncome: '',
    monthlyExpenses: '',
    savings: '',
    debt: '',
    financialGoals: '',
    riskTolerance: 'moderate',
    investmentExperience: 'beginner'
  });
  const { uid } = useUser();
  const [username, setUsername] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes for form fields
  /**
   * Handles input changes for financial form fields.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>} e - The input change event.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFinancialData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch username when component mounts or uid changes
  useEffect(() => {
    const fetchData = async () => {
      const fetchedUsername = await fetchUsername(uid);
      setUsername(fetchedUsername);
    };

    fetchData();
  }, [uid]);

  // Handle form submission and get recommendations
  /**
   * Handles form submission to get financial recommendations.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Make API call to get financial recommendations
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
      <Navbar username={username} />
      <div className="page-container">
        {/* Financial Input Form Block */}
        <div className="block-container">
          <div className="form-block">
            <h1>Financial Advisor</h1>
            <p>Fill in your financial information to get personalized recommendations</p>
            
            <form onSubmit={handleSubmit} className="financial-form">
              <div className="form-content">
                {/* Income and Expenses Input Section */}
                <div className="input-section">
                  <div className="input-pairs">
                    {/* Monthly Income and Expenses Fields */}
                    <div className="input-pair">
                      {/* Monthly Income Input */}
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
                      {/* Monthly Expenses Input */}
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

                    {/* Savings and Debt Input Fields */}
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

                    {/* Financial Goals Section */}
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

                {/* Risk and Experience Selection Section */}
                <div className="side-section">
                  {/* Risk Tolerance Dropdown */}
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

                  {/* Investment Experience Dropdown */}
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

                  {/* Submit Button */}
                  <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Get Recommendations'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Recommendation Display Section */}
        {recommendation && (
          <div className="block-container">
            <div className="recommendation-block">
              <h2>Your Personal Financial Recommendations</h2>
              <div className="recommendation-content">
                {/* Display recommendation summary */}
                <div className="recommendation-summary">
                  <h3>Summary</h3>
                  <ReactMarkdown>{recommendation.summary}</ReactMarkdown>
                </div>
                {/* Display key suggestions */}
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