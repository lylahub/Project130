// src/authService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const login = async (email, password) => {
  console.log(API_URL)
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed. Please try again.");
  }

  const data = await response.json();
  console.log(data);
  return data.userId;
};

export const signUp = async (email, password) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Signup failed. Please try again.");
  }

  const data = await response.json();
  return data.userId;
};
