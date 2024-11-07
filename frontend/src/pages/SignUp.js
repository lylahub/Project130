// src/pages/SignUp.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SignUp.css';
import logo from '../components/logo.png';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch("http://localhost:3001/signup", { // Backend URL and port
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include credentials in request
      });      

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        setMessage(data.message || "Sign-up successful!");
        setTimeout(() => navigate('/login'), 2000); // Redirect after showing success message
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Sign-up failed");
      }
    } catch (error) {
      setError("Network error: Unable to sign up. Please try again later.");
      console.error("Sign-up request error:", error);
    } finally {
      setLoading(false);
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
          <button 
            type="button" 
            className="button secondary" 
            onClick={() => navigate('/login')} 
            disabled={loading}
          >
            Back to Login
          </button>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default SignUp;
