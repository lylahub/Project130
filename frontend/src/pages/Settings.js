// src/pages/Settings.js
import React, { useState } from 'react';
import Navbar from '../components/Navbar'; // Import Navbar component
import '../css/Settings.css'; // Import corresponding CSS for styling

// Main Settings component
const Settings = () => {
    // Define state to store settings data
    const [settings, setSettings] = useState({
        username: 'Baby',
        email: 'baby@example.com',
        currency: 'USD',
        riskTolerance: 'moderate',
        notifications: true,
        theme: 'light'
    });

    // Handle input changes for text, select, and checkbox inputs
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Update settings state based on input type
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Placeholder function for saving settings
    const handleSave = () => {
        alert("Settings saved!");
    };

    return (
        <div className="settings-container">
            {/* Include Navbar and pass username prop */}
            <Navbar username={settings.username} />
            <div className="content-container">
                {/* Form section to hold all settings inputs */}
                <div className="form-section">
                    <h1>Settings</h1>

                    {/* Settings form */}
                    <form onSubmit={(e) => {e.preventDefault(); handleSave();}} className="settings-form">

                        {/* Username field */}
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={settings.username}
                                onChange={handleInputChange}
                                placeholder="Enter your username"
                            />
                        </div>

                        {/* Email field */}
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={settings.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Currency selection dropdown */}
                        <div className="form-group">
                            <label>Default Currency</label>
                            <select name="currency" value={settings.currency} onChange={handleInputChange}>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="JPY">JPY</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>

                        {/* Risk tolerance selection dropdown */}
                        <div className="form-group">
                            <label>Risk Tolerance</label>
                            <select name="riskTolerance" value={settings.riskTolerance} onChange={handleInputChange}>
                                <option value="conservative">Conservative</option>
                                <option value="moderate">Moderate</option>
                                <option value="aggressive">Aggressive</option>
                            </select>
                        </div>

                        {/* Notifications checkbox */}
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="notifications"
                                    checked={settings.notifications}
                                    onChange={handleInputChange}
                                />
                                Enable Notifications
                            </label>
                        </div>

                        {/* Theme selection dropdown */}
                        <div className="form-group">
                            <label>Theme</label>
                            <select name="theme" value={settings.theme} onChange={handleInputChange}>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>

                        {/* Save button */}
                        <button type="submit" className="save-button">Save All Settings</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
