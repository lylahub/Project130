/**
 * @file index.js
 * @description Entry point of the React application. Initializes the root component and renders the application into the DOM.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Render the App component wrapped in React's StrictMode.
 * StrictMode is used to highlight potential problems in the application by performing additional checks during development.
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
