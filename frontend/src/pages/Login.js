// src/pages/Login.js
import React, { useContext, useState } from 'react';
import { useUser } from '../userContext';
import '../css/Login.css';
import logo from '../components/logo.png';

const Login = () => {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUid, uid } = useUser();

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