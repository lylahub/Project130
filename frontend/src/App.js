// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from "framer-motion";
import { UserProvider, UserContext } from "./userContext.js";
import "./App.css";
import './css/theme.css';

// Import pages
import Home from './pages/Home';
import GroupSplit from './pages/GroupSplit';
import IncomeRecommendation from './pages/IncomeRe';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

function AppRouter() {
  const location = useLocation();
  const { uid } = useContext(UserContext); // Check if user is logged in

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes for Login and Sign Up */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Redirect root to login initially */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected routes */}
        {uid ? (
          <>
            <Route path="/sb" element={<Home />} />
            <Route path="/group-split" element={<GroupSplit />} />
            <Route path="/income-re" element={<IncomeRecommendation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </>
        ) : (
          // Redirect unauthenticated users to login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router> {/* Place Router outside of UserProvider */}
      <UserProvider> {/* Wrap UserProvider inside Router */}
        <div className="App">
          <AppRouter />
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;
