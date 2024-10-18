import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.js';
import '../css/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const username = "John Doe"; // 這裡應該從用戶狀態或 props 中獲取

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="home-container">
      <Navbar username={username} />
      
      <header className="home-header">
        <h1>Welcome to SB</h1>
      </header>
      
      <main className="home-main">
        {/* Feature cards as before */}
      </main>
    </div>
  );
};

export default Home;