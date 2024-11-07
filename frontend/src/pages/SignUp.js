// src/pages/SignUp.js
import React, { useState } from 'react';
import { useUser } from '../userContext';
import { useNavigate } from 'react-router-dom';
import '../css/SignUp.css';

const SignUp = () => {
  const { signUp } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        <h2>Sign Up</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="signup-button">Sign Up</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <button
          className="back-to-login-button"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default SignUp;
