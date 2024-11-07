// src/pages/Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../userContext.js';
import '../css/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { setUid } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setUid(data.userId); // Set user ID in context
        setTimeout(() => navigate('/sb'), 1000); // Optional: Delay to show success indicator
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (error) {
      setError("Network error: Unable to log in. Please try again later.");
      console.error("Login request error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading} // Disable input during loading
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging In..." : "Log In"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <button onClick={() => navigate('/signup')} className="signup-button" disabled={loading}>
        Sign Up
      </button>
    </div>
  );
};

export default Login;
