// src/userContext.js
/**
 * @file userContext.js
 * @description Provides user authentication context, including login and signup functionality, for the application.
 */
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { login as loginService, signUp as signUpService } from "./authService";

const UserContext = createContext();

/**
 * UserProvider Component
 *
 * @component
 * @description Wraps the application with user authentication context, providing `uid`, `login`, and `signUp` functionality.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components that will consume the user context.
 * @returns {JSX.Element} The UserProvider component.
 */
export const UserProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const navigate = useNavigate();

  /**
   * Logs in the user using email and password.
   *
   * @async
   * @function
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<string|undefined>} Error message if login fails, otherwise undefined.
   */
  const login = async (email, password) => {
  try {
    const userId = await loginService(email, password);
    console.log("Received userId from loginService:", userId);
    setUid(userId);
    console.log("uid set:", userId);
    navigate("/sb");
  } catch (error) {
    console.error("Login error:", error.message);
    return error.message;
  }
};

  /**
   * Signs up the user using email and password.
   *
   * @async
   * @function
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<string|undefined>} Error message if signup fails, otherwise undefined.
   */
  const signUp = async (email, password) => {
    try {
      const userId = await signUpService(email, password);
      setUid(userId);
      navigate("/sb");
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

/**
 * Custom hook to consume the UserContext.
 *
 * @function
 * @returns {Object} Context value containing `uid`, `setUid`, `login`, and `signUp` functions.
 */
export const useUser = () => useContext(UserContext);
