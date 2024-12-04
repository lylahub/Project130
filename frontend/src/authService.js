// src/authService.js
/**
 * @file authService.js
 * @description This file contains utility functions for user authentication, including login and signup functionalities.
 */
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Logs in a user using their email and password.
 *
 * @async
 * @param {string} email - The email address of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<string>} The user ID of the authenticated user.
 * @throws {Error} If the login request fails or the server returns an error message.
 */
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

/**
 * Signs up a new user with the provided email and password.
 *
 * @async
 * @param {string} email - The email address of the new user.
 * @param {string} password - The password for the new user.
 * @returns {Promise<string>} The user ID of the newly created user.
 * @throws {Error} If the signup request fails or the server returns an error message.
 */
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
