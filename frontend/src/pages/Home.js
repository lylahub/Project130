// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../userContext.js';
import Navbar from '../components/Navbar';
import '../css/Home.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
console.log()

const fetchUserCategories = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/categories/user-categories?userId=${uid}`);
  const data = await response.json();
  return data.categories || [];
};

const fetchAllTransactions = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/categories/transactions?userId=${uid}`);
  const data = await response.json();
  return data.transactions || [];
};

const getCategoryAmount = async (uid, categoryName) => {
  const response = await fetch(`${API_BASE_URL}/categories/amount?userId=${uid}&categoryName=${categoryName}`);
  const data = await response.json();
  return data.amounts;
};


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

const getOverallAmounts = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/categories/overall?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch overall amounts for user ${userId}: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};


const Home = () => {
  const navigate = useNavigate();
  const username = "Baby";
  const { uid } = useUser();
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

  useEffect(() => {
    const fetchData = async () => {
      const fetchedCategories = await fetchUserCategories(uid);
      
      if (fetchedCategories.length === 0) {
        await addDefaultCategories(uid, default_icons);
        const defaultCategories = await fetchUserCategories(uid);
        setCategories([{ id: 'overall', name: 'Overall', icon: 'fa-list' }, ...defaultCategories]);
      } else {
        setCategories([{ id: 'overall', name: 'Overall', icon: 'fa-list' }, ...fetchedCategories]);
      }

      const fetchedTransactions = await fetchAllTransactions(uid);
      const fetchedOverallAmounts = await getOverallAmounts(uid);
      setTransactions(fetchedTransactions);
      setFilteredTransactions(fetchedTransactions); 
      setOverallAmounts({
        totalAmount: fetchedOverallAmounts.totalAmount,
        monthlyAmount: fetchedOverallAmounts.monthlyAmount
      });
    };

    fetchData();
  }, [uid]);


  const handleCategoryClick = async (categoryId) => {
    setSelectedCategoryId(categoryId);

    if (categoryId === 'overall') {
      const allTransactions = await fetchAllTransactions(uid);
      setFilteredTransactions(allTransactions);
      setSelectedCategoryAmounts({
        totalAmount: overallAmounts.totalAmount,
        monthlyAmount: overallAmounts.monthlyAmount
      });
    } else if (categoryId) {
      const categoryTransactions = await getCategoryDetails(uid, categoryId);
      const amounts = await getCategoryAmount(uid, categoryId);
      setFilteredTransactions(categoryTransactions);
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

  const handleAddCategory = async () => {
    const result = await addNewCategory(uid, newCategoryName, selectedIcon);
    if (result) {
      const newCategory = { id: result.category.categoryData.categoryId, name: newCategoryName, icon: selectedIcon };
      setCategories((prevCategories) => [...prevCategories, newCategory]);
      setNewCategoryName('');
      setSelectedIcon('');
      await handleCategoryClick(result.category.categoryData.categoryId);
      setFilteredTransactions([]);
    } else {
      alert("Category could not be added: Duplicated categories");
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedCategoryId) {
      alert("Please select a category");
      return;
    }
    const amount = parseFloat(newTransactionAmount);
    if (isNaN(amount)) {
      alert("Please enter a valid number for the amount");
      return;
    }
    const result = await addTransaction(uid, selectedCategoryId, amount, newTransactionMemo, transactionType);
    setOverallAmounts({
      totalAmount: result.entry.overallTotalAmount,
      monthlyAmount: result.entry.overallMonthlyAmount,
    });
    setSelectedCategoryAmounts({
      totalAmount: result.entry.totalAmount,
      monthlyAmount: result.entry.monthlyAmount,
    });
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
        <div className="home-block-container">
          {/* Left Section */}
          <div className="left-section">
            {/* Chart Section */}
            <div className="chart-section card">
              <h2>Category Overview</h2>
              
              {/* Overall Amounts */}
              <div className="overall-amounts">
                <div className="amount-card">
                  <p>Overall Total Expense</p>
                  <strong>${overallAmounts.totalAmount}</strong>
                </div>
                <div className="amount-card">
                  <p>Monthly Total Expense</p>
                  <strong>${overallAmounts.monthlyAmount}</strong>
                </div>
              </div>
  
              {/* Categories List */}
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
  
            {/* Transactions Section */}
            <div className="transactions-section card">
              <h2>Transaction History</h2>
              
              {/* Selected Category Amounts */}
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
  
              {/* Transactions List */}
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
          </div>
  
          {/* Right Section */}
          <div className="right-section">
            {/* Add Category Section */}
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
  
                {/* Icon Selector */}
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
  
            {/* Add Transaction Section */}
            {selectedCategoryId && selectedCategoryId !== 'overall' && (
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
  );
};
export default Home;
