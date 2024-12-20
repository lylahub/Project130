// src/pages/Home.js

/**
 * @file Home.js
 * @description This file contains the implementation of the Home component for managing categories and transactions in a budgeting application.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../userContext.js';
import Navbar from '../components/Navbar';
import '../css/Home.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { CategoryChartExpense, CategoryChartIncome } from '../chart.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
console.log()

/**
 * Fetches user-specific categories.
 *
 * @async
 * @param {string} uid - The user ID.
 * @returns {Promise<Array>} An array of category objects.
 */
const fetchUserCategories = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/categories/user-categories?userId=${uid}`);
  const data = await response.json();
  return data.categories || [];
};

/**
 * Fetches all transactions for a user.
 *
 * @async
 * @param {string} uid - The user ID.
 * @returns {Promise<Array>} An array of transaction objects.
 */
const fetchAllTransactions = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/categories/transactions?userId=${uid}`);
  const data = await response.json();
  return data.transactions || [];
};

/**
 * Fetches amounts for a specific category.
 *
 * @async
 * @param {string} uid - The user ID.
 * @param {string} categoryName - The category name.
 * @returns {Promise<Object>} An object containing monthly and total amounts.
 */
const getCategoryAmount = async (uid, categoryName) => {
  const response = await fetch(`${API_BASE_URL}/categories/amount?userId=${uid}&categoryName=${categoryName}`);
  const data = await response.json();
  return data.amounts;
};

/**
 * Fetches transaction details for a specific category.
 *
 * @async
 * @param {string} userId - The user ID.
 * @param {string} categoryName - The category name.
 * @returns {Promise<Array>} An array of transaction entries.
 */
const getCategoryDetails = async (userId, categoryName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/details?userId=${userId}&categoryName=${categoryName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch category details: ${response.statusText}`);
    }
    
    const data = await response.json();

    if (!data.entries) {
      console.warn("No entries found in the response");
      return [];
    }
    return data.entries;
  } catch (error) {
    console.error("Error fetching category details:", error);
    return [];
  }
};

/**
 * Adds a new category for the user.
 *
 * @async
 * @param {string} uid - The user ID.
 * @param {string} categoryName - The name of the new category.
 * @param {string} icon - The icon class for the category.
 * @returns {Promise<Object>} The result of the API call.
 */
const addNewCategory = async (uid, categoryName, icon) => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uid, categoryName, icon }),
  });
  const result = await response.json();
  if (!result.category.success) {
    return;
  }
  return result;
};

/**
 * Adds a transaction to a category.
 *
 * @async
 * @param {string} uid - The user ID.
 * @param {string} categoryId - The category ID.
 * @param {number} amount - The transaction amount.
 * @param {string} memo - A note for the transaction.
 * @param {string} incomeExpense - The type of transaction ('income' or 'expense').
 * @returns {Promise<Object>} The result of the API call.
 */
const addTransaction = async (uid, categoryId, amount, memo, incomeExpense) => {
  const response = await fetch(`${API_BASE_URL}/categories/entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uid, categoryName: categoryId, amount, note: memo, incomeExpense: incomeExpense}),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add transaction");
  }

  return response.json(); 
};

/**
 * Adds default categories for a user.
 *
 * @async
 * @param {string} uid - The user ID.
 * @param {Array<string>} icons - An array of default icon classes.
 * @returns {Promise<Object>} The result of the API call.
 */
const addDefaultCategories = async(uid, icons) => {
  const response = await fetch(`${API_BASE_URL}/categories/default`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uid, icons: icons }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add default categories");
  }
  return response.json(); 
}

/**
 * Fetches overall amounts (income/expense) for a user.
 *
 * @async
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} An object containing total and monthly amounts.
 */
const getOverallAmounts = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/categories/overall?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch overall amounts for user ${userId}: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

/**
 * Fetches the username for a given user ID.
 *
 * @async
 * @param {string} uid - The user ID.
 * @returns {Promise<string>} The username of the user.
 */
const fetchUsername = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/get-username/${uid}`);
  if (!response.ok) {
    throw new Error("Failed to fetch username");
  }
  const data = await response.json();
  return data.username;
};

/**
 * The main Home component for the budgeting application.
 *
 * @component
 * @returns {JSX.Element} The rendered Home component.
 */
const Home = () => {
  const navigate = useNavigate();
  const { uid } = useUser();
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]); 
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionMemo, setNewTransactionMemo] = useState('');
  const [selectedCategoryAmounts, setSelectedCategoryAmounts] = useState({ monthlyAmount: 0, totalAmount: 0 });
  const [overallAmounts, setOverallAmounts] = useState({ monthlyAmount: 0, totalAmount: 0 });
  const [transactionType, setTransactionType] = useState('expense');


  const icons = [
    "fa-utensils",
    "fa-shopping-cart",
    "fa-film",
    "fa-bus",
    "fa-heart",
    "fa-book",
    "fa-dollar-sign"
  ];

  const default_icons = [
    "fa-utensils",       // Food
    "fa-film",           // Entertainment
    "fa-bus",            // Traffic
    "fa-shopping-cart"   // Shopping
  ];

// Initialize data and fetch necessary information when component mounts or user changes
useEffect(() => {
  const fetchData = async () => {
    // Fetch user's existing categories
    const fetchedCategories = await fetchUserCategories(uid);
    console.log(fetchedCategories)
    
    // If no categories exist, create default ones and fetch them
    if (fetchedCategories.length === 0) {
      await addDefaultCategories(uid, default_icons);
      const defaultCategories = await fetchUserCategories(uid);
      // Add 'overall' category to the beginning of the list
      setCategories([{ id: 'overall', name: 'Overall', icon: 'fa-list' }, ...defaultCategories]);
    } else {
      setCategories([{ id: 'overall', name: 'Overall', icon: 'fa-list' }, ...fetchedCategories]);
    }

    // Fetch all transactions and overall amounts
    const fetchedTransactions = await fetchAllTransactions(uid);
    console.log("Transactions: ", fetchedTransactions)
    const fetchedOverallAmounts = await getOverallAmounts(uid);
    
    // Update state with fetched data
    setTransactions(fetchedTransactions);
    setFilteredTransactions(fetchedTransactions); 
    setOverallAmounts({
      totalAmount: fetchedOverallAmounts.totalAmount,
      monthlyAmount: fetchedOverallAmounts.monthlyAmount
    });

    const fetchedUsername = await fetchUsername(uid);
    setUsername(fetchedUsername);
  };

  fetchData();
}, [uid]);

// Handle category selection and update related data
const handleCategoryClick = async (categoryId) => {
  // Update selected category in state
  setSelectedCategoryId(categoryId);

  // Handle 'overall' category view
  if (categoryId === 'overall') {
    const allTransactions = await fetchAllTransactions(uid);
    setFilteredTransactions(allTransactions);
    setSelectedCategoryAmounts({
      totalAmount: overallAmounts.totalAmount,
      monthlyAmount: overallAmounts.monthlyAmount
    });
  } else if (categoryId) {
    // Get specific category transactions and amounts
    const categoryTransactions = await getCategoryDetails(uid, categoryId);
    const amounts = await getCategoryAmount(uid, categoryId);
    setFilteredTransactions(categoryTransactions);
    // Update category amounts if available
    if (amounts) {
      setSelectedCategoryAmounts({
        monthlyAmount: amounts.monthlyAmount || 0,
        totalAmount: amounts.totalAmount || 0
      });
    }
  } else {
    setFilteredTransactions(transactions); 
  }
};

// Create new category and handle UI updates
const handleAddCategory = async () => {
  const result = await addNewCategory(uid, newCategoryName, selectedIcon);
  if (result) {
    // Create new category object with returned data
    const newCategory = { 
      id: result.category.categoryData.categoryId, 
      name: newCategoryName, 
      icon: selectedIcon 
    };
    // Add new category to state and reset form
    setCategories((prevCategories) => [...prevCategories, newCategory]);
    setNewCategoryName('');
    setSelectedIcon('');
    // Switch view to new category and clear transactions
    await handleCategoryClick(result.category.categoryData.categoryId);
    setFilteredTransactions([]);
  } else {
    alert("Category could not be added: Duplicated categories");
  }
};

// Add new transaction and update category/overall amounts
const handleAddTransaction = async () => {
  // Validate category selection
  if (!selectedCategoryId) {
    alert("Please select a category");
    return;
  }
  // Validate amount input
  const amount = parseFloat(newTransactionAmount);
  if (isNaN(amount) | amount < 0) {
    alert("Please enter a valid number for the amount");
    return;
  }
  // Add transaction and get updated amounts
  const result = await addTransaction(uid, selectedCategoryId, amount, newTransactionMemo, transactionType);
  
  // Update overall totals
  setOverallAmounts({
    totalAmount: result.entry.overallTotalAmount,
    monthlyAmount: result.entry.overallMonthlyAmount,
  });
  
  // Update category totals
  setSelectedCategoryAmounts({
    totalAmount: result.entry.totalAmount,
    monthlyAmount: result.entry.monthlyAmount,
  });
  
  // Refresh transaction list and reset form
  const updatedTransactions = await getCategoryDetails(uid, selectedCategoryId);
  setFilteredTransactions(updatedTransactions);
  setNewTransactionAmount('');
  setNewTransactionMemo('');
};

  return (
    <div className="home-container">
      <Navbar
        username={username}
        tabs={[
          { id: 1, label: "Tab 1" },
          { id: 2, label: "Tab 2" },
          { id: 3, label: "Tab 3" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="home-content">
        <div className="home-blocks-wrapper">
          {/* Overview Card */}
          <div className="overview-card card">
            <div className="overview-content">
              {/* Left side with category info */}
              <div className="category-info">
                <h2>Category Overview</h2>
                
                <div className="amounts-section">
                  <div className="amount-card">
                    <p>Overall Total Income</p>
                    <strong>${overallAmounts.totalAmount}</strong>
                  </div>
                  <div className="amount-card">
                    <p>Monthly Total Income</p>
                    <strong>${overallAmounts.monthlyAmount}</strong>
                  </div>
                </div>
  
                <div className="category-list">
                  {categories?.map((category) => (
                    <div
                      key={category.id}
                      className={`category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <i className={`fas ${category.icon}`}></i>
                      <span>{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
  
              {/* Right side with pie chart */}
              {(selectedCategoryId === 'overall' || !selectedCategoryId) && (
                <div className="chart-visualization">
                  <h2>Expense Overview</h2>
                  <CategoryChartExpense categories={categories} transactions={filteredTransactions}/>
                  <h2>Income Overview</h2>
                  <CategoryChartIncome categories={categories} transactions={filteredTransactions} />
                </div>
              )}
            </div>
          </div>
  
          {/* Lower section */}
          <div className="lower-section">
            {/* Transaction History - Left side */}
            <div className="transactions-section card">
              <h2>Transaction History</h2>
              
              {selectedCategoryId && selectedCategoryId !== 'overall' && (
                <div className="selected-category-amounts">
                  <div className="amount-card">
                    <p>Category Total</p>
                    <strong>${selectedCategoryAmounts.totalAmount || 0}</strong>
                  </div>
                  <div className="amount-card">
                    <p>Category Monthly</p>
                    <strong>${selectedCategoryAmounts.monthlyAmount || 0}</strong>
                  </div>
                </div>
              )}
  
              <div className="transactions-list">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <span>{new Date(transaction.created_at?.seconds * 1000).toLocaleDateString()}</span>
                    <span>{transaction.note}</span>
                    <span className={`amount ${transaction.incomeExpense === 'income' ? 'income' : 'expense'}`}>
                      ${transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
  
            {/* Action Card - Right side */}
            <div className="action-card">
              {(selectedCategoryId === 'overall' || !selectedCategoryId) ? (
                <div className="add-category-section card">
                  <h2>Add New Category</h2>
                  <div className="input-container">
                    <div className="input-group">
                      <label>Category Name</label>
                      <input
                        type="text"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
  
                    <div className="icon-selector">
                      <label>Select Icon</label>
                      <div className="icon-list">
                        {icons.map((icon, index) => (
                          <div 
                            key={index}
                            className={`icon-item ${selectedIcon === icon ? 'selected' : ''}`}
                            onClick={() => setSelectedIcon(icon)}
                          >
                            <i className={`fas ${icon}`}></i>
                          </div>
                        ))}
                      </div>
                    </div>
  
                    <button className="button" onClick={handleAddCategory}>
                      Add Category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="add-transaction-section card">
                  <h2>Add Transaction</h2>
                  <div className="input-container">
                    <div className="input-group">
                      <label>Transaction Type</label>
                      <select
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
  
                    <div className="input-group">
                      <label>Amount</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={newTransactionAmount}
                        onChange={(e) => setNewTransactionAmount(e.target.value)}
                      />
                    </div>
  
                    <div className="input-group">
                      <label>Memo</label>
                      <input
                        type="text"
                        placeholder="Enter memo"
                        value={newTransactionMemo}
                        onChange={(e) => setNewTransactionMemo(e.target.value)}
                      />
                    </div>
  
                    <button className="button" onClick={handleAddTransaction}>
                      Add Transaction
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
