// src/userContext.js
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { login as loginService, signUp as signUpService } from "./authService";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const userId = await loginService(email, password);
      setUid(userId);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error.message);
      return error.message;
    }
  };

  const signUp = async (email, password) => {
    try {
      const userId = await signUpService(email, password);
      setUid(userId);
      navigate("/home");
    } catch (error) {
      console.error("Signup error:", error.message);
      return error.message;
    }
  };

  return (
    <UserContext.Provider value={{ uid, setUid, login, signUp }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
