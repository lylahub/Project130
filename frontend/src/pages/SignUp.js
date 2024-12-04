// src/pages/SignUp.js
/**
 * @file SignUp.js
 * @description This file contains the SignUp component, allowing users to create an account by providing their email and password.
 */
import React, { useState } from 'react';
import { useUser } from '../userContext';
import { useNavigate } from 'react-router-dom';
import '../css/SignUp.css';
import logo from '../components/logo.png';

/**
 * SignUp Component
 *
 * @component
 * @description Renders the sign-up form for new users to create an account. Handles form submission, displays error messages, and includes navigation to the login page.
 * @returns {JSX.Element} The rendered SignUp component.
 */
const SignUp = () => {
  const { signUp } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles form submission for sign-up.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   * @returns {Promise<void>} Resolves when the sign-up process is complete.
   */
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    const errorMsg = await signUp(email, password);
    if (errorMsg) {
      setError(errorMsg);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="logo-container">
          <img src={logo} alt="Logo"></img>
        </div>
        <form onSubmit={handleSignUp} className="signup-form">
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <button
          className="button secondary"
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default SignUp;
