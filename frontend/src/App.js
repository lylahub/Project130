import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from "framer-motion";
import { UserProvider } from "./userContext.js";
import "./App.css";
import './css/theme.css';


// import pages
import Home from './pages/Home.js';
import GroupSplit from './pages/GroupSplit.js';
import IncomeRecommendation from './pages/IncomeRe.js';


function AppRouter() {
  const location = useLocation();
  return (
    // <UserProvider>
    // for later user login
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* <Route exact path="/" element={<LoginSignup />} /> */}
          <Route exact path="/sb" element={<Home />} />
          <Route path="/group-split" element={<GroupSplit />} />
          <Route path="/income-re" element={<IncomeRecommendation />} />
          {/* new pages put here */}
        </Routes>
      </AnimatePresence>
    // </UserProvider>
  );
}

function App() {
  return (
    <div className="App">
      <Router>
        <AppRouter />
      </Router>
    </div>
  );
}

export default App;