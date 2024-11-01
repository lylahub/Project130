// src/pages/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const username = "Baby"; // 使用設計圖中的名稱
  const [activeTab, setActiveTab] = useState(1);
  
  // 模擬交易記錄數據
  const transactions = [
    { id: 1, description: "Transaction 1", amount: 100, date: "2024-03-10" },
    { id: 2, description: "Transaction 2", amount: 200, date: "2024-03-09" },
    // 添加更多交易記錄...
  ];

  return (
    <div className="home-container">
      <Navbar username={username} tabs={[
        { id: 1, label: "Tab 1" },
        { id: 2, label: "Tab 2" },
        { id: 3, label: "Tab 3" }
      ]} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="home-content">
        <div className="top-sections">
          <div className="chart-section">
            <h2>Chart</h2>
            {/* 這裡添加圖表組件 */}
          </div>
          <div className="info-section">
            {/* 右側信息區塊 */}
          </div>
        </div>
        
        <div className="transactions-section">
          <h2>Transaction History</h2>
          <div className="transactions-list">
            {transactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <span>{transaction.date}</span>
                <span>{transaction.description}</span>
                <span>${transaction.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;