// src/components/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';
import logo from './logo.png'; // 確保路徑正確

const Navbar = ({ username }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <img src={logo} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">SB</span>
        </div>
        <div className="navbar-right">
          <span className="navbar-username">{username}</span>
          <div className="navbar-dropdown">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
              className="navbar-dropdown-toggle"
            >
              &#9662;
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
      </div>
    </nav>
  );
};

export default Navbar;