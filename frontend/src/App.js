// src/App.js
/**
 * @file App.js
 * @description This file serves as the main entry point for the React application, managing routes and context providers.
 */
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from "framer-motion";
import { UserProvider, useUser } from "./userContext.js";
import { WebSocketProvider } from "./WebsocketContext.js";
import { useEffect } from 'react';
import "./App.css";
import './css/theme.css';

// import pages
import Home from './pages/Home.js';
import GroupSplit from './pages/GroupSplit.js';
import IncomeRecommendation from './pages/IncomeRe.js';
import Profile from "./pages/Profile";
import Login from './pages/Login';
import SignUp from './pages/SignUp';

/**
 * AppRouter Component
 *
 * @component
 * @description Manages the application's routes and handles conditional rendering based on user authentication state.
 * @returns {JSX.Element} The rendered AppRouter component.
 */
function AppRouter() {
  const location = useLocation(); // useLocation在Router内部使用
  const { uid, setUid } = useUser();

  useEffect(() => {
    if (uid) {
      console.log("User has logged in successfully with UID:", uid);
    }
  }, [uid]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to={uid ? "/sb" : "/login"} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {uid ? (
          <>
            <Route path="/sb" element={<Home />} />
            <Route path="/group-split" element={<GroupSplit />} />
            <Route path="/income-re" element={<IncomeRecommendation />} />
            <Route path="/profile" element={<Profile />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </AnimatePresence>
  );
}


/**
 * App Component
 *
 * @component
 * @description Wraps the application with necessary providers such as UserProvider and WebSocketProvider, and initializes routing.
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  return (
    <Router>
      <UserProvider>
        <WebSocketProvider>
          <AppRouter />
        </WebSocketProvider>
      </UserProvider>
    </Router>
  );
}

export default App;