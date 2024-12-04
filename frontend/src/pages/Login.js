// src/pages/Login.js
/**
 * @file Login.js
 * @description This file contains the Login component for handling user authentication via email and password.
 */
import React, { useContext, useState } from 'react';
import { useUser } from '../userContext';
import '../css/Login.css';
import logo from '../components/logo.png';

/**
 * Login Component.
 *
 * @component
 * @description Renders the login form for user authentication. Allows users to log in using their email and password.
 * Displays error messages if login fails.
 * @returns {JSX.Element} The rendered Login component.
 */
const Login = () => {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUid, uid } = useUser();

  /**
   * Handles form submission for login.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   * @returns {Promise<void>} Resolves when the login process is complete.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous error message

    const errorMsg = await login(email, password);
    
    if (errorMsg) {
      // Set the error message from the result in userContext
      setError(errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src={logo} alt="Logo"></img>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="button primary" disabled={loading}>
          {loading ? "Logging In..." : "Log In"}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;