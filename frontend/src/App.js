import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FinancialAdvice from './FinancialAdvice';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
      <Router>
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <nav>
              <Link to="/">Home</Link>
              <Link to="/financial-advice" style={{ marginLeft: '10px' }}>Get Financial Advice</Link>
            </nav>
            <p>
              Edit <code>src/App.js</code> and save to reload.
            </p>
            <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
              Learn React
            </a>
          </header>
          <Routes>
            <Route path="/" element={<h1>Welcome to SmartBudget</h1>} />
            <Route path="/financial-advice" element={<FinancialAdvice />} />
          </Routes>
        </div>
      </Router>
  );
}

export default App;
