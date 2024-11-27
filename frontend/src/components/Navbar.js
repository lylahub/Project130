import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Navbar.css';
import logo from './logo.png';

const Navbar = ({ username }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const tabs = [
    { id: 1, label: "Bookkeep", path: "/sb" },
    { id: 2, label: "Group Split", path: "/group-split" },
    { id: 3, label: "Income Recommendation", path: "/income-re" }
  ];

  const handleTabClick = (tabId, path) => {
    setActiveTab(tabId);
    navigate(path);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prevState => !prevState);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          <div className="navbar-right" ref={dropdownRef}>
            <div className="navbar-username-container" onClick={toggleDropdown}>
              <span className="navbar-username">{username}</span>
              <button className="navbar-dropdown-toggle">▼</button>
            </div>
            {isDropdownOpen && (
                <ul className="navbar-dropdown-menu">
                  <li><Link to="/profile">Profile</Link></li>
                  <li><Link to="/login">Logout</Link></li>
                </ul>
            )}
          </div>
        </div>
      </nav>
  );
};

export default Navbar;
