// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from "framer-motion";
import { UserProvider, useUser } from "./userContext.js";
import { WebSocketProvider } from "./WebsocketContext.js";
import "./App.css";
import './css/theme.css';

// import pages
import Home from './pages/Home.js';
import GroupSplit from './pages/GroupSplit.js';
import IncomeRecommendation from './pages/IncomeRe.js';
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from './pages/Login';
import SignUp from './pages/SignUp';

function AppRouter() {
  const location = useLocation();
  const { uid } = useUser(); // Check if user is logged in

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* If user is not authenticated, navigate to Login page */}
        <Route path="/" element={<Navigate to={uid ? "/home" : "/login"} replace />} />

        {/* Public routes for Login and Sign Up */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes - accessible only if user is authenticated */}
        {uid ? (
          <>
            <Route path="/home" element={<Home />} />
            <Route path="/group-split" element={<GroupSplit />} />
            <Route path="/income-re" element={<IncomeRecommendation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </>
        ) : (
          // Redirect unauthenticated users back to login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </AnimatePresence>
  );
}

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