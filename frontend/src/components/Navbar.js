// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Navbar.css';
import logo from './logo.png';

const Navbar = ({ username }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();

  const tabs = [
    { id: 1, label: "Bookkeep", path: "/sb" },
    { id: 2, label: "Group Split", path: "/group-split" },
    { id: 3, label: "Income Recommendation", path: "/income-re" }
  ];

  const handleTabClick = (tabId, path) => {
    setActiveTab(tabId);
    navigate(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/sb" className="navbar-logo-container">
            <img src={logo} alt="Logo" className="navbar-logo" />
            <span className="navbar-title">SB</span>
          </Link>
          <div className="navbar-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`navbar-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id, tab.path)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div 
          className="navbar-right"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <span className="navbar-username">{username}</span>
          <button
            className="navbar-dropdown-toggle"
          >
            ▼
          </button>
          {isDropdownOpen && (
            <ul className="navbar-dropdown-menu">
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/settings">Settings</Link></li>
              <li><Link to="/logout">Logout</Link></li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;