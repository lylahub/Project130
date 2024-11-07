// src/userContext.js
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to sign up
  const signUp = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setUid(data.userId); // Store the user ID
        navigate("/"); // Redirect to the home page or wherever you'd like after sign-up
      } else {
        setError(data.error || "Sign-up failed");
      }
    } catch (error) {
      setError("Error during sign-up: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to log in
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setUid(data.userId); // Store the user ID
        navigate("/"); // Redirect to the home page or wherever you'd like after login
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("Error during login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to log out
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUid(null); // Clear the user ID on logout
        navigate("/login"); // Redirect to the login page
      } else {
        const data = await response.json();
        setError(data.error || "Logout failed");
      }
    } catch (error) {
      setError("Error during logout: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ uid, setUid, signUp, login, logout, error, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
